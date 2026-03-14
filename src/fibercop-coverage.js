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
  const browser = await chromium.launch({ headless: false });
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

  let result = null;

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

    result = await resultHandle.jsonValue();
  } catch {
    // ignore, will be treated as non-determined
  }

  const prefix = `${city}, ${street} ${houseNumber}: `;

  switch (result) {
    case 'covered':
      console.log(`${prefix}✅ COPERTO da FiberCop`);
      break;
    case 'not_covered':
      console.log(`${prefix}❌ NON COPERTO da FiberCop`);
      break;
    default:
      console.log(`${prefix}☠️ NON DETERMINATO da FiberCop`);
      break;
  }

  await browser.close();
}

module.exports = { runForAddressFiberCop };

