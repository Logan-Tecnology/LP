/**
 * LOGAN TECHNOLOGY - CONFIGURAÇÕES GERAIS
 * Centraliza variáveis de ambiente, WhatsApp, endpoints e IDs de tracking.
 * Não exponha chaves privadas neste arquivo client-side.
 */

export const APP_CONFIG = {
  // Número de WhatsApp oficial (DDI + DDD + Número)
  // Altere aqui sem precisar mexer em outros locais do código
  whatsappNumber: window.LOGAN_CONFIG?.whatsappNumber || '5511999999999',
  
  // Mensagem padrão de abertura de conversa no WhatsApp
  whatsappMessage: 'Olá! Vi a página Logan TI para Advocacia e gostaria de conversar sobre a gestão de TI do meu escritório.',
  
  // Telefone corporativo institucional
  contactPhone: '11 0000-0000',
  contactEmail: 'contato@logan.com.br',
  institutionalUrl: 'https://logan.com.br',
  
  // Endpoint para submissão do formulário de diagnóstico
  apiLeadEndpoint: '/api/lead',

  // Configuração de Tracking & Analytics (Google Ads / GA4 / GTM)
  // Preencha via tag manager ou variáveis globais window.LOGAN_CONFIG
  tracking: {
    gtmId: window.LOGAN_CONFIG?.gtmId || '',
    ga4Id: window.LOGAN_CONFIG?.ga4Id || '',
    googleAdsId: window.LOGAN_CONFIG?.googleAdsId || '',
    googleAdsConversionLabel: window.LOGAN_CONFIG?.googleAdsConversionLabel || '',
  }
};
