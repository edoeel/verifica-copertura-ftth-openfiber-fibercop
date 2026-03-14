const { chromium } = require('@playwright/test');

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
  const page = await browser.newPage();

  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });

  const fullAddress = `${street}, ${houseNumber}, ${city}`;

  await typeSlow(page, '.address-input', fullAddress);
  await page.waitForTimeout(4000);

  // Select the correct suggestion from `ul.suggestions-list`
  const suggestions = page.locator('ul.suggestions-list li');
  const count = await suggestions.count();

  for (let i = 0; i < count; i += 1) {
    const item = suggestions.nth(i);
    const text = (await item.innerText()).trim();

    if (
      text.toLowerCase() === fullAddress.toLowerCase()
      || text.toLowerCase().startsWith(fullAddress.toLowerCase())
    ) {
      await item.click();
      break;
    }
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
