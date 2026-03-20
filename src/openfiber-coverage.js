const { chromium } = require('@playwright/test');
const fs = require('fs');

const PAGE_URL = 'https://openfiber.it/verifica-copertura/';

async function typeSlow(page, selector, text, delay = 100) {
  // Ensure the element is ready and clear it before typing
  await page.click(selector);
  await page.fill(selector, '');
  // Using type() instead of pressSequentially() for compatibility with older Playwright versions
  await page.type(selector, text, { delay });
}

async function runForAddressOpenFiber({ city, street, houseNumber }) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
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

    await page.waitForTimeout(1000);

    // 1. City Selection
    await typeSlow(page, '#city-coverage', city);
    const citySelector = 'ul.ui-autocomplete:visible li';
    try {
      await page.waitForSelector(citySelector, { state: 'visible', timeout: 10000 });
      await page.click(`${citySelector}:first-child`);
    } catch (e) {
      console.error(`[OpenFiber] Error selecting city "${city}":`, e.message);
      await page.screenshot({ path: `error-city-${city.replace(/\s+/g, '_')}.png` });
      await browser.close();
      return 'not_exist';
    }
    
    // Give the site time to load streets for the selected city
    await page.waitForTimeout(1500);

    // 2. Street Selection
    await typeSlow(page, '#street-coverage', street);
    const streetSelector = 'ul.ui-autocomplete:visible li';
    try {
      await page.waitForSelector(streetSelector, { state: 'visible', timeout: 10000 });
      await page.click(`${streetSelector}:first-child`);
    } catch (e) {
      console.error(`[OpenFiber] Error selecting street "${street}" for city "${city}":`, e.message);
      await page.screenshot({ path: `error-street-${street.replace(/\s+/g, '_')}.png` });
      await browser.close();
      return 'not_exist';
    }
    
    await page.waitForTimeout(1000);

    // 3. House Number Selection
    await typeSlow(page, '#house-number-coverage', houseNumber);
    const houseSelector = 'ul.ui-autocomplete:visible li';
    try {
      await page.waitForSelector(houseSelector, { state: 'visible', timeout: 10000 });
      await page.click(`${houseSelector}:first-child`);
    } catch (e) {
      console.error(`[OpenFiber] Error selecting house number "${houseNumber}" in street "${street}":`, e.message);
      await page.screenshot({ path: `error-house-${houseNumber}.png` });
      await browser.close();
      return 'not_exist';
    }

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
    } catch (e) {
      console.error(`[OpenFiber] Timeout waiting for coverage result for ${city}, ${street} ${houseNumber}`);
      await page.screenshot({ path: `error-result-${city.replace(/\s+/g, '_')}.png` });
    }

    await browser.close();
    return result;

  } catch (globalError) {
    console.error('[OpenFiber] Critical error:', globalError.message);
    await browser.close();
    return 'unknown';
  }
}

module.exports = { runForAddressOpenFiber };
