const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

const root = __dirname;
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
  const apiMock = `window.YT={PlayerState:{UNSTARTED:-1,ENDED:0,PLAYING:1,PAUSED:2,BUFFERING:3,CUED:5},Player:function(target,options){const frame=document.createElement('iframe');frame.id='mock-youtube-iframe';(typeof target==='string'?document.getElementById(target):target).replaceWith(frame);let current=0,duration=240,state=5,volume=25;const api={options,playCalls:0,getIframe:()=>frame,getCurrentTime:()=>{if(state===1)current+=0.5;return current},getDuration:()=>duration,getVideoData:()=>({title:'Mock song'}),getPlayerState:()=>state,setVolume:v=>{volume=v},getVolume:()=>volume,unMute:()=>{},mute:()=>{},cuePlaylist:args=>{api.lastCue=args;current=0;state=5;options.events.onStateChange({data:5})},playVideo:()=>{api.playCalls++;state=1;options.events.onStateChange({data:1})},pauseVideo:()=>{state=2;options.events.onStateChange({data:2})},nextVideo:()=>{},previousVideo:()=>{},seekTo:s=>{current=s}};window.mockYTPlayer=api;setTimeout(()=>options.events.onReady({target:api}),0);return api}};if(window.onYouTubeIframeAPIReady)window.onYouTubeIframeAPIReady();`;

(async () => {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const filePath = path.join(root, decodeURIComponent(url.pathname.slice(1) || 'index.html'));
    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const requestUrl = route.request().url();
      if (requestUrl.includes('youtube.com/iframe_api')) return route.fulfill({ contentType: 'text/javascript', body: apiMock });
      if (new URL(requestUrl).origin !== `http://127.0.0.1:${port}`) return route.abort();
      return route.continue();
    });
    await page.goto(`http://127.0.0.1:${port}/index.html`);
    await page.waitForFunction(() => window.mockYTPlayer && window.bandPlayer?.player);
    await page.waitForFunction(() => window.mockYTPlayer.getPlayerState() === 5);
    await page.evaluate(() => { document.querySelector('#music-queue').value = 'ras'; document.querySelector('#music-queue').dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('#music-volume').value = '63'; document.querySelector('#music-volume').dispatchEvent(new Event('input', { bubbles: true })); });
    const freshRoute = await page.evaluate(() => ({ state: window.mockYTPlayer.getPlayerState(), calls: window.mockYTPlayer.playCalls, autoplay: window.bandPlayer.player.options.playerVars.autoplay }));
    assert.equal(freshRoute.state, 5, 'fresh route stays paused after its initial cue');
    assert.equal(freshRoute.calls, 0, 'fresh route does not start playback automatically');
    assert.equal(freshRoute.autoplay, 0);

    await page.locator('#map a.stop[href="bands.html"]').click();
    await page.waitForURL('**/bands.html');
    await page.waitForFunction(() => !window.siteNavigation.busy);
    await page.waitForSelector('.bands-page');
    assert.equal(await page.locator('body > .bands-backdrop').count(), 1, 'bands backdrop is restored with its route');
    await page.evaluate(() => { window.initialPlayerFrame = window.bandPlayer.player.getIframe(); });
    await page.locator('#music-toggle').click();
    const initial = await page.evaluate(() => ({ time: window.bandPlayer.player.getCurrentTime() }));
    await page.waitForTimeout(700);
    const advancing = await page.evaluate(() => window.bandPlayer.player.getCurrentTime());
    assert.ok(advancing > initial.time, 'mock playback advances before navigation');

    await page.locator('nav a[href="ramen.html"]').click();
    await page.waitForURL('**/ramen.html');
    await page.waitForFunction(() => !window.siteNavigation.busy);
    await page.waitForSelector('#ramen-map');
    assert.equal(await page.locator('body > .bands-backdrop').count(), 0, 'bands backdrop is removed from other routes');
    await page.locator('[data-select-place="birdman"]').click();
    assert.ok((await page.locator('#ramen-map-status').textContent()).length > 0, 'ramen map interaction is initialized after navigation');
    await page.locator('nav a[href="voice.html"]').click();
    await page.waitForURL('**/voice.html');
    await page.waitForFunction(() => !window.siteNavigation.busy);
    await page.waitForSelector('.voice-page');
    await page.locator('nav a[href="index.html"]').click();
    await page.waitForURL('**/index.html');
    await page.waitForFunction(() => !window.siteNavigation.busy);
    await page.waitForSelector('#map');
    assert.equal(await page.locator('body').getAttribute('data-page'), null, 'home route clears stale page metadata');
    await page.locator('#map a[data-topic="career"]').hover();
    assert.equal(await page.locator('#category').textContent(), 'CAREER / EXPERIENCE', 'home interactions are initialized after navigation');
    const preserved = await page.evaluate(() => ({
      sameFrame: window.bandPlayer.player.getIframe() === window.initialPlayerFrame && window.bandPlayer.player.getIframe() === document.querySelector('#mock-youtube-iframe'),
      queue: document.querySelector('#music-queue').value,
      volume: Number(document.querySelector('#music-volume').value),
      playing: window.bandPlayer.player.getPlayerState() === YT.PlayerState.PLAYING,
      time: window.bandPlayer.player.getCurrentTime(),
      cue: window.mockYTPlayer.lastCue,
      playCalls: window.mockYTPlayer.playCalls,
      playerCount: document.querySelectorAll('.music-dock').length,
    }));
    assert.ok(preserved.sameFrame, 'iframe identity survives four page transitions');
    assert.equal(preserved.queue, 'ras');
    assert.equal(preserved.volume, 63);
    assert.ok(preserved.playing, `active playback remains active: ${JSON.stringify(preserved)}`);
    assert.ok(preserved.time > advancing, 'playback time keeps advancing across routes');
    assert.equal(preserved.cue.list, 'PLUNBkD51DRF0');
    assert.equal(preserved.cue.index, 0);
    assert.equal(preserved.playerCount, 1);
    assert.equal(preserved.playCalls, 1, 'new pages do not trigger autoplay');

    await page.goBack();
    await page.waitForURL('**/voice.html');
    await page.waitForFunction(() => !window.siteNavigation.busy);
    await page.waitForSelector('.voice-page');
    await page.goForward();
    await page.waitForURL('**/index.html');
    await page.waitForFunction(() => !window.siteNavigation.busy);
    await page.waitForSelector('#map');
    assert.equal(await page.evaluate(() => window.bandPlayer.player.getIframe() === document.querySelector('#mock-youtube-iframe')), true, 'back/forward keeps the iframe');

    const desktop = await page.evaluate(() => {
      const box = document.querySelector('.music-dock').getBoundingClientRect();
      const record = document.querySelector('.music-dock__record').getBoundingClientRect();
      const main = document.querySelector('.music-dock__main').getBoundingClientRect();
      const volume = document.querySelector('.music-dock__volume').getBoundingClientRect();
      const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
      return { width: box.width, height: box.height, record: { left: record.left, right: record.right, top: record.top, bottom: record.bottom }, main: { left: main.left, right: main.right, top: main.top, bottom: main.bottom }, volume: { left: volume.left, right: volume.right, top: volume.top, bottom: volume.bottom, width: volume.width, height: volume.height }, dock: { left: box.left, right: box.right, top: box.top, bottom: box.bottom }, parts: Object.fromEntries(['.music-dock__queue-label', '#music-queue', '.music-dock__title', '.music-dock__timeline', '.music-dock__controls'].map(selector => [selector, rect(selector)])) };
    });
    assert.ok(desktop.width <= 510 * 0.76 && desktop.height <= 112 * 0.8, `desktop dock is about 25% smaller: ${JSON.stringify(desktop)}`);
    assert.ok(desktop.record.right <= desktop.main.left, 'desktop record and center content do not overlap');
    assert.ok(desktop.volume.top <= desktop.dock.top + 17 && desktop.volume.right <= desktop.dock.right && desktop.volume.width <= 90, 'desktop volume is bounded and sits upper right');
    for (const [name, rect] of Object.entries(desktop.parts)) assert.ok(!overlaps(desktop.volume, rect), `desktop volume does not overlap ${name}: ${JSON.stringify({ volume: desktop.volume, rect })}`);

    await page.setViewportSize({ width: 320, height: 780 });
    const mobile = await page.evaluate(() => {
      const box = document.querySelector('.music-dock').getBoundingClientRect();
      const record = document.querySelector('.music-dock__record').getBoundingClientRect();
      const main = document.querySelector('.music-dock__main').getBoundingClientRect();
      const volume = document.querySelector('.music-dock__volume').getBoundingClientRect();
      const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
      return { width: box.width, height: box.height, record: { left: record.left, right: record.right, top: record.top, bottom: record.bottom }, main: { left: main.left, right: main.right, top: main.top, bottom: main.bottom }, volume: { left: volume.left, right: volume.right, top: volume.top, bottom: volume.bottom, width: volume.width, height: volume.height }, dock: { left: box.left, right: box.right, top: box.top, bottom: box.bottom }, parts: Object.fromEntries(['.music-dock__queue-label', '#music-queue', '.music-dock__title', '.music-dock__timeline', '.music-dock__controls'].map(selector => [selector, rect(selector)])) };
    });
    assert.ok(mobile.width <= 320 && mobile.height <= 102 * 0.82, `mobile dock fits viewport and is about 20% shorter: ${JSON.stringify(mobile)}`);
    assert.ok(mobile.record.right <= mobile.main.left, 'mobile record and center content do not overlap');
    assert.ok(mobile.volume.top <= mobile.dock.top + 14 && mobile.volume.right <= mobile.dock.right && mobile.volume.width <= 80, 'mobile volume is bounded and sits upper right');
    for (const [name, rect] of Object.entries(mobile.parts)) assert.ok(!overlaps(mobile.volume, rect), `mobile volume does not overlap ${name}: ${JSON.stringify({ volume: mobile.volume, rect })}`);
    assert.deepEqual(errors, [], `no browser exceptions: ${errors.join('; ')}`);
    console.log(JSON.stringify({ transitions: 'bands -> ramen -> voice -> home; back/forward', preserved, desktop, mobile, browserErrors: errors }, null, 2));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
