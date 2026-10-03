const currentFile = location.pathname.split('/').pop() || 'index.html';
const ageLabel = document.querySelector('#yuki-age');
if (ageLabel) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
  const value = type => Number(parts.find(part => part.type === type).value);
  const beforeBirthday = value('month') < 9 || (value('month') === 9 && value('day') < 12);
  ageLabel.textContent = value('year') - 1997 - Number(beforeBirthday);
}
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
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const main = document.querySelector('main');
if (main) {
  const revealTargets = document.body.classList.contains('home-page')
    ? [...main.children, document.querySelector('#contact'), document.querySelector('footer')].filter(Boolean)
    : [...main.children, ...document.querySelectorAll('#career-list > *, .resume-experience > *, .resume-capabilities > *, .resume-milestones > *')];
  revealTargets.forEach(target => {
    if (!target.hasAttribute('data-reveal') && !target.querySelector('[data-reveal]')) target.setAttribute('data-reveal', '');
  });
  // Progressive enhancement: without IntersectionObserver the content stays visible.
  const items = [...document.querySelectorAll('[data-reveal]')];
  if ('IntersectionObserver' in window && !motionPreference.matches) {
    try {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('reveal-pending');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
      items.forEach((item, index) => {
        item.style.setProperty('--reveal-delay', `${Math.min(index % 5, 4) * 70}ms`);
        item.classList.add('reveal-pending');
        observer.observe(item);
      });
      motionPreference.addEventListener('change', event => {
        if (event.matches) {
          observer.disconnect();
          items.forEach(item => item.classList.remove('reveal-pending'));
        }
      });
    } catch {
      items.forEach(item => item.classList.remove('reveal-pending'));
    }
  }
}
