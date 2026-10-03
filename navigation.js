(() => {
  if (window.siteNavigation) return;
  const routes = new Set(['index.html', 'career.html', 'voice.html', 'bands.html', 'projects.html', 'ramen.html', 'resume.html']);
  let routeAbort = null;
  let routeObservers = [];
  let routeRestores = [];
  let routeGeneration = 0;
  let navigationBusy = false;

  const routeName = url => url.pathname.split('/').filter(Boolean).pop() || 'index.html';
  const canNavigate = url => url.origin === location.origin && routes.has(routeName(url));
  const cleanupRoute = () => {
    routeAbort?.abort();
    routeAbort = null;
    routeObservers.forEach(observer => observer.disconnect());
    routeObservers = [];
    routeRestores.splice(0).reverse().forEach(restore => restore());
  };

  const trackRouteResources = () => {
    routeAbort = new AbortController();
    const signal = routeAbort.signal;
    const originalAdd = window.addEventListener;
    window.addEventListener = function (type, listener, options) {
      if (this !== window) return originalAdd.call(this, type, listener, options);
      const next = typeof options === 'boolean' ? { capture: options, signal } : { ...(options || {}), signal };
      return originalAdd.call(this, type, listener, next);
    };
    routeRestores.push(() => { window.addEventListener = originalAdd; });

    const originalMatchMedia = window.matchMedia;
    window.matchMedia = function (...args) {
      const query = originalMatchMedia.apply(this, args);
      const originalQueryAdd = query.addEventListener;
      query.addEventListener = function (type, listener, options) {
        const next = typeof options === 'boolean' ? { capture: options, signal } : { ...(options || {}), signal };
        return originalQueryAdd.call(this, type, listener, next);
      };
      return query;
    };
    routeRestores.push(() => { window.matchMedia = originalMatchMedia; });

    for (const name of ['IntersectionObserver', 'ResizeObserver']) {
      const Original = window[name];
      if (!Original) continue;
      const Wrapped = new Proxy(Original, { construct(Target, args) { const observer = new Target(...args); routeObservers.push(observer); return observer; } });
      window[name] = Wrapped;
      routeRestores.push(() => { window[name] = Original; });
    }
  };

  const syncStylesheets = doc => {
    const currentLinks = [...document.querySelectorAll('head link[rel~="stylesheet"]')];
    const nextLinks = [...doc.querySelectorAll('head link[rel~="stylesheet"]')];
    const key = link => `${link.href}\n${link.media}`;
    const available = new Map();
    currentLinks.forEach(link => {
      const linkKey = key(link);
      if (!available.has(linkKey)) available.set(linkKey, []);
      available.get(linkKey).push(link);
    });

    const retained = new Set();
    for (const link of nextLinks) {
      const match = available.get(key(link))?.shift();
      if (match) retained.add(match);
      else document.head.appendChild(document.importNode(link, true));
    }
    currentLinks.forEach(link => { if (!retained.has(link)) link.remove(); });
  };

  const runPageScripts = async (doc, generation) => {
    const scripts = [...doc.querySelectorAll('.page ~ script, body > script')];
    for (const script of scripts) {
      let source = script.textContent;
      if (script.src) {
        const url = new URL(script.getAttribute('src'), location.href);
        if (url.origin !== location.origin) continue;
        const response = await fetch(url.href, { credentials: 'same-origin' });
        if (!response.ok) throw new Error(`Could not load ${url.pathname}`);
        source = await response.text();
      }
      if (generation !== routeGeneration) return;
      // Function scope isolates classic-script lexical declarations so routes can be revisited.
      (new Function(source))();
    }
  };

  const loadRoute = async (url, { historyMode = 'push', scroll = true } = {}) => {
    if (!canNavigate(url)) return false;
    const generation = ++routeGeneration;
    navigationBusy = true;
    try {
      const response = await fetch(url.href, { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`Could not load ${url.pathname}`);
      const parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
      if (generation !== routeGeneration) return false;
      const nextPage = parsed.querySelector('body > .page');
      const currentPage = document.querySelector('body > .page');
      if (!nextPage || !currentPage) return false;

      cleanupRoute();
      syncStylesheets(parsed);
      currentPage.replaceWith(document.importNode(nextPage, true));
      document.querySelector('body > .bands-backdrop')?.remove();
      const nextBackdrop = parsed.body.querySelector(':scope > .bands-backdrop');
      if (nextBackdrop) document.body.insertBefore(document.importNode(nextBackdrop, true), document.querySelector('body > .page'));
      document.title = parsed.title;
      const hasMusicDock = document.body.classList.contains('has-music-dock');
      document.body.classList.remove('home-page', 'resume-page');
      [...parsed.body.classList].filter(className => className !== 'has-music-dock').forEach(className => document.body.classList.add(className));
      document.body.classList.toggle('has-music-dock', hasMusicDock);
      if (parsed.body.dataset.page) document.body.dataset.page = parsed.body.dataset.page;
      else delete document.body.dataset.page;
      if (historyMode === 'push') history.pushState({}, '', url.pathname + url.search + url.hash);
      else if (historyMode === 'replace') history.replaceState({}, '', url.pathname + url.search + url.hash);
      trackRouteResources();
      await runPageScripts(parsed, generation);
      if (generation !== routeGeneration) return false;
      if (scroll) {
        if (url.hash) document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();
        else window.scrollTo(0, 0);
      }
      return true;
    } finally {
      if (generation === routeGeneration) navigationBusy = false;
    }
  };

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // SVG link targets can be SVGTextElement/SVGCircleElement instances; use the
    // composed path so branch clicks resolve to their enclosing anchor reliably.
    const link = event.composedPath().find(node => node instanceof Element && node.matches('a[href]'));
    if (!link || link.getAttribute('target') || link.hasAttribute('download')) return;
    const url = new URL(link.getAttribute('href'), location.href);
    if (!canNavigate(url)) return;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) {
      event.preventDefault();
      history.pushState({}, '', url.href);
      document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();
      return;
    }
    event.preventDefault();
    loadRoute(url).catch(error => {
      window.dispatchEvent(new CustomEvent('sitenavigationerror', { detail: error }));
    });
  }, true);
  window.addEventListener('popstate', () => {
    loadRoute(new URL(location.href), { historyMode: 'none' }).catch(error => {
      window.dispatchEvent(new CustomEvent('sitenavigationerror', { detail: error }));
    });
  });
  window.siteNavigation = { load: href => loadRoute(new URL(href, location.href)), get busy() { return navigationBusy; } };
})();
