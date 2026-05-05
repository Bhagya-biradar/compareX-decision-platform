import puppeteer from 'puppeteer';
import { normalizeWhitespace, similarityScore } from './normalizationService.js';

const DEFAULT_TIMEOUT = Number(process.env.PRICE_SCRAPER_TIMEOUT_MS || 20000);
const NAVIGATION_TIMEOUT = Number(process.env.PRICE_NAVIGATION_TIMEOUT_MS || 15000);
const SELECTOR_TIMEOUT = Number(process.env.PRICE_SELECTOR_TIMEOUT_MS || 5000);
const MIN_MATCH_SCORE = Number(process.env.PRICE_MATCH_THRESHOLD || 0.55);
const MIN_VALID_PRICE = Number(process.env.PRICE_MIN_VALUE || 5000);
const MAX_VALID_PRICE = Number(process.env.PRICE_MAX_VALUE || 200000);
const MAX_CONCURRENT_TABS = Number(process.env.PRICE_MAX_TABS || 3);
const STORE_RESULT_TIMEOUT_MS = Number(process.env.PRICE_STORE_TIMEOUT_MS || 12000);

const ACCESSORY_KEYWORDS = [
  'case',
  'cover',
  'back cover',
  'mobile cover',
  'screen protector',
  'tempered glass',
  'protector',
  'guard',
  'charger',
  'cable',
  'adapter',
  'earphone',
  'earbuds',
  'buds',
  'pouch',
  'holder',
  'mount',
  'stand',
  'dock',
  'power bank',
  'stylus',
  'skin',
  'lens protector',
  'camera protector',
  'flip cover',
  'silicone cover',
];

const NON_NEW_PRODUCT_KEYWORDS = [
  'refurbished',
  'renewed',
  'used',
  'second hand',
  'pre owned',
  'pre-owned',
  'unboxed',
  'open box',
];

const STORE_CONFIGS = {
  amazon: {
    store: 'Amazon',
    searchUrl: (query) => `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
    searchResultSelector: '[data-component-type="s-search-result"]',
    titleSelector: 'h2 a span, h2 span',
    linkSelector: 'h2 a',
    priceSelectors: ['#priceblock_dealprice', '#priceblock_ourprice', '.a-price .a-offscreen', '.a-price-whole'],
    availabilitySelector: '#availability',
  },
  flipkart: {
    store: 'Flipkart',
    searchUrl: (query) => `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
    searchResultSelector: 'a[href*="/p/"]',
    titleSelector: '._4rR01T, img[alt], [title]',
    linkSelector: 'a[href*="/p/"]',
    priceSelectors: ['.Nx9bqj', '._30jeq3', '._16Jk6d'],
    availabilitySelector: 'body',
  },
  croma: {
    store: 'Croma',
    searchUrl: (query) => `https://www.croma.com/searchB?q=${encodeURIComponent(query)}`,
    searchResultSelector: 'a[href*="/p/"]',
    titleSelector: '[title], img[alt], h3, h2',
    linkSelector: 'a[href*="/p/"]',
    priceSelectors: ['.amount', '[class*="amount"]'],
    availabilitySelector: 'body',
  },
};

let browserInstance = null;
let browserPromise = null;
let activeTabs = 0;
const tabQueue = [];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const withTimeout = async (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    }),
  ]);

const normalizeMatchText = (value) =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/\b(add to compare|bestseller|ratings|reviews|offers?|buy now|coming soon)\b/g, ' ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeStorageToken = (value) => {
  const match = normalizeMatchText(value).match(/\b(\d+(?:\.\d+)?)\s?(tb|gb)\b/i);
  if (!match) {
    return '';
  }

  return `${match[1]} ${match[2].toLowerCase()}`;
};

const stripStorageTokens = (value) => normalizeMatchText(value).replace(/\b\d+(?:\.\d+)?\s?(tb|gb)\b/g, ' ').replace(/\s+/g, ' ').trim();

const isAccessoryListing = (title) => {
  const normalizedTitle = normalizeMatchText(title);
  return ACCESSORY_KEYWORDS.some((keyword) => normalizedTitle.includes(keyword));
};

const isPlausiblePrice = (price) => Number.isFinite(price) && price >= MIN_VALID_PRICE && price <= MAX_VALID_PRICE;

const extractPriceValue = (value) => {
  const text = normalizeWhitespace(String(value || ''));

  if (!text) {
    return null;
  }

  const candidates = [];
  for (const match of text.matchAll(/₹\s*([0-9][0-9,]*(?:\.\d+)?)\b/g)) {
    candidates.push(Number(match[1].replace(/,/g, '')));
  }
  for (const match of text.matchAll(/\b([0-9]{4,6})(?:\.\d+)?\b/g)) {
    candidates.push(Number(match[1].replace(/,/g, '')));
  }

  const validCandidates = candidates.filter(isPlausiblePrice);
  if (!validCandidates.length) {
    return null;
  }

  return Math.min(...validCandidates);
};

const getMinimumValidPriceForQuery = (query = '') => {
  const normalizedQuery = normalizeMatchText(query);

  if (/\biphone\b|\bapple\b/.test(normalizedQuery)) {
    return Math.max(MIN_VALID_PRICE, 20000);
  }

  return Math.max(MIN_VALID_PRICE, 10000);
};

const hasBlockedPriceContext = (text = '', index = 0) => {
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + 80);
  const context = text.slice(start, end).toLowerCase();
  return /\b(emi|month|monthly|per month|no cost emi|instalment|installment)\b/.test(context);
};

const isNonNewProductListing = (title = '') => {
  const normalizedTitle = normalizeMatchText(title);
  return NON_NEW_PRODUCT_KEYWORDS.some((keyword) => normalizedTitle.includes(keyword));
};

const isRealisticPhonePrice = (price, query = '') =>
  Number.isFinite(price) && price >= getMinimumValidPriceForQuery(query) && price <= MAX_VALID_PRICE;

const extractRealisticPriceValue = (value, query = '') => {
  const text = normalizeWhitespace(String(value || ''));

  if (!text) {
    return null;
  }

  const candidates = [];
  const rupeePatterns = [/₹\s*([0-9][0-9,]*(?:\.\d+)?)\b/g, /â‚¹\s*([0-9][0-9,]*(?:\.\d+)?)\b/g];

  for (const pattern of rupeePatterns) {
    for (const match of text.matchAll(pattern)) {
      if (hasBlockedPriceContext(text, match.index || 0)) {
        continue;
      }
      candidates.push(Number(match[1].replace(/,/g, '')));
    }
  }

  for (const match of text.matchAll(/\b([0-9]{4,6})(?:\.\d+)?\b/g)) {
    if (hasBlockedPriceContext(text, match.index || 0)) {
      continue;
    }
    candidates.push(Number(match[1].replace(/,/g, '')));
  }

  const validCandidates = candidates.filter((candidate) => isRealisticPhonePrice(candidate, query));
  return validCandidates.length ? Math.min(...validCandidates) : null;
};

const buildSearchQueries = (productName, aliases = []) => {
  const queries = [productName, ...aliases].map((value) => normalizeWhitespace(value)).filter(Boolean);
  return [...new Set(queries)];
};

const buildStoreSearchLinks = (query) =>
  Object.values(STORE_CONFIGS).map((storeConfig) => ({
    store: storeConfig.store,
    price: null,
    link: storeConfig.searchUrl(query),
    available: null,
    availability: 'Open store search',
    offers: [],
    fallback: true,
    message: 'Live price could not be confirmed. Use the store search link to verify current price.',
  }));

const scoreCandidate = (query, candidateTitle) => {
  const queryText = normalizeMatchText(query);
  const titleText = normalizeMatchText(candidateTitle);
  const queryStorage = normalizeStorageToken(queryText);
  const titleStorage = normalizeStorageToken(titleText);

  let score = similarityScore(stripStorageTokens(queryText), stripStorageTokens(titleText));
  const queryTokens = stripStorageTokens(queryText).split(' ').filter(Boolean);
  const titleTokens = new Set(stripStorageTokens(titleText).split(' ').filter(Boolean));
  const sharedTokens = queryTokens.filter((token) => titleTokens.has(token)).length;

  if (queryStorage) {
    if (titleStorage === queryStorage) {
      score += 0.2;
    } else if (!titleStorage) {
      score -= 0.15;
    } else {
      score -= 0.3;
    }
  }

  if (isAccessoryListing(candidateTitle)) {
    score -= 0.45;
  }

  if (queryTokens.length && sharedTokens < Math.min(2, queryTokens.length)) {
    score -= 0.2;
  }

  return {
    score: Math.max(0, score),
    queryStorage,
    titleStorage,
    sharedTokens,
    requiredTokens: Math.min(2, Math.max(1, queryTokens.length)),
  };
};

const getBrowser = async () => {
  if (browserInstance?.isConnected()) {
    return browserInstance;
  }

  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      timeout: DEFAULT_TIMEOUT,
    });
  }

  browserInstance = await browserPromise;
  browserPromise = null;
  return browserInstance;
};

const closeBrowser = async () => {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (error) {
      // Ignore shutdown errors.
    }
  }

  browserInstance = null;
  browserPromise = null;
};

process.once('exit', () => {
  void closeBrowser();
});

const acquirePage = async () => {
  if (activeTabs >= MAX_CONCURRENT_TABS) {
    await new Promise((resolve) => tabQueue.push(resolve));
  }

  activeTabs += 1;
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
  await page.setDefaultTimeout(SELECTOR_TIMEOUT);
  await page.setUserAgent(
    process.env.SCRAPER_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );
  await page.setViewport({ width: 1440, height: 1600 });

  const release = async () => {
    try {
      await page.close();
    } catch (error) {
      // Ignore page close errors.
    }

    activeTabs = Math.max(0, activeTabs - 1);
    const next = tabQueue.shift();
    if (next) {
      next();
    }
  };

  return { page, release };
};

const safeGoto = async (page, url) => {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT });
  await delay(1800);
};

const waitForAnySelector = async (page, selectors) => {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: SELECTOR_TIMEOUT });
      return selector;
    } catch (error) {
      continue;
    }
  }

  return null;
};

const extractTextValue = async (page, selectors, query = '') => {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: SELECTOR_TIMEOUT });
      const values = await page.$$eval(selector, (nodes) =>
        nodes
          .map((node) => (node.innerText || node.textContent || '').trim())
          .filter(Boolean)
          .slice(0, 5)
      );

      for (const value of values) {
        const price = extractRealisticPriceValue(value, query);
        if (price !== null) {
          return price;
        }
      }
    } catch (error) {
      continue;
    }
  }

  return null;
};

const extractRawTextValues = async (page, selectors) => {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: SELECTOR_TIMEOUT });
      const values = await page.$$eval(selector, (nodes) =>
        nodes
          .map((node) => (node.innerText || node.textContent || '').trim())
          .filter(Boolean)
          .slice(0, 10)
      );

      if (values.length) {
        return values;
      }
    } catch (error) {
      continue;
    }
  }

  return [];
};

const extractOffersFromText = (text = '') => {
  const normalizedText = normalizeWhitespace(String(text || ''));
  if (!normalizedText) {
    return [];
  }

  const offerCandidates = normalizedText
    .split(/[\n\r]+|\.|\|/)
    .map((line) => normalizeWhitespace(line))
    .filter((line) => line.length >= 10)
    .slice(0, 120);

  const offers = [];
  const seen = new Set();

  for (const line of offerCandidates) {
    const lower = line.toLowerCase();
    let type = null;

    if (/cashback/.test(lower)) {
      type = 'cashback';
    } else if (/emi|no\s*cost\s*emi/.test(lower)) {
      type = 'emi';
    } else if (/discount|off\b|bank offer|coupon/.test(lower)) {
      type = 'discount';
    }

    if (!type) {
      continue;
    }

    const key = `${type}:${lower}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const title = line.length > 90 ? `${line.slice(0, 87)}...` : line;
    offers.push({
      type,
      title,
      description: line,
    });

    if (offers.length >= 6) {
      break;
    }
  }

  return offers;
};

const extractPriceFromCandidateCard = async (page, storeConfig, candidate, query = '') => {
  try {
    const cardPrice = await page.evaluate(
      ({ resultSelector, candidateLink, selectors }) => {
        const cards = [...document.querySelectorAll(resultSelector)];
        const card = cards.find((node) => {
          const linkNode = node.querySelector('a[href]');
          const href = linkNode?.href || linkNode?.getAttribute('href') || '';
          return href && href.includes(candidateLink);
        });

        if (!card) {
          return null;
        }

        const readText = (element) => (element?.innerText || element?.textContent || '').trim();

        const findTextBySelector = (selectorList) => {
          for (const selector of selectorList) {
            const element = card.querySelector(selector);
            const value = readText(element);
            if (value) {
              return value;
            }
          }
          return '';
        };

        const selectorText = findTextBySelector(selectors);
        if (selectorText) {
          return selectorText;
        }

        return readText(card);
      },
      {
        resultSelector: storeConfig.searchResultSelector,
        candidateLink: candidate.link,
        selectors: storeConfig.priceSelectors,
      }
    );

    const price = extractRealisticPriceValue(cardPrice, query);
    return isRealisticPhonePrice(price, query) ? price : null;
  } catch (error) {
    return null;
  }
};

const buildFallbackStoreResult = async (page, storeConfig, query, searchUrl) => {
  try {
    const pageTitle = await page.title();
    const pageText = await page.evaluate(() => document.body?.innerText || document.body?.textContent || '');
    const price = await extractTextValue(page, storeConfig.priceSelectors, query);

    if (!isRealisticPhonePrice(price, query)) {
      return null;
    }

    if (!validateProductMatch(query, pageTitle || searchUrl, pageText)) {
      return null;
    }

    return {
      store: storeConfig.store,
      price,
      link: searchUrl,
      available: true,
      availability: 'Available',
      offers: extractOffersFromText(pageText),
      fallback: true,
    };
  } catch (error) {
    return null;
  }
};

const getSearchCandidates = async (page, storeConfig, query) => {
  await safeGoto(page, storeConfig.searchUrl(query));
  await waitForAnySelector(page, [storeConfig.searchResultSelector]);

  const candidates = await page.evaluate(
    ({ resultSelector, titleSelector, linkSelector }) => {
      const cards = [...document.querySelectorAll(resultSelector)].slice(0, 15);

      return cards
        .map((card) => {
            const titleElement = card.querySelector(titleSelector);
            const linkElement = card.querySelector(linkSelector);
            const anchorElement = card.tagName === 'A' ? card : card.querySelector('a[href]');
            const title = (titleElement?.innerText || titleElement?.textContent || card.textContent || '').trim();
            const link =
              linkElement?.href ||
              linkElement?.getAttribute('href') ||
              anchorElement?.href ||
              anchorElement?.getAttribute('href') ||
              card.getAttribute('href') ||
              '';
          const cardText = (card.innerText || card.textContent || '').trim();

          if (!title || !link) {
            return null;
          }

          return { title, link, cardText };
        })
        .filter(Boolean);
    },
    {
      resultSelector: storeConfig.searchResultSelector,
      titleSelector: storeConfig.titleSelector,
      linkSelector: storeConfig.linkSelector,
    }
  );

  return candidates
    .map((candidate) => ({
      ...candidate,
      ...scoreCandidate(query, candidate.title),
    }))
      .filter(
        (candidate) =>
          !isAccessoryListing(candidate.title) &&
          !isNonNewProductListing(candidate.title) &&
          candidate.score >= MIN_MATCH_SCORE &&
          candidate.sharedTokens >= candidate.requiredTokens
      )
    .sort((first, second) => second.score - first.score || first.title.localeCompare(second.title));
};

const validateProductMatch = (query, title, pageText) => {
  const queryText = normalizeMatchText(query);
  const titleText = normalizeMatchText(`${title} ${pageText}`);
  const queryStorage = normalizeStorageToken(queryText);
  const titleStorage = normalizeStorageToken(titleText);

  if (queryStorage && queryStorage !== titleStorage) {
    return false;
  }

  const similarity = similarityScore(stripStorageTokens(queryText), stripStorageTokens(titleText));
  return similarity >= MIN_MATCH_SCORE;
};

const getStoreResult = async (storeConfig, query) => {
  const { page, release } = await acquirePage();

  try {
    const searchUrl = storeConfig.searchUrl(query);
    const candidates = await getSearchCandidates(page, storeConfig, query);
    for (const candidate of candidates.slice(0, 5)) {
      const cardPrice = extractRealisticPriceValue(candidate.cardText, query);
      if (isRealisticPhonePrice(cardPrice, query)) {
        return {
          store: storeConfig.store,
          price: cardPrice,
          link: candidate.link,
          available: true,
          availability: 'Available',
          offers: [],
          searchResult: true,
        };
      }

      const fallbackCardPrice = await extractPriceFromCandidateCard(page, storeConfig, candidate, query);
      if (isRealisticPhonePrice(fallbackCardPrice, query)) {
        return {
          store: storeConfig.store,
          price: fallbackCardPrice,
          link: candidate.link,
          available: true,
          availability: 'Available',
          offers: [],
          searchResult: true,
        };
      }
    }

    await safeGoto(page, searchUrl);
    const directCards = await page.evaluate(
      ({ resultSelector, titleSelector }) => {
        const cards = [...document.querySelectorAll(resultSelector)].slice(0, 12);

        return cards
          .map((card) => {
            const titleElement = card.querySelector(titleSelector);
            const anchorElement = card.tagName === 'A' ? card : card.querySelector('a[href]');
            const title = (titleElement?.innerText || titleElement?.textContent || card.textContent || '').trim();
            const link = anchorElement?.href || anchorElement?.getAttribute('href') || card.getAttribute('href') || '';
            const cardText = (card.innerText || card.textContent || '').trim();

            if (!title || !link || !cardText) {
              return null;
            }

            return { title, link, cardText };
          })
          .filter(Boolean);
      },
      {
        resultSelector: storeConfig.searchResultSelector,
        titleSelector: storeConfig.titleSelector,
      }
    );

    for (const card of directCards) {
      if (isNonNewProductListing(card.title)) {
        continue;
      }

      const directPrice = extractRealisticPriceValue(card.cardText, query);
      if (isRealisticPhonePrice(directPrice, query)) {
        return {
          store: storeConfig.store,
          price: directPrice,
          link: card.link,
          available: true,
          availability: 'Available',
          offers: extractOffersFromText(card.cardText),
          searchResult: true,
        };
      }
    }

    for (const candidate of candidates.slice(0, 5)) {
      try {
        await safeGoto(page, candidate.link);
        const pageTitle = await page.title();
        const bodyText = await page.evaluate(() => document.body?.innerText || document.body?.textContent || '');

        if (!validateProductMatch(query, pageTitle || candidate.title, bodyText)) {
          continue;
        }

        const price = await extractTextValue(page, storeConfig.priceSelectors, query);
        if (!isRealisticPhonePrice(price, query)) {
          continue;
        }

        const availabilityValues = await extractRawTextValues(page, [storeConfig.availabilitySelector]);
        const availabilityText = normalizeWhitespace(availabilityValues.join(' ') || bodyText);
        const available = !/out of stock|currently unavailable|unavailable|sold out/i.test(availabilityText);

        if (!available) {
          continue;
        }

        const offers = extractOffersFromText(bodyText);

        return {
          store: storeConfig.store,
          price,
          link: candidate.link,
          available: true,
          availability: 'Available',
          offers,
        };
      } catch (error) {
        continue;
      }
    }

    await safeGoto(page, searchUrl);
    const fallbackResult = await buildFallbackStoreResult(page, storeConfig, query, searchUrl);
    if (fallbackResult) {
      return fallbackResult;
    }

    return null;
  } finally {
    await release();
  }
};

const scrapeStorePrices = async (productName, aliases = []) => {
  const searchQueries = buildSearchQueries(productName, aliases);

  const storeTasks = Object.values(STORE_CONFIGS).map(async (storeConfig) => {
    const task = (async () => {
      for (const query of searchQueries) {
        try {
          const result = await getStoreResult(storeConfig, query);
          if (result) {
            return result;
          }
        } catch (error) {
          continue;
        }
      }

      return null;
    })();

    return withTimeout(task, STORE_RESULT_TIMEOUT_MS);
  });

  const results = await Promise.all(storeTasks);
  const scrapedStores = results.filter(Boolean);
  const stores = scrapedStores.length ? scrapedStores : buildStoreSearchLinks(searchQueries[0] || productName);
  const prices = stores.map((store) => store.price).filter((price) => isRealisticPhonePrice(price, searchQueries[0] || productName));
  const lowestPrice = prices.length ? Math.min(...prices) : null;
  const highestPrice = prices.length ? Math.max(...prices) : null;
  const bestDeal = lowestPrice ? stores.find((store) => store.price === lowestPrice) || null : null;

  return {
    query: searchQueries[0] || productName,
    stores,
    bestDeal: bestDeal
      ? {
          ...bestDeal,
          savings: highestPrice && lowestPrice ? highestPrice - lowestPrice : 0,
          savingsPercent: highestPrice && lowestPrice ? Number((((highestPrice - lowestPrice) / highestPrice) * 100).toFixed(2)) : 0,
        }
      : null,
    priceRange: {
      lowestPrice,
      highestPrice,
    },
  };
};

export { scrapeStorePrices };
