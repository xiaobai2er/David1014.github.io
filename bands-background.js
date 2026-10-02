(() => {
  const backdrop = document.querySelector('.bands-backdrop');
  const sections = [...document.querySelectorAll('.bands-page .band-section')];
  if (!backdrop || !sections.length) return;

  const layers = [...backdrop.querySelectorAll('.bands-backdrop__image')];
  const images = {
    roselia: 'https://bushiroad-store.com/cdn/shop/files/2025_roselia_rgb_1400x.jpg?v=1749022330',
    ras: 'https://bushiroad-store.com/cdn/shop/files/2025_RAS_RGB.jpg?v=1749022330',
  };
  Object.values(images).forEach(src => { const image = new Image(); image.src = src; });
  let active = -1;

  const update = () => {
    const mid = window.innerHeight / 2;
    const candidates = sections.map((section, index) => {
      const rect = section.getBoundingClientRect();
      const distance = mid < rect.top ? rect.top - mid : mid > rect.bottom ? mid - rect.bottom : 0;
      return { index, rect, distance };
    }).filter(item => item.distance === 0);
    const selected = candidates.sort((a, b) => Math.abs(a.rect.top + a.rect.height / 2 - mid) - Math.abs(b.rect.top + b.rect.height / 2 - mid))[0];
    const next = selected ? selected.index : -1;
    if (next === active) return;
    active = next;
    backdrop.classList.toggle('is-visible', next >= 0);
    if (next < 0) return;
    const section = sections[next];
    const url = images[section.id];
    if (!url) return;
    const incoming = layers.find(layer => !layer.classList.contains('is-active'));
    const outgoing = layers.find(layer => layer.classList.contains('is-active'));
    incoming.style.backgroundImage = `url("${url}")`;
    incoming.classList.add('is-active');
    outgoing.classList.remove('is-active');
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
