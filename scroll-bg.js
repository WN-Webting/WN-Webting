/* Scroll-Hintergrund: baut die Linien-Grafik (SVG) abhängig vom Scroll-Fortschritt auf.
   Elemente mit data-seq erscheinen nacheinander; Pfade mit data-draw werden "gezeichnet".
   Ohne JS (oder mit "Bewegung reduzieren") ist die Grafik vollständig sichtbar. */
(function(){
  var wrap = document.querySelector('.scroll-bg');
  if(!wrap) return;
  var items = Array.prototype.slice.call(wrap.querySelectorAll('[data-seq]'));
  if(!items.length) return;

  var maxSeq = 0;
  items.forEach(function(el){
    var s = parseFloat(el.getAttribute('data-seq'));
    if(s > maxSeq) maxSeq = s;
    if(el.hasAttribute('data-draw')){
      el.setAttribute('pathLength', '1');
      el.style.strokeDasharray = '1';
    }
  });
  var LEN = 0.25;                       // Anteil des Scrolls, den ein Element zum Aufbauen braucht
  var STEP = (1 - LEN - 0.05) / (maxSeq || 1);

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticking = false;

  function clamp(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }

  function render(){
    ticking = false;
    // Seiten mit gepinntem Video-Hero: Aufbau startet erst, wenn der Hero vorbei ist,
    // sonst läuft die Animation unsichtbar hinter dem Video ab.
    var startY = 0;
    var hero = document.querySelector('.page-hero--video');
    if(hero){
      var holder = (hero.parentElement && /pin-spacer/.test(hero.parentElement.className)) ? hero.parentElement : hero;
      startY = Math.max(0, holder.getBoundingClientRect().bottom + window.scrollY - window.innerHeight);
    }
    var max = document.documentElement.scrollHeight - window.innerHeight - startY;
    var p = reduce ? 1 : (max > 0 ? clamp((window.scrollY - startY) / max) : 1);
    var q = reduce ? 1.2 : p + 0.12;    // oben sind die ersten Elemente schon halb sichtbar
    wrap.style.setProperty('--p', p.toFixed(4));
    items.forEach(function(el){
      var seq = parseFloat(el.getAttribute('data-seq'));
      var e = clamp((q - seq * STEP) / LEN);
      if(el.hasAttribute('data-draw')){
        el.style.strokeDashoffset = (1 - e).toFixed(4);
      } else {
        el.style.opacity = e.toFixed(3);
        el.style.transform = 'translateY(' + ((1 - e) * 18).toFixed(1) + 'px)';
      }
    });
  }
  function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(render); } }

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll);
  render();
})();
