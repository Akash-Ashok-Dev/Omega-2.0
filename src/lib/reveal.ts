const REVEAL_THRESHOLD = 0.15;

let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer?.unobserve(entry.target);
      }
    },
    { threshold: REVEAL_THRESHOLD },
  );

  return observer;
}

export function reveal(element: Element): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced) {
    element.classList.add("is-visible");
    return () => {};
  }

  const instance = getObserver();
  instance.observe(element);

  return () => {
    instance.unobserve(element);
  };
}