(() => {
  if (window.bandPlayer) return;
  const queues = {
    roselia: { label: 'Roselia', playlist: 'PLLatW7JFqfww' },
    ras: { label: 'RAISE A SUILEN', playlist: 'PLUNBkD51DRF0', videos: ['8e0cdY3CM9s','Uh2MjQ9Q324','4b3deIpxkSk','oXN2YFZH0ig','2gJfjLGCf9U','ci5Ot5n-8_k','5gUl74wG2DE','AxEUw6LdHR4','gSVSgtA9ke4','9iOltuunbvs','DfJT_frR5GY','gHqSTnDDmJk','mKt2u5a3-H8','6AYEq-aacmU','5AL7kBxbMI8','eLpe02tbeYU','CmEGhNuz_zs','m5z-mCUwmxM','DkMyx_sLMlk','eJp3_buirj4','9V7m4YJvFQ0','rRo4HYj654A','ckqNhklWz6I','-0OIoHQv5qY','caxxCfDdklI','vHZF9D4gAoQ','pW01z1Q-MQY','4i9vGzhaCg0','bjHImc6cTqE','zle_8SGQgcg','0fBH7M4EY1M','M-6HMvPPnLM','pB350d7RuAg','cmwOP8goDTw','e_5VjvDrHz8'] },
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
  let playlistIndex = 0, playlistReady = false, suppressLoadPlayback = false, pendingPlaylistLoad = null;
  const fmt = value => { const n = Math.max(0, Math.floor(Number(value) || 0)); return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`; };
  const setPlaying = value => { toggle.setAttribute('aria-label', value ? 'Pause' : 'Play'); toggle.title = value ? 'Pause' : 'Play'; toggle.setAttribute('aria-pressed', String(value)); toggle.textContent = value ? 'Ⅱ' : '▶'; root.classList.toggle('is-playing', value); };
  const restoreVolume = () => {
    if (!suppressLoadPlayback || !player) return;
    suppressLoadPlayback = false;
    if (muted) player.mute();
    else { player.unMute(); player.setVolume(rememberedVolume); }
  };
  const playlistPosition = () => {
    const customVideos = queues[queue.value].videos;
    if (customVideos) {
      const id = player?.getVideoData?.()?.video_id;
      return id === customVideos[playlistIndex] ? playlistIndex : -1;
    }
    const videos = player?.getPlaylist?.() || [];
    const videoId = player?.getVideoData?.()?.video_id;
    const index = player?.getPlaylistIndex?.();
    return videoId && videos[index] === videoId && Number.isInteger(index) && index >= 0 && index < videos.length ? index : -1;
  };
  const sameVideos = (left, right) => left.length === right.length && left.every((video, index) => video === right[index]);
  const refresh = () => {
    if (!player) return;
    const current = player.getCurrentTime?.() || 0, duration = player.getDuration?.() || 0;
    time.textContent = `${fmt(current)} / ${fmt(duration)}`;
    if (!draggingSeek) { seek.value = String(duration ? Math.round(current / duration * 1000) : 0); seek.setAttribute('aria-valuetext', fmt(current)); }
    const data = player.getVideoData?.();
    if (data?.title) title.textContent = data.title;
    const index = playlistPosition();
    const videos = player.getPlaylist?.() || [];
    const playlistChanged = !pendingPlaylistLoad || data?.video_id !== pendingPlaylistLoad.videoId || !sameVideos(videos, pendingPlaylistLoad.videos);
    if (index >= 0 && playlistChanged) { playlistIndex = index; playlistReady = true; pendingPlaylistLoad = null; if (status.textContent === 'Loading playlist…') status.textContent = ''; }
  };
  const loadPlaylist = (index, pauseAfterLoad = false) => {
    const customVideos = queues[queue.value].videos;
    if (customVideos) {
      if (!player?.cueVideoById || !player?.loadVideoById) { status.textContent = 'YouTube cannot load this track right now. Please try again.'; return false; }
      const videoId = customVideos[index];
      playlistIndex = index;
      playlistReady = true;
      pendingPlaylistLoad = null;
      suppressLoadPlayback = pauseAfterLoad;
      status.textContent = '';
      if (pauseAfterLoad) { player.setVolume(0); player.mute(); player.cueVideoById({ videoId }); }
      else player.loadVideoById({ videoId });
      return true;
    }
    if (!player?.loadPlaylist) { status.textContent = 'YouTube cannot load this playlist right now. Please try again.'; return false; }
    pendingPlaylistLoad = { videoId: player.getVideoData?.()?.video_id, videos: player.getPlaylist?.() || [] };
    playlistIndex = index;
    playlistReady = false;
    suppressLoadPlayback = pauseAfterLoad;
    status.textContent = 'Loading playlist…';
    if (pauseAfterLoad) { player.setVolume(0); player.mute(); }
    try {
      player.loadPlaylist({ list: queues[queue.value].playlist, listType: 'playlist', index });
      if (pauseAfterLoad) player.pauseVideo();
      return true;
    } catch (_) {
      restoreVolume();
      status.textContent = 'Could not load this playlist. Please try again.';
      return false;
    }
  };
  const cueSelected = () => {
    const key = queue.value;
    safeSet(storage.queue, key);
    title.textContent = queues[key].label;
    time.textContent = '00:00 / 00:00';
    seek.value = '0';
    setPlaying(false);
    loadPlaylist(0, true);
  };
  const moveTrack = direction => {
    if (!player) { status.textContent = 'YouTube player is not ready.'; return; }
    if (!playlistReady) { status.textContent = 'Playlist is still loading. Try again in a moment.'; return; }
    const reportedIndex = playlistPosition();
    if (reportedIndex < 0) { playlistReady = false; status.textContent = 'Playlist is still loading. Try again in a moment.'; return; }
    const currentIndex = reportedIndex;
    const targetIndex = currentIndex + direction;
    const trackCount = queues[queue.value].videos?.length ?? (player.getPlaylist?.() || []).length;
    if (targetIndex < 0 || targetIndex >= trackCount) {
      status.textContent = 'You are at the start or end of this playlist.';
      return;
    }
    const paused = player.getPlayerState?.() !== YT.PlayerState.PLAYING && player.getPlayerState?.() !== YT.PlayerState.BUFFERING;
    loadPlaylist(targetIndex, paused);
  };
  queue.addEventListener('change', cueSelected);
  volume.addEventListener('input', () => { const v = Number(volume.value); rememberedVolume = v; muted = false; volume.setAttribute('aria-valuetext', `${v}%`); safeSet(storage.volume, String(v)); if (player) { if (suppressLoadPlayback) { player.setVolume(0); player.mute(); } else { player.setVolume(v); player.unMute(); } } byId('music-mute').setAttribute('aria-label', 'Mute'); });
  byId('music-mute').addEventListener('click', event => { muted = !muted; if (player) { if (suppressLoadPlayback) { player.setVolume(0); player.mute(); } else { muted ? player.mute() : player.unMute(); if (!muted) player.setVolume(rememberedVolume); } } event.currentTarget.setAttribute('aria-label', muted ? 'Unmute' : 'Mute'); event.currentTarget.title = muted ? 'Unmute' : 'Mute'; });
  byId('music-prev').addEventListener('click', () => moveTrack(-1)); byId('music-next').addEventListener('click', () => moveTrack(1));
  toggle.addEventListener('click', () => { if (!player) { status.textContent = 'YouTube player is not ready.'; return; } const state = player.getPlayerState?.(); if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) player.pauseVideo(); else { restoreVolume(); player.playVideo(); } });
  seek.addEventListener('pointerdown', () => { draggingSeek = true; });
  seek.addEventListener('input', () => { const duration = player?.getDuration?.() || 0, seconds = duration * Number(seek.value) / 1000; seek.setAttribute('aria-valuetext', fmt(seconds)); time.textContent = `${fmt(seconds)} / ${fmt(duration)}`; });
  const commitSeek = () => { if (draggingSeek && player?.seekTo) player.seekTo((player.getDuration?.() || 0) * Number(seek.value) / 1000, true); draggingSeek = false; };
  seek.addEventListener('change', commitSeek); seek.addEventListener('pointerup', commitSeek); seek.addEventListener('keyup', event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key) && player?.seekTo) player.seekTo((player.getDuration?.() || 0) * Number(seek.value) / 1000, true); });
  let refreshTimer;
  const startPlayer = () => {
    if (!window.YT?.Player || player) return;
    player = new YT.Player('bands-player-frame', { playerVars: { autoplay: 0, playsinline: 1, controls: 0 }, events: {
      onReady: () => { player.setVolume(Number(volume.value)); cueSelected(); refreshTimer = window.setInterval(refresh, 500); },
      onStateChange: event => {
        if (suppressLoadPlayback && event.data === YT.PlayerState.PLAYING) { player.pauseVideo(); return; }
        setPlaying(event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.BUFFERING);
        if (event.data === YT.PlayerState.CUED) {
          refresh();
          if (!playlistReady) status.textContent = 'YouTube has not loaded tracks for this playlist yet.';
        } else if (event.data === YT.PlayerState.PAUSED) {
          refresh();
        } else if (event.data === YT.PlayerState.PLAYING) {
          refresh();
        }
      },
      onError: () => { playlistReady = false; status.textContent = 'The YouTube playlist could not be loaded. Check that the playlist is public, or open a music video on YouTube instead.'; },
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
