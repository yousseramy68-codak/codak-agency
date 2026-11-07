(() => {
  const langCodes = ['en','ar','fr','es','de'];
  const langNames = {en:'English',ar:'العربية',fr:'Français',es:'Español',de:'Deutsch'};
  const messages = {
    en: {sending:'Sending…',success:'Thanks! Your request has been received. We’ll be in touch soon.',fail:'Unable to send your request. Please try again.',invalid:'Please check your name and phone number.',contactSuccess:'Thanks! Your message has been received. We’ll be in touch soon.',contactFail:'Unable to send your message. Please try again.'},
    ar: {sending:'جارٍ الإرسال…',success:'شكراً! وصلنا طلبك وسنتواصل معك قريباً.',fail:'تعذر إرسال الطلب. حاول مرة أخرى.',invalid:'تحقق من الاسم ورقم الهاتف.',contactSuccess:'شكراً! وصلتنا رسالتك وسنتواصل معك قريباً.',contactFail:'تعذر إرسال الرسالة. حاول مرة أخرى.'},
    fr: {sending:'Envoi…',success:'Merci ! Votre demande a bien été reçue.',fail:'Impossible d’envoyer la demande. Veuillez réessayer.',invalid:'Vérifiez votre nom et votre numéro de téléphone.',contactSuccess:'Merci ! Votre message a bien été reçu.',contactFail:'Impossible d’envoyer votre message. Veuillez réessayer.'},
    es: {sending:'Enviando…',success:'¡Gracias! Hemos recibido tu solicitud.',fail:'No se pudo enviar la solicitud. Inténtalo de nuevo.',invalid:'Comprueba tu nombre y teléfono.',contactSuccess:'¡Gracias! Hemos recibido tu mensaje.',contactFail:'No se pudo enviar el mensaje. Inténtalo de nuevo.'},
    de: {sending:'Wird gesendet…',success:'Vielen Dank! Ihre Anfrage ist eingegangen.',fail:'Anfrage konnte nicht gesendet werden. Bitte erneut versuchen.',invalid:'Bitte prüfen Sie Ihren Namen und Ihre Telefonnummer.',contactSuccess:'Vielen Dank! Ihre Nachricht ist eingegangen.',contactFail:'Nachricht konnte nicht gesendet werden. Bitte erneut versuchen.'}
  };
  const lang = document.documentElement.lang || 'en';
  const t = messages[lang] || messages.en;
  const quoteForm = form => Boolean(form.querySelector('[name="project_type"]'));

  // Contact messages go to Formspree; project quotes stay on the order API.
  document.querySelectorAll('form.contact-form').forEach(form => form.addEventListener('submit', async event => {
    event.preventDefault();
    if (form.dataset.submitting === 'true') return;
    const data = new FormData(form);
    const value = key => String(data.get(key) || '').trim();
    const isQuote = quoteForm(form);
    const name = value('name');
    const phone = value('phone');
    const button = form.querySelector('button[type="submit"],button:not([type])');
    let status = form.querySelector('.form-status');
    if (!status) { status = document.createElement('p'); status.className = 'form-status'; button.before(status); }
    const validPhone = !isQuote && !phone ? true : /^\+?[\d\s()().-]{8,24}$/.test(phone);
    if (!form.checkValidity() || name.length < 2 || !validPhone || (isQuote && (!value('project_type') || !value('budget')))) {
      status.className = 'form-status error';
      status.setAttribute('role', 'alert');
      status.textContent = t.invalid;
      (form.querySelector(':invalid') || form.querySelector('[name="name"]'))?.focus();
      return;
    }
    form.dataset.submitting = 'true';
    form.setAttribute('aria-busy', 'true');
    button.disabled = true;
    button.dataset.label = button.textContent;
    button.textContent = t.sending;
    try {
      const payload = {
        name,
        phone: phone || 'Not provided',
        service: isQuote ? value('project_type') : 'General inquiry',
        budget: isQuote ? value('budget') : 'Not specified',
        email: value('email'),
        message: value('message'),
        website: value('website')
      };
      const response = isQuote
        ? await fetch('/api/order', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        : await fetch(form.action || 'https://formspree.io/f/xyewobvb', {method:'POST',body:data,headers:{Accept:'application/json'}});
      const result = await response.json().catch(() => null);
      if (!response.ok || (isQuote && result?.success !== true)) throw new Error('request failed');
      status.className = 'form-status success';
      status.setAttribute('role', 'status');
      status.textContent = isQuote ? t.success : t.contactSuccess;
      form.reset();
    } catch {
      status.className = 'form-status error';
      status.setAttribute('role', 'alert');
      status.textContent = isQuote ? t.fail : t.contactFail;
    } finally {
      form.dataset.submitting = 'false';
      form.setAttribute('aria-busy', 'false');
      button.disabled = false;
      button.textContent = button.dataset.label || button.textContent;
    }
  }));

  // Language menu mirrors the original URL-based language switch.
  const langButton = document.querySelector('.lang-button');
  const langSelect = document.querySelector('.lang-select');
  const closeLanguageMenu = () => {
    const menu = langSelect?.querySelector('.lang-menu');
    menu?.remove();
    langButton?.setAttribute('aria-expanded','false');
  };
  langButton?.addEventListener('click', () => {
    if (langSelect?.querySelector('.lang-menu')) return closeLanguageMenu();
    const menu = document.createElement('ul');
    menu.className = 'lang-menu';
    menu.setAttribute('aria-label', langButton.title || 'Language');
    for (const code of langCodes) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `/${code}/${location.pathname.split('/').filter(Boolean).includes('contact') ? 'contact/' : location.pathname.split('/').filter(Boolean).includes('quote') ? 'quote/' : ''}`;
      link.textContent = langNames[code];
      if (code === lang) link.setAttribute('aria-current','true');
      link.addEventListener('click', () => { try { localStorage.setItem('codak-language',code); } catch {} });
      item.append(link); menu.append(item);
    }
    langSelect?.append(menu);
    langButton.setAttribute('aria-expanded','true');
  });
  document.addEventListener('pointerdown', event => { if (langSelect && !langSelect.contains(event.target)) closeLanguageMenu(); });

  // Accessible drawer behavior for mobile navigation.
  const menuButton = document.querySelector('.mobile-menu');
  const panel = document.querySelector('.mobile-panel');
  const scrim = document.querySelector('.mobile-scrim');
  const closeButton = document.querySelector('.mobile-close');
  let previousFocus = null;
  const closeDrawer = (restore = true) => {
    if (!panel?.classList.contains('open')) return;
    panel.classList.remove('open'); scrim?.classList.remove('open'); document.body.classList.remove('menu-open');
    panel.setAttribute('aria-hidden','true'); panel.setAttribute('inert','');
    menuButton?.setAttribute('aria-expanded','false'); document.body.style.overflow='';
    if (restore) menuButton?.focus(); else previousFocus?.focus?.();
  };
  menuButton?.addEventListener('click', () => {
    closeLanguageMenu();
    if (!panel) return;
    if (panel.classList.contains('open')) return closeDrawer();
    previousFocus = document.activeElement;
    panel.classList.add('open'); scrim?.classList.add('open'); document.body.classList.add('menu-open');
    panel.removeAttribute('inert'); panel.setAttribute('aria-hidden','false');
    menuButton.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden';
    panel.querySelector('a,button')?.focus();
  });
  closeButton?.addEventListener('click', () => closeDrawer());
  scrim?.addEventListener('click', () => closeDrawer());
  panel?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeDrawer(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeDrawer(); closeLanguageMenu(); }
    if (event.key !== 'Tab' || !panel?.classList.contains('open')) return;
    const focusable = [...panel.querySelectorAll('a[href],button:not([disabled])')];
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });

  // Keep the selected light/dark theme across visits.
  const themeButton = document.querySelector('.theme-switch-pill');
  try {
    const dark = localStorage.getItem('codak-theme') === 'dark';
    document.documentElement.classList.toggle('dark',dark);
    if (themeButton) { themeButton.classList.toggle('is-dark',dark); themeButton.setAttribute('aria-checked',String(dark)); }
    themeButton?.addEventListener('click', () => {
      const next = !document.documentElement.classList.contains('dark');
      document.documentElement.classList.toggle('dark',next);
      localStorage.setItem('codak-theme',next?'dark':'light');
      themeButton.classList.toggle('is-dark',next); themeButton.setAttribute('aria-checked',String(next));
      themeButton.setAttribute('aria-label',next?'Switch to light mode':'Switch to dark mode');
    });
  } catch {}

  // Header state, reveal animations, and delayed hero video match the React behavior.
  const header = document.querySelector('.site-header');
  const onScroll = () => header?.classList.toggle('scrolled',window.scrollY > 10);
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
  const revealNodes = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); observer.unobserve(entry.target); }
    }),{threshold:.1});
    revealNodes.forEach(node => observer.observe(node));
  } else revealNodes.forEach(node => node.classList.add('in'));

  const bar = document.querySelector('.mobile-cta-bar');
  const barTarget = document.querySelector('.closing-cta, #request-form');
  if (bar && barTarget && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      const visible = !entry.isIntersecting;
      bar.classList.toggle('is-hidden',!visible);
      bar.setAttribute('aria-hidden',String(!visible));
      document.documentElement.dataset.ctaBar = visible?'visible':'hidden';
      bar.querySelectorAll('a').forEach(link => link.tabIndex = visible ? 0 : -1);
    }),{threshold:.3});
    observer.observe(barTarget);
  }
  if (sessionStorage.getItem('codak-focus-form') === '1') {
    sessionStorage.removeItem('codak-focus-form');
    requestAnimationFrame(() => document.querySelector('#request-form .field input, #request-form .field select')?.focus());
  }
  document.querySelectorAll('a[href*="/quote/"]').forEach(link => link.addEventListener('click',() => sessionStorage.setItem('codak-focus-form','1')));

  const backdrop = document.querySelector('.hero-backdrop');
  const viewport = matchMedia('(max-width: 899px)');
  if (backdrop) {
    const connection = navigator.connection;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const constrained = connection?.saveData || /2g|3g/.test(connection?.effectiveType || '');
    if (!reduced && !constrained) {
      const startVideo = () => {
        if (backdrop.querySelector('video')) return;
        const video = document.createElement('video');
        video.className = 'hero-video'; video.autoplay = true; video.loop = true; video.muted = true;
        video.playsInline = true; video.preload = 'none'; video.setAttribute('aria-hidden', 'true');
        const syncSource = () => { video.src = viewport.matches ? '/videos/hero-bg-mobile.mp4' : '/videos/hero-bg.mp4'; };
        syncSource(); viewport.addEventListener('change', syncSource); backdrop.prepend(video); video.play().catch(() => {});
      };
      if ('requestIdleCallback' in window) window.requestIdleCallback(startVideo, { timeout: 1500 }); else window.setTimeout(startVideo, 800);
    }
  }})();
