(() => {
  const tracks = [
    { id: 'p6XVF7fkoGM', title: 'Roselia - BLACK SHOUT (LIVE Vier)' },
    { id: 'gGUPMlP8TnI', title: 'RAISE A SUILEN - A DECLARATION OF \u00d7\u00d7\u00d7' },
  ];
  const frame = document.getElementById('bands-player-frame');
  const title = document.getElementById('bands-player-title');
  const toggle = document.getElementById('bands-player-toggle');
  if (!frame || !title || !toggle) return;

  let activeTrack = 0;
  let player = null;
  let playing = false;

  const setPlaying = value => {
    playing = value;
    const label = value ? 'Pause' : 'Play';
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
    toggle.setAttribute('aria-pressed', String(value));
    toggle.textContent = value ? '\u275a\u275a' : '\u25b6';
  };

  const updateTrack = index => {
    activeTrack = (index + tracks.length) % tracks.length;
    const track = tracks[activeTrack];
    title.textContent = track.title;
    title.href = `https://www.youtube.com/watch?v=${track.id}`;
    if (player) {
      player.loadVideoById(track.id);
      setPlaying(true);
    } else {
      // Keep pre-API selection paused; play intent is applied once the API is ready.
      frame.src = `https://www.youtube-nocookie.com/embed/${track.id}?enablejsapi=1&playsinline=1`;
      setPlaying(false);
    }
  };

  document.getElementById('bands-player-previous')?.addEventListener('click', () => updateTrack(activeTrack - 1));
  document.getElementById('bands-player-next')?.addEventListener('click', () => updateTrack(activeTrack + 1));
  toggle.addEventListener('click', () => {
    if (player) {
      if (playing) player.pauseVideo();
      else player.playVideo();
    } else {
      setPlaying(!playing);
    }
  });

  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player(frame, {
      events: {
        onReady: () => {
          if (playing) player.playVideo();
          else player.pauseVideo();
        },
        onStateChange: event => {
          if (event.data === YT.PlayerState.PLAYING) setPlaying(true);
          if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) setPlaying(false);
        },
      },
    });
  };

  const api = document.createElement('script');
  api.src = 'https://www.youtube.com/iframe_api';
  document.head.append(api);
})();
