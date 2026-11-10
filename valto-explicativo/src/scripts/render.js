// Renderiza un tramo de fotogramas a un segmento H.264:
//   node render.js <v|h> <salida.mp4> <frameInicio> <frameFin>
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const [,, fmt, outFile, f0s, f1s] = process.argv;
const FPS = 30;
(async () => {
  const b = await chromium.launch();
  const vp = fmt === 'h' ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
  const p = await b.newPage({ viewport: vp });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?fmt=' + fmt);
  await p.evaluate(() => window.ready);
  const total = Math.round((await p.evaluate(() => window.DUR)) * FPS);
  const f0 = parseInt(f0s || '0'), f1 = Math.min(total, parseInt(f1s || String(total)));
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', '-g', '30',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = f0; f < f1; f++) {
    await p.evaluate(t => window.render(t), f / FPS);
    const buf = await p.screenshot({ type: 'png', scale: 'css' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await b.close();
  console.log('done', outFile, f0, f1);
})();
