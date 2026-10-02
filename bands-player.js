(() => {
  if (window.bandPlayer) return;
  const queues = {
    roselia: { label: 'Roselia', playlist: 'PLLatW7JFqfww' },
    ras: { label: 'RAISE A SUILEN', playlist: 'PLUNBkD51DRF0' },
  };
  const storage = { queue: 'bandPlayerQueue', volume: 'bandPlayerVolume' };
  const safeGet = key => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const safeSet = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
  const savedQueue = safeGet(storage.queue);
  const initialQueue = Object.hasOwn(queues, savedQueue) ? savedQueue : 'roselia';
  const savedVolumeValue = safeGet(storage.volume);
  const savedVolume = savedVolumeValue === null ? NaN : Number(savedVolumeValue);
  const initialVolume = Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 100 ? savedVolume : 25;
  const root = document.createElement('aside');
  root.className = 'music-dock';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', 'Roselia and RAISE A SUILEN music player');
  root.innerHTML = `<div class="music-dock__yt" aria-hidden="true"><div id="bands-player-frame"></div></div>
    <div class="music-dock__record" aria-hidden="true"><span></span></div>
    <div class="music-dock__volume"><button type="button" id="music-mute" aria-label="Mute" title="Mute">◖)</button><input id="music-volume" type="range" min="0" max="100" value="${initialVolume}" aria-label="Volume" aria-valuetext="${initialVolume}%"></div>
    <div class="music-dock__main"><label class="music-dock__queue-label" for="music-queue">Queue</label><select id="music-queue" aria-label="Select music queue"><option value="roselia"${initialQueue === 'roselia' ? ' selected' : ''}>Roselia</option><option value="ras"${initialQueue === 'ras' ? ' selected' : ''}>RAISE A SUILEN</option></select>
      <div class="music-dock__title" id="music-title">${queues[initialQueue].label}</div><div class="music-dock__timeline"><span id="music-time">00:00 / 00:00</span><input id="music-seek" type="range" min="0" max="1000" value="0" aria-label="Seek" aria-valuetext="00:00"></div>
      <div class="music-dock__controls"><button type="button" id="music-prev" aria-label="Previous track" title="Previous track">|◀</button><button type="button" id="music-toggle" aria-label="Play" aria-pressed="false" title="Play">▶</button><button type="button" id="music-next" aria-label="Next track" title="Next track">▶|</button></div><p class="music-dock__status" id="music-status" role="status" aria-live="polite"></p></div>`;
  document.body.classList.add('has-music-dock');
  document.body.append(root);
  const byId = id => document.getElementById(id);
  const queue = byId('music-queue'), title = byId('music-title'), status = byId('music-status');
  const volume = byId('music-volume'), seek = byId('music-seek'), time = byId('music-time'), toggle = byId('music-toggle');
  let player = null, draggingSeek = false, muted = false, rememberedVolume = initialVolume;
  const fmt = value => { const n = Math.max(0, Math.floor(Number(value) || 0)); return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`; };
  const setPlaying = value => { toggle.setAttribute('aria-label', value ? 'Pause' : 'Play'); toggle.title = value ? 'Pause' : 'Play'; toggle.setAttribute('aria-pressed', String(value)); toggle.textContent = value ? 'Ⅱ' : '▶'; root.classList.toggle('is-playing', value); };
  const refresh = () => { if (!player) return; const current = player.getCurrentTime?.() || 0, duration = player.getDuration?.() || 0; time.textContent = `${fmt(current)} / ${fmt(duration)}`; if (!draggingSeek) { seek.value = String(duration ? Math.round(current / duration * 1000) : 0); seek.setAttribute('aria-valuetext', fmt(current)); } const data = player.getVideoData?.(); if (data?.title) title.textContent = data.title; };
  const cueSelected = () => { const key = queue.value; safeSet(storage.queue, key); title.textContent = queues[key].label; time.textContent = '00:00 / 00:00'; seek.value = '0'; setPlaying(false); if (player) player.cuePlaylist({ list: queues[key].playlist, listType: 'playlist', index: 0 }); };
  queue.addEventListener('change', cueSelected);
  volume.addEventListener('input', () => { const v = Number(volume.value); rememberedVolume = v; muted = false; volume.setAttribute('aria-valuetext', `${v}%`); safeSet(storage.volume, String(v)); if (player) { player.setVolume(v); player.unMute(); } byId('music-mute').setAttribute('aria-label', 'Mute'); });
  byId('music-mute').addEventListener('click', event => { muted = !muted; if (player) muted ? player.mute() : player.unMute(); if (!muted && player) player.setVolume(rememberedVolume); event.currentTarget.setAttribute('aria-label', muted ? 'Unmute' : 'Mute'); event.currentTarget.title = muted ? 'Unmute' : 'Mute'; });
  byId('music-prev').addEventListener('click', () => player?.previousVideo()); byId('music-next').addEventListener('click', () => player?.nextVideo());
  toggle.addEventListener('click', () => { if (!player) { status.textContent = 'YouTube player is not ready.'; return; } const state = player.getPlayerState?.(); if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) player.pauseVideo(); else player.playVideo(); });
  seek.addEventListener('pointerdown', () => { draggingSeek = true; });
  seek.addEventListener('input', () => { const duration = player?.getDuration?.() || 0, seconds = duration * Number(seek.value) / 1000; seek.setAttribute('aria-valuetext', fmt(seconds)); time.textContent = `${fmt(seconds)} / ${fmt(duration)}`; });
  const commitSeek = () => { if (draggingSeek && player?.seekTo) player.seekTo((player.getDuration?.() || 0) * Number(seek.value) / 1000, true); draggingSeek = false; };
  seek.addEventListener('change', commitSeek); seek.addEventListener('pointerup', commitSeek); seek.addEventListener('keyup', event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key) && player?.seekTo) player.seekTo((player.getDuration?.() || 0) * Number(seek.value) / 1000, true); });
  let refreshTimer;
  const startPlayer = () => {
    if (!window.YT?.Player || player) return;
    player = new YT.Player('bands-player-frame', { playerVars: { autoplay: 0, playsinline: 1, controls: 0 }, events: {
      onReady: () => { player.setVolume(Number(volume.value)); cueSelected(); refreshTimer = window.setInterval(refresh, 500); },
      onStateChange: event => { setPlaying(event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.BUFFERING); if (event.data === YT.PlayerState.CUED || event.data === YT.PlayerState.PLAYING) { status.textContent = ''; refresh(); } },
      onError: () => { status.textContent = 'The YouTube playlist could not be loaded. Open a music video on YouTube instead.'; },
    } });
  };
  window.bandPlayer = { get player() { return player; }, get element() { return root; } };
  if (window.YT?.Player) startPlayer();
  else {
    const oldReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (typeof oldReady === 'function') oldReady(); startPlayer(); };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const api = document.createElement('script'); api.src = 'https://www.youtube.com/iframe_api'; api.onerror = () => { status.textContent = 'YouTube player could not load. Check your connection or open a music video on YouTube.'; }; document.head.append(api);
    }
  }
})();
