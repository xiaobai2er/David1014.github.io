(() => {
  const frame = document.getElementById('bands-player-frame');
  const title = document.getElementById('bands-player-title');
  const toggle = document.getElementById('bands-player-toggle');
  const source = document.getElementById('bands-player-source');
  if (!frame || !title || !toggle || !source) return;

  const queues = {
    roselia: {
      label: 'Roselia',
      playlist: 'PLLatW7JFqfww',
      url: 'https://music.youtube.com/playlist?list=PLLatW7JFqfww',
    },
    ras: {
      label: 'RAISE A SUILEN',
      playlist: 'PLUNBkD51DRF0',
      url: 'https://music.youtube.com/playlist?list=PLUNBkD51DRF0',
    },
  };
  const queueIdPattern = /^[A-Za-z0-9_-]{10,64}$/;
  const validQueue = queue => queue && queueIdPattern.test(queue.playlist);
  let player = null;
  let playing = false;
  let activeSource = source.value;

  const setPlaying = value => {
    playing = value;
    const label = value ? 'Pause' : 'Play';
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
    toggle.setAttribute('aria-pressed', String(value));
    toggle.textContent = value ? '\u275a\u275a' : '\u25b6';
  };

  const updateTitle = () => {
    if (!player || !player.getVideoData) return;
    const video = player.getVideoData();
    const queue = queues[activeSource];
    title.textContent = video && video.title ? video.title : `${queue.label} queue`;
    title.href = video && video.video_id
      ? `https://www.youtube.com/watch?v=${encodeURIComponent(video.video_id)}`
      : queue.url;
  };

  const loadQueue = (preservePlayback = false) => {
    const selectedSource = source.value;
    const queue = queues[selectedSource];
    if (!validQueue(queue)) return;
    activeSource = selectedSource;
    title.textContent = `${queue.label} queue`;
    title.href = queue.url;
    if (player) {
      if (preservePlayback) {
        player.loadPlaylist({ list: queue.playlist, listType: 'playlist', index: 0 });
        setPlaying(true);
      } else {
        player.cuePlaylist({ list: queue.playlist, listType: 'playlist', index: 0 });
        setPlaying(false);
      }
    }
  };

  source.addEventListener('change', () => loadQueue(playing));
  document.getElementById('bands-player-previous')?.addEventListener('click', () => player?.previousVideo());
  document.getElementById('bands-player-next')?.addEventListener('click', () => player?.nextVideo());
  toggle.addEventListener('click', () => {
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  });

  window.onYouTubeIframeAPIReady = () => {
    if (!validQueue(queues[activeSource])) return;
    player = new YT.Player(frame, {
      playerVars: { playsinline: 1 },
      events: {
        onReady: () => {
          loadQueue();
          updateTitle();
        },
        onStateChange: event => {
          if (event.data === YT.PlayerState.PLAYING) setPlaying(true);
          if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) setPlaying(false);
          if (event.data === YT.PlayerState.CUED || event.data === YT.PlayerState.PLAYING) updateTitle();
        },
      },
    });
  };

  const api = document.createElement('script');
  api.src = 'https://www.youtube.com/iframe_api';
  document.head.append(api);
})();
