/* NEXORA companion: local interface only; no telemetry, requests or user input. */
(() => {
  'use strict';
  if (document.querySelector('.nx-mascot')) return;
  const KEY = 'nexora:mascot:hidden', SEEN = 'nexora:mascot:greeted';
  const root = document.createElement('aside');
  root.className = 'nx-mascot';
  root.setAttribute('aria-label', 'Mascote NEXORA');
  root.innerHTML = `<p class="nx-mascot-bubble" hidden>Olá! Sou o mascote NEXORA. Toque em mim para encontrar ferramentas.</p>
    <section class="nx-mascot-panel" id="nx-mascot-panel" aria-labelledby="nx-mascot-title" hidden>
      <h2 id="nx-mascot-title">Um atalho para ajudar</h2><p>Escolha uma ferramenta. Este painel não é um chat.</p>
      <a href="index.html#ferramentas">Ver ferramentas</a><a href="gerador-de-nick.html">Gerador de Nick</a>
      <a href="gerador-qr-code.html">Gerador de QR Code</a><a href="gerador-link-whatsapp.html">Link do WhatsApp</a><a href="ajuda.html">Ajuda</a>
      <button type="button" data-panel-close>Fechar painel</button><button type="button" data-hide>Ocultar mascote</button>
      <p>A preferência de ocultar fica salva apenas neste navegador. Reative pelo rodapé.</p>
    </section>
    <button class="nx-mascot-toggle" type="button" aria-label="Abrir atalhos do mascote NEXORA" aria-expanded="false" aria-controls="nx-mascot-panel">
      <svg viewBox="0 0 96 96" aria-hidden="true" focusable="false"><path d="M25 74Q48 57 71 74L68 87H28Z" fill="#233542" stroke="#567183"/>
        <g class="nx-mascot-head"><path d="M20 34L17 12 36 25M60 25L79 12 76 34" fill="#192a37" stroke="#7296ab" stroke-width="2" stroke-linejoin="round"/>
        <rect x="16" y="26" width="64" height="47" rx="19" fill="#18252f" stroke="#7593a5" stroke-width="2"/><rect x="24" y="35" width="48" height="27" rx="12" fill="#090f15"/>
        <rect class="nx-mascot-eye" x="32" y="43" width="7" height="10" rx="3.5" fill="#80c8ec"/><rect class="nx-mascot-eye" x="57" y="43" width="7" height="10" rx="3.5" fill="#80c8ec"/>
        <path d="M43 57Q48 61 53 57" fill="none" stroke="#80c8ec" stroke-width="2" stroke-linecap="round"/><path d="M44 29L48 25 52 29 48 33Z" fill="#80c8ec"/></g></svg>
    </button><button class="nx-mascot-dismiss" type="button" aria-label="Ocultar mascote NEXORA">×</button>`;
  const toggle = root.querySelector('.nx-mascot-toggle'), panel = root.querySelector('.nx-mascot-panel'), bubble = root.querySelector('.nx-mascot-bubble');
  const restore = document.createElement('button');
  restore.type = 'button'; restore.className = 'nx-mascot-restore'; restore.textContent = 'Mostrar mascote';
  try { root.hidden = localStorage.getItem(KEY) === '1'; } catch (_) {}
  document.body.append(root);
  (document.querySelector('.site-footer') || document.body).append(restore);
  restore.hidden = !root.hidden;
  function close(focus = false) {
    if (!panel.hidden) panel.hidden = true;
    if (toggle.getAttribute('aria-expanded') !== 'false') toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir atalhos do mascote NEXORA');
    if (focus) toggle.focus();
  }
  function hide() {
    close(); bubble.hidden = true; root.hidden = true; restore.hidden = false;
    try { localStorage.setItem(KEY, '1'); } catch (_) {}
    restore.focus({ preventScroll: true });
  }
  restore.addEventListener('click', () => {
    try { localStorage.removeItem(KEY); } catch (_) {}
    root.hidden = false; restore.hidden = true; update();
    if (root.dataset.paused !== 'true') toggle.focus({ preventScroll: true });
  });
  root.querySelector('.nx-mascot-dismiss').addEventListener('click', hide);
  root.querySelector('[data-hide]').addEventListener('click', hide);
  root.querySelector('[data-panel-close]').addEventListener('click', () => close(true));
  toggle.addEventListener('click', () => {
    bubble.hidden = true;
    if (!panel.hidden) return close();
    panel.hidden = false; toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fechar atalhos do mascote NEXORA'); panel.querySelector('a').focus();
  });
  root.addEventListener('keydown', e => { if (e.key === 'Escape') { close(true); bubble.hidden = true; } });
  document.addEventListener('pointerdown', e => { if (!root.contains(e.target)) { close(); bubble.hidden = true; } });
  root.addEventListener('focusout', () => { queueMicrotask(() => { if (!root.contains(document.activeElement)) close(); }); });
  const visible = el => !el.hidden && el.getAttribute('aria-hidden') !== 'true' && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none';
  let frame = 0;
  function schedule() { if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); }); }
  function update() {
    if (root.hidden) return;
    // Yield to dialogs, consent (including future Google frames), menus and focused form fields.
    let blocked = document.hidden || [...document.querySelectorAll('.privacy-panel, .modal, [role="dialog"], #mainNav.open, iframe')].some(visible) ||
      !!document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
    let r = root.getBoundingClientRect();
    if (!bubble.hidden) { const b = bubble.getBoundingClientRect(); r = { top: b.top, bottom: r.bottom, left: Math.min(b.left, r.left), right: r.right }; }
    const overlaps = el => { const b = el.getBoundingClientRect(); return b.bottom > r.top - 24 && b.top < r.bottom + 12 && b.right > r.left - 12 && b.left < r.right + 12; };
    if (!blocked) blocked = [...document.querySelectorAll('a,button,input,textarea,select,[role="button"],.adsbygoogle,[data-ad-slot]')]
      .some(el => !root.contains(el) && visible(el) && overlaps(el));
    const value = String(blocked);
    if (root.dataset.paused !== value) root.dataset.paused = value;
    if (blocked) { close(); if (!bubble.hidden) bubble.hidden = true; }
  }
  new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden', 'aria-hidden', 'aria-expanded'] });
  window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('focusin', schedule); document.addEventListener('focusout', schedule); document.addEventListener('visibilitychange', schedule);
  window.addEventListener('storage', e => { if (e.key === KEY) { root.hidden = e.newValue === '1'; restore.hidden = !root.hidden; close(); schedule(); } });
  update();
  // One short greeting per tab session, desktop only, never interrupting another panel.
  setTimeout(() => {
    let seen = true; try { seen = sessionStorage.getItem(SEEN) === '1'; } catch (_) {}
    if (seen || root.hidden || root.dataset.paused === 'true' || !panel.hidden || matchMedia('(max-width:600px), (prefers-reduced-motion:reduce)').matches) return;
    try { sessionStorage.setItem(SEEN, '1'); } catch (_) {}
    bubble.hidden = false; setTimeout(() => { bubble.hidden = true; }, 6500);
  }, 12000);
})();
