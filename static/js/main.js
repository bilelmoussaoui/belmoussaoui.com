(function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  function setHighlight(dark) {
    const hl = document.getElementById('hl');
    if (hl) hl.href = `/${dark ? 'hl-dark' : 'hl-light'}.css`;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    if (isDark === prefersDark.matches) {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
    setHighlight(isDark);
  });

  prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      document.documentElement.classList.toggle('dark', e.matches);
      setHighlight(e.matches);
    }
  });
})();

(function initTabs() {
  const tabs = document.querySelectorAll('[data-tab]');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => {
        const active = t.dataset.tab === target;
        t.classList.toggle('border-gray-900', active);
        t.classList.toggle('dark:border-gray-100', active);
        t.classList.toggle('text-gray-900', active);
        t.classList.toggle('dark:text-gray-100', active);
        t.classList.toggle('border-transparent', !active);
        t.classList.toggle('text-gray-400', !active);
        t.classList.toggle('dark:text-gray-500', !active);
      });
      document.querySelectorAll('[id^="panel-"]').forEach((panel) => {
        panel.classList.toggle('hidden', panel.id !== `panel-${target}`);
      });
    });
  });
})();

(function initOutdateAlert() {
  const el = document.getElementById('outdate-alert');
  if (!el) return;

  const publishDate = new Date(el.dataset.publishDate);
  const updatedDate = el.dataset.updatedDate ? new Date(el.dataset.updatedDate) : null;
  const refDate = (updatedDate && updatedDate > publishDate) ? updatedDate : publishDate;
  const daysSince = Math.floor((Date.now() - refDate.getTime()) / 86400000);
  const threshold = parseInt(el.dataset.days, 10);

  if (daysSince >= threshold) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const dateStr = `${months[refDate.getMonth()]} ${refDate.getDate()}, ${refDate.getFullYear()}`;
    const span = el.querySelector('span');
    if (span) span.textContent = `This article was last updated on ${dateStr} and may be out of date.`;
    el.classList.remove('hidden');
  }
})();

(function initCopyButtons() {
  const cfg = document.getElementById('copy-cfg');
  if (!cfg) return;

  const copySvg =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">'
    + '<path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" /></svg>';
  const checkSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">'
    + '<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>';

  document.querySelectorAll('pre').forEach((pre) => {
    const code = pre.querySelector('code');
    let lang = '';
    if (code) {
      const cls = code.className || '';
      const m = cls.match(/language-(\S+)/);
      if (m) lang = m[1];
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'relative group';

    const langLabel = document.createElement('span');
    langLabel.className = 'absolute top-2 left-2 px-1.5 py-0.5 text-xs font-mono text-gray-400 dark:text-gray-500';
    langLabel.textContent = lang;

    const toolbar = document.createElement('div');
    toolbar.className = 'absolute top-0 right-0 px-4 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity';

    const btn = document.createElement('button');
    btn.className = 'p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer';
    btn.setAttribute('aria-label', 'Copy code');
    btn.innerHTML = copySvg;

    btn.addEventListener('click', () => {
      const text = code ? code.textContent : pre.textContent;
      navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = checkSvg;
        btn.classList.add('text-green-500');
        setTimeout(() => {
          btn.innerHTML = copySvg;
          btn.classList.remove('text-green-500');
        }, 1500);
      });
    });

    toolbar.appendChild(btn);

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    if (lang) wrapper.appendChild(langLabel);
    wrapper.appendChild(toolbar);
  });
})();

(function initActiveToc() {
  const tocLinks = document.querySelectorAll('aside nav a[href^="#"]');
  if (!tocLinks.length) return;

  const headings = [];
  tocLinks.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) headings.push({ el, link });
  });

  let clickedIdx = -1;
  let clickedAt = 0;

  tocLinks.forEach((link, idx) => {
    link.addEventListener('click', () => {
      clickedIdx = idx;
      clickedAt = Date.now();
    });
  });

  function update() {
    const useClicked = Date.now() - clickedAt < 1000;

    tocLinks.forEach((link) => {
      link.classList.remove('toc-active');
    });

    if (useClicked) {
      tocLinks[clickedIdx].classList.add('toc-active');
      return;
    }

    let current = null;
    const atBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 50);
    if (atBottom) {
      current = headings.length - 1;
    } else {
      const offset = window.scrollY + 100;
      for (let i = 0; i < headings.length; i++) {
        if (headings[i].el.offsetTop <= offset) current = i;
      }
    }

    if (current !== null) {
      headings[current].link.classList.add('toc-active');
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();
