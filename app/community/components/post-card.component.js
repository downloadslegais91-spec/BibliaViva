// post-card.component.js

export function createPostCard(post) {
  const amemActive = post.userReactions?.amem ? 'active' : '';
  const orandoActive = post.userReactions?.orando ? 'active' : '';
  
  const typeColor = post.type === 'Oração' ? 'var(--community-prayer)' : 
                    post.type === 'Testemunho' ? 'var(--community-victory)' : 'var(--community-green)';
                    
  const typeBg = post.type === 'Oração' ? 'var(--prayer-bg)' : 
                 post.type === 'Testemunho' ? 'var(--victory-bg)' : 'rgba(52, 199, 89, 0.1)';

  return `
    <div class="post-card" data-id="${post.id}">
      <div class="post-card-header">
        <div class="post-avatar" style="background: linear-gradient(135deg, ${typeColor}, #333)">
          ${post.author.charAt(0)}
        </div>
        <div>
          <span class="post-author">${post.author}</span>
          <div class="post-meta-row">
            <span class="post-type-badge" style="color:${typeColor}; background:${typeBg}">
              ${post.type}
            </span>
            <span class="post-time">• ${post.time}</span>
          </div>
        </div>
      </div>
      
      <div class="post-content">
        ${post.content}
      </div>
      
      <div class="post-reactions-bar">
        <button class="reaction-btn ${amemActive}" onclick="window.CommunityModule.toggleReaction(${post.id}, 'amem', this)">
          🙌 Amém <span class="reaction-count">${post.reactions.amem || 0}</span>
        </button>
        <button class="reaction-btn ${orandoActive}" onclick="window.CommunityModule.toggleReaction(${post.id}, 'orando', this)">
          🙏 Orando <span class="reaction-count">${post.reactions.orando || 0}</span>
        </button>
        
        <button class="post-comment-btn">
          💬 Comentar
        </button>
      </div>
    </div>
  `;
}

export function createSkeletonPost() {
  return `
    <div class="post-skeleton">
      <div class="post-card-header">
        <div class="post-avatar" style="background: #E5E5EA"></div>
        <div style="flex:1">
          <div class="skeleton-line" style="width: 40%"></div>
          <div class="skeleton-line" style="width: 25%; margin-top:6px;"></div>
        </div>
      </div>
      <div class="skeleton-line" style="width: 100%"></div>
      <div class="skeleton-line" style="width: 85%"></div>
      <div class="skeleton-line" style="width: 60%"></div>
    </div>
  `;
}
