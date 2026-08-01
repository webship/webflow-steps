// Minimal stand-in for Webflow's runtime interactions (nav toggle + AJAX-style
// form submit) so the demo site behaves like a real Webflow export without
// requiring Webflow's hosted JS bundle.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.w-nav').forEach(function (nav) {
    var button = nav.querySelector('.w-nav-button');
    var menu = nav.querySelector('.w-nav-menu');
    if (!button || !menu) return;
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('w--nav-menu-open');
      button.setAttribute('aria-expanded', String(isOpen));
    });
  });

  document.querySelectorAll('.w-form form').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var wrapper = form.closest('.w-form');
      var doneEl = wrapper.querySelector('.w-form-done');
      var failEl = wrapper.querySelector('.w-form-fail');
      var email = form.querySelector('[name="email"]');
      var shouldFail = email && /fail@/i.test(email.value);
      setTimeout(function () {
        if (shouldFail) {
          if (failEl) failEl.style.display = 'block';
        } else {
          form.style.display = 'none';
          if (doneEl) doneEl.style.display = 'block';
        }
      }, 50);
    });
  });
});
