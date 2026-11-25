/* Hero-Überschrift wird beim Öffnen getippt; danach zeichnet sich der Unterstrich unter „Kunden". */
(function(){
  var h1 = document.querySelector('.hero h1');
  if(!h1) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g,' ').trim());
  var spans = [];
  (function wrap(node){
    [].slice.call(node.childNodes).forEach(function(n){
      if(n.nodeType === 3){
        var f = document.createDocumentFragment();
        n.textContent.split('').forEach(function(ch){
          var s = document.createElement('span');
          s.className = 'tw'; s.setAttribute('aria-hidden','true'); s.textContent = ch;
          f.appendChild(s); spans.push(s);
        });
        n.parentNode.replaceChild(f, n);
      } else if(n.nodeType === 1 && n.tagName !== 'BR'){
        wrap(n);
      }
    });
  })(h1);
  if(!spans.length) return;

  h1.classList.add('typing');
  var i = 0;
  function step(){
    if(i > 0) spans[i-1].classList.remove('caret');
    if(i < spans.length){
      var s = spans[i]; s.classList.add('on','caret'); i++;
      var ch = s.textContent;
      setTimeout(step, (ch === '.' ? 320 : ch === ' ' ? 45 : 62 + Math.random()*38));
    } else {
      setTimeout(function(){
        h1.classList.remove('typing');           /* alles sichtbar */
        h1.classList.add('typed');               /* Unterstrich wird jetzt gezeichnet */
      }, 260);
    }
  }
  setTimeout(step, 450);
})();
