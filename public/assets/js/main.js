/**
 * LOGAN TECHNOLOGY - MAIN JAVASCRIPT ENTRYPOINT
 * Orquestração de inicialização, modais, menu mobile e sincronização de eventos.
 */

import { APP_CONFIG } from './config.js';
import { initAttribution, initTrackingTags, trackEvent } from './tracking.js';
import { initLeadForm } from './form.js';
import { initAccordion } from './accordion.js';
import { initMobileConversionBar } from './mobile-bar.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializa Atribuição e Tracking
  initAttribution();
  initTrackingTags();

  // 2. Componentes Interativos
  initLeadForm();
  initAccordion();
  initMobileConversionBar();

  // 3. Atualiza ano dinâmico no rodapé
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 4. Configura URLs de WhatsApp em todos os botões correspondentes
  setupWhatsAppLinks();

  // 5. Menu Mobile Drawer
  setupMobileMenu();

  // 6. Monitoramento de Cliques em CTAs e Links Estratégicos
  setupCtaTracking();

  // 7. Modal de Política de Privacidade
  setupPrivacyModal();
});

function setupWhatsAppLinks() {
  const wppElements = document.querySelectorAll('.js-wpp-link');
  const encodedMsg = encodeURIComponent(APP_CONFIG.whatsappMessage);
  const wppUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodedMsg}`;

  wppElements.forEach(el => {
    el.setAttribute('href', wppUrl);
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');

    el.addEventListener('click', () => {
      trackEvent('whatsapp_click', {
        placement: el.getAttribute('data-placement') || 'floating'
      });
    });
  });
}

function setupMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const drawer = document.getElementById('nav-mobile-drawer');
  if (!toggleBtn || !drawer) return;

  function toggleMenu() {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', !isExpanded);
    drawer.classList.toggle('open', !isExpanded);
    document.body.style.overflow = !isExpanded ? 'hidden' : '';
  }

  toggleBtn.addEventListener('click', toggleMenu);

  // Fecha menu ao clicar em qualquer link
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggleBtn.setAttribute('aria-expanded', 'false');
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

function setupCtaTracking() {
  // Rastreia cliques nos botões de Diagnóstico
  document.querySelectorAll('a[href="#diagnostico"], a[href="#diagnostico-form"]').forEach(btn => {
    btn.addEventListener('click', () => {
      trackEvent('diagnostic_click', {
        button_text: btn.textContent.trim(),
        location: btn.getAttribute('data-location') || 'body'
      });
    });
  });

  // Rastreia cliques gerais em CTAs secundários
  document.querySelectorAll('.js-cta-track').forEach(btn => {
    btn.addEventListener('click', () => {
      trackEvent('cta_click', {
        cta_label: btn.textContent.trim(),
        location: btn.getAttribute('data-location') || 'unknown'
      });
    });
  });
}

function setupPrivacyModal() {
  const openLinks = document.querySelectorAll('.js-open-privacy-modal');
  const modal = document.getElementById('privacy-modal');
  const closeBtn = document.getElementById('close-privacy-modal');

  if (!modal) return;

  function openModal(e) {
    if (e) e.preventDefault();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  openLinks.forEach(link => link.addEventListener('click', openModal));
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}
