// groups.tab.js
import { CommunityAPI } from '../community.api.js';
import { communityState } from '../community.state.js';

export const GroupsTab = {
  async render(container) {
    container.innerHTML = `<div class="tab-loading">Carregando grupos...</div>`;
    
    this.unsubscribe = communityState.subscribe((event, data) => {
      if (event === 'groupsUpdated') {
        this.renderData(data, container);
      }
    });

    const data = await CommunityAPI.fetchGroups();
    communityState.setGroups(data);
  },

  renderData(data, container) {
    if (!data) return;
    
    const { myGroups, discover } = data;
    
    let html = `
      <div class="groups-section-label">Meus Grupos</div>
    `;
    
    html += myGroups.map(g => `
      <div class="group-card">
        <div class="group-card-icon" style="background: ${g.color}20; color: ${g.color}">
          ${g.icon}
        </div>
        <div class="group-info">
          <span class="group-name">${g.name}</span>
          <span class="group-activity">${g.activity}</span>
        </div>
        <div class="group-unread ${g.unread > 0 ? 'has-unread' : ''}">
          ${g.unread > 0 ? g.unread : '❯'}
        </div>
      </div>
    `).join('');
    
    html += `
      <button class="create-group-btn">
        + Criar Novo Grupo
      </button>
      
      <div class="groups-section-label" style="margin-top:24px;">Descubra Grupos</div>
    `;
    
    html += discover.map(g => `
      <div class="group-card">
        <div class="group-card-icon" style="background: ${g.color}20; color: ${g.color}">
          ${g.icon}
        </div>
        <div class="group-info">
          <span class="group-name">${g.name}</span>
          <span class="group-meta">${g.members} membros</span>
        </div>
        <button class="group-join-btn">Entrar</button>
      </div>
    `).join('');
    
    container.innerHTML = html;
  },

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
};
