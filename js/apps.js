(function () {
  const APP_NAMES = {
    about: 'About Me',
    sideprojects: 'Side Projects',
    tools: 'Tools & Automation',
    coursework: 'Coursework',
    certs: 'Certificates',
    experience: 'Experience',
    projects: 'Projects',
    resume: 'Resume',
    contact: 'Contact',
    claude: 'Claude Code',
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
  open &lt;app&gt;           open a window (about, projects, sideprojects,
                       tools, coursework, certs, experience, resume, contact, claude)
  clear                clear this terminal`);
      } else if (lower === 'clear') {
        output.innerHTML = '';
        return;
      } else if (lower.startsWith('open ')) {
        const target = lower.slice(5).trim();
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

  function initClaudeChat() {
    const form = document.getElementById('claude-chat-form');
    const input = document.getElementById('claude-chat-input');
    const send = document.getElementById('claude-chat-send');
    const messages = document.getElementById('claude-messages');
    if (!form || !input || !messages) return;

    function appendMessage(text, kind) {
      const div = document.createElement('div');
      div.className = `claude-msg claude-msg-${kind}`;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      appendMessage(text, 'user');
      input.value = '';
      input.disabled = true;
      send.disabled = true;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();
        if (data.error) {
          appendMessage(data.error, 'error');
        } else {
          appendMessage(data.reply, 'assistant');
        }
      } catch (err) {
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
