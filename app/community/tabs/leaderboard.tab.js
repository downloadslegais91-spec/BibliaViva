// leaderboard.tab.js
import { CommunityAPI } from '../community.api.js';
import { communityState } from '../community.state.js';
import { createLeaderboardRow, createPodium } from '../components/leaderboard-row.component.js';

export const LeaderboardTab = {
  async render(container) {
    container.innerHTML = `
      <div class="leaderboard-filter">
        <button class="lb-filter-btn active" data-filter="weekly">Semanal</button>
        <button class="lb-filter-btn" data-filter="monthly">Mensal</button>
        <button class="lb-filter-btn" data-filter="all">Geral</button>
      </div>
      
      <div id="leaderboardContent">
        <div class="tab-loading">Carregando ranking...</div>
      </div>
    `;

    const contentContainer = document.getElementById('leaderboardContent');

    this.unsubscribe = communityState.subscribe((event, data) => {
      if (event === 'leaderboardUpdated') {
        this.renderData(data, contentContainer);
      }
    });

    // Filtros
    const btns = container.querySelectorAll('.lb-filter-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        btns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        contentContainer.innerHTML = `<div class="tab-loading">Atualizando...</div>`;
        const data = await CommunityAPI.fetchLeaderboard(e.target.dataset.filter);
        communityState.setLeaderboard(data);
      });
    });

    // Initial fetch
    const data = await CommunityAPI.fetchLeaderboard('weekly');
    communityState.setLeaderboard(data);
  },

  renderData(data, container) {
    if (!data || data.length === 0) return;
    
    const top3 = data.slice(0, 3);
    const rest = data.slice(3);
    const me = data.find(u => u.isMe);
    
    let html = createPodium(top3);
    
    html += `<div class="groups-section-label" style="margin-top:24px;">Outros Participantes</div>`;
    html += rest.map(createLeaderboardRow).join('');
    
    if (me && me.position > 3) {
      html += `
        <div class="lb-my-position-sticky">
          <div class="groups-section-label" style="margin-bottom:8px">Sua Posição</div>
          ${createLeaderboardRow(me)}
        </div>
      `;
    }
    
    container.innerHTML = html;
  },

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
};
