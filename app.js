/* Shared behaviour for the service subpages:
   scroll-reveal, magnetic buttons, and per-service contact form. */
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll reveal */
  var els = document.querySelectorAll('.reveal');
  if(reduce || !('IntersectionObserver' in window)){
    els.forEach(function(el){ el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold:0.12, rootMargin:'0px 0px -8% 0px' });
    els.forEach(function(el){ io.observe(el); });
  }

  /* Magnetic buttons */
  if(!reduce && window.matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('[data-magnetic]').forEach(function(btn){
      var raf;
      btn.addEventListener('mousemove', function(e){
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width/2) * 0.25;
        var y = (e.clientY - r.top - r.height/2) * 0.35;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function(){ btn.style.transform = 'translate('+x+'px,'+y+'px)'; });
      });
      btn.addEventListener('mouseleave', function(){ cancelAnimationFrame(raf); btn.style.transform=''; });
    });
  }

  /* Per-service contact form: real submission via Web3Forms.
     The access key below is a public form identifier, not a secret --
     Web3Forms is designed for static sites with no backend, so every
     request is scoped to this key and can only ever reach the inbox it
     was registered with. Get your own key at https://web3forms.com and
     replace the placeholder before going live. See WEB3FORMS_SETUP.md. */
  var WEB3FORMS_ACCESS_KEY = '7c3b79e9-b39c-46d9-84ff-4b305c04eb29';
  var WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function revealFormSuccess(form){
    var ok = form.querySelector('.form-ok');
    form.querySelectorAll('.field, .btn, .form-note, .form-error').forEach(function(el){ el.style.display = 'none'; });
    if(ok) ok.style.display = 'block';
  }

  document.querySelectorAll('form[data-lead-form]').forEach(function(form){
    var submitBtn = form.querySelector('button[type="submit"]');
    var errorBox = form.querySelector('.form-error');

    function showError(msg){
      if(errorBox){ errorBox.textContent = msg; errorBox.style.display = 'block'; }
    }
    function clearError(){
      if(errorBox){ errorBox.style.display = 'none'; }
    }
    function setLoading(isLoading){
      if(!submitBtn) return;
      submitBtn.disabled = isLoading;
      if(isLoading){
        submitBtn.dataset.originalLabel = submitBtn.innerHTML;
        submitBtn.style.opacity = '.7';
        submitBtn.innerHTML = 'Wird gesendet …';
      } else if(submitBtn.dataset.originalLabel){
        submitBtn.style.opacity = '';
        submitBtn.innerHTML = submitBtn.dataset.originalLabel;
      }
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      clearError();

      var name = form.querySelector('[name="name"]');
      var email = form.querySelector('[name="email"]');

      if(!name.value.trim()){ name.focus(); showError('Bitte gib deinen Namen an.'); return; }
      if(!email.value.trim() || !EMAIL_PATTERN.test(email.value.trim())){
        email.focus();
        showError('Bitte gib eine gültige E-Mail-Adresse an.');
        return;
      }

      // Honeypot: real visitors never see or fill this field; bots often do.
      var honeypot = form.querySelector('input[name="botcheck"]');
      if(honeypot && honeypot.checked){
        revealFormSuccess(form); // pretend success, send nothing
        return;
      }

      var data = new FormData(form);
      data.append('access_key', WEB3FORMS_ACCESS_KEY);
      data.append('submission_time', new Date().toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }));
      var leistung = data.get('leistung');
      data.append('subject', leistung ? ('Neue Anfrage: ' + leistung) : 'Neue Kontaktanfrage über wn-webting.de');

      setLoading(true);
      fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data
      })
        .then(function(res){ return res.json().then(function(json){ return { ok: res.ok, json: json }; }); })
        .then(function(result){
          setLoading(false);
          if(result.ok && result.json && result.json.success){
            revealFormSuccess(form);
          } else {
            showError('Senden hat nicht geklappt. Bitte versuch es noch einmal oder schreib uns direkt an wn-kontakt@wn-webting.com.');
          }
        })
        .catch(function(){
          setLoading(false);
          showError('Keine Verbindung möglich. Bitte versuch es noch einmal oder schreib uns direkt an wn-kontakt@wn-webting.com.');
        });
    });
  });
})();
