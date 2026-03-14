const { chromium } = require('@playwright/test');

const PAGE_URL = 'https://openfiber.it/verifica-copertura/';

async function typeSlow(page, selector, text, baseDelayMs = 100, jitterMs = 100) {
  await page.click(selector, { delay: 50 });
  for (const char of text) {
    const delay = baseDelayMs + Math.floor(Math.random() * (jitterMs + 1)); // 100–200ms circa
    await page.type(selector, char, { delay });
  }
}

async function runForAddressOpenFiber({ city, street, houseNumber }) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });

  const cookieButton = page
    .getByRole('button', { name: /accetta|consento|accept/i })
    .first();
  try {
    if (await cookieButton.isVisible()) {
      await cookieButton.click();
    }
  } catch {
    // ignore banner errors
  }

  await page.waitForTimeout(2000);

  await typeSlow(page, '#city-coverage', city);
  await page.waitForTimeout(2000);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await typeSlow(page, '#street-coverage', street);
  await page.waitForTimeout(2000);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await typeSlow(page, '#house-number-coverage', houseNumber);
  await page.waitForTimeout(2000);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await page.click('#checkCoverageSubmitButton');

  let result = null;

  try {
    const resultHandle = await page.waitForFunction(() => {
      const text = document.body.innerText || '';

      if (/il tuo civico è coperto/i.test(text)) {
        return 'covered';
      }

      if (/la fibra ottica non è ancora disponibile nella tua zona!/i.test(text)) {
        return 'not_covered';
      }

      return null;
    }, { timeout: 60_000 });

    result = await resultHandle.jsonValue();
  } catch {}

  const prefix = `${city}, ${street} ${houseNumber}: `;

  switch (result) {
    case 'covered':
      console.log(`${prefix}✅ COPERTO da OpenFiber`);
      break;
    case 'not_covered':
      console.log(`${prefix}❌ NON COPERTO da OpenFiber`);
      break;
    default:
      console.log(`${prefix}☠️ NON DETERMINATO da OpenFiber`);
      break;
  }

  await browser.close();
}

module.exports = { runForAddressOpenFiber };

