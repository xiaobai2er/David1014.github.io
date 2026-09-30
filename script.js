const profile = window.PORTFOLIO;
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
const topics = {
  yuki: { label: 'YUKI / FAVORITE', title: '中島由貴', description: '收藏中島由貴的相關紀錄與喜歡的瞬間。', color: 'var(--data)' },
  career: { label: 'CAREER / EXPERIENCE', title: '職涯', description: '從數學出發，記錄精算與資料分析的實務經驗。', color: 'var(--language)' },
  bands: { label: 'MUSIC / FAVORITE BANDS', title: '喜歡的樂團', description: 'Roselia & RAISE A SUILEN', color: 'var(--life)' },
  ramen: { label: 'RAMEN / FOOD MAP', title: '拉麵地圖', description: '記錄吃過的拉麵，以及下一碗想去探索的味道。', color: '#dab67d' }
};
function renderTopicContent(key) {
  const panel = document.querySelector('#topic-content');
  panel.replaceChildren();
  if (key === 'yuki' && profile?.yukiCover) {
    const cover = document.createElement('img');
    cover.className = 'topic-cover';
    cover.alt = '中島由貴主題封面';
    cover.src = profile.yukiCover;
    cover.addEventListener('error', () => cover.remove(), { once: true });
    panel.append(cover);
  }
  const rows = key === 'career' ? (profile?.experience || []).map(item => [item.title, item.description])
    : key === 'bands' ? [['Roselia', ''], ['RAISE A SUILEN', '']]
    : key === 'ramen' ? [['第一站，準備出發', '店家與食記陸續整理中。']] : [];
  rows.forEach(([title, description]) => {
    const card = document.createElement('div'); card.className = 'topic-entry';
    const heading = document.createElement('h3'); heading.textContent = title; card.append(heading);
    if (description) { const p = document.createElement('p'); p.textContent = description; card.append(p); }
    panel.append(card);
  });
}
renderTopicContent('yuki');
document.querySelectorAll('[data-topic]').forEach(control => {
  control.addEventListener('click', event => {
    event.preventDefault();
    const key = control.dataset.topic;
    const topic = topics[key];
    renderTopicContent(key);
    document.querySelector('#category').textContent = topic.label;
    document.querySelector('#title').textContent = topic.title;
    document.querySelector('#title').style.color = topic.color;
    document.querySelector('#description').textContent = topic.description;
    document.querySelector('#topic').style.borderColor = topic.color;
    document.querySelectorAll('button[data-topic]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topic === key)));
    if (window.matchMedia('(max-width: 760px)').matches) document.querySelector('#topic').scrollIntoView({ block: 'center' });
  });
});
