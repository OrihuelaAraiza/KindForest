// Page motion with GSAP, ScrollTrigger and SplitText (loaded as deferred
// scripts). Every effect is skipped when the visitor prefers reduced motion
// or turns on "Reducir movimiento"; without GSAP the page stays static.
const root = document.documentElement;

export function createMotion() {
  const { gsap, ScrollTrigger, SplitText } = window;
  const available = Boolean(gsap && ScrollTrigger && SplitText);
  let context = null,
    split = null,
    refreshTimer;
  const allowed = () =>
    available &&
    !root.classList.contains("calm") &&
    matchMedia("(prefers-reduced-motion: no-preference)").matches;

  if (available) gsap.registerPlugin(ScrollTrigger, SplitText);

  function splitHeading(animate) {
    split?.revert();
    split = null;
    if (!allowed()) return;
    split = SplitText.create("#heading", {
      type: "lines,chars",
      mask: "lines",
      aria: "auto",
    });
    if (animate)
      gsap.from(split.chars, {
        yPercent: 115,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.022,
      });
  }

  function start() {
    if (!allowed()) return;
    context = gsap.context(() => {
      // The tissue comes into focus like a microscope.
      gsap.fromTo(
        ".hero-canvas",
        { filter: "blur(16px) saturate(0.4)", scale: 1.08 },
        { filter: "blur(0px) saturate(1)", scale: 1, duration: 1.9, ease: "expo.out", clearProps: "filter,scale" },
      );
      gsap.from(".hero .eyebrow, #intro-text, .hero-search, .suggest, .hero-top, .hero-foot", {
        y: 24,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.35,
      });
      // Plates: the numeral wipes in and the title rises.
      for (const head of document.querySelectorAll(".plate-head")) {
        const timeline = gsap.timeline({
          scrollTrigger: { trigger: head, start: "top 85%", once: true },
        });
        timeline
          .from(head.querySelector(".plate-no"), {
            clipPath: "inset(0 100% 0 0)",
            duration: 1.1,
            ease: "expo.out",
          })
          .from(
            head.querySelectorAll(".eyebrow, h2, .section-lede, .search"),
            { y: 26, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.07 },
            0.1,
          );
      }
      // Gallery images drift inside their frames.
      for (const img of document.querySelectorAll(".figure-media img")) {
        gsap.fromTo(
          img,
          { yPercent: -7 },
          {
            yPercent: 7,
            ease: "none",
            scrollTrigger: { trigger: img.closest(".figure"), start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      }
      gsap.from(".principle", {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: ".principle-grid", start: "top 88%", once: true },
      });
      gsap.from(".prep-fern", {
        yPercent: 18,
        rotate: -8,
        opacity: 0,
        duration: 1.4,
        ease: "expo.out",
        scrollTrigger: { trigger: ".prep", start: "top 85%", once: true },
      });
      gsap.from(".foot-word", {
        yPercent: 40,
        opacity: 0,
        duration: 1.4,
        ease: "expo.out",
        scrollTrigger: { trigger: ".site-footer", start: "top 92%", once: true },
      });
      // The sources band leans with scroll speed.
      const track = document.getElementById("marquee");
      const lean = gsap.quickTo(track, "skewX", { duration: 0.5, ease: "power3.out" });
      ScrollTrigger.create({
        onUpdate: (self) => lean(gsap.utils.clamp(-10, 10, self.getVelocity() / -260)),
      });
    });
    splitHeading(true);
  }
  // Layout changes when tabs or filters render; keep trigger positions true.
  if (available)
    new ResizeObserver(() => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        if (context) ScrollTrigger.refresh();
      }, 200);
    }).observe(document.body);

  function stop() {
    split?.revert();
    split = null;
    context?.revert();
    context = null;
  }

  return {
    start,
    // Replace the headline text, then split it again.
    retitle(update) {
      split?.revert();
      split = null;
      update();
      if (context) splitHeading(true);
    },
    setCalm(calm) {
      if (calm) stop();
      else if (!context) start();
    },
    get active() {
      return Boolean(context);
    },
  };
}
