/**
 * LOGAN TECHNOLOGY - ACCORDION COMPONENT (FAQ)
 * Acessível via teclado, ARIA semântico e fechamento inteligente.
 */

export function initAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        // Fecha outros itens para manter a página limpa
        faqItems.forEach(otherItem => {
          if (otherItem !== item && otherItem.open) {
            otherItem.removeAttribute('open');
          }
        });
      }
    });
  });
}
