const themes = {minimal:'清晰履歷', lab:'資料實驗室', editorial:'個人誌', dashboard:'分析面板', timeline:'學習路徑'};
const dialog = document.querySelector('#preview-dialog');
const frame = document.querySelector('#dialog-frame');
const chosen = document.querySelector('#chosen-theme');
let active = 'minimal';
let previousFocus;

function syncFrames() {
  document.querySelectorAll('.preview-window').forEach(box => {
    const iframe = box.querySelector('iframe');
    const resize = () => {
      const width = box.clientWidth;
      iframe.style.transform = `scale(${width / 1200})`;
      box.style.height = `${Math.round(width * .61)}px`;
    };
    new ResizeObserver(resize).observe(box);
    resize();
  });
}
function selectTheme(id) {
  if (!themes[id]) return;
  try { localStorage.setItem('lin-portfolio-choice', id); } catch {}
  chosen.textContent = `目前選擇：${themes[id]}`;
  document.querySelectorAll('.choose').forEach(button => {
    const selected = button.dataset.theme === id;
    button.setAttribute('aria-pressed', String(selected));
    button.textContent = selected ? '已選擇 ✓' : '選這款';
  });
}
function setDevice(mobile) {
  dialog.classList.toggle('is-mobile', mobile);
  document.querySelector('#desktop-view').setAttribute('aria-pressed', String(!mobile));
  document.querySelector('#mobile-view').setAttribute('aria-pressed', String(mobile));
}
document.querySelectorAll('.choose').forEach(button => button.addEventListener('click', () => selectTheme(button.dataset.theme)));
document.querySelectorAll('.preview-open').forEach(button => button.addEventListener('click', () => {
  active = button.dataset.preview;
  previousFocus = document.activeElement;
  frame.src = `site.html?theme=${active}`;
  document.querySelector('#dialog-title').textContent = `${Object.keys(themes).indexOf(active)+1} / ${themes[active]}`;
  document.querySelector('#dialog-full').href = `site.html?theme=${active}`;
  setDevice(false);
  dialog.showModal();
}));
document.querySelector('#desktop-view').addEventListener('click', () => setDevice(false));
document.querySelector('#mobile-view').addEventListener('click', () => setDevice(true));
document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { frame.removeAttribute('src'); previousFocus?.focus(); });
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
try { const saved = localStorage.getItem('lin-portfolio-choice'); if (themes[saved]) selectTheme(saved); } catch {}
syncFrames();
