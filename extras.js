// Apex.OS site extras (2026-10-29): live stats from stats.json, the command search, and the small
// companion who walks along the bottom of the page.
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  };

  // ---------- stats: the hero numbers come from stats.json, the HTML holds a fallback ----------
  function setStat(key, value, label) {
    var tile = $('[data-stat="' + key + '"]');
    if (!tile) return;
    var n = $('span', tile);
    if (n) { n.textContent = value; n.setAttribute('data-count', value); }
    if (label) $('dd', tile).textContent = label;
  }
  fetch('stats.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (s) {
    if (!s) return;
    if (s.tools) setStat('tools', s.tools);
    if (s.systems) setStat('systems', s.systems);
    if (s.first_build) {
      var days = Math.max(1, Math.floor((Date.now() - new Date(s.first_build + 'T00:00:00').getTime()) / 86400000));
      setStat('days', days);
    }
    if (s.skills_built > 0) setStat('versions', s.skills_built, 'Skills he built himself');
    else if (s.saved_versions) setStat('versions', s.saved_versions);
  }).catch(function () {});

  // ---------- command search ----------
  var search = $('[data-cmd-search]');
  if (search) {
    var items = $$('[data-cmds] li'), count = $('[data-cmd-count]'), empty = $('[data-cmd-empty]');
    var filter = function () {
      var q = search.value.trim().toLowerCase(), shown = 0;
      items.forEach(function (li) {
        var hit = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
        li.hidden = !hit;
        if (hit) shown++;
      });
      count.textContent = q ? shown + ' of ' + items.length : items.length + ' examples';
      empty.hidden = shown !== 0;
    };
    search.addEventListener('input', filter);
    filter();
  }

  // ---------- the walking companion ----------
  var IMG = 'img/companion/';
  var LINES = [
    'Hi, I\'m Apex. I live on my owner\'s PC.',
    'Try "Hey Apex, what\'s on today?"',
    'I can move windows with a wave of your hand.',
    'Nothing you see here leaves the PC unless it has to.',
    'Scroll on. I\'ll keep up.',
    'I check myself every morning, before anyone wakes up.',
    'Ask me to look at your screen, and I will. Only then.'
  ];
  if (store.get('apex-walker') === 'hidden') { addBack(); return; }

  var el = document.createElement('div');
  el.className = 'walker';
  el.setAttribute('aria-hidden', 'false');
  el.innerHTML = '<div class="walker-bubble" role="status"></div>' +
    '<button class="walker-body" type="button" aria-label="Apex, the companion. Click to say hello"><img alt="" src="' + IMG + 'walk_1.png"></button>' +
    '<button class="walker-hide" type="button" aria-label="Hide the companion">&times;</button>';
  document.body.appendChild(el);
  var img = $('img', el), bubble = $('.walker-bubble', el);
  ['walk_1', 'walk_2', 'idle', 'talk', 'think', 'sit', 'sleep', 'listen'].forEach(function (n) { new Image().src = IMG + n + '.png'; });

  var x = 40, dir = 1, mode = 'walk', frame = 0, frameT = 0, last = performance.now();
  var lastScroll = 0, scrollBoost = 0, idleSince = performance.now(), sayUntil = 0, atEnd = false, lineIdx = 0;
  var W = function () { return window.innerWidth - el.offsetWidth - 8; };

  function pose(name) { var src = IMG + name + '.png'; if (img.getAttribute('src') !== src) img.setAttribute('src', src); }
  function say(text, ms) {
    bubble.textContent = text;
    bubble.classList.remove('left', 'right');
    if (x < 120) bubble.classList.add('right');
    else if (x > W() - 120) bubble.classList.add('left');
    bubble.classList.add('show');
    sayUntil = performance.now() + (ms || 3600);
  }

  window.addEventListener('scroll', function () {
    var now = performance.now(), y = window.scrollY;
    scrollBoost = Math.min(4, scrollBoost + Math.abs(y - lastScroll) / 120);
    if (y !== lastScroll) dir = y > lastScroll ? 1 : -1;  // he heads the way you scroll
    lastScroll = y;
    idleSince = now;
    var end = window.innerHeight + y >= document.documentElement.scrollHeight - 40;
    if (end && !atEnd) { atEnd = true; say('Thanks for visiting! 👋', 5000); }
    if (!end) atEnd = false;
  }, { passive: true });

  $('.walker-body', el).addEventListener('click', function () {
    idleSince = performance.now();
    say(LINES[lineIdx++ % LINES.length]);
  });
  $('.walker-hide', el).addEventListener('click', function () {
    store.set('apex-walker', 'hidden');
    el.remove();
    addBack();
  });

  function tick(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    var quiet = (now - idleSince) / 1000, talking = now < sayUntil;
    if (!talking) bubble.classList.remove('show');
    el.classList.toggle('wave', atEnd && talking);

    if (atEnd || talking) { mode = atEnd ? 'wave' : 'talk'; pose('talk'); }
    else if (reduced) { mode = 'idle'; pose('idle'); }
    else if (quiet > 45) { mode = 'sleep'; pose('sleep'); }
    else if (quiet > 20) { mode = 'sit'; pose('sit'); }
    else {
      mode = 'walk';
      var speed = 34 + scrollBoost * 55;
      x += dir * speed * dt;
      if (x > W()) { x = W(); dir = -1; }
      if (x < 8) { x = 8; dir = 1; }
      frameT += dt * (2.6 + scrollBoost * 1.6);
      if (frameT >= 1) { frameT = 0; frame ^= 1; }
      pose(scrollBoost > 2.5 ? 'think' : (frame ? 'walk_2' : 'walk_1'));
    }
    scrollBoost = Math.max(0, scrollBoost - dt * 1.5);
    el.classList.toggle('flip', dir < 0);
    el.classList.toggle('sleep', mode === 'sleep');
    el.style.transform = 'translateX(' + Math.round(x) + 'px)';
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize', function () { x = Math.min(x, W()); });
  setTimeout(function () { say('Hi! I\'m Apex. Click me any time.', 4200); }, 1800);
  requestAnimationFrame(tick);

  function addBack() {
    var b = document.createElement('button');
    b.className = 'walker-back';
    b.type = 'button';
    b.textContent = 'Bring Apex back';
    b.addEventListener('click', function () { store.set('apex-walker', null); location.reload(); });
    document.body.appendChild(b);
  }
})();
