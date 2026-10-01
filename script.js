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
