/**
 * BibliaViva — Sermon Player Module
 * Encapsulates sermon video playback, sharing, using the original, native 
 * YouTube IFrame Player with standard controls (timeline, play/pause, seek, volume).
 * 
 * Follows Apple HIG standards and Touch-First mobile principles for the sheet container.
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
function togglePlayPause() {
  if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
    const state = ytPlayer.getPlayerState();
    if (state === 1) { // YT.PlayerState.PLAYING
      ytPlayer.pauseVideo();
    } else {
      ytPlayer.playVideo();
    }
  }
}

function toggleSimulatedFullscreen(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('youtube-player-modal');
  if (!modal) return;
  
  const isCurrentlyFS = modal.classList.contains('fullscreen-active');
  if (isCurrentlyFS) {
    modal.classList.remove('fullscreen-active');
    modal.classList.remove('rotated');
  } else {
    modal.classList.add('fullscreen-active');
  }
}

function toggleRotation(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('youtube-player-modal');
  if (!modal) return;
  
  modal.classList.toggle('rotated');
  
  if (window.showFeedback) {
    const isRotated = modal.classList.contains('rotated');
    window.showFeedback(isRotated ? '🔄 Vídeo rotacionado' : '🔄 Orientação restaurada');
  }
}

// Auto-fullscreen on mobile landscape rotation
window.addEventListener('resize', () => {
  const modal = document.getElementById('youtube-player-modal');
  if (!modal || !modal.classList.contains('active')) return;
  
  const isLandscape = window.innerWidth > window.innerHeight;
  // Standard mobile/tablet breakpoint
  const isMobile = window.innerWidth < 920 || window.innerHeight < 500;
  
  if (isLandscape && isMobile) {
    if (!modal.classList.contains('fullscreen-active')) {
      modal.classList.add('fullscreen-active');
    }
  } else if (!isLandscape && modal.classList.contains('fullscreen-active')) {
    modal.classList.remove('fullscreen-active');
    modal.classList.remove('rotated');
  }
});

function ensureSermonModalInjected() {
  if (document.getElementById('youtube-player-modal')) return;

  const modalHtml = `
    <div class="ios-sheet-overlay" id="youtube-player-modal">
      <!-- Simulated Fullscreen Floating Controls -->
      <button class="sermon-fs-control-btn exit-fs" id="sermon-fs-exit-btn" onclick="toggleSimulatedFullscreen(event)" title="Sair da Tela Cheia">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4"></path>
        </svg>
      </button>
      <button class="sermon-fs-control-btn rotate-fs" id="sermon-fs-rotate-btn" onclick="toggleRotation(event)" title="Rotacionar Vídeo">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
      </button>

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
            <!-- Floating Glassmorphic Fullscreen trigger button -->
            <button class="sermon-video-fs-btn" id="sermon-video-fs-btn" onclick="toggleSimulatedFullscreen(event)" title="Tela Cheia">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
            </button>
            <div id="youtube-player-iframe-container">
              <div id="sermon-youtube-player-target"></div>
            </div>
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
 * Play a YouTube video inside the Apple HIG Bottom Sheet, leveraging the official YT API with standard controls.
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

  // Load YouTube API and instantiate YT.Player
  loadYouTubeAPI().then(() => {
    // If player already exists, just load video
    if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
      try {
        ytPlayer.loadVideoById({
          videoId: videoId
        });
        window.sermonVideoPlaying = true;
        window.sermonVideoMuted = false;

        // Ensure iframe attributes are maintained on reuse
        const iframe = ytPlayer.getIframe();
        if (iframe) {
          iframe.setAttribute('allowfullscreen', 'true');
          iframe.setAttribute('webkitallowfullscreen', 'true');
          iframe.setAttribute('mozallowfullscreen', 'true');
          iframe.setAttribute('msallowfullscreen', 'true');
          iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
          iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-popups-to-escape-sandbox');
        }
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

    // Create new player instance with standard controls enabled
    ytPlayer = new YT.Player('sermon-youtube-player-target', {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        'autoplay': 1,
        'controls': 1, // Enable the original native YouTube control bar with timeline/scrubber
        'disablekb': 0, // Enable native keyboard shortcuts
        'fs': 1, // Enable the native YouTube fullscreen button
        'iv_load_policy': 1, // Show video annotations
        'modestbranding': 1, // Premium branding: hides YouTube logo from control bar
        'rel': 0, // Related videos only from the same channel
        'playsinline': 1, // Play inline on iOS Safari within the bottom sheet
        'enablejsapi': 1,
        'origin': window.location.origin
      },
      events: {
        'onReady': (event) => {
          event.target.playVideo();
          window.sermonVideoPlaying = true;
          window.sermonVideoMuted = event.target.isMuted();

          // Force fullscreen capabilities on the dynamically created iframe element
          const iframe = event.target.getIframe();
          if (iframe) {
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('webkitallowfullscreen', 'true');
            iframe.setAttribute('mozallowfullscreen', 'true');
            iframe.setAttribute('msallowfullscreen', 'true');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-popups-to-escape-sandbox');
          }
        },
        'onStateChange': (event) => {
          // YT.PlayerState.PLAYING = 1, YT.PlayerState.PAUSED = 2, YT.PlayerState.ENDED = 0
          if (event.data === 1) {
            window.sermonVideoPlaying = true;
          } else if (event.data === 2 || event.data === 0) {
            window.sermonVideoPlaying = false;
          }
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
    modal.classList.remove('rotated');
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
  
  document.body.style.overflow = ''; // Restore background scroll
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

// Ensure modal is injected into the DOM as soon as possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureSermonModalInjected);
} else {
  ensureSermonModalInjected();
}
