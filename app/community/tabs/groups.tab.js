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
        <button class="group-join-btn" data-id="${g.id}">Entrar</button>
      </div>
    `).join('');
    
    container.innerHTML = html;

    // Adicionar eventos
    const createBtn = container.querySelector('.create-group-btn');
    if (createBtn) {
      createBtn.addEventListener('click', async () => {
        const name = prompt("Qual o nome do novo grupo?");
        if (name && name.trim()) {
          createBtn.textContent = "Criando...";
          const newData = await CommunityAPI.createGroup(name.trim());
          communityState.setGroups(newData);
        }
      });
    }

    const joinBtns = container.querySelectorAll('.group-join-btn');
    joinBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.target.getAttribute('data-id'), 10);
        e.target.textContent = "Entrando...";
        const newData = await CommunityAPI.joinGroup(id);
        communityState.setGroups(newData);
      });
    });
  },

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
};
