// Jarvis.OS site motion: starfield, particle core, scroll reveal, filters, companion poses,
// stage showcase and the mobile menu. The page is fully readable without this script.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  // ---------- header: progress bar, glass state, current section ----------
  var bar = $('.progress');
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
    document.body.classList.toggle('scrolled', scrollY > 24);
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navLinks = $$('.nav a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('current', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) secObs.observe(s); });
  }

  // mobile menu
  var menuBtn = $('.menu-btn'), nav = $('#nav');
  function setMenu(open) {
    if (!menuBtn || !nav) return;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('open', open);
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.nav-shell')) setMenu(false); });
  }

  // ---------- starfield ----------
  var sky = $('.stars');
  if (sky && sky.getContext) {
    var sctx = sky.getContext('2d'), stars = [], sw = 0, sh = 0, sdpr = 1;
    var sizeSky = function () {
      sdpr = Math.min(devicePixelRatio || 1, 2);
      sw = innerWidth; sh = innerHeight;
      sky.width = sw * sdpr; sky.height = sh * sdpr;
      sctx.setTransform(sdpr, 0, 0, sdpr, 0, 0);
      var n = Math.round(Math.min(160, sw * sh / 9000));
      stars = [];
      for (var i = 0; i < n; i++) stars.push({ x: Math.random() * sw, y: Math.random() * sh, r: Math.random() * 1.1 + 0.2, p: Math.random() * 6.28, s: 0.4 + Math.random() * 1.2 });
    };
    var drawSky = function (t) {
      sctx.clearRect(0, 0, sw, sh);
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        var a = reduce ? 0.5 : 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t / 1000 * st.s + st.p));
        sctx.fillStyle = 'rgba(170,220,255,' + a.toFixed(3) + ')';
        sctx.beginPath(); sctx.arc(st.x, st.y, st.r, 0, 6.283); sctx.fill();
      }
    };
    sizeSky();
    addEventListener('resize', function () { sizeSky(); drawSky(performance.now()); });
    if (reduce) drawSky(0);
    else (function loop(t) { if (!document.hidden) drawSky(t); requestAnimationFrame(loop); })(0);
  }

  // ---------- particle core ----------
  var core = $('[data-core]');
  if (core) (function () {
    var cv = $('.core-canvas', core), ctx = cv.getContext('2d');
    var small = innerWidth < 640;
    var N = small ? 1100 : 1800;
    var W = 0, H = 0, dpr = 1;
    var rotY = 0.6, rotX = -0.32, vel = 0.0035, dragging = false, lastX = 0, lastY = 0, visible = true;

    function rnd(a, b) { return a + Math.random() * (b - a); }
    var shapes = {
      sphere: function (i) {
        var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;
        return [Math.cos(th) * r, y, Math.sin(th) * r];
      },
      wave: function (i) {
        var side = Math.ceil(Math.sqrt(N)), gx = i % side, gz = Math.floor(i / side);
        var x = (gx / (side - 1) - 0.5) * 2.3, z = (gz / (side - 1) - 0.5) * 2.3;
        return [x, 0.28 * Math.sin(x * 3.2) * Math.cos(z * 2.4), z];
      },
      torus: function (i) {
        var u = (i / N) * 6.2832, v = (i * 0.61803 % 1) * 6.2832, R = 0.78, r = 0.3;
        return [(R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (R + r * Math.cos(v)) * Math.sin(u)];
      },
      cube: function () {
        var s = 0.72, f = Math.floor(Math.random() * 6), a = rnd(-s, s), b = rnd(-s, s), sg = f % 2 ? s : -s;
        return f < 2 ? [sg, a, b] : f < 4 ? [a, sg, b] : [a, b, sg];
      },
      helix: function (i) {
        var t = i / N, strand = i % 3, y = (t - 0.5) * 2.3, ang = t * 6.2832 * 3;
        if (strand === 2) { // rungs between the strands
          var k = Math.random();
          var x0 = Math.cos(ang) * 0.55, z0 = Math.sin(ang) * 0.55;
          return [x0 * (1 - 2 * k), y, z0 * (1 - 2 * k)];
        }
        var o = strand ? Math.PI : 0;
        return [Math.cos(ang + o) * 0.55 + rnd(-0.02, 0.02), y, Math.sin(ang + o) * 0.55 + rnd(-0.02, 0.02)];
      },
      pyramid: function () {
        var apex = [0, 0.95, 0], h = 0.85, base = -0.72;
        var c = [[-h, base, -h], [h, base, -h], [h, base, h], [-h, base, h]];
        var f = Math.floor(Math.random() * 5);
        if (f === 4) return [rnd(-h, h), base, rnd(-h, h)];
        var p = c[f], q = c[(f + 1) % 4], u = Math.random(), v = Math.random();
        if (u + v > 1) { u = 1 - u; v = 1 - v; }
        return [apex[0] + u * (p[0] - apex[0]) + v * (q[0] - apex[0]), apex[1] + u * (p[1] - apex[1]) + v * (q[1] - apex[1]), apex[2] + u * (p[2] - apex[2]) + v * (q[2] - apex[2])];
      }
    };

    var P = new Float32Array(N * 3), T = new Float32Array(N * 3), E = new Float32Array(N), current = 'sphere';
    function setShape(name, instant) {
      current = name;
      var f = shapes[name] || shapes.sphere;
      for (var i = 0; i < N; i++) {
        var p = f(i);
        T[i * 3] = p[0]; T[i * 3 + 1] = p[1]; T[i * 3 + 2] = p[2];
        if (instant) { P[i * 3] = p[0]; P[i * 3 + 1] = p[1]; P[i * 3 + 2] = p[2]; }
      }
    }
    for (var i = 0; i < N; i++) E[i] = rnd(0.035, 0.09);
    setShape('sphere', true);
    // start scattered so the core assembles on load
    if (!reduce) for (i = 0; i < N * 3; i++) P[i] = (Math.random() - 0.5) * 4;

    // place the nodes on a ring around the core (angle from each node's --a)
    $$('.node', core).forEach(function (n) {
      var a = parseFloat(n.style.getPropertyValue('--a')) * Math.PI / 180;
      n.style.left = (50 + 45 * Math.cos(a)).toFixed(2) + '%';
      n.style.top = (50 + 45 * Math.sin(a)).toFixed(2) + '%';
    });

    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      var r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      var cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
      var scale = Math.min(W, H) * 0.3, ox = W / 2, oy = H / 2, cam = 3.2, live = current === 'wave' && !reduce;
      for (var i = 0; i < N; i++) {
        var j = i * 3;
        if (!reduce) {
          P[j] += (T[j] - P[j]) * E[i];
          P[j + 1] += (T[j + 1] - P[j + 1]) * E[i];
          P[j + 2] += (T[j + 2] - P[j + 2]) * E[i];
        }
        var x = P[j], y = P[j + 1], z = P[j + 2];
        if (live) y += 0.07 * Math.sin(t / 420 + x * 4 + z * 2);
        var x1 = x * cy - z * sy, z1 = x * sy + z * cy;
        var y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
        if (cam + z2 < 1.2) continue; // too close to the camera while assembling
        var k = cam / (cam + z2);
        var px = ox + x1 * scale * k, py = oy + y1 * scale * k;
        var depth = (1 - z2) / 2; // 0 far .. 1 near
        var a = 0.18 + 0.75 * Math.max(0, Math.min(1, depth));
        var s = (0.7 + 1.5 * depth) * k;
        ctx.fillStyle = depth > 0.82 ? 'rgba(200,245,255,' + a.toFixed(2) + ')' : 'rgba(63,208,255,' + a.toFixed(2) + ')';
        ctx.fillRect(px - s / 2, py - s / 2, s, s);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function loop(t) {
      if (visible && !document.hidden) {
        if (!dragging) { rotY += vel; vel += (0.0035 - vel) * 0.02; }
        draw(t);
      }
      requestAnimationFrame(loop);
    }

    size();
    addEventListener('resize', function () { size(); if (reduce) draw(0); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(core);
    if (reduce) draw(0); else requestAnimationFrame(loop);

    // drag to spin (horizontal drags only, so the page still scrolls on touch)
    core.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.node')) return;
      dragging = true; lastX = e.clientX; lastY = e.clientY; core.classList.add('dragging');
      core.setPointerCapture && core.setPointerCapture(e.pointerId);
    });
    core.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      rotY += dx * 0.008; vel = dx * 0.008;
      rotX = Math.max(-1.1, Math.min(1.1, rotX + dy * 0.004));
      if (reduce) draw(0);
    });
    var stop = function () { dragging = false; core.classList.remove('dragging'); };
    core.addEventListener('pointerup', stop);
    core.addEventListener('pointercancel', stop);

    // nodes morph the particles
    var title = $('.core-title', core), text = $('.core-text', core);
    $$('.node', core).forEach(function (n) {
      n.addEventListener('click', function () {
        $$('.node', core).forEach(function (m) { m.classList.toggle('active', m === n); m.setAttribute('aria-pressed', m === n ? 'true' : 'false'); });
        title.textContent = n.dataset.title; text.textContent = n.dataset.text;
        setShape(n.dataset.shape, reduce);
        vel = 0.03;
        if (reduce) draw(0);
      });
    });
  })();

  // ---------- reveal on scroll + stat count-up ----------
  function countUp(el) {
    var end = +el.dataset.count, t0 = null;
    if (reduce || !end) return;
    (function step(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * e);
      if (k < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  var revealed = function (el) { el.classList.remove('pre'); el.classList.add('in'); $$('[data-count]', el).forEach(countUp); };
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { revealed(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    $$('.reveal').forEach(function (el) {
      if (el.parentNode.children.length > 1 && /feature|mini|shield|stat/.test(el.className)) {
        var i = [].indexOf.call(el.parentNode.children, el);
        el.style.transitionDelay = (i % 4) * 80 + 'ms';
      }
      if (el.getBoundingClientRect().top > innerHeight * 0.92) { el.classList.add('pre'); io.observe(el); }
      else revealed(el);
    });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // ---------- cursor glow on cards ----------
  document.addEventListener('pointermove', function (e) {
    var card = e.target.closest && e.target.closest('.glow-card');
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  // ---------- feature filters ----------
  var filters = $$('.filter'), features = $$('.feature');
  filters.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.dataset.filter;
      filters.forEach(function (x) { x.classList.toggle('active', x === b); x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      features.forEach(function (card, i) {
        var show = f === 'all' || card.dataset.cat === f;
        card.classList.toggle('hide', !show);
        card.classList.remove('pop', 'pre');
        card.classList.add('in');
        card.style.transitionDelay = '';
        if (show && !reduce) { void card.offsetWidth; card.style.animationDelay = (i % 4) * 50 + 'ms'; card.classList.add('pop'); }
      });
    });
  });

  // ---------- companion poses ----------
  var bubbles = {
    drop: ['Caught a document: invoice.pdf. What should I do with it?', ['Summarise', 'Save to memory', 'Send to phone']],
    idle: ['Standing by. Click me to chat, or double-click me to open the full interface.', ['Chat', 'Open HUD']],
    think: ['Thinking it over: checking your calendar and inbox now.', []],
    sit: ['Comfy up here on your window. If you move it, I ride along.', []],
    sleep: ['Zzz. I doze after ten quiet minutes and wake up when you are back.', []]
  };
  var hero = $('.cmp-hero'), bubble = $('.cmp-bubble'), msg = $('.cmp-msg'), btns = $('.cmp-btns');
  $$('.pose').forEach(function (p) {
    p.addEventListener('click', function () {
      $$('.pose').forEach(function (x) { x.classList.toggle('active', x === p); x.setAttribute('aria-selected', x === p ? 'true' : 'false'); });
      var b = bubbles[p.dataset.bubble];
      hero.classList.add('swap'); bubble.classList.add('swap');
      setTimeout(function () {
        hero.src = 'img/companion/' + p.dataset.img + '.png';
        hero.classList.toggle('wide', p.dataset.img === 'sleep');
        msg.textContent = b[0];
        btns.innerHTML = b[1].map(function (t, i) { return '<span' + (i ? '' : ' class="on"') + '>' + t + '</span>'; }).join('');
        hero.classList.remove('swap'); bubble.classList.remove('swap');
      }, reduce ? 0 : 220);
    });
  });
  ['idle', 'think', 'sit', 'sleep'].forEach(function (n) { var im = new Image(); im.src = 'img/companion/' + n + '.png'; });

  // ---------- stage showcase: the step in the middle of the screen picks the picture ----------
  var steps = $$('.stage'), frames = $$('.frame'), wrap = $('.stages');
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
