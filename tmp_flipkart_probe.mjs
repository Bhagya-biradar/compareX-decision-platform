import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await page.goto('https://www.flipkart.com/search?q=iPhone%2015', { waitUntil: 'domcontentloaded', timeout: 15000 });
await delay(3000);

const result = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('a[href*="/p/"]')].slice(0, 5);
  return cards.map((card) => ({
    href: card.href || card.getAttribute('href') || '',
    title: (card.querySelector('._4rR01T, img[alt], [title]')?.innerText || card.querySelector('._4rR01T, img[alt], [title]')?.textContent || card.textContent || '').trim().slice(0, 150),
    price30: (card.querySelector('._30jeq3')?.innerText || card.querySelector('._30jeq3')?.textContent || '').trim(),
    price16: (card.querySelector('._16Jk6d')?.innerText || card.querySelector('._16Jk6d')?.textContent || '').trim(),
    priceTextMatch: ((card.innerText || card.textContent || '').match(/₹\s*[0-9][0-9,]*/g) || []).slice(0, 3),
    text: (card.innerText || card.textContent || '').trim().slice(0, 200),
  }));
});

console.log(JSON.stringify(result, null, 2));
await browser.close();