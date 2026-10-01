const profile = window.PORTFOLIO;
const previews = {
  yuki: { label: 'YUKI / FAVORITE', title: '中島由貴', description: '收藏中島由貴的相關紀錄與喜歡的瞬間。', color: 'var(--data)' },
  career: { label: 'CAREER / EXPERIENCE', title: '職涯', description: '從數學出發，探索精算與資料分析的實務經驗、工作歷程與持續學習。', color: 'var(--language)' },
  bands: { label: 'MUSIC / FAVORITE BANDS', title: '喜歡的樂團', description: 'Roselia & RAISE A SUILEN：收藏喜歡的音樂與樂團相關紀錄。', color: 'var(--life)' },
  ramen: { label: 'RAMEN / FOOD MAP', title: '拉麵地圖', description: '記錄吃過的拉麵、食記與口袋名單，尋找下一碗喜歡的味道。', color: 'var(--ramen)' }
};
const routeKeys = { 'voice.html': 'yuki', 'career.html': 'career', 'bands.html': 'bands', 'voice.html#bands': 'bands', 'ramen.html': 'ramen' };
const previewLinks = document.querySelectorAll('#map a');
let activePreview;
function showPreview(key) {
  if (!previews[key] || key === activePreview) return;
  activePreview = key;
  const preview = previews[key];
  document.querySelector('#category').textContent = preview.label;
  document.querySelector('#title').textContent = preview.title;
  document.querySelector('#description').textContent = preview.description;
  document.querySelector('#title').style.color = preview.color;
  document.querySelector('#topic').style.borderColor = preview.color;
  previewLinks.forEach(link => link.classList.toggle('is-previewed', routeKeys[link.getAttribute('href')] === key));
}
previewLinks.forEach(link => {
  const key = routeKeys[link.getAttribute('href')];
  link.addEventListener('pointerenter', () => showPreview(key));
  link.addEventListener('focus', () => showPreview(key));
});
showPreview('yuki');
if (profile) {
  document.title = `${profile.name}｜興趣路線圖`;
  document.querySelector('h1').textContent = `${profile.name}.`;
  document.querySelector('.avatar').textContent = Array.from(profile.initials || profile.name)[0];
  document.querySelector('.subtitle').textContent = profile.role;
  document.querySelector('.bio').textContent = profile.intro;
  document.querySelector('.credentials').textContent = profile.education;
  const tools = document.createElement('p');
  tools.className = 'mono';
  tools.textContent = profile.capabilities.find(item => item.label === '工具')?.value || '';
  document.querySelector('.identity').append(tools);
  if (profile.links.email) {
    const link = document.createElement('a');
    link.href = `mailto:${encodeURIComponent(profile.links.email)}`;
    link.textContent = profile.links.email;
    document.querySelector('.contact-title').replaceChildren(link);
  }
}
