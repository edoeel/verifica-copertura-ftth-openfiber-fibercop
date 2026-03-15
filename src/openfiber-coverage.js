const { chromium } = require('@playwright/test');
const fs = require('fs');

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
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

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
  try {
    await page.waitForSelector('ul#ui-id-1 li', { state: 'attached', timeout: 5000 });
  } catch (e) {
    await browser.close();
    return 'not_exist';
  }
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await typeSlow(page, '#street-coverage', street);
  try {
    await page.waitForSelector('ul#ui-id-2 li', { state: 'attached', timeout: 5000 });
  } catch (e) {
    await browser.close();
    return 'not_exist';
  }
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await typeSlow(page, '#house-number-coverage', houseNumber);
  try {
    await page.waitForSelector('ul#ui-id-3 li', { state: 'attached', timeout: 5000 });
  } catch (e) {
    await browser.close();
    return 'not_exist';
  }
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await page.click('#checkCoverageSubmitButton');

  let result = 'unknown';

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

    const value = await resultHandle.jsonValue();
    if (value === 'covered' || value === 'not_covered') {
      result = value;
    }
  } catch {}
  await browser.close();

  return result;
}

module.exports = { runForAddressOpenFiber };
