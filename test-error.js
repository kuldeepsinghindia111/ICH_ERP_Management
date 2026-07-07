const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  await page.goto('http://localhost:8080/settings/general', { waitUntil: 'networkidle' }).catch(e => console.log('GOTO ERR:', e.message));
  await browser.close();
})();
