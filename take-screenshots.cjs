const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport for a nice desktop screenshot
  await page.setViewport({ width: 1440, height: 1080, deviceScaleFactor: 2 });
  
  // Go to dev server
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  // Take light mode screenshot
  await page.screenshot({ path: 'public/screenshot-light.png', fullPage: true });
  
  // Switch to dark mode (by clicking the theme toggle in the floating dock)
  await page.click('nav.fixed button');
  
  // Wait a bit for transition
  await new Promise(r => setTimeout(r, 1000));
  
  // Take dark mode screenshot
  await page.screenshot({ path: 'public/screenshot-dark.png', fullPage: true });
  
  await browser.close();
})();
