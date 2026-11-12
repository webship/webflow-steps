// A small stand-in for Webflow's runtime (webflow.js), so the demo pages
// behave like a published Webflow site without loading Webflow's script. It
// does what the real script does to the markup, as read from the script and
// observed on public Webflow sites:
//
// - links: a link whose address is the page's gets `w--current`;
// - Navbar: the hamburger button gets `role`, `tabindex`, `aria-controls`,
//   `aria-haspopup` and `aria-expanded`; opening puts `w--open` on the button,
//   `data-nav-menu-open` on the menu (which moves into a `.w-nav-overlay`) and
//   `w--nav-link-open` on the links, sizes the overlay to the viewport, and
//   sets `aria-expanded` when the animation ends; closing undoes it;
// - forms: a form with `data-turnstile-sitekey` keeps its submit button
//   disabled until Cloudflare's Turnstile script hands over a token; the
//   submit posts to the form endpoint, and `{"code": 200}` hides the form and
//   shows `.w-form-done`, anything else shows `.w-form-fail`.
(function () {
  'use strict';

  var ENDPOINT = '/api/v1/form/';
  var TURNSTILE = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

  function markCurrentLinks() {
    var here = location.pathname.replace(/index\.html$/, '');
    Array.prototype.forEach.call(document.links, function (a) {
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.indexOf(':') >= 0 || a.getAttribute('hreflang')) return;
      var target = href.replace(/index\.html$/, '');
      if (a.href === location.href || href === location.pathname || target === here) a.classList.add('w--current');
    });
  }

  function setUpNavbar(nav, index) {
    var button = nav.querySelector('.w-nav-button');
    var menu = nav.querySelector('.w-nav-menu');
    if (!button || !menu) return;
    var duration = Number(nav.getAttribute('data-duration') || 400);
    var overlay = document.createElement('div');
    overlay.className = 'w-nav-overlay';
    overlay.id = 'w-nav-overlay-' + index;
    overlay.setAttribute('data-wf-ignore', '');
    nav.appendChild(overlay);
    var links = menu.querySelectorAll('a');
    var open = false;
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
    button.setAttribute('aria-label', 'menu');
    button.setAttribute('aria-controls', overlay.id);
    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-expanded', 'false');

    function openMenu() {
      open = true;
      button.classList.add('w--open');
      menu.setAttribute('data-nav-menu-open', '');
      Array.prototype.forEach.call(links, function (a) { a.classList.add('w--nav-link-open'); });
      overlay.style.display = 'block';
      overlay.style.height = Math.max(window.innerHeight - nav.offsetHeight, 0) + 'px';
      overlay.appendChild(menu);
      setTimeout(function () { button.setAttribute('aria-expanded', 'true'); }, duration);
    }
    function closeMenu() {
      open = false;
      button.classList.remove('w--open');
      setTimeout(function () {
        menu.removeAttribute('data-nav-menu-open');
        Array.prototype.forEach.call(links, function (a) { a.classList.remove('w--nav-link-open'); });
        if (overlay.contains(menu)) nav.querySelector('.w-container').insertBefore(menu, button);
        overlay.style.display = '';
        overlay.style.height = '';
        button.setAttribute('aria-expanded', 'false');
      }, duration);
    }
    function toggle() { if (open) closeMenu(); else openMenu(); }
    button.addEventListener('click', toggle);
    button.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
    });
  }

  function setUpForm(form) {
    var wrapper = form.closest('.w-form');
    var done = wrapper.querySelector('.w-form-done');
    var fail = wrapper.querySelector('.w-form-fail');
    var submit = form.querySelector('input[type="submit"]');
    var label = submit.value;
    var wait = submit.getAttribute('data-wait');
    var sitekey = form.getAttribute('data-turnstile-sitekey');
    var token = null;

    if (sitekey) {
      submit.disabled = true;
      var script = document.createElement('script');
      script.src = TURNSTILE;
      script.onload = function () {
        var holder = document.createElement('div');
        form.appendChild(holder);
        window.turnstile.render(holder, {
          sitekey: sitekey,
          callback: function (value) { token = value; submit.disabled = false; },
          'error-callback': function () { submit.disabled = true; }
        });
      };
      document.head.appendChild(script);
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (wait) submit.value = wait;
      fail.style.display = '';
      var body = new URLSearchParams();
      Array.prototype.forEach.call(form.elements, function (field) {
        if (field.name) body.append(field.getAttribute('data-name') || field.name, field.value);
      });
      if (token) body.append('turnstile', token);
      fetch(ENDPOINT + document.documentElement.getAttribute('data-wf-site'), { method: 'POST', body: body })
        .then(function (response) { return response.json(); })
        .then(function (answer) {
          if (answer && answer.code === 200) { form.style.display = 'none'; done.style.display = 'block'; } else { fail.style.display = 'block'; }
        })
        .catch(function () { fail.style.display = 'block'; })
        .then(function () { submit.value = label; });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    markCurrentLinks();
    Array.prototype.forEach.call(document.querySelectorAll('.w-nav'), setUpNavbar);
    Array.prototype.forEach.call(document.querySelectorAll('.w-form form'), setUpForm);
  });
})();
