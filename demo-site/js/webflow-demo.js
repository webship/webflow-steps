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
// - Tabs: the links get `role`, `aria-selected` and `tabindex`, the panes `role`
//   and `aria-labelledby`; a click moves `w--current` and `w--tab-active`;
// - Slider: `role`, arrows and dots with their labels, `aria-hidden` on the
//   slides that are not shown, and the live region "Slide 2 of 3.";
// - Dropdown: `aria-expanded` on the toggle, `w--open` on the toggle and the
//   list; a dropdown with `data-hover="true"` also opens on hover;
// - Lightbox: a click on `a.w-lightbox` adds `.w-lightbox-backdrop` to the
//   body; closing adds `w-lightbox-hide` to it;
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

  function setUpTabs(tabs, index) {
    var links = tabs.querySelectorAll('.w-tab-link');
    var panes = tabs.querySelectorAll('.w-tab-pane');
    var menu = tabs.querySelector('.w-tab-menu');
    menu.setAttribute('role', 'tablist');
    function select(link) {
      Array.prototype.forEach.call(links, function (other, i) {
        var on = other === link;
        other.classList.toggle('w--current', on);
        other.setAttribute('aria-selected', String(on));
        if (on) other.removeAttribute('tabindex'); else other.setAttribute('tabindex', '-1');
        panes[i].classList.toggle('w--tab-active', on);
      });
    }
    Array.prototype.forEach.call(links, function (link, i) {
      link.id = 'w-tabs-' + index + '-data-w-tab-' + i;
      panes[i].id = 'w-tabs-' + index + '-data-w-pane-' + i;
      link.setAttribute('role', 'tab');
      link.setAttribute('href', '#' + panes[i].id);
      link.setAttribute('aria-controls', panes[i].id);
      panes[i].setAttribute('role', 'tabpanel');
      panes[i].setAttribute('aria-labelledby', link.id);
      link.addEventListener('click', function (event) { event.preventDefault(); select(link); });
    });
    select(tabs.querySelector('.w-tab-link.w--current') || links[0]);
  }

  function setUpSlider(slider, index) {
    var mask = slider.querySelector('.w-slider-mask');
    var slides = mask.querySelectorAll('.w-slide');
    var nav = slider.querySelector('.w-slider-nav');
    var label = document.createElement('div');
    var left = slider.querySelector('.w-slider-arrow-left');
    var right = slider.querySelector('.w-slider-arrow-right');
    var dots = [];
    var current = 0;
    mask.id = 'w-slider-mask-' + index;
    slider.setAttribute('role', 'region');
    slider.setAttribute('aria-label', 'carousel');
    label.className = 'w-slider-aria-label';
    label.setAttribute('aria-live', 'off');
    label.setAttribute('aria-atomic', 'true');
    label.setAttribute('data-wf-ignore', '');
    slider.appendChild(label);
    [[left, 'previous slide'], [right, 'next slide']].forEach(function (pair) {
      pair[0].setAttribute('role', 'button');
      pair[0].setAttribute('tabindex', '0');
      pair[0].setAttribute('aria-controls', mask.id);
      pair[0].setAttribute('aria-label', pair[1]);
    });
    Array.prototype.forEach.call(slides, function (slide, i) {
      var dot = document.createElement('div');
      dot.className = 'w-slider-dot';
      dot.setAttribute('data-wf-ignore', '');
      dot.setAttribute('role', 'button');
      dot.setAttribute('aria-label', 'Show slide ' + (i + 1) + ' of ' + slides.length);
      dot.textContent = String(i + 1);
      dot.addEventListener('click', function () { show(i); });
      nav.appendChild(dot);
      dots.push(dot);
    });
    function show(i) {
      current = (i + slides.length) % slides.length;
      Array.prototype.forEach.call(slides, function (slide, n) {
        slide.style.display = n === current ? 'inline-block' : 'none';
        if (n === current) slide.removeAttribute('aria-hidden'); else slide.setAttribute('aria-hidden', 'true');
      });
      dots.forEach(function (dot, n) {
        dot.classList.toggle('w-active', n === current);
        dot.setAttribute('aria-pressed', String(n === current));
        dot.setAttribute('tabindex', n === current ? '0' : '-1');
      });
      label.textContent = 'Slide ' + (current + 1) + ' of ' + slides.length + '.';
    }
    left.addEventListener('click', function () { show(current - 1); });
    right.addEventListener('click', function () { show(current + 1); });
    show(0);
  }

  function setUpDropdown(dropdown, index) {
    var toggle = dropdown.querySelector(':scope > .w-dropdown-toggle');
    var list = dropdown.querySelector(':scope > .w-dropdown-list');
    toggle.id = 'w-dropdown-toggle-' + index;
    list.id = 'w-dropdown-list-' + index;
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('tabindex', '0');
    toggle.setAttribute('aria-controls', list.id);
    toggle.setAttribute('aria-haspopup', 'menu');
    toggle.setAttribute('aria-expanded', 'false');
    list.setAttribute('aria-labelledby', toggle.id);
    function set(open) {
      toggle.classList.toggle('w--open', open);
      list.classList.toggle('w--open', open);
      toggle.setAttribute('aria-expanded', String(open));
      dropdown.style.zIndex = open ? '901' : '';
    }
    toggle.addEventListener('click', function () { set(!list.classList.contains('w--open')); });
    toggle.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); set(!list.classList.contains('w--open')); }
    });
    if (dropdown.getAttribute('data-hover') === 'true') {
      dropdown.addEventListener('mouseenter', function () { set(true); });
      dropdown.addEventListener('mouseleave', function () { set(false); });
    }
  }

  function setUpLightbox(link) {
    var data = JSON.parse(link.querySelector('script.w-json').textContent);
    var backdrop = null;
    link.setAttribute('aria-label', 'open lightbox');
    link.setAttribute('aria-haspopup', 'dialog');
    function close() {
      backdrop.classList.add('w-lightbox-hide');
      document.documentElement.classList.remove('w-lightbox-noscroll');
    }
    link.addEventListener('click', function (event) {
      event.preventDefault();
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'w-lightbox-backdrop';
        backdrop.innerHTML = '<div class="w-lightbox-container"><div class="w-lightbox-content"><div class="w-lightbox-view"><div class="w-lightbox-frame"><figure class="w-lightbox-figure"><img class="w-lightbox-img w-lightbox-image" alt="" src="' + data.items[0].url + '"></figure></div></div>' +
          '<div class="w-lightbox-control w-lightbox-left"></div><div class="w-lightbox-control w-lightbox-right"></div>' +
          '<div class="w-lightbox-control w-lightbox-close" role="button" aria-label="close lightbox" tabindex="0"></div></div></div>';
        backdrop.querySelector('.w-lightbox-close').addEventListener('click', close);
        document.body.appendChild(backdrop);
      }
      backdrop.classList.remove('w-lightbox-hide');
      document.documentElement.classList.add('w-lightbox-noscroll');
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && backdrop && !backdrop.classList.contains('w-lightbox-hide')) close();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    markCurrentLinks();
    Array.prototype.forEach.call(document.querySelectorAll('.w-tabs'), setUpTabs);
    Array.prototype.forEach.call(document.querySelectorAll('.w-slider'), setUpSlider);
    Array.prototype.forEach.call(document.querySelectorAll('.w-dropdown'), setUpDropdown);
    Array.prototype.forEach.call(document.querySelectorAll('.w-lightbox'), setUpLightbox);
    Array.prototype.forEach.call(document.querySelectorAll('.w-nav'), setUpNavbar);
    Array.prototype.forEach.call(document.querySelectorAll('.w-form form'), setUpForm);
  });
})();
