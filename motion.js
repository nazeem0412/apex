// Scroll motion for the Jarvis site: progress bar, reveal-on-scroll, hero parallax,
// and the sticky stage showcase. Everything is visible without this script; it only
// hides elements that start below the fold, then brings them in as they arrive.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bar = document.querySelector('.progress');
  var heroBg = document.querySelector('.hero-bg');

  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
    if (heroBg && !reduce && scrollY < innerHeight * 1.5) {
      heroBg.style.transform = 'translate3d(0,' + (scrollY * 0.15).toFixed(1) + 'px,0) scale(' + (1 + scrollY * 0.0002).toFixed(4) + ')';
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // reveal on scroll (stagger cards that share a row)
  if (!reduce && 'IntersectionObserver' in window) {
    var items = [].slice.call(document.querySelectorAll('.reveal'));
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.remove('pre'); e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) {
      if (el.classList.contains('feature')) {
        var i = [].indexOf.call(el.parentNode.children, el);
        el.style.transitionDelay = (i % 4) * 90 + 'ms';
      }
      if (el.getBoundingClientRect().top > innerHeight * 0.92) { el.classList.add('pre'); io.observe(el); }
      else el.classList.add('in');
    });
  } else {
    [].forEach.call(document.querySelectorAll('.reveal'), function (el) { el.classList.add('in'); });
  }

  // stage showcase: the step in the middle of the screen picks the picture
  var steps = [].slice.call(document.querySelectorAll('.stage'));
  var frames = [].slice.call(document.querySelectorAll('.frame'));
  var wrap = document.querySelector('.stages');
  function activate(name) {
    steps.forEach(function (s) { s.classList.toggle('active', s.dataset.stage === name); });
    frames.forEach(function (f) { f.classList.toggle('active', f.dataset.stage === name); });
    var c = steps.filter(function (s) { return s.dataset.stage === name; })[0];
    if (wrap && c) wrap.style.setProperty('--stage', getComputedStyle(c).getPropertyValue('--c'));
  }
  if (steps.length && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) activate(e.target.dataset.stage); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { so.observe(s); });
  }
  steps.forEach(function (s) { s.addEventListener('click', function () { activate(s.dataset.stage); }); });
})();
