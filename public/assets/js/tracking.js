/**
 * LOGAN TECHNOLOGY - TRACKING & ATTRIBUTION ENGINE
 * Captura UTMs, GCLID, gerencia persistência de sessão e dispara eventos de conversão.
 */

import { APP_CONFIG } from './config.js';

// Lista de parâmetros de campanha para persistir
const ATTRIBUTION_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'];
const STORAGE_KEY = 'logan_lp_attribution';

/**
 * Captura os parâmetros de URL na chegada do usuário e salva em sessionStorage
 */
export function initAttribution() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    let attributionData = {};

    // Recupera dados prévios se houver
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        attributionData = JSON.parse(stored);
      } catch (e) {
        attributionData = {};
      }
    }

    // Sobrescreve com novos parâmetros caso existam na URL atual
    let hasNewParam = false;
    ATTRIBUTION_PARAMS.forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        attributionData[param] = value;
        hasNewParam = true;
      }
    });

    if (hasNewParam) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attributionData));
    }
  } catch (err) {
    console.warn('[Logan Tracking] Não foi possível acessar o sessionStorage:', err);
  }
}

/**
 * Retorna todos os parâmetros de atribuição armazenados
 */
export function getAttributionData() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (err) {
    return {};
  }
}

/**
 * Disparador unificado de eventos de conversão e comportamento
 * Suporta Google Tag Manager (dataLayer) e Google Analytics 4 (gtag)
 */
export function trackEvent(eventName, eventParams = {}) {
  const attribution = getAttributionData();
  const payload = {
    event: eventName,
    page_title: document.title,
    page_location: window.location.href,
    timestamp: new Date().toISOString(),
    ...attribution,
    ...eventParams
  };

  // 1. Google Tag Manager (dataLayer)
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);

  // 2. Google Analytics 4 / Google Ads (gtag)
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, payload);
  }

  // Log informativo em ambiente de desenvolvimento / console
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log(`[Tracking Event] ${eventName}:`, payload);
  }
}

/**
 * Inicialização opcional de scripts de terceiros se os IDs estiverem preenchidos
 */
export function initTrackingTags() {
  const { gtmId, ga4Id } = APP_CONFIG.tracking;

  if (gtmId && !document.getElementById('gtm-script')) {
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',gtmId);
  }

  if (ga4Id && !document.getElementById('ga4-script')) {
    const script = document.createElement('script');
    script.id = 'ga4-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', ga4Id);
  }
}
