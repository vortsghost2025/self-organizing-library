const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const capture = async (url, filename) => {
    console.log(`Navigating to ${url}...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    } catch (e) {
      console.log(`Networkidle0 timeout/issue, falling back to networkidle2: ${e.message}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }
    
    // Wait for loading text to disappear
    try {
      await page.waitForFunction(() => {
        const divs = Array.from(document.querySelectorAll('div'));
        return !divs.some(div => div.textContent.includes('Rendering graph workspace') || div.textContent.includes('Loading graph'));
      }, { timeout: 30000 });
    } catch (e) {
      console.log(`Wait for loader to disappear timed out, proceeding: ${e.message}`);
    }
    
    // Wait 4 more seconds for Sigma's layout/rendering/animations to settle
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const outputPath = path.join("C:/Users/seand/.gemini/antigravity/brain/87a69dbb-b03f-4961-9bb2-9d4b627202c5", filename);
    await page.screenshot({ path: outputPath });
    console.log(`Saved screenshot to ${outputPath}`);
  };

  try {
    // 1. Default overview (navigation lens)
    await capture('http://localhost:3000/graph?lens=navigation', '01_default_overview.png');

    // 2. Authority lens (authority view)
    await capture('http://localhost:3000/graph?lens=authority', '02_authority_lens.png');

    // 3. Governance lens (contradiction view)
    await capture('http://localhost:3000/graph?lens=governance', '03_governance_lens.png');

    // 4. Canonical lens (canonical view)
    await capture('http://localhost:3000/graph?lens=canonical', '04_canonical_lens.png');

    // 5. Select one node + neighbors view (simulate search for "covenant")
    await capture('http://localhost:3000/graph?lens=navigation&mode=full', '05_navigation_full_mode.png');

  } catch (e) {
    console.error('Error during capture:', e);
  } finally {
    await browser.close();
  }
})();
