/* Scroll-scrubbed hero video controller.
   Wires every ".page-hero--video" section's ".hero-video" element so
   playback position follows scroll progress only: no autoplay, no loop,
   no time-based motion. Scrolling down plays the clip forward, scrolling
   up plays it backward, and it holds its exact frame when scrolling stops.
   The section pins in place for the scroll distance so the video reads as
   a controlled sequence, not a background loop. */
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sections = document.querySelectorAll('.page-hero--video');
  if(!sections.length) return;

  sections.forEach(function(section){
    var video = section.querySelector('.hero-video');
    if(!video) return;

    function whenReady(cb){
      if(video.readyState >= 1 && !isNaN(video.duration) && video.duration > 0){ cb(); }
      else { video.addEventListener('loadedmetadata', cb, { once: true }); }
    }

    if(reduce){
      // Calm, static representative frame. No pin, no scrubbing, no motion.
      whenReady(function(){ video.currentTime = video.duration * 0.4; });
      return;
    }

    if(typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    whenReady(function(){
      video.pause();

      var isMobile = window.matchMedia('(max-width: 640px)').matches;
      var isTablet = !isMobile && window.matchMedia('(max-width: 1024px)').matches;
      var vh = window.innerHeight;
      var distance = isMobile ? vh * 1.3 : isTablet ? vh * 1.8 : vh * 2.2;

      // currentTime is tied directly to scroll progress (targetTime =
      // progress * duration). `scrub: 0.5` adds a short catch-up lag so
      // the seek eases toward the target instead of snapping on every
      // scroll tick -- this is what keeps fast/slow wheel and trackpad
      // scrolling equally smooth, since raw video seeks are never instant.
      gsap.to(video, {
        currentTime: video.duration,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: function(){ return '+=' + distance; },
          pin: true,
          scrub: 0.5
        }
      });

      // Web fonts / late images can shift layout after these measurements
      // were taken; re-measure once things settle.
      window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
      if(document.fonts && document.fonts.ready){
        document.fonts.ready.then(function(){ ScrollTrigger.refresh(); });
      }
    });
  });
})();
