// community.state.js
// Gerenciamento de estado simples em memória

class CommunityState {
  constructor() {
    this.activeTab = 'prayer-wall';
    this.posts = [];
    this.leaderboard = [];
    this.challenges = [];
    this.groups = [];
    this.userStats = {
      level: 5,
      xp: 4200,
      streak: 12
    };
    this.listeners = [];
  }

  // Permite que componentes escutem mudanças de estado
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(event, data) {
    this.listeners.forEach(l => l(event, data));
  }

  setActiveTab(tabId) {
    this.activeTab = tabId;
    this.notify('tabChanged', tabId);
  }

  setPosts(posts) {
    this.posts = posts;
    this.notify('postsUpdated', posts);
  }

  addPost(post) {
    this.posts.unshift(post);
    this.notify('postsUpdated', this.posts);
  }

  toggleReaction(postId, reactionType) {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      if (!post.userReactions) post.userReactions = {};
      post.userReactions[reactionType] = !post.userReactions[reactionType];
      
      if (!post.reactions) post.reactions = { amem: 0, orando: 0 };
      
      if (post.userReactions[reactionType]) {
        post.reactions[reactionType] = (post.reactions[reactionType] || 0) + 1;
      } else {
        post.reactions[reactionType] = Math.max(0, (post.reactions[reactionType] || 0) - 1);
      }
      
      this.notify('postUpdated', post);
    }
  }

  setLeaderboard(data) {
    this.leaderboard = data;
    this.notify('leaderboardUpdated', data);
  }

  setChallenges(data) {
    this.challenges = data;
    this.notify('challengesUpdated', data);
  }

  setGroups(data) {
    this.groups = data;
    this.notify('groupsUpdated', data);
  }
}

// Exportar uma única instância para ser compartilhada (Singleton pattern simple)
export const communityState = new CommunityState();
