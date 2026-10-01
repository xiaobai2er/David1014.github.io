const currentFile = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a').forEach(link => {
  if (link.getAttribute('href') === currentFile) link.setAttribute('aria-current', 'page');
});
if (document.querySelector('#career-list')) {
  (window.PORTFOLIO?.experience || []).forEach(item => {
    const section = document.createElement('section');
    section.className = 'detail-section';
    const label = document.createElement('p'); label.className = 'mono'; label.textContent = item.number + ' / ' + item.type;
    const title = document.createElement('h2'); title.textContent = item.title;
    const description = document.createElement('p'); description.textContent = item.description;
    section.append(label, title, description);
    document.querySelector('#career-list').append(section);
  });
}
