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
  data: { label: 'DATA / STUDY', title: '統計與資料', description: '記錄統計學習、資料處理與實際分析中的觀察。', color: 'var(--data)' },
  language: { label: 'LANGUAGE / JAPANESE', title: '日文學習', description: '從單字、文法到閱讀，記錄日文學習路上的發現與練習。', color: 'var(--language)' },
  life: { label: 'LEARNING / LIFE', title: '學習與生活', description: '收藏日常的靈感，記下閱讀、學習與生活裡值得留下的片刻。', color: 'var(--life)' }
};
document.querySelectorAll('[data-topic]').forEach(control => {
  control.addEventListener('click', event => {
    event.preventDefault();
    const key = control.dataset.topic;
    const topic = topics[key];
    document.querySelector('#category').textContent = topic.label;
    document.querySelector('#title').textContent = topic.title;
    document.querySelector('#title').style.color = topic.color;
    document.querySelector('#description').textContent = topic.description;
    document.querySelector('#topic').style.borderColor = topic.color;
    document.querySelectorAll('button[data-topic]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topic === key)));
    if (window.matchMedia('(max-width: 760px)').matches) document.querySelector('#topic').scrollIntoView({ block: 'center' });
  });
});
