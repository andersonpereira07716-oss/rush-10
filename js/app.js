document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('chat-form');
    const input = document.getElementById('user-input');
    const container = document.getElementById('chat-container');
    const clearBtn = document.getElementById('clear-chat');
    const exportBtn = document.getElementById('export-chat');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveKeyBtn = document.getElementById('save-key');
    const modelSelect = document.getElementById('model-select');
    const quickPrompts = document.querySelectorAll('.quick-prompt');

    // Abas
    const tabChat = document.getElementById('tab-chat');
    const tabCommand = document.getElementById('tab-command');
    const tabNotes = document.getElementById('tab-notes');
    const viewChat = document.getElementById('view-chat');
    const viewCommand = document.getElementById('view-command');
    const viewNotes = document.getElementById('view-notes');
    const chatFooter = document.getElementById('chat-footer');
    const quickPromptsBar = document.getElementById('quick-prompts-bar');

    // Ferramentas Command Center
    const generatePromptBtn = document.getElementById('generate-prompt-btn');
    const promptBuilderInput = document.getElementById('prompt-builder-input');
    const promptOutputContainer = document.getElementById('prompt-output-container');
    const promptOutput = document.getElementById('prompt-output');
    const copyPromptBtn = document.getElementById('copy-prompt-btn');
    const btnClearStorage = document.getElementById('btn-clear-storage');

    // Bloco de Notas
    const quickNotesTextarea = document.getElementById('quick-notes-textarea');
    const notesStatus = document.getElementById('notes-status');

    // Carregar dados salvos
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) apiKeyInput.value = savedKey;

    const savedModel = localStorage.getItem('gemini_model');
    if (savedModel) modelSelect.value = savedModel;

    const savedNotes = localStorage.getItem('nexa_quick_notes');
    if (savedNotes) quickNotesTextarea.value = savedNotes;

    loadChatHistory();

    // Gestão de Abas
    function switchTab(activeTab) {
        [tabChat, tabCommand, tabNotes].forEach(t => {
            t.classList.remove('bg-cyan-600', 'text-slate-950', 'font-bold');
            t.classList.add('bg-slate-900', 'text-slate-300');
        });
        [viewChat, viewCommand, viewNotes].forEach(v => v.classList.add('hidden'));

        if (activeTab === 'chat') {
            tabChat.classList.add('bg-cyan-600', 'text-slate-950', 'font-bold');
            tabChat.classList.remove('bg-slate-900', 'text-slate-300');
            viewChat.classList.remove('hidden');
            chatFooter.classList.remove('hidden');
            quickPromptsBar.classList.remove('hidden');
        } else if (activeTab === 'command') {
            tabCommand.classList.add('bg-cyan-600', 'text-slate-950', 'font-bold');
            tabCommand.classList.remove('bg-slate-900', 'text-slate-300');
            viewCommand.classList.remove('hidden');
            chatFooter.classList.add('hidden');
            quickPromptsBar.classList.add('hidden');
        } else if (activeTab === 'notes') {
            tabNotes.classList.add('bg-cyan-600', 'text-slate-950', 'font-bold');
            tabNotes.classList.remove('bg-slate-900', 'text-slate-300');
            viewNotes.classList.remove('hidden');
            chatFooter.classList.add('hidden');
            quickPromptsBar.classList.add('hidden');
        }
    }

    tabChat.addEventListener('click', () => switchTab('chat'));
    tabCommand.addEventListener('click', () => switchTab('command'));
    tabNotes.addEventListener('click', () => switchTab('notes'));

    // Auto-save Notas
    quickNotesTextarea.addEventListener('input', () => {
        localStorage.setItem('nexa_quick_notes', quickNotesTextarea.value);
        notesStatus.textContent = 'Salvo automaticamente.';
        setTimeout(() => notesStatus.textContent = 'Alterações salvas localmente.', 2000);
    });

    // Gerador de Prompts
    generatePromptBtn.addEventListener('click', () => {
        const val = promptBuilderInput.value.trim();
        if (!val) return;
        const structured = `Atue como Arquiteto de Software Sênior. Preciso implementar a seguinte demanda com foco em código limpo, modular e alta performance em React/Tailwind/Node: "${val}". Forneça o código direto, sem enrolação e com tratamento de erros.`;
        promptOutput.textContent = structured;
        promptOutputContainer.classList.remove('hidden');
    });

    copyPromptBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(promptOutput.textContent);
        copyPromptBtn.textContent = 'Copiado!';
        setTimeout(() => copyPromptBtn.textContent = 'Copiar Prompt', 2000);
    });

    btnClearStorage.addEventListener('click', () => {
        if(confirm('Tem certeza que deseja limpar o cache local?')) {
            localStorage.clear();
            location.reload();
        }
    });

    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        const model = modelSelect.value;
        if (key) {
            localStorage.setItem('gemini_api_key', key);
            localStorage.setItem('gemini_model', model);
            alert('Configurações salvas com sucesso!');
        } else {
            localStorage.removeItem('gemini_api_key');
            alert('API Key removida.');
        }
    });

    modelSelect.addEventListener('change', () => {
        localStorage.setItem('gemini_model', modelSelect.value);
    });

    quickPrompts.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab('chat');
            input.value = btn.getAttribute('data-text');
            input.focus();
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        const apiKey = localStorage.getItem('gemini_api_key') || apiKeyInput.value.trim();
        if (!apiKey) {
            alert('Por favor, insira e salve sua Gemini API Key no topo da página primeiro.');
            return;
        }

        appendMessage(text, 'user');
        saveMessageToHistory(text, 'user');
        input.value = '';

        const typingId = showTypingIndicator();

        try {
            const responseText = await callGeminiAPI(apiKey, text);
            removeTypingIndicator(typingId);
            const formatted = formatResponse(responseText);
            appendMessage(formatted, 'nexa', responseText);
            saveMessageToHistory(formatted, 'nexa');
        } catch (error) {
            removeTypingIndicator(typingId);
            const errorMsg = `⚡ <strong>Erro de Execução:</strong> ${error.message}`;
            appendMessage(errorMsg, 'nexa');
        }
    });

    clearBtn.addEventListener('click', () => {
        localStorage.removeItem('nexa_chat_history');
        container.innerHTML = `
            <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg self-start max-w-[85%]">
                <p class="text-sm text-slate-300">⚡ <strong>O Veredito Cru:</strong> Histórico limpo. Pronto para a próxima missão.</p>
            </div>
        `;
    });

    exportBtn.addEventListener('click', () => {
        const history = JSON.parse(localStorage.getItem('nexa_chat_history') || '[]');
        if (history.length === 0) {
            alert('Não há conversas no histórico para exportar.');
            return;
        }

        let content = "=== NEXA - RELATÓRIO OMNI ===\n\n";
        history.forEach(item => {
            const cleanText = item.htmlContent.replace(/<br>/g, '\n').replace(/<strong>/g, '').replace(/<\/strong>/g, '');
            content += `[${item.sender.toUpperCase()}]:\n${cleanText}\n\n-----------------------------------\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexa-omni-report-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    async function callGeminiAPI(apiKey, promptText) {
        const systemPersona = `Você é o "Nexus", um Agente de Engenharia de Inovação e Desconstrução de Gargalos. Sua missão não é apenas responder perguntas, mas hackear o pensamento convencional do usuário para encontrar soluções disruptivas, simples e altamente eficientes.
        Estilo: Provocativo, analítico, direto ao ponto, levemente irônico com burocracias, mas profundamente focado em resultados práticos. Evite bajulação excessiva.
        Sempre estruture suas respostas exatamente nestes três blocos visuais:
        ⚡ **O Veredito Cru:** (Análise rápida e sem filtros)
        🔄 **O Ângulo Cego:** (O que ninguém está vendo no problema)
        🛠️ **A Gambiarra de Elite:** (A solução funcional, criativa e imediata)`;

        const selectedModel = localStorage.getItem('gemini_model') || 'gemini-3.8-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: systemPersona + "\n\nMissão do usuário: " + promptText }] }
                ]
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || 'Falha ao comunicar com a API do Gemini.');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    function formatResponse(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }

    function appendMessage(text, sender, rawText = '') {
        const div = document.createElement('div');
        if (sender === 'user') {
            div.className = 'bg-cyan-950/40 border border-cyan-800/50 p-4 rounded-xl shadow-lg self-end max-w-[85%]';
            div.innerHTML = `<p class="text-sm text-cyan-200">${escapeHtml(text)}</p>`;
        } else {
            div.className = 'bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg self-start max-w-[85%] relative group';
            div.innerHTML = `
                <div class="text-sm text-slate-300 mb-2">${text}</div>
                <button class="copy-btn text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-400 px-2 py-1 rounded transition opacity-80" data-copy="${escapeHtml(rawText || text)}">
                    Copiar Resposta
                </button>
            `;
            setTimeout(() => {
                const btn = div.querySelector('.copy-btn');
                btn.addEventListener('click', () => {
                    navigator.clipboard.writeText(btn.getAttribute('data-copy').replace(/<br>/g, '\n').replace(/<strong>/g, '').replace(/<\/strong>/g, ''));
                    btn.textContent = 'Copiado!';
                    setTimeout(() => btn.textContent = 'Copiar Resposta', 2000);
                });
            }, 0);
        }
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function saveMessageToHistory(htmlContent, sender) {
        const history = JSON.parse(localStorage.getItem('nexa_chat_history') || '[]');
        history.push({ htmlContent, sender });
        localStorage.setItem('nexa_chat_history', JSON.stringify(history));
    }

    function loadChatHistory() {
        const history = JSON.parse(localStorage.getItem('nexa_chat_history') || '[]');
        history.forEach(item => {
            const div = document.createElement('div');
            if (item.sender === 'user') {
                div.className = 'bg-cyan-950/40 border border-cyan-800/50 p-4 rounded-xl shadow-lg self-end max-w-[85%]';
                div.innerHTML = `<p class="text-sm text-cyan-200">${escapeHtml(item.htmlContent)}</p>`;
            } else {
                div.className = 'bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg self-start max-w-[85%] relative';
                div.innerHTML = `
                    <div class="text-sm text-slate-300 mb-2">${item.htmlContent}</div>
                    <button class="copy-btn text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-400 px-2 py-1 rounded transition opacity-80" data-copy="${escapeHtml(item.htmlContent)}">
                        Copiar Resposta
                    </button>
                `;
                setTimeout(() => {
                    const btn = div.querySelector('.copy-btn');
                    if(btn) {
                        btn.addEventListener('click', () => {
                            navigator.clipboard.writeText(btn.getAttribute('data-copy').replace(/<br>/g, '\n').replace(/<strong>/g, '').replace(/<\/strong>/g, ''));
                            btn.textContent = 'Copiado!';
                            setTimeout(() => btn.textContent = 'Copiar Resposta', 2000);
                        });
                    }
                }, 0);
            }
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-lg self-start max-w-[85%] flex items-center gap-2';
        div.innerHTML = `
            <span class="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></span>
            <span class="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span class="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            <span class="text-xs text-slate-400 ml-1">NEXA está pensando...</span>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
});
