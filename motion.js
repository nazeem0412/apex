// Jarvis.OS site motion: starfield, particle core, scroll reveal, filters, companion demo,
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

  // ---------- companion demo: a looping scene on a pretend desktop ----------
  var stage = $('.cmp-stage');
  if (stage) (function () {
    var jv = $('.cmp-jv', stage), img = $('.cmp-hero', stage), win = $('.cmp-window', stage),
      file = $('.cmp-file', stage), cur = $('.cmp-cursor', stage), zzz = $('.cmp-zzz', stage),
      bubble = $('.cmp-bubble', stage), msg = $('.cmp-msg', stage), btns = $('.cmp-btns', stage),
      play = $('.cmp-play', stage), chips = $$('.pose');
    ['idle', 'walk_1', 'walk_2', 'talk', 'think', 'listen', 'drag', 'sit', 'sleep'].forEach(function (n) { new Image().src = 'img/companion/' + n + '.png'; });

    var SAY = {
      hi: ['Hi! I live down here on your taskbar. Click me any time.', []],
      drop: ['Caught a document: invoice.pdf. What should I do with it?', ['Summarise', 'Save to memory', 'Send to phone']],
      dots: [null, []],
      summary: ['It’s an invoice for R4 250, due Friday. Want a reminder on Thursday?', ['Remind me', 'Not now']],
      perch: ['Comfy up here. Move the window and I’ll ride along.', []],
      welcome: ['Oh! Welcome back. Want a quick rundown of what you missed?', ['Yes please']]
    };
    var HS = { sleep: 0.27, sit: 0.32, drag: 0.42 }; // sprite height as a share of the stage height
    var TASK = 40, WIN = { x: 0.08, top: 0.55, w: 0.44 }, W = 0, H = 0;

    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
    function ease(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
    function lerp(a, b, k) { return a + (b - a) * k; }
    function hOf(p) { return (HS[p] || 0.46) * H; }
    function walk(t) { return Math.floor(t / 0.2) % 2 ? 'walk_2' : 'walk_1'; }
    function perchX(dx) { return WIN.x + dx + WIN.w * 0.6; }
    function seatBottom() { return H * (1 - WIN.top) - hOf('sit') * 0.2; } // legs hang over the edge
    function headTop(s) { return H - s.y - hOf(s.pose); } // px from the top of the stage

    var CH = [
      { d: 6.2, key: 5.5, f: function (t, s) { // strolls along the taskbar
        if (t < 3.2) { s.x = lerp(0.48, 0.78, ease(seg(t, 0, 3.2))); s.pose = walk(t); }
        else if (t < 3.5) { s.x = 0.78; s.flip = true; }
        else if (t < 4.8) { s.x = lerp(0.78, 0.5, ease(seg(t, 3.5, 4.8))); s.pose = walk(t); s.flip = true; }
        else s.say = 'hi';
      } },
      { d: 6.6, key: 4.4, f: function (t, s) { // a file is dropped on him
        var ht = headTop(s), sx = W * 0.88, sy = H * 0.1, ex = s.x * W, ey = ht - 44;
        if (t < 1.9) {
          var k = ease(seg(t, 0.3, 1.9));
          s.file = { x: lerp(sx, ex, k), y: lerp(sy, ey, k), o: seg(t, 0.2, 0.5) };
          s.cur = { x: s.file.x + 18, y: s.file.y + 14, o: s.file.o };
        } else {
          var d = seg(t, 1.9, 2.3);
          if (d < 1) s.file = { x: ex, y: lerp(ey, ht + 30, d * d), o: 1 - d };
          s.cur = { x: ex + 18, y: ey + 14, o: 1 };
        }
        if (t >= 2.2) { s.pose = 'talk'; s.hop = Math.sin(Math.PI * seg(t, 2.2, 2.6)) * 26; }
        if (t >= 2.4) s.say = 'drop';
        if (t >= 3.6 && s.cur) s.cur.to = { k: ease(seg(t, 3.6, 4.8)) }; // glide to the first button
        if (t >= 4.8 && t < 5.3) s.press = true;
        if (t >= 5.3 && s.cur) s.cur.o = 1 - seg(t, 5.3, 6.1);
      } },
      { d: 6, key: 4, f: function (t, s) { // thinks, then answers
        if (t < 2.4) { s.pose = 'think'; s.say = 'dots'; } else { s.pose = 'talk'; s.say = 'summary'; }
      } },
      { d: 7.2, key: 3, f: function (t, s) { // hops onto a window and rides it
        var k0 = ease(seg(t, 0, 0.5));
        s.win = { o: k0, dx: 0, sc: lerp(0.94, 1, k0) };
        if (t < 0.6) return;
        if (t < 1.4) { s.x = lerp(0.5, 0.42, ease(seg(t, 0.6, 1.4))); s.pose = walk(t); s.flip = true; return; }
        if (t < 2.1) {
          var k = seg(t, 1.4, 2.1);
          s.pose = 'drag'; s.x = lerp(0.42, perchX(0), k);
          s.y = lerp(TASK, seatBottom(), k) + Math.sin(Math.PI * k) * 70; return;
        }
        var dx = 0.14 * ease(seg(t, 4, 5.4));
        s.win.dx = dx; s.pose = 'sit'; s.x = perchX(dx); s.y = seatBottom();
        if (t >= 2.4) s.say = 'perch';
      } },
      { d: 8, key: 3.5, f: function (t, s) { // the window closes, he falls, naps, wakes up
        var c = seg(t, 0, 0.45);
        s.win = { o: 1 - c, dx: 0.14, sc: lerp(1, 0.94, c) };
        s.x = perchX(0.14);
        if (t < 0.5) { s.pose = 'sit'; s.y = seatBottom(); return; }
        if (t < 1.1) { var k = seg(t, 0.5, 1.1); s.pose = 'drag'; s.y = lerp(seatBottom(), TASK, k * k); return; }
        if (t < 1.4) { s.y = TASK + Math.sin(Math.PI * seg(t, 1.1, 1.4)) * 10; return; }
        if (t < 6.6) { s.pose = 'sleep'; s.zzz = true; }
        else { s.pose = 'listen'; s.say = 'welcome'; s.hop = Math.sin(Math.PI * seg(t, 6.6, 6.9)) * 14; }
        if (t >= 5.6) {
          var m = ease(seg(t, 5.6, 6.5)), tx = s.x * W + 70, ty = H - TASK - 120;
          s.cur = { x: lerp(W * 0.95, tx, m), y: lerp(H * 0.3, ty, m), o: seg(t, 5.6, 5.9) * (1 - seg(t, 7.2, 7.8)) };
        }
      } }
    ];
    var starts = [], total = 0;
    CH.forEach(function (c) { starts.push(total); total += c.d; });

    var shown = { pose: null, say: undefined };
    function render(s) {
      var h = hOf(s.pose), px = s.x * W, bottom = s.y + s.hop;
      if (shown.pose !== s.pose) { img.src = 'img/companion/' + s.pose + '.png'; shown.pose = s.pose; }
      img.style.height = h.toFixed(1) + 'px';
      img.classList.toggle('flip', s.flip);
      jv.style.transform = 'translate(calc(' + px.toFixed(1) + 'px - 50%),' + (-bottom).toFixed(1) + 'px)';

      win.style.opacity = s.win.o;
      win.style.transform = 'translateX(' + (s.win.dx * W).toFixed(1) + 'px) scale(' + s.win.sc + ')';

      if (shown.say !== s.say) {
        shown.say = s.say;
        if (s.say) {
          var c = SAY[s.say];
          if (c[0]) msg.textContent = c[0]; else msg.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
          btns.innerHTML = c[1].map(function (b, i) { return '<span' + (i ? '' : ' class="on"') + '>' + b + '</span>'; }).join('');
        }
      }
      bubble.classList.toggle('hidden', !s.say);
      var bw = bubble.offsetWidth, left = clamp(px, bw / 2 + 10, W - bw / 2 - 10);
      bubble.style.left = left.toFixed(1) + 'px';
      bubble.style.bottom = (bottom + h + 16).toFixed(1) + 'px';
      bubble.style.setProperty('--tail', clamp(px - left, -bw / 2 + 22, bw / 2 - 22).toFixed(1) + 'px');
      var first = btns.firstElementChild;
      if (first) first.classList.toggle('press', s.press);

      if (s.cur && s.cur.to && first) { // glide from where it was to the first button
        var r = first.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        s.cur.x = lerp(s.cur.x, r.left - sr.left + r.width * 0.5, s.cur.to.k);
        s.cur.y = lerp(s.cur.y, r.top - sr.top + r.height * 0.55, s.cur.to.k);
      }
      cur.style.opacity = s.cur ? s.cur.o : 0;
      if (s.cur) cur.style.transform = 'translate(' + s.cur.x.toFixed(1) + 'px,' + s.cur.y.toFixed(1) + 'px) scale(' + (s.press ? 0.85 : 1) + ')';
      file.style.opacity = s.file ? s.file.o : 0;
      if (s.file) file.style.transform = 'translate(calc(' + s.file.x.toFixed(1) + 'px - 50%),' + s.file.y.toFixed(1) + 'px)';

      zzz.style.opacity = s.zzz ? 1 : 0;
      zzz.style.transform = 'translate(' + (px + h * 0.25).toFixed(1) + 'px,' + (-(bottom + h * 0.75)).toFixed(1) + 'px)';
    }

    var T = 0, last = null, paused = false, inView = false;
    function draw() {
      var i = CH.length - 1;
      while (i > 0 && T < starts[i]) i--;
      var t = T - starts[i];
      var s = { x: 0.5, y: TASK, pose: 'idle', flip: false, say: null, cur: null, file: null, win: { o: 0, dx: 0, sc: 1 }, zzz: false, hop: 0, press: false };
      CH[i].f(t, s);
      render(s);
      chips.forEach(function (c, j) {
        var on = j === i;
        if (c.classList.contains('active') !== on) { c.classList.toggle('active', on); c.setAttribute('aria-selected', on ? 'true' : 'false'); }
        c.style.setProperty('--p', on ? (t / CH[i].d).toFixed(3) : 0);
      });
    }
    function measure() { W = stage.clientWidth; H = stage.clientHeight; }
    function frame(now) {
      if (last === null) last = now;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!paused && inView && !document.hidden) { T = (T + dt) % total; draw(); }
      requestAnimationFrame(frame);
    }
    function setPaused(p) {
      paused = p;
      play.setAttribute('aria-pressed', p ? 'true' : 'false');
      play.setAttribute('aria-label', p ? 'Play the demo' : 'Pause the demo');
    }

    measure();
    T = reduce ? CH[0].key : 0;
    draw();
    addEventListener('resize', function () { measure(); draw(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }).observe(stage);
    else inView = true;
    if (reduce) setPaused(true);
    requestAnimationFrame(frame);

    play.addEventListener('click', function () { setPaused(!paused); });
    chips.forEach(function (c, j) {
      c.addEventListener('click', function () {
        T = starts[j] + (paused ? CH[j].key : 0);
        draw();
      });
    });
  })();

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
