/**
 * LOGAN TECHNOLOGY - MOBILE CONVERSION BAR
 * Exibe barra fixa inferior em dispositivos móveis após a saída da dobra Hero.
 */

export function initMobileConversionBar() {
  const bar = document.getElementById('mobile-conversion-bar');
  const hero = document.getElementById('hero-section');
  const formSection = document.getElementById('diagnostico');

  if (!bar || !hero) return;

  // Usa IntersectionObserver para monitorar o scroll do Hero
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Quando o Hero não está mais visível no viewport
      if (!entry.isIntersecting && window.innerWidth <= 768) {
        bar.classList.add('visible');
      } else {
        bar.classList.remove('visible');
      }
    });
  }, {
    threshold: 0.1
  });

  observer.observe(hero);

  // Oculta a barra caso o usuário já esteja na seção do formulário para não encobrir campos
  if (formSection) {
    const formObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          bar.classList.remove('visible');
        }
      });
    }, {
      threshold: 0.2
    });
    formObserver.observe(formSection);
  }

  // Monitora redimensionamento da janela
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      bar.classList.remove('visible');
    }
  });
}
