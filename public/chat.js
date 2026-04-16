// ============================================================
// MediEat — AI Nutrition Chat
// ============================================================

let chatHistory = [];
let chatOpen = false;
let chatStreaming = false;

function toggleChatPanel() {
    chatOpen = !chatOpen;
    document.getElementById('chatPanel').classList.toggle('open', chatOpen);
    document.getElementById('chatFab').classList.toggle('active', chatOpen);
    if (chatOpen) {
        document.getElementById('chatInput').focus();
    }
}

function appendChatMessage(role, content) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `chat-message ${role}`;
    div.innerHTML = `<div class="chat-bubble">${escapeHtmlChat(content)}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

function createStreamingBubble() {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-message assistant';
    div.innerHTML = '<div class="chat-bubble streaming-bubble"></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.querySelector('.streaming-bubble');
}

function escapeHtmlChat(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatMarkdown(text) {
    // Basic markdown: bold, italic, line breaks
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

async function sendChatMessage() {
    if (chatStreaming) return;

    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';

    // Add user message to UI and history
    appendChatMessage('user', text);
    chatHistory.push({ role: 'user', content: text });

    // Build health profile from current state
    const healthProfile = {
        conditions: selectedConditions,
        allergies: selectedAllergies,
        customAllergies: customAllergies,
        favoriteFoods: favoriteFoods,
        dietPreference: dietPreference,
        calorieTarget: calorieTarget,
        macroGoals: macroGoals
    };

    // Create streaming bubble
    const bubble = createStreamingBubble();
    chatStreaming = true;
    let fullResponse = '';

    try {
        const token = (await supabase.auth.getSession())?.data?.session?.access_token;

        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                messages: chatHistory,
                healthProfile: healthProfile
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Chat request failed');
        }

        // Read SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // keep incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.error) throw new Error(parsed.error);
                        if (parsed.text) {
                            fullResponse += parsed.text;
                            bubble.innerHTML = formatMarkdown(fullResponse);
                            document.getElementById('chatMessages').scrollTop =
                                document.getElementById('chatMessages').scrollHeight;
                        }
                    } catch (e) {
                        // skip unparseable chunks
                    }
                }
            }
        }

        // Add assistant response to history
        chatHistory.push({ role: 'assistant', content: fullResponse });
        bubble.classList.remove('streaming-bubble');

    } catch (err) {
        console.error('Chat error:', err);
        const isNotConfigured = err.message && (err.message.includes('not configured') || err.message.includes('API key'));
        if (isNotConfigured) {
            bubble.innerHTML = `<strong>AI not available yet</strong><br><br>The AI nutrition advisor needs a Claude API key to work. Once configured, you can ask me anything about nutrition tailored to your health profile.<br><br><em style="color:var(--outline)">The rest of MediEat works perfectly without it!</em>`;
        } else {
            bubble.innerHTML = `<em style="color:var(--error)">Error: ${escapeHtmlChat(err.message)}</em>`;
        }
        bubble.classList.remove('streaming-bubble');
        // Remove the failed exchange from history
        if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
            chatHistory.pop();
        }
    } finally {
        chatStreaming = false;
    }
}
