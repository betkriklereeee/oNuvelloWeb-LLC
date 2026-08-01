(() => {
  const track = (event, details = {}) => {
    const payload = { event, page_path: window.location.pathname, ...details };
    window.dataLayer?.push(payload);
    window.dispatchEvent(new CustomEvent('nuvello:analytics', { detail: payload }));
  };
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.nav-links');

  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  menuButton?.addEventListener('click', () => {
    const open = menu?.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(Boolean(open)));
    document.body.classList.toggle('menu-open', Boolean(open));
  });

  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }));

  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      const group = button.closest('.faq-list');
      group?.querySelectorAll('.faq-question').forEach(item => item.setAttribute('aria-expanded', 'false'));
      button.setAttribute('aria-expanded', String(!expanded));
    });
  });

  document.querySelectorAll('.lead-form').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const status = form.querySelector('.form-status');
      const submit = form.querySelector('[type="submit"]');
      const original = submit.textContent;
      status.className = 'form-status';
      submit.disabled = true;
      submit.textContent = 'Sending\u2026';
      track('lead_form_submit', { service: form.querySelector('[name="service"]')?.value || 'Unknown' });

      try {
        const response = await fetch(form.action, { method: 'POST', body: new FormData(form) });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Submission failed');
        form.reset();
        status.textContent = 'Thanks \u2014 your message is in. We\u2019ll respond within one business day.';
        status.classList.add('success');
        track('generate_lead', { form_location: window.location.pathname });
      } catch (error) {
        status.textContent = 'Something went wrong. Please call (323) 219-9208 or email contact@nuvelloweb.com.';
        status.classList.add('error');
        track('lead_form_error', { form_location: window.location.pathname });
      } finally {
        submit.disabled = false;
        submit.textContent = original;
      }
    });
  });

  document.querySelectorAll('a[href^="tel:"]').forEach(link => link.addEventListener('click', () => track('phone_click')));
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => link.addEventListener('click', () => track('email_click')));

  document.querySelectorAll('[data-year]').forEach(node => { node.textContent = new Date().getFullYear(); });
})();
