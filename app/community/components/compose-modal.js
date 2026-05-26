// compose-modal.js
import { CommunityAPI } from '../community.api.js';
import { communityState } from '../community.state.js';

export function renderComposeModal() {
  const container = document.getElementById('communityModalContainer');
  
  // HTML do modal
  container.innerHTML = `
    <div id="composeModal" class="modal-overlay" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:100; align-items:flex-end;">
      <div class="modal-content" style="background:white; width:100%; border-radius: 20px 20px 0 0; padding:20px; padding-bottom:calc(env(safe-area-inset-bottom, 20px) + 20px); transform:translateY(100%); transition:transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3 style="margin:0; font-family:var(--serif); font-size:20px;">Nova Publicação</h3>
          <button id="closeComposeBtn" style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--label2);">&times;</button>
        </div>
        
        <div style="display:flex; gap:10px; margin-bottom:16px;">
          <button class="type-select-btn active" data-type="Oração" style="flex:1; padding:10px; border-radius:12px; border:2px solid var(--community-prayer); background:var(--prayer-bg); color:var(--community-prayer); font-weight:600;">🙏 Oração</button>
          <button class="type-select-btn" data-type="Testemunho" style="flex:1; padding:10px; border-radius:12px; border:2px solid transparent; background:var(--bg); color:var(--label2); font-weight:600;">✨ Testemunho</button>
        </div>
        
        <textarea id="composeTextarea" placeholder="Escreva seu pedido de oração ou testemunho..." style="width:100%; height:120px; border:1px solid var(--sep); border-radius:12px; padding:12px; font-family:var(--sans); font-size:15px; resize:none; margin-bottom:16px; outline:none;"></textarea>
        
        <button id="submitComposeBtn" style="width:100%; padding:14px; border-radius:24px; border:none; background:linear-gradient(135deg, var(--blue), var(--purple)); color:white; font-weight:600; font-size:16px; cursor:pointer;">
          Publicar
        </button>
      </div>
    </div>
  `;
  
  // Lógica do Modal
  const modal = document.getElementById('composeModal');
  const modalContent = modal.querySelector('.modal-content');
  const closeBtn = document.getElementById('closeComposeBtn');
  const submitBtn = document.getElementById('submitComposeBtn');
  const typeBtns = modal.querySelectorAll('.type-select-btn');
  const textarea = document.getElementById('composeTextarea');
  
  let selectedType = 'Oração';
  
  // Trocar tipo (Oração/Testemunho)
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => {
        b.classList.remove('active');
        b.style.borderColor = 'transparent';
        b.style.background = 'var(--bg)';
        b.style.color = 'var(--label2)';
      });
      btn.classList.add('active');
      selectedType = btn.dataset.type;
      
      if (selectedType === 'Oração') {
        btn.style.borderColor = 'var(--community-prayer)';
        btn.style.background = 'var(--prayer-bg)';
        btn.style.color = 'var(--community-prayer)';
        textarea.placeholder = "Escreva seu pedido de oração...";
      } else {
        btn.style.borderColor = 'var(--community-victory)';
        btn.style.background = 'var(--victory-bg)';
        btn.style.color = 'var(--community-victory)';
        textarea.placeholder = "Compartilhe seu testemunho...";
      }
    });
  });
  
  // Fechar
  const closeModal = () => {
    modalContent.style.transform = 'translateY(100%)';
    setTimeout(() => { modal.style.display = 'none'; }, 300);
  };
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });
  
  // Enviar
  submitBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) return;
    
    submitBtn.innerText = 'Enviando...';
    submitBtn.disabled = true;
    
    const newPost = await CommunityAPI.createPost(text, selectedType);
    communityState.addPost(newPost);
    
    textarea.value = '';
    submitBtn.innerText = 'Publicar';
    submitBtn.disabled = false;
    closeModal();
  });
  
  // Expor função de abrir modal globalmente
  window.openComposeModal = () => {
    modal.style.display = 'flex';
    // Pequeno delay para a transição funcionar
    setTimeout(() => {
      modalContent.style.transform = 'translateY(0)';
      textarea.focus();
    }, 10);
  };
}
