const { chromium } = require('@playwright/test');
const fs = require('fs');

const PAGE_URL = 'https://copertura.fibercop.com/';

async function typeSlow(page, selector, text, baseDelayMs = 100, jitterMs = 100) {
  await page.click(selector, { delay: 50 });
  for (const char of text) {
    const delay = baseDelayMs + Math.floor(Math.random() * (jitterMs + 1)); // ~100–200ms
    await page.type(selector, char, { delay });
  }
}

async function runForAddressFiberCop({ city, street, houseNumber }) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });

  const fullAddress = `${street}, ${houseNumber}, ${city}`;

  await typeSlow(page, '.address-input', fullAddress);
  await page.waitForTimeout(4000);

  // Select the correct suggestion from `ul.suggestions-list`
  try {
    await page.waitForSelector('ul.suggestions-list li', { state: 'attached', timeout: 5000 });
  } catch (e) {
    await browser.close();
    return 'not_exist';
  }

  const suggestions = await page.$$('ul.suggestions-list li');
  let selected = false;

  for (const item of suggestions) {
    const text = (await item.innerText()).trim();

    if (
      text.toLowerCase() === fullAddress.toLowerCase()
      || text.toLowerCase().startsWith(fullAddress.toLowerCase())
    ) {
      await item.click();
      selected = true;
      break;
    }
  }

  if (!selected) {
    await browser.close();
    return 'not_exist';
  }

  await page.waitForTimeout(2000);
  await page.click('.address-button');

  let result = 'unknown';

  try {
    const resultHandle = await page.waitForFunction(() => {
      const text = document.body.innerText || '';

      if (
        /Naviga alla massima velocità fino a 10Giga/i.test(
          text,
        )
      ) {
        return 'covered';
      }

      if (
        /Naviga fino a 200 mega con la migliore connessione disponibile per te!/i.test(
          text,
        )
      ) {
        return 'not_covered';
      }

      return null;
    }, { timeout: 60_000 });

    const value = await resultHandle.jsonValue();
    if (value === 'covered' || value === 'not_covered') {
      result = value;
    }
  } catch {}
  await browser.close();

  return result;
}

module.exports = { runForAddressFiberCop };
