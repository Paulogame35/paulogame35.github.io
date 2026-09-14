/* Native Banner: autorização independente do GA4; nenhum recurso externo antes do aceite. */
(function () {
  'use strict';
  if (window.nexoraAdvertising) return;
  const KEY = 'nexora-root:advertising:v1', TTL = 180 * 24 * 60 * 60 * 1000;
  const SRC = 'https://pl31346977.profitableratecpmnetwork.com/06a5ddab43b9b592be9fcb3802cbea67/invoke.js';
  const CONTAINER = 'container-06a5ddab43b9b592be9fcb3802cbea67';
  let choice = null, frame = null, timer, panel, current, feedback;
  const slot = document.getElementById('native-advertising');
  function read() {
    try {
      const r = JSON.parse(localStorage.getItem(KEY));
      if (r && r.version === 1 && typeof r.advertising === 'boolean' && Number.isFinite(r.savedAt) &&
          r.savedAt <= Date.now() && Date.now() - r.savedAt < TTL) return r;
    } catch (_) { /* Sem registro válido, publicidade permanece bloqueada. */ }
    return null;
  }
  function allowed() { return choice?.advertising === true && Date.now() - choice.savedAt < TTL; }
  function removeBanner() {
    // Destrói também timers, documentos e scripts do fornecedor, não apenas sua aparência.
    if (frame) { frame.remove(); frame = null; }
    if (slot) slot.hidden = true;
  }
  function loadBanner() {
    if (!slot || frame || !allowed()) return;
    frame = document.createElement('iframe');
    frame.title = 'Publicidade da Adsterra';
    // Sem same-origin e sem navegação da página principal. O fornecedor não acessa o DOM do NEXORA.
    frame.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
    frame.referrerPolicy = 'strict-origin';
    frame.style.cssText = 'display:block;width:100%;height:0;border:0;color-scheme:dark';
    frame.srcdoc = '<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin"><style>html,body{margin:0;padding:0;background:transparent;color:#edf2f8;font:14px Arial,sans-serif;overflow-wrap:anywhere}*{box-sizing:border-box}img,video{max-width:100%;height:auto}</style></head><body>' +
      '<script async="async" data-cfasync="false" src="' + SRC + '"></script>' +
      '<div id="' + CONTAINER + '"></div>' +
      '<script>(function(){const box=document.getElementById("' + CONTAINER + '");let last=-1,queued=false;function measure(){queued=false;const h=Math.ceil(box.getBoundingClientRect().height);if(h!==last){last=h;parent.postMessage({type:"nexora-native-size",height:h},"*");}}function schedule(){if(!queued){queued=true;requestAnimationFrame(measure)}}new MutationObserver(schedule).observe(box,{childList:true,subtree:true,attributes:true});if(window.ResizeObserver)new ResizeObserver(schedule).observe(box);addEventListener("resize",schedule);document.addEventListener("load",schedule,true);schedule();})();</script></body></html>';
    slot.hidden = false;
    slot.appendChild(frame);
  }
  function apply(record) {
    choice = record;
    if (allowed()) loadBanner(); else removeBanner();
    clearTimeout(timer);
    if (record) timer = setTimeout(checkExpiry, Math.min(TTL - (Date.now() - record.savedAt), 2147483647));
    if (current) current.textContent = allowed() ? 'Sua escolha atual: publicidade permitida.' : record ? 'Sua escolha atual: publicidade recusada.' : 'Publicidade bloqueada até você aceitar.';
    window.dispatchEvent(new CustomEvent('nexora:advertisingchange', { detail: { advertising: allowed() } }));
  }
  function checkExpiry() {
    if (!choice) return;
    if (Date.now() - choice.savedAt >= TTL) { apply(null); if (panel) panel.hidden = false; }
    else apply(choice);
  }
  function save(advertising) {
    const record = { version: 1, advertising, savedAt: Date.now() };
    let persistent = true;
    try { localStorage.setItem(KEY, JSON.stringify(record)); } catch (_) {
      persistent = false;
      try { localStorage.removeItem(KEY); } catch (_) {}
    }
    apply(record);
    feedback.textContent = (advertising ? 'Publicidade permitida.' : 'Publicidade recusada. O banner foi desativado.') +
      ' A escolha de medição não foi alterada.' + (persistent ? ' Você pode mudar as escolhas no rodapé.' : ' Não foi possível salvar: esta escolha vale somente nesta página.');
  }
  function mount() {
    panel = document.querySelector('.privacy-panel');
    if (!panel || panel.querySelector('[data-advertising-controls]')) return;
    const section = document.createElement('section');
    section.setAttribute('data-advertising-controls', '');
    section.setAttribute('aria-labelledby', 'advertising-heading');
    section.style.cssText = 'border-top:1px solid #515b65;margin-top:20px;padding-top:18px';
    section.innerHTML = '<h3 id="advertising-heading" style="font:600 18px/1.4 Arial,sans-serif;margin:0 0 12px">Publicidade — Adsterra</h3>' +
      '<p>Podemos carregar um Native Banner da Adsterra na página inicial? Após aceitar, a rede e seus parceiros poderão receber dados de conexão (como IP), navegador e interação com anúncios, e usar cookies ou tecnologias semelhantes para exibição, medição e personalização publicitária.</p>' +
      '<p>Esta escolha é separada do Analytics. Recusar não limita o acesso às ferramentas. Não carregamos Adsterra antes do aceite. A preferência vale por até 180 dias e pode ser retirada aqui.</p>' +
      '<p data-advertising-current></p><div class="privacy-actions"><button type="button" data-advertising-reject>Recusar publicidade</button><button type="button" data-advertising-accept>Aceitar publicidade</button></div>' +
      '<p data-advertising-feedback role="status" style="margin-top:12px"></p>';
    const close = panel.querySelector('[data-consent-close]');
    panel.appendChild(section);
    // Um único fechamento, depois das duas escolhas; fechar nunca aceita nenhuma delas.
    if (close) { const actions = document.createElement('div'); actions.className = 'privacy-actions'; actions.append(close); panel.append(actions); }
    current = section.querySelector('[data-advertising-current]');
    feedback = section.querySelector('[data-advertising-feedback]');
    section.querySelector('[data-advertising-accept]').addEventListener('click', () => save(true));
    section.querySelector('[data-advertising-reject]').addEventListener('click', () => save(false));
    apply(read());
    if (!choice) panel.hidden = false;
  }
  window.nexoraAdvertising = Object.freeze({ get: () => ({ advertising: allowed(), version: 1 }) });
  window.addEventListener('message', e => {
    if (!frame || e.source !== frame.contentWindow || e.data?.type !== 'nexora-native-size' || !allowed()) return;
    const height = e.data.height;
    if (Number.isFinite(height) && height >= 0) frame.style.height = Math.min(height, 4000) + 'px';
  });
  window.addEventListener('storage', e => { if (e.key === KEY || e.key === null) { apply(read()); if (!choice && panel) panel.hidden = false; } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkExpiry(); });
  // Revalidar também ao restaurar uma página pelo histórico/bfcache.
  window.addEventListener('pagehide', removeBanner);
  window.addEventListener('pageshow', () => { apply(read()); });
  mount();
}());
