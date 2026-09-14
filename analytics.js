/* Consent Mode básico do NEXORA. Controle próprio de GA4, NÃO CMP certificada/TCF. */
(function () {
  'use strict';
  if (window.nexoraConsent) return;
  const ID = 'G-51GCTVDFP8', KEY = 'nexora-tools:consent:v1', VERSION = 1;
  const TTL = 180 * 24 * 60 * 60 * 1000;
  const denied = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  let choice = null, configured = false, panel, status, lastFocus, expiryTimer;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window['ga-disable-' + ID] = true;
  window.gtag('consent', 'default', denied);

  function readChoice() {
    try {
      const r = JSON.parse(localStorage.getItem(KEY));
      if (r && r.version === VERSION && typeof r.analytics === 'boolean' &&
          Number.isFinite(r.savedAt) && r.savedAt <= Date.now() && Date.now() - r.savedAt < TTL) return r;
    } catch (_) { /* Nunca presume autorização se o armazenamento falhar. */ }
    return null;
  }
  function clearCookies() {
    // Cookies desta configuração e identificadores legados do site.
    const names = document.cookie.split(';').map(c => c.trim().split('=')[0])
      .filter(n => /^(?:_ga|_ga_51GCTVDFP8|nexora_ga|nexora_ga_51GCTVDFP8)$/.test(n));
    for (const name of names) for (const path of ['/', '/nexora-tools', '/nexora-tools/']) {
      for (const domain of ['', '; Domain=' + location.hostname, '; Domain=.' + location.hostname]) {
        document.cookie = name + '=; Max-Age=0; Path=' + path + domain + '; SameSite=Lax; Secure';
      }
    }
  }
  function loadAnalytics() {
    if (configured) return;
    configured = true;
    window.gtag('js', new Date());
    let referrer = '';
    try { const ref = new URL(document.referrer); referrer = ref.origin + ref.pathname; } catch (_) {}
    window.gtag('config', ID, {
      page_location: location.origin + location.pathname,
      page_referrer: referrer,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_prefix: 'nexora',
      cookie_path: '/',
      cookie_domain: 'none',
      cookie_expires: TTL / 1000,
      cookie_update: false,
      cookie_flags: 'SameSite=Lax;Secure'
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    tag.dataset.nexoraGa4 = ID;
    tag.onerror = function () { if (status) status.textContent = 'Escolha salva. A medição está indisponível neste navegador; as ferramentas continuam funcionando.'; };
    document.head.appendChild(tag);
  }
  function apply(record) {
    choice = record;
    const allowed = record?.analytics === true;
    window['ga-disable-' + ID] = !allowed;
    window.gtag('consent', 'update', Object.assign({}, denied, { analytics_storage: allowed ? 'granted' : 'denied' }));
    if (allowed) loadAnalytics(); else clearCookies();
    clearTimeout(expiryTimer);
    // setTimeout tem limite de ~24 dias: reavaliar sem antecipar a expiração.
    if (record) expiryTimer = setTimeout(checkExpiry, Math.min(TTL - (Date.now() - record.savedAt), 2147483647));
    if (panel) panel.querySelector('[data-consent-current]').textContent = allowed ? 'Sua escolha atual: medição permitida.' : record ? 'Sua escolha atual: medição recusada.' : 'Medição desativada até você aceitar.';
    window.dispatchEvent(new CustomEvent('nexora:consentchange', { detail: { version: VERSION, analytics: allowed, advertising: window.nexoraAdvertising?.get().advertising === true } }));
  }
  function checkExpiry() {
    if (!choice) return;
    if (Date.now() - choice.savedAt >= TTL) { apply(null); if (panel) panel.hidden = false; }
    else apply(choice);
  }
  function hide() {
    panel.hidden = true;
    if (lastFocus?.isConnected) lastFocus.focus();
    else document.querySelector('.privacy-preferences')?.focus({ preventScroll: true });
  }
  function save(analytics) {
    const record = { version: VERSION, analytics: analytics === true, savedAt: Date.now() };
    let persistent = true;
    try { localStorage.setItem(KEY, JSON.stringify(record)); } catch (_) {
      persistent = false;
      // Não deixe uma autorização anterior sobreviver a uma recusa não gravada.
      try { localStorage.removeItem(KEY); } catch (_) {}
    }
    apply(record); hide();
    status.textContent = (analytics ? 'Medição permitida.' : 'Medição recusada. Você pode usar todas as ferramentas.') +
      (persistent ? ' Altere a escolha em Preferências de privacidade no rodapé.' : ' O navegador não permitiu salvar a escolha; ela vale somente nesta página.');
  }
  function open() {
    if (!panel) return;
    lastFocus = document.activeElement;
    panel.hidden = false;
    panel.querySelector('h2').focus();
  }
  function mount() {
    panel = document.createElement('section');
    panel.className = 'privacy-panel';
    panel.setAttribute('aria-labelledby', 'privacy-heading');
    panel.innerHTML = '<h2 id="privacy-heading" tabindex="-1">Sua privacidade, sua escolha</h2>' +
      '<p>Podemos usar o Google Analytics para entender visitas e melhorar o site? Se aceitar, o Google poderá receber identificadores por cookies, páginas visitadas, interações e dados técnicos do navegador/dispositivo.</p>' +
      '<p>Recusar medição não limita as ferramentas. Esta escolha vale apenas para o Analytics, não autoriza publicidade. Ela fica neste navegador por até 180 dias e pode ser retirada no rodapé.</p>' +
      '<p data-consent-current></p><a href="privacidade.html">Ler a Política de Privacidade</a>' +
      '<div class="privacy-actions"><button type="button" data-consent-reject>Recusar medição</button><button type="button" data-consent-accept>Aceitar medição</button><button type="button" data-consent-close>Fechar sem alterar</button></div>';
    panel.hidden = !!choice;
    document.body.appendChild(panel);
    status = document.createElement('p'); status.className = 'privacy-status'; status.setAttribute('role', 'status');
    const footer = document.querySelector('.site-footer') || document.body;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'privacy-preferences';
    button.textContent = 'Preferências de privacidade'; button.setAttribute('data-privacy-preferences', '');
    footer.append(button, status);
    panel.querySelector('[data-consent-reject]').addEventListener('click', () => save(false));
    panel.querySelector('[data-consent-accept]').addEventListener('click', () => save(true));
    panel.querySelector('[data-consent-close]').addEventListener('click', hide);
    panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); hide(); } });
    document.addEventListener('click', e => { if (e.target.closest('[data-privacy-preferences]')) open(); });
    panel.querySelector('[data-consent-current]').textContent = choice?.analytics ? 'Sua escolha atual: medição permitida.' : choice ? 'Sua escolha atual: medição recusada.' : 'Medição desativada até você aceitar.';
    // Controle publicitário local e independente; não altera os sinais de publicidade do Google.
    const advertisingControl = document.createElement('script');
    advertisingControl.src = 'advertising.js';
    advertisingControl.async = true;
    document.head.appendChild(advertisingControl);
  }
  // Ponto de integração próprio, sem __tcfapi ou consentimento publicitário fictício.
  window.nexoraConsent = Object.freeze({ open, get: () => ({ analytics: choice?.analytics === true, advertising: window.nexoraAdvertising?.get().advertising === true, version: VERSION }) });
  apply(readChoice());
  window.addEventListener('storage', e => { if (e.key === KEY || e.key === null) { apply(readChoice()); if (panel) panel.hidden = !!choice; } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkExpiry(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
}());
