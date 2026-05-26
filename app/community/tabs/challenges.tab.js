// challenges.tab.js
import { CommunityAPI } from '../community.api.js';
import { communityState } from '../community.state.js';

export const ChallengesTab = {
  async render(container) {
    container.innerHTML = `<div class="tab-loading">Carregando desafios...</div>`;
    
    this.unsubscribe = communityState.subscribe((event, data) => {
      if (event === 'challengesUpdated') {
        this.renderData(data, container);
      }
    });

    const data = await CommunityAPI.fetchChallenges();
    communityState.setChallenges(data);
  },

  renderData(data, container) {
    if (!data) return;
    
    const { community, personal } = data;
    
    let html = `
      <!-- Banner Desafio da Comunidade -->
      <div class="weekly-challenge-banner">
        <div class="wc-header">
          <span class="wc-label">Desafio Global</span>
          <span class="wc-timer">⏱️ 3d 12h</span>
        </div>
        <h3 class="wc-title">${community.title}</h3>
        <p class="wc-desc">${community.desc}</p>
        
        <div class="wc-progress-track">
          <div class="wc-progress-fill" style="width: 0%"></div>
        </div>
        <div class="wc-progress-labels">
          <span>Progresso</span>
          <span>${community.progress}%</span>
        </div>
        
        <div class="wc-participants">
          <div class="wc-avatars">
            <div class="wc-avatar" style="background:#AF52DE; z-index:3">M</div>
            <div class="wc-avatar" style="background:#34C759; z-index:2">J</div>
            <div class="wc-avatar" style="background:#FF9500; z-index:1">S</div>
          </div>
          <span class="wc-participant-count">+${community.participants} participando</span>
        </div>
        
        <div class="wc-reward">
          🎁 Recompensa: <strong>${community.reward}</strong>
        </div>
      </div>
      
      <div class="groups-section-label" style="margin-top:24px; margin-bottom:12px;">Seus Desafios Diários</div>
    `;
    
    // Desafios Pessoais
    html += personal.map(c => {
      const pct = Math.round((c.progress / c.total) * 100);
      const isComplete = c.completed || pct >= 100;
      
      let onClickAction = `window.switchPage && window.switchPage('leitura')`;
      if (!isComplete && c.title && c.title.startsWith('Estudo: ')) {
        const targetBook = c.title.replace('Estudo: ', '').trim();
        const nextCh = c.progress ? (c.progress + 1) : 1;
        onClickAction = `window.continueReading && window.continueReading('${targetBook}', ${nextCh})`;
      }

      return `
        <div class="post-card" style="margin-bottom: 10px; display:flex; align-items:center; gap:16px; cursor:${isComplete ? 'default' : 'pointer'}" ${isComplete ? '' : `onclick="${onClickAction}"`}>
          <div style="flex-shrink:0; width:48px; height:48px; border-radius:50%; background:${isComplete ? 'var(--community-green)' : 'var(--bg)'}; display:flex; align-items:center; justify-content:center; font-size:20px;">
            ${isComplete ? '✅' : '🎯'}
          </div>
          <div style="flex:1;">
            <span style="display:block; font-size:15px; font-weight:600; color:${isComplete ? 'var(--label)' : 'var(--label)'}; text-decoration:${isComplete ? 'line-through' : 'none'}; opacity:${isComplete ? '0.6' : '1'}">${c.title}</span>
            
            <div style="display:flex; align-items:center; gap:10px; margin-top:6px; opacity:${isComplete ? '0.6' : '1'}">
              <div style="flex:1; background:var(--bg); height:6px; border-radius:3px; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:var(--blue); border-radius:3px;"></div>
              </div>
              <span style="font-size:12px; color:var(--label2); font-weight:600;">${c.progress}/${c.total}</span>
            </div>
          </div>
          
          <div style="flex-shrink:0; text-align:right; opacity:${isComplete ? '0.6' : '1'}">
            <span style="display:block; font-size:14px; font-weight:700; color:var(--blue);">+${c.xp}</span>
            <span style="font-size:10px; color:var(--label2);">XP</span>
          </div>
        </div>
      `;
    }).join('');
    
    container.innerHTML = html;
    
    // Animate global progress bar
    setTimeout(() => {
      const fill = container.querySelector('.wc-progress-fill');
      if (fill) fill.style.width = community.progress + '%';
    }, 50);
  },

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
};
