(() => {
  const map = document.getElementById('ramen-map');
  const tilesLayer = document.getElementById('ramen-map-tiles');
  const markerLayer = document.getElementById('ramen-map-markers');
  const status = document.getElementById('ramen-map-status');
  if (!map || !tilesLayer || !markerLayer || !status) return;

  const locations = [
    { id: 'noodlesoul', name: '麵魂家-真。濃厚豚骨拉麵', lat: 24.672, lon: 121.765 },
    { id: 'birdman', name: '鳥人拉麵 中山店', lat: 25.0509, lon: 121.524 },
    { id: 'chikumo', name: '麵屋 千雲 林森店', lat: 25.0514, lon: 121.525 },
    { id: 'duck', name: '柑橘Shinn 鴨蔥', lat: 25.02307, lon: 121.55453 },
    { id: 'issyoke', name: '一生懸麵 新埔三猿店', lat: 25.02361, lon: 121.46874 },
    { id: 'mutsuki', name: '睦月拉麵', lat: 25.041, lon: 121.552 },
    { id: 'hasumentei', name: '荷麵亭 HASUMENTEI 士林店', lat: 25.0931168, lon: 121.5266429 },
    { id: 'guanghua', name: '丸舢拉麵 光華店', lat: 25.044, lon: 121.531 },
    { id: 'cityhall', name: '丸舢拉麵 市府店', lat: 25.041, lon: 121.568 },
    { id: 'shinn', name: '柑橘Shinn', lat: 25.037, lon: 121.551 },
    { id: 'ryunokokyu', name: '龍鱗拉麵 士林店', lat: 25.088, lon: 121.526 },
  ];
  const size = 256;
  const state = { lat: 24.89, lon: 121.53, zoom: 8, selected: null, drag: null, tileError: false };
  let renderQueued = false;

  const project = (lat, lon, zoom) => {
    const scale = size * (2 ** zoom);
    const sin = Math.sin(lat * Math.PI / 180);
    return {
      x: (lon + 180) / 360 * scale,
      y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
    };
  };
  const unproject = (x, y, zoom) => {
    const scale = size * (2 ** zoom);
    const lon = x / scale * 360 - 180;
    const n = Math.PI - 2 * Math.PI * y / scale;
    return { lat: 180 / Math.PI * Math.atan(Math.sinh(n)), lon };
  };
  const centerPixel = () => project(state.lat, state.lon, state.zoom);
  const queueRender = () => {
    if (renderQueued) return;
    renderQueued = true;
    window.requestAnimationFrame(() => { renderQueued = false; render(); });
  };

  const render = () => {
    const width = map.clientWidth;
    const height = map.clientHeight;
    if (!width || !height) return;
    const center = centerPixel();
    const left = center.x - width / 2;
    const top = center.y - height / 2;
    const firstX = Math.floor(left / size);
    const lastX = Math.floor((left + width) / size);
    const firstY = Math.floor(top / size);
    const lastY = Math.floor((top + height) / size);
    const maxTile = 2 ** state.zoom;
    const tileNodes = [];
    for (let y = firstY; y <= lastY; y += 1) {
      if (y < 0 || y >= maxTile) continue;
      for (let x = firstX; x <= lastX; x += 1) {
        const wrappedX = ((x % maxTile) + maxTile) % maxTile;
        const tile = document.createElement('img');
        tile.className = 'ramen-map__tile';
        tile.alt = '';
        tile.draggable = false;
        tile.src = `https://tile.openstreetmap.org/${state.zoom}/${wrappedX}/${y}.png`;
        tile.style.left = `${Math.round(x * size - left)}px`;
        tile.style.top = `${Math.round(y * size - top)}px`;
        tile.addEventListener('error', () => {
          state.tileError = true;
          status.textContent = '地圖圖磚暫時無法載入；請使用下方地址與導航清單。';
        }, { once: true });
        tileNodes.push(tile);
      }
    }
    tilesLayer.replaceChildren(...tileNodes);
    markerLayer.setAttribute('viewBox', `0 0 ${width} ${height}`);
    markerLayer.replaceChildren();
    for (const location of locations) {
      const point = project(location.lat, location.lon, state.zoom);
      const x = point.x - left;
      const y = point.y - top;
      if (x < -20 || y < -20 || x > width + 20 || y > height + 20) continue;
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      marker.setAttribute('class', `ramen-map__marker${state.selected === location.id ? ' is-selected' : ''}`);
      marker.setAttribute('transform', `translate(${x},${y})`);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', state.selected === location.id ? '10' : '8');
      const number = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      number.setAttribute('text-anchor', 'middle');
      number.setAttribute('dy', '0.35em');
      number.textContent = String(locations.indexOf(location) + 1);
      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hit.setAttribute('r', '18');
      hit.setAttribute('class', 'ramen-map__hit');
      marker.append(hit, circle, number);
      marker.dataset.placeId = location.id;
      marker.setAttribute('role', 'button');
      marker.setAttribute('tabindex', '0');
      marker.setAttribute('aria-label', `${locations.indexOf(location) + 1}. ${location.name}`);
      marker.addEventListener('click', () => selectLocation(location.id));
      marker.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectLocation(location.id); }
      });
      markerLayer.append(marker);
    }
    if (!state.tileError) status.textContent = `${locations.length} 個位置；點選標記或清單店名查看位置。`;
  };

  const selectLocation = id => {
    const location = locations.find(item => item.id === id);
    if (!location) return;
    state.selected = id;
    state.lat = location.lat;
    state.lon = location.lon;
    state.zoom = Math.max(state.zoom, 14);
    document.querySelectorAll('.ramen-location').forEach(item => item.classList.toggle('is-selected', item.dataset.place === id));
    status.textContent = `已選取：${location.name}；可使用地址旁的地圖導航。`;
    queueRender();
  };
  // Buttons and list controls work without any map tile service.
  document.getElementById('ramen-zoom-in')?.addEventListener('click', () => { state.zoom = Math.min(18, state.zoom + 1); queueRender(); });
  document.getElementById('ramen-zoom-out')?.addEventListener('click', () => { state.zoom = Math.max(7, state.zoom - 1); queueRender(); });
  document.getElementById('ramen-reset')?.addEventListener('click', () => {
    state.lat = 24.89; state.lon = 121.53; state.zoom = 8; state.selected = null;
    document.querySelectorAll('.ramen-location').forEach(item => item.classList.remove('is-selected'));
    status.textContent = `${locations.length} 個位置；點選標記或清單店名查看位置。`;
    queueRender();
  });
  document.querySelectorAll('[data-select-place]').forEach(button => button.addEventListener('click', () => selectLocation(button.dataset.selectPlace)));

  map.addEventListener('pointerdown', event => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    if (event.target.closest('button, a')) return;
    const marker = event.target.closest('.ramen-map__marker');
    state.drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      center: centerPixel(),
      markerId: marker?.dataset.placeId || null,
      moved: false,
    };
    try { map.setPointerCapture(event.pointerId); } catch (_) { /* Pointer may already have been cancelled. */ }
    map.classList.add('is-dragging');
    event.preventDefault();
  });
  map.addEventListener('pointermove', event => {
    if (!state.drag || state.drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - state.drag.x;
    const dy = event.clientY - state.drag.y;
    if (!state.drag.moved && Math.hypot(dx, dy) < 5) return;
    state.drag.moved = true;
    const next = unproject(state.drag.center.x - dx, state.drag.center.y - dy, state.zoom);
    state.lat = next.lat; state.lon = next.lon; queueRender();
  });
  const endDrag = (event, cancelled = false) => {
    if (!state.drag || state.drag.pointerId !== event.pointerId) return;
    const drag = state.drag;
    state.drag = null;
    map.classList.remove('is-dragging');
    if (!cancelled && !drag.moved && drag.markerId) selectLocation(drag.markerId);
    try { if (map.hasPointerCapture(event.pointerId)) map.releasePointerCapture(event.pointerId); } catch (_) { /* Capture can be lost before pointerup. */ }
  };
  map.addEventListener('pointerup', event => endDrag(event));
  map.addEventListener('pointercancel', event => endDrag(event, true));
  map.addEventListener('lostpointercapture', event => endDrag(event, true));
  map.addEventListener('keydown', event => {
    if (event.key === '+' || event.key === '=') { state.zoom = Math.min(18, state.zoom + 1); queueRender(); }
    if (event.key === '-') { state.zoom = Math.max(7, state.zoom - 1); queueRender(); }
  });
  window.addEventListener('resize', queueRender);
  if ('ResizeObserver' in window) new ResizeObserver(queueRender).observe(map);
  queueRender();
})();
