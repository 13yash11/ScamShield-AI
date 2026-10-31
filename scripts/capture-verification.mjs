import http from 'http';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DIST_DIR = path.resolve('dist');
const SCREENSHOT_DIR = path.resolve('screenshots');
const ARTIFACT_DIR = 'C:\\Users\\Aspire Lite\\.gemini\\antigravity\\brain\\a91e7524-f6e3-438d-bd5b-6b59c09b6404';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Simple SPA static file server
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // SPA fallback
    const indexPath = path.join(DIST_DIR, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
  }
});

const PORT = 4173;

async function capture(urlPath, filename, width = 1280, height = 800) {
  const targetUrl = `http://localhost:${PORT}${urlPath}`;
  const outPath = path.join(SCREENSHOT_DIR, filename);
  console.log(`Capturing ${targetUrl} (${width}x${height}) -> ${filename}...`);

  const tempProfile = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'edge-test-profile-' + Date.now());
  await execFileAsync(EDGE_PATH, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${tempProfile}`,
    `--window-size=${width},${height}`,
    `--screenshot=${outPath}`,
    '--hide-scrollbars',
    targetUrl,
  ]);

  if (fs.existsSync(ARTIFACT_DIR)) {
    fs.copyFileSync(outPath, path.join(ARTIFACT_DIR, filename));
  }
}

server.listen(PORT, async () => {
  console.log(`SPA Test Server listening on http://localhost:${PORT}`);
  try {
    await capture('/', 'screenshot-homepage.png', 1280, 850);
    await capture('/', 'screenshot-homepage-mobile.png', 375, 812);
    await capture('/scan', 'screenshot-scan.png', 1280, 900);
    await capture('/signup', 'screenshot-signup.png', 1280, 950);
    await capture('/login', 'screenshot-login.png', 1280, 800);
    await capture('/dashboard', 'screenshot-dashboard.png', 1280, 850);
    await capture('/how-it-works', 'screenshot-how-it-works.png', 1280, 900);
    await capture('/history', 'screenshot-history.png', 1280, 800);
    console.log('Visual verification capture finished successfully.');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
