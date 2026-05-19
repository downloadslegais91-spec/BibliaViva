/**
 * BibliaViva — Sermon Player Module
 * Encapsulates sermon video playback, sharing, custom native media controls (Play/Pause, Mute, Fullscreen)
 * and interactions with the official YouTube IFrame Player API.
 * 
 * Follows Apple HIG standards and Touch-First mobile principles.
 */

// Global player states
window.sermonVideoPlaying = false;
window.sermonVideoMuted = false;

let ytPlayer = null;
let ytApiLoaded = false;

/**
 * Dynamically injects the premium Apple HIG Bottom Sheet Modal into the DOM if it's not present.
 * Decouples the HTML structure entirely from bibliaviva.html.
 */
function ensureSermonModalInjected() {
  if (document.getElementById('youtube-player-modal')) return;

  const modalHtml = `
    <div class="ios-sheet-overlay" id="youtube-player-modal">
      <div class="ios-sheet" onclick="event.stopPropagation()">
        <div class="ios-sheet-grabber"></div>
        <div class="ios-sheet-header">
          <button class="ios-sheet-btn cancel" onclick="closeSermonPlayer()">Fechar</button>
          <span class="ios-sheet-title" id="sermon-modal-title">Carregando pregação...</span>
          <button class="ios-sheet-btn share" id="sermon-modal-share-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
          </button>
        </div>
        <div class="ios-sheet-content ios-sheet-content-sermon">
          <div class="sermon-video-wrapper">
            <div id="youtube-player-iframe-container">
              <div id="sermon-youtube-player-target"></div>
            </div>
            <div class="sermon-video-touch-overlay"></div>
          </div>
          
          <!-- Native Custom Media Controls (Apple HIG) -->
          <div class="sermon-custom-controls">
            <button class="sermon-control-btn secondary" id="sermon-control-mute" title="Silenciar">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <g id="sermon-mute-icon">
                  <!-- Unmute Icon by Default -->
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </g>
              </svg>
            </button>
            
            <button class="sermon-control-btn primary" id="sermon-control-play" title="Reproduzir/Pausar">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <g id="sermon-play-icon">
                  <!-- Pause Icon by Default -->
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </g>
              </svg>
            </button>
            
            <button class="sermon-control-btn secondary" id="sermon-control-fullscreen" title="Tela Cheia">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <g id="sermon-fullscreen-icon">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </g>
              </svg>
            </button>
          </div>
          
          <div class="sermon-modal-details-container">
            <p id="sermon-modal-channel" class="sermon-channel-info">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="sermon-channel-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              <span id="sermon-modal-channel-name"></span>
            </p>
            <p id="sermon-modal-description" class="sermon-description-text"></p>
            
            <a id="sermon-modal-external-link" href="#" target="_blank" rel="noopener noreferrer" class="sermon-youtube-btn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="sermon-youtube-btn-icon">
                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Assistir no YouTube ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const container = document.createElement('div');
  container.innerHTML = modalHtml.trim();
  const modalEl = container.firstElementChild;
  document.body.appendChild(modalEl);

  // Close modal when clicking the backdrop
  modalEl.addEventListener('click', () => {
    closeSermonPlayer();
  });

  // Bind premium touch-first event listeners to overlay and controls to completely block click-through/redirects
  const overlay = modalEl.querySelector('.sermon-video-touch-overlay');
  const btnMute = modalEl.querySelector('#sermon-control-mute');
  const btnPlay = modalEl.querySelector('#sermon-control-play');
  const btnFullscreen = modalEl.querySelector('#sermon-control-fullscreen');

  let lastToggleTime = 0;
  const handleOverlayToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    if (now - lastToggleTime < 350) return;
    lastToggleTime = now;
    toggleSermonPlay(e);
  };

  if (overlay) {
    // Intercept click and touch actions cleanly
    ['click', 'touchend'].forEach(evt => {
      overlay.addEventListener(evt, handleOverlayToggle, { passive: false });
    });
    // Stop all raw pointer propagation to prevent underlying iframe receiving gestures
    ['touchstart', 'pointerdown', 'pointerup', 'mousedown', 'mouseup'].forEach(evt => {
      overlay.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });
    });
  }

  if (btnMute) {
    ['click', 'touchend'].forEach(evt => {
      btnMute.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSermonMute(e);
      }, { passive: false });
    });
  }

  if (btnPlay) {
    ['click', 'touchend'].forEach(evt => {
      btnPlay.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSermonPlay(e);
      }, { passive: false });
    });
  }

  if (btnFullscreen) {
    ['click', 'touchend'].forEach(evt => {
      btnFullscreen.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSermonFullscreen(e);
      }, { passive: false });
    });
  }
}

/**
 * Dynamically loads the official YouTube IFrame Player API.
 */
function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) {
    ytApiLoaded = true;
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    // If script is already loading in DOM, wait for it
    if (document.getElementById('youtube-iframe-api-script')) {
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          ytApiLoaded = true;
          resolve();
        }
      }, 100);
      return;
    }
    
    const tag = document.createElement('script');
    tag.id = 'youtube-iframe-api-script';
    tag.src = 'https://www.youtube.com/iframe_api';
    
    const previousOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function() {
      if (previousOnReady) previousOnReady();
      ytApiLoaded = true;
      resolve();
    };
    
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  });
}

/**
 * Update SVG icons inside custom player controls to reflect active states.
 */
function updateSermonControlsUI() {
  const playIcon = document.getElementById('sermon-play-icon');
  const muteIcon = document.getElementById('sermon-mute-icon');

  if (playIcon) {
    if (window.sermonVideoPlaying) {
      // Pause Icon
      playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    } else {
      // Play Icon
      playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    }
  }

  if (muteIcon) {
    if (window.sermonVideoMuted) {
      // Volume Off/Mute Icon
      muteIcon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
    } else {
      // Volume Up/Unmute Icon
      muteIcon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
    }
  }
}

/**
 * Play a YouTube video inside the Apple HIG Bottom Sheet, leveraging the official YT API.
 */
function playSermonVideo(videoId, title, channel, description) {
  ensureSermonModalInjected();
  
  const modal = document.getElementById('youtube-player-modal');
  const titleEl = document.getElementById('sermon-modal-title');
  const channelNameEl = document.getElementById('sermon-modal-channel-name');
  const descEl = document.getElementById('sermon-modal-description');
  const shareBtn = document.getElementById('sermon-modal-share-btn');
  const externalLink = document.getElementById('sermon-modal-external-link');
  
  if (!modal) return;
  
  // Pause main Bible reading audio if active
  if (window.currentAudio && !window.currentAudio.paused) {
    window.currentAudio.pause();
    const btnPlay = document.getElementById('btn-audio-play');
    if (btnPlay) btnPlay.textContent = '▶';
  }
  
  // Set sermon details
  if (titleEl) titleEl.innerText = title;
  if (channelNameEl) {
    channelNameEl.innerText = `Canal: ${channel}`;
  } else {
    const channelEl = document.getElementById('sermon-modal-channel');
    if (channelEl) channelEl.innerText = `Canal: ${channel}`;
  }
  
  // Graceful description fallback
  const fallbackBook = window.currentBook || 'Bíblia';
  const displayDescription = (description && description.trim()) ? description : `Explore esta inspiradora pregação baseada nos ensinamentos do livro de ${fallbackBook} e aprofunde sua caminhada de fé com reflexões práticas para o dia a dia.`;
  if (descEl) descEl.innerText = displayDescription;
  
  // Set share action
  if (shareBtn) {
    shareBtn.onclick = (e) => {
      e.stopPropagation();
      shareCurrentSermon(title, videoId);
    };
  }
  
  // Set external watch link
  if (externalLink) {
    externalLink.href = `https://www.youtube.com/watch?v=${videoId}`;
  }
  
  // Show Bottom Sheet Modal and prevent body scroll
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Load YouTube API and instantiate robust YT.Player
  loadYouTubeAPI().then(() => {
    // If player already exists, just load video
    if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
      try {
        ytPlayer.loadVideoById({
          videoId: videoId
        });
        window.sermonVideoPlaying = true;
        window.sermonVideoMuted = false;
        updateSermonControlsUI();
        return;
      } catch (e) {
        console.warn("Could not reuse existing YT.Player, destroying and rebuilding...", e);
        try { ytPlayer.destroy(); } catch (err) {}
        ytPlayer = null;
      }
    }

    // Reset container with player target placeholder
    const container = document.getElementById('youtube-player-iframe-container');
    if (container) {
      container.innerHTML = '<div id="sermon-youtube-player-target"></div>';
    }

    // Create new player instance
    ytPlayer = new YT.Player('sermon-youtube-player-target', {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        'autoplay': 1,
        'controls': 0, // Hides native controls completely to prevent redirects
        'disablekb': 1, // Disable keyboard shortcuts
        'fs': 0, // Disable native full screen button
        'iv_load_policy': 3, // Hide video annotations
        'modestbranding': 1, // Minimize YouTube branding
        'rel': 0, // Related videos only from same channel
        'playsinline': 1, // Play inline on iOS Safari
        'enablejsapi': 1,
        'origin': window.location.origin
      },
      events: {
        'onReady': (event) => {
          event.target.playVideo();
          window.sermonVideoPlaying = true;
          window.sermonVideoMuted = event.target.isMuted();
          updateSermonControlsUI();
        },
        'onStateChange': (event) => {
          // YT.PlayerState.PLAYING = 1, YT.PlayerState.PAUSED = 2, YT.PlayerState.ENDED = 0
          if (event.data === 1) {
            window.sermonVideoPlaying = true;
          } else if (event.data === 2 || event.data === 0) {
            window.sermonVideoPlaying = false;
          }
          updateSermonControlsUI();
        }
      }
    });
  });
}

/**
 * Close player, clean/destroy YT player to stop playback, and restore background scroll.
 */
function closeSermonPlayer() {
  const modal = document.getElementById('youtube-player-modal');
  
  if (modal) {
    modal.classList.remove('active');
    modal.classList.remove('fullscreen-active');
  }
  
  if (ytPlayer) {
    try {
      if (typeof ytPlayer.stopVideo === 'function') ytPlayer.stopVideo();
      if (typeof ytPlayer.destroy === 'function') ytPlayer.destroy();
    } catch (e) {
      console.warn('Error closing YouTube player:', e);
    }
    ytPlayer = null;
  }
  
  const iframeContainer = document.getElementById('youtube-player-iframe-container');
  if (iframeContainer) {
    iframeContainer.innerHTML = '<div id="sermon-youtube-player-target"></div>';
  }
  
  window.sermonVideoPlaying = false;
  window.sermonVideoMuted = false;
  
  // Reset fullscreen button icon and title
  const fullscreenIcon = document.getElementById('sermon-fullscreen-icon');
  const fullscreenBtn = document.getElementById('sermon-control-fullscreen');
  if (fullscreenIcon) {
    fullscreenIcon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>';
  }
  if (fullscreenBtn) {
    fullscreenBtn.title = "Tela Cheia";
  }
  
  document.body.style.overflow = ''; // Restore background scroll
}

/**
 * Toggle Sermon Play/Pause natively using robust YT API calls.
 */
function toggleSermonPlay(event) {
  if (event) event.stopPropagation();
  if (!ytPlayer) return;
  
  try {
    const state = typeof ytPlayer.getPlayerState === 'function' ? ytPlayer.getPlayerState() : null;
    if (state === 1) { // Playing
      ytPlayer.pauseVideo();
      window.sermonVideoPlaying = false;
      if (window.showFeedback) window.showFeedback('⏸️ Vídeo pausado');
    } else { // Paused, ended, etc
      ytPlayer.playVideo();
      window.sermonVideoPlaying = true;
      if (window.showFeedback) window.showFeedback('▶️ Vídeo reproduzindo');
    }
  } catch (e) {
    console.error('Error toggling Play state via YouTube API:', e);
  }
  updateSermonControlsUI();
}

/**
 * Toggle Sermon Mute/Unmute natively using robust YT API calls.
 */
function toggleSermonMute(event) {
  if (event) event.stopPropagation();
  if (!ytPlayer) return;
  
  try {
    const isMuted = typeof ytPlayer.isMuted === 'function' ? ytPlayer.isMuted() : window.sermonVideoMuted;
    if (isMuted) {
      ytPlayer.unMute();
      window.sermonVideoMuted = false;
      if (window.showFeedback) window.showFeedback('🔊 Áudio ativado');
    } else {
      ytPlayer.mute();
      window.sermonVideoMuted = true;
      if (window.showFeedback) window.showFeedback('🔇 Vídeo silenciado');
    }
  } catch (e) {
    console.error('Error toggling Mute state via YouTube API:', e);
  }
  updateSermonControlsUI();
}

/**
 * Toggle Fullscreen via CSS simulated theater mode.
 * Bypasses iframe gesture and iOS Safari constraints completely.
 */
function toggleSermonFullscreen(event) {
  if (event) event.stopPropagation();
  
  const modal = document.getElementById('youtube-player-modal');
  if (!modal) return;
  
  const fullscreenBtn = document.getElementById('sermon-control-fullscreen');
  const fullscreenIcon = document.getElementById('sermon-fullscreen-icon');
  
  const isFullscreen = modal.classList.toggle('fullscreen-active');
  
  if (fullscreenIcon) {
    if (isFullscreen) {
      // Exit Fullscreen Icon (Shrink)
      fullscreenIcon.innerHTML = '<path d="M4 14h6v6H8v-4H4v-2zm10 6h2v-4h4v-2h-6v6zM4 8h4V4h2v6H4V8zm14 0V4h-2v6h6V8h-4z"></path>';
      if (fullscreenBtn) fullscreenBtn.title = "Sair da Tela Cheia";
      if (window.showFeedback) window.showFeedback('📺 Modo tela cheia ativado');
    } else {
      // Enter Fullscreen Icon (Expand)
      fullscreenIcon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>';
      if (fullscreenBtn) fullscreenBtn.title = "Tela Cheia";
      if (window.showFeedback) window.showFeedback('📺 Modo padrão ativado');
    }
  }
}

/**
 * Share sermon via Native Web Share API or copy-link fallback.
 */
function shareCurrentSermon(title, videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const shareData = {
    title: `Pregação: ${title}`,
    text: `Assista a esta edificante pregação em BíbliaViva: "${title}"`,
    url: videoUrl
  };
  
  if (navigator.share) {
    navigator.share(shareData)
      .then(() => {
        if (window.showFeedback) window.showFeedback('🎯 Compartilhado com sucesso!');
      })
      .catch((err) => {
        if (err.name !== 'AbortError') fallbackCopyLink(videoUrl);
      });
  } else {
    fallbackCopyLink(videoUrl);
  }
}

/**
 * Clipboard fallback copy link.
 */
function fallbackCopyLink(url) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => {
        if (window.showFeedback) window.showFeedback('📋 Link copiado para a área de transferência!');
      })
      .catch(() => fallbackCopyLinkCommand(url));
  } else {
    fallbackCopyLinkCommand(url);
  }
}

/**
 * Legacy command fallback copy link.
 */
// Ensure modal is injected into the DOM as soon as possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureSermonModalInjected);
} else {
  ensureSermonModalInjected();
}

function fallbackCopyLinkCommand(url) {
  const textArea = document.createElement("textarea");
  textArea.value = url;
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    if (window.showFeedback) window.showFeedback('📋 Link copiado para a área de transferência!');
  } catch (err) {
    if (window.showFeedback) window.showFeedback('❌ Falha ao copiar link');
  }
  document.body.removeChild(textArea);
}
