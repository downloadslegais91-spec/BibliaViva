// leaderboard-row.component.js

export function createLeaderboardRow(user) {
  const isMine = user.isMe ? 'lb-row-mine' : '';
  
  // Cores por posição (além do pódio, se necessário)
  let posColor = 'var(--label2)';
  if (user.position === 1) posColor = '#FFD60A';
  if (user.position === 2) posColor = '#C0C0C0';
  if (user.position === 3) posColor = '#CD7F32';
  
  return `
    <div class="lb-row ${isMine}">
      <div class="lb-position" style="color: ${posColor}">${user.position}</div>
      <div class="lb-avatar" style="background: linear-gradient(135deg, var(--blue), var(--purple))">
        ${user.name.charAt(0)}
      </div>
      <div class="lb-info">
        <span class="lb-name">${user.name}</span>
        <span class="lb-level">Nível ${user.level}</span>
      </div>
      <div class="lb-xp-col">
        <span class="lb-xp-num">${user.xp}</span>
        <span class="lb-xp-label">XP</span>
      </div>
    </div>
  `;
}

export function createPodium(top3) {
  if (!top3 || top3.length < 3) return '';
  
  const [first, second, third] = top3;
  
  return `
    <div class="podium-section">
      <div class="podium">
        <!-- 2º LUGAR -->
        <div class="podium-place">
          <div class="podium-avatar" style="background: #C0C0C0">${second.name.charAt(0)}</div>
          <span class="podium-name">${second.name}</span>
          <span class="podium-xp">${second.xp} XP</span>
          <div class="podium-block second-block">2</div>
        </div>
        
        <!-- 1º LUGAR -->
        <div class="podium-place">
          <div class="podium-crown">👑</div>
          <div class="podium-avatar large" style="background: #FFD60A; border-color: #FFD60A">${first.name.charAt(0)}</div>
          <span class="podium-name">${first.name}</span>
          <span class="podium-xp" style="font-size:12px">${first.xp} XP</span>
          <div class="podium-block first-block">1</div>
        </div>
        
        <!-- 3º LUGAR -->
        <div class="podium-place">
          <div class="podium-avatar" style="background: #CD7F32">${third.name.charAt(0)}</div>
          <span class="podium-name">${third.name}</span>
          <span class="podium-xp">${third.xp} XP</span>
          <div class="podium-block third-block">3</div>
        </div>
      </div>
    </div>
  `;
}
