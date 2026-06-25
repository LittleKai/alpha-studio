const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();
  
  // Set user agent to resemble a real browser
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log('Navigating to Uiverse...');
  await page.goto('https://uiverse.io/Smit-Prajapati/great-bat-98', {
    waitUntil: 'networkidle2'
  });
  
  console.log('Extracting page content...');
  // Let's get the HTML of the page to find HTML/CSS code blocks
  const html = await page.content();
  fs.writeFileSync('uiverse_page.html', html);
  
  // Try to find the HTML and CSS tabs/content
  const data = await page.evaluate(() => {
    // Uiverse pages usually have copy buttons or code blocks.
    const preElements = Array.from(document.querySelectorAll('pre'));
    const codeTexts = preElements.map(pre => pre.innerText);
    
    return {
      pres: codeTexts,
      title: document.title
    };
  });
  
  console.log('Title:', data.title);
  console.log('Found', data.pres.length, 'pre elements');
  fs.writeFileSync('uiverse_extracted.json', JSON.stringify(data, null, 2));
  
  await browser.close();
  console.log('Done!');
}

run().catch(err => {
  console.error('Error:', err);
});
