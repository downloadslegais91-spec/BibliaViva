// community.api.js
// Mock da API para alimentar os dados da comunidade

export const CommunityAPI = {
  // Simula delay de rede
  async delay(ms = 800) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  async fetchPosts() {
    await this.delay();
    return [
      {
        id: 1,
        author: "Maria Clara",
        type: "Oração",
        time: "Há 10 min",
        content: "Irmãos, peço oração pela saúde da minha avó que fará uma cirurgia delicada amanhã de manhã. Que Deus guie as mãos dos médicos.",
        reactions: { amem: 24, orando: 12 },
        userReactions: { amem: true, orando: false }
      },
      {
        id: 2,
        author: "Lucas Rodrigues",
        type: "Testemunho",
        time: "Há 2 horas",
        content: "Deus é fiel! Depois de 6 meses desempregado, hoje assinei meu contrato de trabalho. Agradeço as orações do grupo!",
        reactions: { amem: 156, orando: 0 },
        userReactions: { amem: false, orando: false }
      },
      {
        id: 3,
        author: "Ana Beatriz",
        type: "Oração",
        time: "Há 5 horas",
        content: "Orando pela juventude da nossa igreja, para que tenham sede da Palavra.",
        reactions: { amem: 45, orando: 30 },
        userReactions: { amem: false, orando: true }
      }
    ];
  },

  async fetchLeaderboard(filter = 'weekly') {
    try {
      if (window.API_URL) {
        const url = filter !== 'weekly' ? `${window.API_URL}/users/ranking?filter=${filter}` : `${window.API_URL}/users/ranking`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          const currentUser = window.currentUser || {};
          return json.data.map((u, index) => ({
            id: u.id,
            name: u.name || 'Usuário',
            xp: u.xp || u.total_xp || 0,
            level: u.level || 1,
            position: index + 1,
            isMe: u.id === currentUser.id
          }));
        }
      }
    } catch (err) {
      console.warn("Erro ao buscar ranking real, usando dados falsos:", err);
    }

    await this.delay(600);
    // Simula diferentes dados baseado no filtro
    return [
      { id: 101, name: "Pr. Marcos", xp: 12500, level: 12, position: 1 },
      { id: 102, name: "João Pedro", xp: 11200, level: 10, position: 2 },
      { id: 103, name: "Sarah Silva", xp: 9800, level: 9, position: 3 },
      { id: 104, name: "Você", xp: 4200, level: 5, position: 12, isMe: true },
      { id: 105, name: "Carlos A.", xp: 4150, level: 5, position: 13 }
    ];
  },

  async fetchChallenges() {
    await this.delay(500);
    return {
      community: {
        title: "Desafio da Semana",
        desc: "Lermos juntos todo o livro de Salmos. Faltam 3 dias!",
        progress: 75,
        participants: 1240,
        reward: "Badge de Adorador"
      },
      personal: [
        { id: 1, title: "Ler 3 capítulos hoje", xp: 50, progress: 2, total: 3 },
        { id: 2, title: "Responder 1 quiz", xp: 20, progress: 0, total: 1 },
        { id: 3, title: "Orar por 1 pedido", xp: 30, progress: 1, total: 1, completed: true }
      ]
    };
  },

  async fetchGroups() {
    await this.delay(700);
    return {
      myGroups: [
        { id: 1, name: "Jovens Firmes", activity: "Última msg há 5 min", unread: 3, icon: "🔥", color: "#FF9500" },
        { id: 2, name: "Leitura Anual 2026", activity: "Última msg há 2h", unread: 0, icon: "📖", color: "#34C759" }
      ],
      discover: [
        { id: 3, name: "Mães que Oram", members: 120, icon: "❤️", color: "#AF52DE" },
        { id: 4, name: "Estudo de Apocalipse", members: 45, icon: "⚔️", color: "#4A6CF7" }
      ]
    };
  },

  async createPost(content, type) {
    await this.delay(400);
    return {
      id: Date.now(),
      author: "Você",
      type: type,
      time: "Agora",
      content: content,
      reactions: { amem: 0, orando: 0 },
      userReactions: {}
    };
  }
};
