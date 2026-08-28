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

  function initClaudeDemo() {
    const input = document.getElementById('claude-input');
    const output = document.getElementById('claude-output');
    if (!input || !output) return;

    const STEPS = [
      { type: 'thinking', text: 'Scanning workspace for relevant files…' },
      { type: 'shell', text: 'git diff --stat' },
      { type: 'thinking', text: 'Planning the change…' },
      { type: 'success', text: 'Done — changes applied and verified.' },
    ];

    function runTask(task) {
      input.disabled = true;
      output.innerHTML += `<div style="margin-top: 12px; color: var(--accent-ink);">&gt; ${task}</div>`;

      let i = 0;
      function next() {
        if (i >= STEPS.length) {
          input.disabled = false;
          input.focus();
          return;
        }
        const step = STEPS[i];
        output.innerHTML += `<div class="claude-step"><span class="claude-badge claude-badge-${step.type}">${step.type}</span>${step.text}</div>`;
        output.parentElement.scrollTop = output.parentElement.scrollHeight;
        i += 1;
        setTimeout(next, 900);
      }
      next();
    }

    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const task = input.value.trim();
      input.value = '';
      if (task) runTask(task);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTerminal();
    initClaudeDemo();
  });
})();
