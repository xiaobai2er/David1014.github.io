const profile = window.PORTFOLIO;
const previews = {
  resume: {
    label: 'PROFILE / INTRODUCTION',
    title: '關於我',
    description: profile?.intro || '歡迎來到我的個人地圖。',
    color: 'var(--resume)'
  },
  voice: {
    label: 'VOICE / FAVORITE',
    title: '聲優',
    description: '記錄喜愛的聲優、作品，以及那些令人印象深刻的聲音表演。',
    color: 'var(--voice)'
  },
  bands: {
    label: 'MUSIC / FAVORITE BANDS',
    title: '樂團',
    description: '分享喜愛的樂團與歌曲，還有陪伴日常的音樂。',
    color: 'var(--bands)'
  },
  projects: {
    label: 'PROJECTS / SELECTED WORK',
    title: '專案',
    description: '整理參與過的專案、實作經驗與持續累積的成果。',
    color: 'var(--projects)'
  },
  ramen: {
    label: 'RAMEN / FOOD MAP',
    title: '拉麵',
    description: '收藏造訪過的拉麵店與值得再次回訪的一碗好麵。',
    color: 'var(--ramen)'
  },
  career: {
    label: 'CAREER / EXPERIENCE',
    title: '職涯',
    description: '回顧工作歷程、專業經驗，以及一路上的學習與成長。',
    color: 'var(--career)'
  }
};
const topic = document.querySelector('#topic');
const previewLinks = document.querySelectorAll('#map [data-topic]');
let activePreview;

function showPreview(key) {
  const preview = previews[key];
  if (!preview || key === activePreview) return;
  activePreview = key;
  document.querySelector('#category').textContent = preview.label;
  document.querySelector('#title').textContent = preview.title;
  document.querySelector('#description').textContent = preview.description;
  document.querySelector('#title').style.color = preview.color;
  topic.style.borderColor = preview.color;
  previewLinks.forEach(link => link.classList.toggle('is-previewed', link.dataset.topic === key));
}

previewLinks.forEach(link => {
  const key = link.dataset.topic;
  link.addEventListener('pointerenter', () => showPreview(key));
  link.addEventListener('focus', () => showPreview(key));
  if (key === 'resume') {
    link.addEventListener('click', () => showPreview('resume'));
    link.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showPreview('resume');
      }
    });
  }
});

const bandBranch = document.querySelector('#band-branch');
const bandTrigger = bandBranch.querySelector('.node-band');
const bandSubitems = document.querySelector('#band-subitems');
function setBandExpanded(expanded) {
  bandBranch.classList.toggle('is-open', expanded);
  bandTrigger.setAttribute('aria-expanded', String(expanded));
  bandSubitems.setAttribute('aria-hidden', String(!expanded));
  bandSubitems.querySelectorAll('a').forEach(link => link.setAttribute('tabindex', expanded ? '0' : '-1'));
}
bandBranch.addEventListener('pointerenter', () => setBandExpanded(true));
bandBranch.addEventListener('pointerleave', () => {
  if (bandBranch.dataset.pinned !== 'true' && !bandBranch.contains(document.activeElement)) setBandExpanded(false);
});
bandBranch.addEventListener('focusin', () => setBandExpanded(true));
bandBranch.addEventListener('focusout', () => {
  window.setTimeout(() => {
    if (bandBranch.dataset.pinned !== 'true' && !bandBranch.contains(document.activeElement)) setBandExpanded(false);
  }, 0);
});
if (!window.__portfolioBandDisclosureInstalled) {
  window.__portfolioBandDisclosureInstalled = true;
  document.addEventListener('click', event => {
    const trigger = event.composedPath().find(node => node instanceof Element && node.matches('#band-branch > .node-band'));
    if (!trigger) return;
    const branch = trigger.closest('#band-branch');
    if (branch.dataset.pinned === 'true') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    branch.dataset.pinned = 'true';
    branch.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    const items = branch.querySelector('#band-subitems');
    items.setAttribute('aria-hidden', 'false');
    items.querySelectorAll('a').forEach(link => link.setAttribute('tabindex', '0'));
  }, true);
  document.addEventListener('pointerdown', event => {
    const branch = document.querySelector('#band-branch');
    if (!branch || branch.contains(event.target)) return;
    branch.dataset.pinned = 'false';
    branch.classList.remove('is-open');
    const trigger = branch.querySelector('.node-band');
    trigger.setAttribute('aria-expanded', 'false');
    const items = branch.querySelector('#band-subitems');
    items.setAttribute('aria-hidden', 'true');
    items.querySelectorAll('a').forEach(link => link.setAttribute('tabindex', '-1'));
  });
}
bandBranch.addEventListener('keydown', event => {
  if (event.key === ' ') {
    if (event.target === bandTrigger) {
      event.preventDefault();
      bandTrigger.click();
    }
  } else if (event.key === 'Escape') {
    bandBranch.dataset.pinned = 'false';
    if (event.target !== bandTrigger) bandTrigger.focus();
    setBandExpanded(false);
  }
});
showPreview('resume');

if (profile) {
  document.title = `${profile.name} | Personal Route Map`;
  document.querySelector('#profile-name').textContent = `${profile.name}.`;
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
