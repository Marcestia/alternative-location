type DetailsTransition = {
  animation: Animation;
  expanded: boolean;
  height: string;
  overflow: string;
};

/** Enhance native details while preserving keyboard input and a no-JS fallback. */
export function attachDetailsMotion(root: HTMLElement) {
  const transitions = new Map<HTMLDetailsElement, DetailsTransition>();

  const handleClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      !(event.target instanceof Element)
    )
      return;
    const summary = event.target.closest("summary");
    const details = summary?.parentElement;
    if (
      !(details instanceof HTMLDetailsElement) ||
      !details.hasAttribute("data-animated-details") ||
      !root.contains(details)
    )
      return;
    if (
      event.target.closest("a,button,input,select,textarea") ||
      typeof details.animate !== "function"
    )
      return;

    event.preventDefault();
    const pending = transitions.get(details);
    const expanded = !(pending?.expanded ?? details.open);
    const start = details.getBoundingClientRect().height;
    const height = pending?.height ?? details.style.height;
    const overflow = pending?.overflow ?? details.style.overflow;
    pending?.animation.cancel();

    details.style.height = "auto";
    details.open = expanded;
    const end = details.getBoundingClientRect().height;
    details.open = true;
    details.style.height = `${start}px`;
    details.style.overflow = "hidden";
    details.dataset.detailsMotion = expanded ? "opening" : "closing";

    const animation = details.animate(
      [{ height: `${start}px` }, { height: `${end}px` }],
      { duration: 360, easing: "cubic-bezier(.2,.75,.25,1)", fill: "both" },
    );
    const transition = { animation, expanded, height, overflow };
    transitions.set(details, transition);
    animation.onfinish = () => {
      if (transitions.get(details) !== transition) return;
      details.open = expanded;
      details.style.height = height;
      details.style.overflow = overflow;
      delete details.dataset.detailsMotion;
      transitions.delete(details);
      animation.cancel();
    };
  };

  root.addEventListener("click", handleClick);
  return () => {
    root.removeEventListener("click", handleClick);
    for (const [details, transition] of transitions) {
      transition.animation.cancel();
      details.open = transition.expanded;
      details.style.height = transition.height;
      details.style.overflow = transition.overflow;
      delete details.dataset.detailsMotion;
    }
    transitions.clear();
  };
}
