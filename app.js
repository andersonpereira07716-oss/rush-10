function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar ul li').forEach(el => el.classList.remove('active'));
    
    document.getElementById('tab-' + tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

function sendChatMessage() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-messages');
    if(!input.value) return;

    chatBox.innerHTML += `<div class="message" style="margin-left:auto; background:#00ffcc; color:#030712;">${input.value}</div>`;
    const userText = input.value;
    input.value = '';

    setTimeout(() => {
        chatBox.innerHTML += `<div class="message ai">Processado via NEXA Core: Resposta simulada para "${userText}". Integração Gemini ativa.</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
}

function triggerWebhook() {
    document.getElementById('webhook-log').innerText = `[${new Date().toLocaleTimeString()}] Evento disparado com sucesso via Make.com webhook pipeline. Status: 200 OK`;
}

function runSystemCheck() {
    document.getElementById('util-output').innerText = "Verificando ambiente Termux...\n- Node.js: OK\n- Supabase RLS: Conectado\n- Memória de Processos: Estável\nDiagnóstico concluído com sucesso!";
}
