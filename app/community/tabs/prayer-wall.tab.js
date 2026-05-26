// prayer-wall.tab.js
import { CommunityAPI } from '../community.api.js';
import { communityState } from '../community.state.js';
import { createPostCard, createSkeletonPost } from '../components/post-card.component.js';

export const PrayerWallTab = {
  async render(container) {
    // Add FAB
    const fabContainer = document.getElementById('communityFabContainer');
    fabContainer.innerHTML = `
      <button class="community-fab" onclick="window.openComposeModal()">
        <span style="font-size: 20px;">✍️</span> Escrever
      </button>
    `;

    // Render Skeletons
    container.innerHTML = `
      <div class="groups-section-label" style="margin-bottom:16px;">Mural de Intercessão</div>
      <div id="postsContainer">
        ${createSkeletonPost()}
        ${createSkeletonPost()}
        ${createSkeletonPost()}
      </div>
    `;

    const postsContainer = document.getElementById('postsContainer');

    // Subscribe to state changes
    this.unsubscribe = communityState.subscribe((event, data) => {
      if (event === 'postsUpdated') {
        this.renderPosts(data, postsContainer);
      }
      if (event === 'postUpdated') {
        const postEl = document.querySelector(`.post-card[data-id="${data.id}"]`);
        if (postEl) {
          postEl.outerHTML = createPostCard(data);
        }
      }
    });

    // Fetch initial data if empty
    if (communityState.posts.length === 0) {
      const posts = await CommunityAPI.fetchPosts();
      communityState.setPosts(posts);
    } else {
      this.renderPosts(communityState.posts, postsContainer);
    }
  },

  renderPosts(posts, container) {
    if (!container) return;
    container.innerHTML = posts.map(createPostCard).join('');
  },

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
    document.getElementById('communityFabContainer').innerHTML = ''; // Hide FAB
  }
};
