import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  normalizeProductName,
  normalizeSpecs,
  normalizeWhitespace,
  similarityScore,
} from './normalizationService.js';

const GSMARENA_BASE_URL = 'https://www.gsmarena.com';
const DEFAULT_TIMEOUT = Number(process.env.SCRAPER_TIMEOUT_MS || 15000);

const http = axios.create({
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'User-Agent':
      process.env.SCRAPER_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.8',
    Referer: GSMARENA_BASE_URL,
  },
});

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value || '');

const toAbsoluteUrl = (value) => {
  if (!value) {
    return '';
  }

  if (isAbsoluteUrl(value)) {
    return value;
  }

  return new URL(value, GSMARENA_BASE_URL).toString();
};

const fetchHtml = async (url) => {
  const { data } = await http.get(url);
  return data;
};

const extractPhonesFromSearchPage = (html, query) => {
  const $ = cheerio.load(html);
  const candidates = [];
  const queryFingerprint = normalizeProductName(query);

  $('a[href$=".php"]').each((_, element) => {
    const href = $(element).attr('href');
    const text = normalizeWhitespace($(element).text());
    if (!href || !text || text.length < 4) {
      return;
    }

    if (!/phone|mobile|pro|max|plus|ultra|note|galaxy|iphone|pixel|xiaomi|redmi|oneplus|vivo|oppo|realme|motorola|nokia|iqoo|infinix|tecno/i.test(text)) {
      return;
    }

    const url = toAbsoluteUrl(href);
    const score = similarityScore(queryFingerprint, text);
    candidates.push({
      name: text,
      url,
      normalizedName: normalizeProductName(text),
      score,
    });
  });

  const unique = new Map();
  candidates.forEach((candidate) => {
    const key = candidate.url || candidate.normalizedName;
    const existing = unique.get(key);
    if (!existing || candidate.score > existing.score) {
      unique.set(key, candidate);
    }
  });

  return [...unique.values()].sort((first, second) => second.score - first.score);
};

const searchGsmarenaProducts = async (query) => {
  const searchTerm = normalizeWhitespace(query);
  if (!searchTerm) {
    return [];
  }

  const encoded = encodeURIComponent(searchTerm);
  const candidateUrls = [
    `${GSMARENA_BASE_URL}/res.php3?sQuickSearch=yes&sName=${encoded}`,
    `${GSMARENA_BASE_URL}/results.php3?sQuickSearch=yes&sName=${encoded}`,
    `${GSMARENA_BASE_URL}/search.php3?search=${encoded}`,
    `${GSMARENA_BASE_URL}/res.php3?sSearch=${encoded}`,
  ];

  for (const candidateUrl of candidateUrls) {
    try {
      const html = await fetchHtml(candidateUrl);
      const matches = extractPhonesFromSearchPage(html, searchTerm);
      if (matches.length) {
        return matches.slice(0, 10);
      }
    } catch (error) {
      continue;
    }
  }

  return [];
};

const extractSpecsFromPage = (html, sourceUrl) => {
  const $ = cheerio.load(html);
  const pageName = normalizeWhitespace($('h1.specs-phone-name-title').first().text() || $('h1').first().text() || $('title').first().text());
  const labels = new Map();

  $('tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 2) {
      return;
    }

    const firstCell = normalizeWhitespace($(cells[0]).text());
    const secondCell = normalizeWhitespace($(cells[1]).text());

    if (!firstCell || !secondCell) {
      return;
    }

    labels.set(firstCell.toLowerCase(), secondCell);
  });

  const findMatch = (...keys) => {
    const entries = [...labels.entries()];
    for (const key of keys) {
      const needle = key.toLowerCase();
      const match = entries.find(([label]) => label.includes(needle));
      if (match) {
        return match[1];
      }
    }
    return '';
  };

  const rawSpecs = {
    name: pageName,
    sourceUrl,
    chipset: findMatch('chipset', 'platform', 'processor'),
    ram: findMatch('ram', 'memory'),
    storage: findMatch('internal', 'storage'),
    battery: findMatch('battery', 'capacity'),
    display: findMatch('display', 'screen'),
    camera: findMatch('camera', 'main camera', 'rear camera'),
    releaseDate: findMatch('launch', 'released', 'release date'),
  };

  return {
    rawSpecs,
    normalizedSpecs: normalizeSpecs(rawSpecs),
  };
};

const scrapeGsmarenaProductByUrl = async (url) => {
  const resolvedUrl = toAbsoluteUrl(url);
  const html = await fetchHtml(resolvedUrl);
  const { rawSpecs, normalizedSpecs } = extractSpecsFromPage(html, resolvedUrl);

  return {
    source: 'gsmarena',
    sourceUrl: resolvedUrl,
    name: rawSpecs.name || resolvedUrl,
    normalizedName: normalizeProductName(rawSpecs.name || resolvedUrl),
    rawSpecs,
    specs: normalizedSpecs,
  };
};

const resolveGsmarenaProduct = async ({ query, url }) => {
  if (url) {
    return scrapeGsmarenaProductByUrl(url);
  }

  const suggestions = await searchGsmarenaProducts(query);
  const bestMatch = suggestions[0];

  if (!bestMatch) {
    throw new Error('No GSMArena matches were found for the requested product');
  }

  const product = await scrapeGsmarenaProductByUrl(bestMatch.url);

  return {
    ...product,
    searchSuggestions: suggestions,
    matchedSuggestion: bestMatch,
  };
};

export { resolveGsmarenaProduct, scrapeGsmarenaProductByUrl, searchGsmarenaProducts };