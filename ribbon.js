/* Mocha-Green-Bänder, die immer von rechts nach links laufen und die Welle des Hero-Bandes weiterführen:
   1) Hero-Band -> läuft unter dem Hero weiter nach links, 2) quer durch „Zusammenarbeit" mit nummerierten Pins,
   3) über dem Kontaktbereich. Breite wechselt fließend. Hero- und Seiten-Teil nutzen denselben Pfad (nahtloser Anschluss). */
(function(){
  var hero = document.querySelector('.hero');
  if(!hero) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  function mk(cls){
    var box = document.createElement('div'); box.className = cls; box.setAttribute('aria-hidden','true');
    var svg = document.createElementNS(NS,'svg'), p = document.createElementNS(NS,'path');
    svg.appendChild(p); box.appendChild(svg); document.body.appendChild(box);
    return {box:box, svg:svg, path:p};
  }
  var heroPart = mk('page-ribbon page-ribbon--hero');   /* über dem Hero-Hintergrund, unter Bildern und Text */
  var pagePart = mk('page-ribbon');                      /* hinter dem Seiteninhalt */
  var pinBox = document.createElement('div');
  pinBox.className = 'ribbon-pins'; pinBox.setAttribute('aria-hidden','true');
  document.body.appendChild(pinBox);

  var pins = [];
  /* Schritte erscheinen nacheinander beim Scrollen: Karte, Pin, Verbindung und gestrichelter Abschnitt */
  var shown = [], ready = [], nextStep = 0, busy = false;
  var pinEls = [], linkEls = [], segEls = [], stepList = [];
  function showStep(n){
    shown[n] = true;
    if(stepList[n]) stepList[n].classList.add('step-in');
    if(pinEls[n]) pinEls[n].classList.add('in');
    if(linkEls[n]) linkEls[n].classList.add('in');
    if(segEls[n-1]) segEls[n-1].classList.add('in');
  }
  function pump(){
    if(busy) return;
    if(nextStep < stepList.length && ready[nextStep]){
      busy = true; showStep(nextStep); nextStep++;
      setTimeout(function(){ busy = false; pump(); }, reduce ? 0 : 420);
    }
  }

  function absTop(el){ var y = 0; while(el){ y += el.offsetTop; el = el.offsetParent; } return y; }
  function sm(x){ x = Math.max(0, Math.min(1, x)); return x*x*(3-2*x); }

  /* Hermite-Spline: Tangenten (Einheitsvektoren) × Segmentlänge -> runde Kurven ohne Ecken */
  function curve(pts){
    var out = [], STEPS = 44, i, s;
    for(i=0;i<pts.length;i++){
      if(!pts[i].t){
        var a = pts[Math.max(0,i-1)], b = pts[Math.min(pts.length-1,i+1)];
        var dx=b.x-a.x, dy=b.y-a.y, l=Math.hypot(dx,dy)||1; pts[i].t = {x:dx/l, y:dy/l};
      }
    }
    for(i=0;i<pts.length-1;i++){
      var p1=pts[i], p2=pts[i+1], seg=Math.hypot(p2.x-p1.x,p2.y-p1.y);
      var m1 = p1.mo || seg, m2 = p2.mi || seg;
      for(s=0;s<STEPS;s++){
        var t=s/STEPS, t2=t*t, t3=t2*t;
        var h00=2*t3-3*t2+1, h10=t3-2*t2+t, h01=-2*t3+3*t2, h11=t3-t2;
        out.push({
          x:h00*p1.x+h10*m1*p1.t.x+h01*p2.x+h11*m2*p2.t.x,
          y:h00*p1.y+h10*m1*p1.t.y+h11*m2*p2.t.y+h01*p2.y});
      }
    }
    var last = pts[pts.length-1]; out.push({x:last.x, y:last.y});
    return out;
  }

  /* Bandform aus Mittellinie + Breite je Punkt */
  function polygon(line, ws){
    var L=[], R=[], i;
    for(i=0;i<line.length;i++){
      var a0 = line[Math.max(0,i-1)], b0 = line[Math.min(line.length-1,i+1)];
      var dx=b0.x-a0.x, dy=b0.y-a0.y, len=Math.hypot(dx,dy)||1, nx=-dy/len, ny=dx/len, h=ws[i]/2;
      L.push((line[i].x+nx*h).toFixed(1)+' '+(line[i].y+ny*h).toFixed(1));
      R.push((line[i].x-nx*h).toFixed(1)+' '+(line[i].y-ny*h).toFixed(1));
    }
    return 'M'+L.join(' L')+' L'+R.reverse().join(' L')+' Z';
  }
  function cumLen(line){
    var c=[0], i; for(i=1;i<line.length;i++) c.push(c[i-1] + Math.hypot(line[i].x-line[i-1].x, line[i].y-line[i-1].y));
    return c;
  }
  /* Breite wechselt fließend zwischen dünn und dick */
  function swell(cum, base, sc, phase, lo, hi){
    return cum.map(function(d){
      var a = Math.pow(Math.sin(Math.PI*d/(1050*sc) + phase), 2);
      var b = Math.pow(Math.sin(Math.PI*d/(1700*sc) + phase*1.7 + .6), 2);
      return base*(lo + (hi-lo)*(.65*a + .35*b));
    });
  }

  function build(){
    var W = document.documentElement.clientWidth;
    var sc = Math.max(.45, Math.min(1, W/1440));
    var heroTop = absTop(hero), heroH = hero.offsetHeight, top0 = heroTop + heroH;
    var kontakt = document.getElementById('kontakt');
    var endY = absTop(kontakt) + kontakt.offsetHeight;
    var pageH = endY - top0 + 20;
    var narrow = W <= 860;

    heroPart.box.style.top = heroTop + 'px'; heroPart.box.style.height = heroH + 'px';
    heroPart.svg.setAttribute('viewBox','0 '+heroTop+' '+W+' '+heroH); heroPart.svg.setAttribute('width',W); heroPart.svg.setAttribute('height',heroH);
    pagePart.box.style.top = (top0-1) + 'px'; pagePart.box.style.height = (pageH+1) + 'px';
    pagePart.svg.setAttribute('viewBox','0 '+(top0-1)+' '+W+' '+(pageH+1)); pagePart.svg.setAttribute('width',W); pagePart.svg.setAttribute('height',pageH+1);

    var bw = W <= 760 ? .48*W : Math.min(.36*W, 520); bw = Math.max(200, bw);
    var k = bw/300, base = 36*k;                          /* Breite des Hero-Bandes */
    var hz = {x:-1, y:0};

    /* 1) Hero-Band unten rechts (Welle über 1,5 Perioden) und sein Weiterlauf von rechts nach links */
    function hp(t){
      var off = 30*Math.sin(t*2*Math.PI*1.5);
      var X = -70 + 310*t + .7071*off, Y = 240 - 310*t + .7071*off;
      return {x:(W-bw)+(300-X)*k, y:top0 - Y*k};
    }
    var lo=.4, hi=1, mm, nn;
    for(nn=0;nn<30;nn++){ mm=(lo+hi)/2; if(hp(mm).y < top0) lo=mm; else hi=mm; }
    var tc = (lo+hi)/2, p0 = [], tt;
    for(tt=.10; tt<tc-.03; tt+=.04){ var q = hp(tt); p0.push({x:q.x, y:q.y}); }
    p0.push({x:hp(tc).x, y:top0});
    /* 1:1 Weiterlauf: dieselbe Linie und Welle, einfach über den Hero-Rand hinaus bis zum linken Bildschirmrand */
    for(tt=tc+.04; tt<4; tt+=.04){
      var qn = hp(tt); p0.push({x:qn.x, y:qn.y});
      if(qn.x < -.12*W) break;
    }
    var line0 = curve(p0), cum0 = cumLen(line0), sCross = 0, i;
    for(i=0;i<line0.length;i++){ if(line0[i].y >= top0){ sCross = cum0[i]; break; } }
    var sw0 = swell(cum0, base, sc, .4, .85, 1.45);
    var w0 = line0.map(function(_,i){ var r = sm((cum0[i]-sCross)/(500*sc)); return base + (sw0[i]-base)*r; });

    /* 2) Zusammenarbeit: ein Band von rechts oben nach links unten quer durch die Schritte */
    var grid = document.querySelector('#vorgehen .process-grid');
    var stepEls = grid ? [].slice.call(grid.querySelectorAll('.pstep')) : [];
    var line1 = null, halfs1 = [], dsub = '';
    if(grid && stepEls.length){
      var lastEl = stepEls[stepEls.length-1];
      var y0 = absTop(grid) - 20*sc, y1 = absTop(lastEl) + lastEl.offsetHeight + 90*sc, D = y1 - y0;
      var xs = [1.07,.84,.66,.47,.30,.13,-.08], ys = [0,.14,.37,.52,.74,.90,1.0], dys = [0,.05,-.04,.05,-.04,.03,0];
      var p1 = xs.map(function(x,n){ return {x:W*x, y:y0 + D*(ys[n]+dys[n])}; });
      p1[0].t = {x:-.9, y:.44}; p1[p1.length-1].t = {x:-.95, y:.3};
      line1 = curve(p1);
      var cum1 = cumLen(line1), ws1 = swell(cum1, base, sc, 1.3, .8, 1.5);
      halfs1 = ws1.map(function(v){ return v/2; });
      dsub += polygon(line1, ws1);
    }

    /* 3) Band über dem Kontaktbereich, wieder von rechts nach links */
    var ctaBox = kontakt.querySelector('.cta-inner');
    var yk = (ctaBox ? absTop(ctaBox) : absTop(kontakt) + 112*sc) + 6*sc;   /* Band läuft hinter dem oberen Rand des Kastens */
    var p2 = [[1.07,0],[.80,38],[.52,-24],[.26,34],[-.08,-4]].map(function(a){ return {x:W*a[0], y:yk + a[1]*sc}; });
    p2[0].t = {x:-1, y:.15}; p2[p2.length-1].t = {x:-1, y:-.1};
    var line2 = curve(p2), cum2 = cumLen(line2), ws2 = swell(cum2, base, sc, 2.4, .7, 1.35);

    var d = polygon(line0, w0) + (dsub ? ' ' + dsub : '') + ' ' + polygon(line2, ws2);
    heroPart.path.setAttribute('d', d); pagePart.path.setAttribute('d', d);

    /* Leistungen: Texte stehen neben dem Band, nicht darauf (Karte 1: Text rechts vom Bild, Karte 2: Text links vom Bild) */
    (function(){
      var grid0 = document.querySelector('#leistungen .services-grid');
      var cards = grid0 ? [].slice.call(grid0.querySelectorAll('.service-card')) : [];
      if(cards.length !== 2) return;
      if(narrow){
        cards.forEach(function(c){ c.style.gridTemplateColumns = ''; c.style.columnGap = ''; c.style.removeProperty('--padl'); });
        return;
      }
      var gr0 = grid0.getBoundingClientRect(), gl0 = gr0.left, gw0 = gr0.width, M = 36;
      function bandSpan(y0, y1){
        var lo = 1e9, hi = -1e9, q;
        for(q=0;q<line0.length;q++){
          if(line0[q].y >= y0 && line0[q].y <= y1){ lo = Math.min(lo, line0[q].x - w0[q]/2); hi = Math.max(hi, line0[q].x + w0[q]/2); }
        }
        return {lo:lo, hi:hi};
      }
      /* Karte 1 */
      var c1 = cards[0], img1 = 500, t1 = absTop(c1), h1 = c1.offsetHeight;
      var s1 = bandSpan(t1, t1 + h1), left1 = Math.max(gl0 + img1 + 44, (s1.hi > -1e8 ? s1.hi : 0) + M);
      c1.style.gridTemplateColumns = img1 + 'px 1fr';
      c1.style.columnGap = Math.max(44, left1 - (gl0 + img1)) + 'px';
      /* Karte 2 */
      var c2 = cards[1], img2 = 500, t2 = absTop(c2), h2 = c2.offsetHeight;
      var s2 = bandSpan(t2 + 50, t2 + h2 - 40), hi2 = s2.hi > -1e8 ? s2.hi : 0;
      var textLeft2 = Math.max(gl0, hi2 + M);
      img2 = Math.max(300, Math.min(500, (gl0 + gw0 - 44) - (textLeft2 + 260)));
      c2.style.gridTemplateColumns = '1fr ' + img2 + 'px';
      c2.style.columnGap = '44px';
      c2.style.setProperty('--padl', Math.max(0, textLeft2 - gl0) + 'px');
    })();

    /* Schritte neben dem Band, nummerierte Pins auf dem Band + Verbindung zur Karte */
    var stepMarks = [];
    if(line1 && !narrow){
      var gr = grid.getBoundingClientRect(), gl = gr.left, gw = gr.width, GAP = 26, prevRight = false;
      var atY = function(y){ var best = 0, bd = 1e9, q; for(q=0;q<line1.length;q++){ var dd = Math.abs(line1[q].y - y); if(dd < bd){ bd = dd; best = q; } } return {x:line1[best].x, y:line1[best].y, i:best}; };
      var span = function(y0_, y1_){ var l = 1e9, h = -1e9, q; for(q=0;q<line1.length;q++){ if(line1[q].y >= y0_ && line1[q].y <= y1_){ l = Math.min(l, line1[q].x - halfs1[q]); h = Math.max(h, line1[q].x + halfs1[q]); } } return {lo:l, hi:h}; };
      stepEls.forEach(function(st,n){
        var top = absTop(st), hgt = st.offsetHeight, yc = top + hgt/2, w = st.offsetWidth;
        var sp = span(top - 20, top + hgt + 20), c = atY(yc);
        var fitsRight = sp.hi + GAP + w <= gl + gw, fitsLeft = sp.lo - GAP - w >= gl;
        var wantRight = (n === 0) ? false : !prevRight;
        var right = wantRight ? (fitsRight || !fitsLeft) : !(fitsLeft || !fitsRight);
        var left = right ? Math.min(sp.hi + GAP, gl + gw - w) : Math.max(sp.lo - GAP - w, gl);
        prevRight = right;
        st.style.marginLeft = Math.max(0, left - gl) + 'px';
        stepMarks.push({x:c.x, y:c.y, i:c.i, right:right, edge: right ? left : left + w});
      });
    } else {
      stepEls.forEach(function(st){ st.style.marginLeft = ''; });
    }
    /* gestrichelte pinke Linie von Pin zu Pin (je Abschnitt, damit sie mit den Schritten erscheint) */
    segEls.forEach(function(s){ s.remove(); }); segEls = [];
    for(var sgi = 0; sgi < stepMarks.length - 1; sgi++){
      var seg = line1.slice(stepMarks[sgi].i, stepMarks[sgi+1].i + 1);
      var sp_ = document.createElementNS(NS,'path');
      sp_.setAttribute('class', 'ribbon-dash' + (shown[sgi+1] || reduce ? ' in' : ''));
      sp_.setAttribute('d', 'M' + seg.map(function(p){ return p.x.toFixed(1)+' '+p.y.toFixed(1); }).join(' L'));
      pagePart.svg.appendChild(sp_); segEls.push(sp_);
    }

    /* Pins + Verbindung zur Karte */
    pins.forEach(function(p){ p.remove(); }); pins = []; pinEls = []; linkEls = [];
    stepMarks.forEach(function(m,n){
      var on = (shown[n] || reduce) ? ' in' : '';
      var ln = document.createElement('span');
      var x0 = m.right ? m.x : m.edge, x1 = m.right ? m.edge : m.x;
      ln.className = 'ribbon-link' + on;
      ln.style.left = x0 + 'px'; ln.style.top = m.y + 'px'; ln.style.width = Math.max(0, x1 - x0) + 'px';
      pinBox.appendChild(ln); pins.push(ln); linkEls[n] = ln;
      var pin = document.createElement('span');
      pin.className = 'ribbon-pin ribbon-pin--n' + on;
      pin.style.left = m.x + 'px'; pin.style.top = m.y + 'px';
      pin.style.setProperty('--s', (1.0 + .28*sc).toFixed(2));
      pin.innerHTML = '<svg viewBox="0 0 28 38"><path d="M14 37C14 37 2 23 2 13.5a12 12 0 1 1 24 0C26 23 14 37 14 37z" fill="#FC75B4"/>' +
        '<circle cx="14" cy="13.5" r="8" fill="#fff"/><text x="14" y="17.6" text-anchor="middle" font-size="11.5" font-weight="700" fill="#474329" font-family="Space Grotesk, system-ui, sans-serif">'+(n+1)+'</text></svg>';
      pinBox.appendChild(pin); pins.push(pin); pinEls[n] = pin;
    });
    /* Seite der Karte merken (für die Einflug-Richtung) */
    stepEls.forEach(function(st, n){
      if(stepMarks[n]) st.setAttribute('data-side', stepMarks[n].right ? 'r' : 'l'); else st.removeAttribute('data-side');
    });
  }

  /* Reihenfolge-Steuerung: Schritt n erscheint, sobald er (oder ein späterer) ins Bild kommt – immer nacheinander */
  (function(){
    var grid = document.querySelector('#vorgehen .process-grid');
    if(!grid) return;
    stepList = [].slice.call(grid.querySelectorAll('.pstep'));
    document.documentElement.classList.add('steps-anim');
    if(reduce || !('IntersectionObserver' in window)){ stepList.forEach(function(_,n){ ready[n] = true; }); return; }
    var so = new IntersectionObserver(function(es){
      es.forEach(function(e){
        var n = stepList.indexOf(e.target);
        if(n < 0) return;
        if(e.isIntersecting || e.boundingClientRect.top < 0){ ready[n] = true; so.unobserve(e.target); pump(); }
      });
    }, {threshold:.3, rootMargin:'0px 0px -10% 0px'});
    stepList.forEach(function(st){ so.observe(st); });
  })();

  var t;
  function later(){ clearTimeout(t); t = setTimeout(build, 120); }
  build();
  if(reduce) pump();
  window.addEventListener('resize', later);
  window.addEventListener('load', build);
  if('ResizeObserver' in window) new ResizeObserver(later).observe(document.body);
})();
