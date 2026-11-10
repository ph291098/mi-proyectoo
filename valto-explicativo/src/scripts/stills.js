// Saca fotogramas sueltos para revisar: node stills.js <v|h> <carpeta> <t1> <t2> ...
const { chromium } = require('playwright');
const path = require('path');
const [,, fmt, outDir, ...times] = process.argv;
(async () => {
  const b = await chromium.launch();
  const vp = fmt === 'h' ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
  const p = await b.newPage({ viewport: vp });
  p.on('console', m => console.log('console:', m.text()));
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?fmt=' + fmt);
  await p.evaluate(() => window.ready);
  for (const t of times) {
    await p.evaluate(t => window.render(t), parseFloat(t));
    await p.screenshot({ path: `${outDir}/${fmt}-${t}.png`, scale: 'css' });
  }
  await b.close();
})();
