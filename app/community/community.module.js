// community.module.js
import { communityState } from './community.state.js';
import { renderComposeModal } from './components/compose-modal.js';
import { PrayerWallTab } from './tabs/prayer-wall.tab.js';
import { LeaderboardTab } from './tabs/leaderboard.tab.js';
import { ChallengesTab } from './tabs/challenges.tab.js';
import { GroupsTab } from './tabs/groups.tab.js';

class CommunityModuleClass {
  constructor() {
    this.currentTab = null;
    this.tabs = {
      'prayer-wall': PrayerWallTab,
      'leaderboard': LeaderboardTab,
      'challenges': ChallengesTab,
      'groups': GroupsTab
    };
  }

  async init(containerElement) {
    // 1. Carregar o HTML base
    const htmlResponse = await fetch('./community/community.html');
    const html = await htmlResponse.text();
    containerElement.innerHTML = html;

    // 2. Inicializar o modal de composição
    renderComposeModal();

    // 3. Configurar eventos das abas
    this.setupTabs();

    // 4. Carregar a aba inicial (Mural de oração)
    this.loadTab('prayer-wall');
  }

  setupTabs() {
    const tabButtons = document.querySelectorAll('.community-tab');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabId = e.target.dataset.tab;
        
        // Atualiza visual dos botões
        tabButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // Carrega a aba
        this.loadTab(tabId);
      });
    });
  }

  async loadTab(tabId) {
    if (this.currentTab) {
      this.currentTab.destroy && this.currentTab.destroy();
    }

    communityState.setActiveTab(tabId);
    this.currentTab = this.tabs[tabId];

    const contentContainer = document.getElementById('communityTabContent');
    if (this.currentTab && contentContainer) {
      // Pequeno timeout para dar sensação de transição suave
      contentContainer.style.opacity = '0.5';
      setTimeout(async () => {
        await this.currentTab.render(contentContainer);
        contentContainer.style.opacity = '1';
      }, 50);
    }
  }

  // Ações globais exportadas para uso inline no HTML (onclick)
  toggleReaction(postId, type, btnElement) {
    // Animação de clique
    btnElement.classList.add('pop');
    setTimeout(() => btnElement.classList.remove('pop'), 350);
    
    // Atualiza estado
    communityState.toggleReaction(postId, type);
  }
}

// Criar e exportar a instância principal
export const CommunityModule = new CommunityModuleClass();

// Colocar na window para que eventos inline funcionem
window.CommunityModule = CommunityModule;
window.communityState = communityState;
