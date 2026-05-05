import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const targets = [
  {
    name: 'Amazon',
    url: 'https://www.amazon.in/s?k=iPhone+15',
    selector: '[data-component-type="s-search-result"]',
  },
  {
    name: 'Flipkart',
    url: 'https://www.flipkart.com/search?q=iPhone%2015',
    selector: 'a[href*="/p/"]',
  },
  {
    name: 'Croma',
    url: 'https://www.croma.com/searchB?q=iPhone%2015',
    selector: 'a[href*="/p/"]',
  },
];

for (const target of targets) {
  try {
    await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(2000);
    const title = await page.title();
    const count = await page.$$eval(target.selector, (nodes) => nodes.length).catch(() => 0);
    const sample = await page.$$eval(target.selector, (nodes) => nodes.slice(0, 2).map((node) => (node.innerText || node.textContent || '').trim().slice(0, 200))).catch(() => []);
    console.log(JSON.stringify({ name: target.name, title, count, sample }, null, 2));
  } catch (error) {
    console.log(JSON.stringify({ name: target.name, error: String(error.message || error) }, null, 2));
  }
}

await browser.close();