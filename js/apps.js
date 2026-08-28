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

  document.addEventListener('DOMContentLoaded', () => {
    initTerminal();
  });
})();
