/**
 * LOGAN TECHNOLOGY - CONVERSION FORM HANDLER
 * Gerenciamento de estados (idle, validating, submitting, success, error),
 * validação sanitizada, máscara de telefone, integração com backend e disparo de eventos.
 */

import { APP_CONFIG } from './config.js';
import { trackEvent, getAttributionData } from './tracking.js';

export function initLeadForm() {
  const form = document.getElementById('diagnostico-lead-form');
  if (!form) return;

  const statusBox = document.getElementById('form-status-box');
  const submitButton = form.querySelector('button[type="submit"]');
  const phoneInput = document.getElementById('lead-whatsapp');
  
  let formStarted = false;
  let isSubmitting = false;

  // 1. Máscara e formatação para WhatsApp brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 11) val = val.slice(0, 11);

      if (val.length > 6) {
        if (val.length === 11) {
          e.target.value = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
        } else {
          e.target.value = `(${val.slice(0, 2)}) ${val.slice(2, 6)}-${val.slice(6)}`;
        }
      } else if (val.length > 2) {
        e.target.value = `(${val.slice(0, 2)}) ${val.slice(2)}`;
      } else if (val.length > 0) {
        e.target.value = `(${val}`;
      } else {
        e.target.value = '';
      }
    });
  }

  // 2. Disparo de evento form_start no primeiro toque/foco de qualquer campo
  form.addEventListener('focusin', () => {
    if (!formStarted) {
      formStarted = true;
      trackEvent('form_start', { form_name: 'diagnostico_ti_advocacia' });
    }
  }, { once: true });

  // 3. Validação de campos individuais
  function validateField(field) {
    const errorEl = document.getElementById(`error-${field.name}`);
    let isValid = true;
    let message = '';

    const val = field.value.trim();

    if (field.hasAttribute('required') && (!val || (field.type === 'checkbox' && !field.checked))) {
      isValid = false;
      message = 'Este campo é obrigatório.';
    } else if (field.name === 'email' && val) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        isValid = false;
        message = 'Por favor, insira um e-mail válido.';
      }
    } else if (field.name === 'whatsapp' && val) {
      const digits = val.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 11) {
        isValid = false;
        message = 'Informe o DDD e o número completo do WhatsApp.';
      }
    }

    if (!isValid) {
      field.classList.add('is-invalid');
      if (errorEl) errorEl.textContent = message;
    } else {
      field.classList.remove('is-invalid');
      if (errorEl) errorEl.textContent = '';
    }

    return isValid;
  }

  // Limpa erro ao digitar
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => {
      field.classList.remove('is-invalid');
      const errorEl = document.getElementById(`error-${field.name}`);
      if (errorEl) errorEl.textContent = '';
    });
  });

  // 4. Submissão do Formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Estado: VALIDATING
    let formIsValid = true;
    const fieldsToValidate = [
      form.elements['nome'],
      form.elements['escritorio'],
      form.elements['email'],
      form.elements['whatsapp'],
      form.elements['usuarios'],
      form.elements['necessidade'],
      form.elements['lgpd']
    ];

    fieldsToValidate.forEach(field => {
      if (field && !validateField(field)) {
        formIsValid = false;
      }
    });

    if (!formIsValid) {
      showStatus('Por favor, preencha todos os campos obrigatórios indicados.', 'status-error');
      return;
    }

    // Coleta dados
    const formData = {
      nome: form.elements['nome'].value.trim(),
      escritorio: form.elements['escritorio'].value.trim(),
      email: form.elements['email'].value.trim(),
      whatsapp: form.elements['whatsapp'].value.trim(),
      usuarios: form.elements['usuarios'].value,
      necessidade: form.elements['necessidade'].value,
      observacoes: form.elements['observacoes'] ? form.elements['observacoes'].value.trim() : '',
      lgpd_consentimento: form.elements['lgpd'].checked,
      origem_pagina: 'Landing Page Advocacia - Logan Technology',
      attribution: getAttributionData(),
      client_timestamp: new Date().toISOString()
    };

    // Dispara evento form_submit (tentativa de envio)
    trackEvent('form_submit', {
      form_name: 'diagnostico_ti_advocacia',
      usuarios: formData.usuarios,
      necessidade: formData.necessidade
    });

    // Estado: SUBMITTING
    isSubmitting = true;
    setFormStateSubmitting(true);
    showStatus('Enviando sua solicitação com segurança...', 'status-notice');

    try {
      const response = await fetch(APP_CONFIG.apiLeadEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && (result.success || response.status === 200 || response.status === 201)) {
        // Estado: SUCCESS
        // REGRA CRÍTICA: Disparar "generate_lead" apenas APÓS confirmação bem-sucedida
        trackEvent('generate_lead', {
          form_name: 'diagnostico_ti_advocacia',
          lead_id: result.leadId || 'lead_' + Date.now(),
          value: 1
        });

        showSuccessScreen(formData.nome);
        form.reset();
      } else {
        // Se a API retornar erro ou status diferente
        throw new Error(result.message || 'Falha ao processar solicitação.');
      }
    } catch (err) {
      console.error('[Logan Form Error]:', err);
      // Estado: ERROR
      showStatus('Não foi possível registrar seu diagnóstico neste momento. Por favor, tente novamente ou fale diretamente conosco pelo WhatsApp.', 'status-error');
      setFormStateSubmitting(false);
      isSubmitting = false;
    }
  });

  function setFormStateSubmitting(submitting) {
    if (submitting) {
      submitButton.disabled = true;
      submitButton.innerHTML = `
        <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
        <span>Processando solicitação...</span>
      `;
    } else {
      submitButton.disabled = false;
      submitButton.innerHTML = 'SOLICITAR DIAGNÓSTICO';
    }
  }

  function showStatus(message, typeClass) {
    if (!statusBox) return;
    statusBox.className = `form-status-box active ${typeClass}`;
    statusBox.innerHTML = message;
    statusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showSuccessScreen(nome) {
    const container = document.getElementById('lead-form-inner-container');
    if (!container) return;

    container.innerHTML = `
      <div class="form-success-card" style="text-align: center; padding: 2rem 1rem;">
        <div style="width: 64px; height: 64px; background-color: var(--color-status-success-bg); color: var(--color-status-success); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; border: 2px solid var(--color-status-success-border);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h3 style="color: var(--color-primary-dark); font-size: 1.5rem; margin-bottom: 0.75rem;">Solicitação Recebida com Sucesso!</h3>
        <p style="color: var(--color-text-secondary); max-width: 480px; margin: 0 auto 1.5rem auto;">
          Obrigado, <strong>${escapeHtml(nome)}</strong>. Nossa equipe técnica especializada em ambientes jurídicos já recebeu seus dados e entrará em contato para agendar a realização do Diagnóstico de TI do seu escritório.
        </p>
        <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
          <a href="${getWhatsAppUrl()}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp" id="success-wpp-btn">
            Adiantar conversa via WhatsApp
          </a>
        </div>
      </div>
    `;

    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  function getWhatsAppUrl() {
    const text = encodeURIComponent(APP_CONFIG.whatsappMessage);
    return `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${text}`;
  }
}
