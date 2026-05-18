// Exemplo de como você pode atualizar o bibliaviva.html para consumir o novo backend.
// Adicione estas funções no final do bloco <script> existente.

const API_BASE_URL = 'http://localhost:3000/api';

// 1. Carregar perfil do usuário ao iniciar
async function loadUserProfile() {
  try {
    const res = await fetch(`${API_BASE_URL}/users/me`);
    const { data } = await res.json();
    console.log('Usuário logado:', data);
    // Exemplo: atualizar o XP no UI
    // document.querySelector('.xp-level').textContent = `${data.xp}/1000 XP`;
  } catch (error) {
    console.error('Erro ao buscar perfil', error);
  }
}

// 2. Salvar progresso após leitura ou quiz
async function saveReadingProgress(book, chapter, verses, completed) {
  try {
    const res = await fetch(`${API_BASE_URL}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book, chapter, verses, completed })
    });
    const { data } = await res.json();
    console.log('Progresso salvo:', data);
  } catch (error) {
    console.error('Erro ao salvar progresso', error);
  }
}

// 3. Atualizar a função sendChat existente para integrar com o backend real
async function sendChatReal() {
  const input = document.getElementById('chatInput');
  const val = input.value.trim();
  if (!val) return;
  const area = document.getElementById('chatArea');

  // Adicionar mensagem do usuário no UI
  const userDiv = document.createElement('div');
  userDiv.style = 'display:flex; flex-direction:column; gap:4px; align-items:flex-end;';
  userDiv.innerHTML = `<div class="chat-bubble bubble-user">${val}</div>`;
  area.appendChild(userDiv);
  input.value = '';

  // Adicionar "Digitando..." no UI
  const typingDiv = document.createElement('div');
  typingDiv.style = 'display:flex; flex-direction:column; gap:4px;';
  typingDiv.innerHTML = `<div class="bubble-header"><div class="ai-avatar">✦</div> BíbliaViva IA</div><div class="chat-bubble bubble-ai" style="color:var(--label2)">Digitando...</div>`;
  area.appendChild(typingDiv);
  area.scrollTop = area.scrollHeight;

  try {
    // Salvar pergunta no backend
    await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'user', message: val })
    });

    // Simular resposta da IA (aqui você poderia chamar a API real de IA)
    const aiResponseText = 'Esta é uma resposta dinâmica vinda da integração.';
    
    await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'ai', message: aiResponseText })
    });

    typingDiv.querySelector('.chat-bubble').style.color = '';
    typingDiv.querySelector('.chat-bubble').innerHTML = aiResponseText;
  } catch (error) {
    typingDiv.querySelector('.chat-bubble').style.color = 'var(--red)';
    typingDiv.querySelector('.chat-bubble').innerHTML = 'Ocorreu um erro ao conectar ao servidor.';
  }
  area.scrollTop = area.scrollHeight;
}

// Chamar loadUserProfile() ao carregar a página
// document.addEventListener('DOMContentLoaded', loadUserProfile);
