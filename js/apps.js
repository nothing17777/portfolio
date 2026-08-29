(function () {
  const APP_NAMES = {
    about: 'About Me',
    sideprojects: 'Projects',
    tools: 'Tools and Framework',
    academics: 'Academics',
    certs: 'Certificates',
    experience: 'Experience',
    resume: 'Resume',
    contact: 'Contact',
    claude: 'AI Assistant',
  };

  const APP_ALIASES = {
    projects: 'sideprojects',
    assistant: 'claude',
  };

  function initTerminal() {
    const input = document.getElementById('term-input');
    const output = document.getElementById('term-output');
    if (!input || !output) return;

    function print(html) {
      output.innerHTML += `\n${html}`;
      output.parentElement.scrollTop = output.parentElement.scrollHeight;
    }

    function run(cmd) {
      const lower = cmd.toLowerCase().trim();
      print(`<span class="terminal-prompt">tim@portfolio ~ %</span> ${cmd}`);

      if (lower === 'help') {
        print(`Available commands:
  help                 show this list
  open &lt;app&gt;           open a window (about, academics, projects,
                       tools, certs, experience, resume, contact, assistant)
  clear                clear this terminal`);
      } else if (lower === 'clear') {
        output.innerHTML = '';
        return;
      } else if (lower.startsWith('open ')) {
        const target = APP_ALIASES[lower.slice(5).trim()] || lower.slice(5).trim();
        if (APP_NAMES[target]) {
          window.WM.open(target);
          print(`Opening ${APP_NAMES[target]}…`);
        } else {
          print(`open: unknown app "${target}"`);
        }
      } else {
        print(`command not found: ${cmd}`);
      }
    }

    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const cmd = input.value.trim();
      input.value = '';
      if (cmd) run(cmd);
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function inlineMarkdown(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  function renderMarkdown(raw) {
    const lines = escapeHtml(raw).split('\n');
    let html = '';
    let inList = false;
    lines.forEach((line) => {
      const trimmed = line.trim();
      const bullet = trimmed.match(/^[-*]\s+(.*)/);
      if (bullet) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += `<li>${inlineMarkdown(bullet[1])}</li>`;
        return;
      }
      if (inList) { html += '</ul>'; inList = false; }

      const heading = trimmed.match(/^#{1,4}\s+(.*)/);
      if (heading) {
        html += `<p class="claude-md-heading">${inlineMarkdown(heading[1])}</p>`;
        return;
      }
      if (trimmed === '') return;
      html += `<p>${inlineMarkdown(trimmed)}</p>`;
    });
    if (inList) html += '</ul>';
    return html;
  }

  function initClaudeChat() {
    const form = document.getElementById('claude-chat-form');
    const input = document.getElementById('claude-chat-input');
    const send = document.getElementById('claude-chat-send');
    const messages = document.getElementById('claude-messages');
    if (!form || !input || !messages) return;

    function appendMessage(text, kind) {
      const div = document.createElement('div');
      div.className = `claude-msg claude-msg-${kind}`;
      if (kind === 'assistant') {
        div.innerHTML = renderMarkdown(text);
      } else {
        div.textContent = text;
      }
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      return div;
    }

    function appendThinking() {
      const div = document.createElement('div');
      div.className = 'claude-msg claude-msg-assistant claude-msg-thinking';
      div.innerHTML = '<span class="claude-spinner"></span>';
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      return div;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      appendMessage(text, 'user');
      input.value = '';
      input.disabled = true;
      send.disabled = true;
      const thinkingEl = appendThinking();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();
        thinkingEl.remove();
        if (data.error) {
          appendMessage(data.error, 'error');
        } else {
          appendMessage(data.reply, 'assistant');
        }
      } catch (err) {
        thinkingEl.remove();
        appendMessage('Could not reach the assistant. Please try again.', 'error');
      } finally {
        input.disabled = false;
        send.disabled = false;
        input.focus();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTerminal();
    initClaudeChat();
  });
})();
