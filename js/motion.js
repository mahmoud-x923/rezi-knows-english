// Pauses looping animations while the app is in the background, to save battery.

function updateVisibility() {
  document.documentElement.classList.toggle('is-hidden', document.hidden);
}

document.addEventListener('visibilitychange', updateVisibility);
updateVisibility();

// Plays a one-off animation class again, even if it ran before.
export function replay(node, className) {
  node.classList.remove(className);
  // Reading layout restarts the animation when the class is added back.
  void node.offsetWidth;
  node.classList.add(className);
  node.addEventListener('animationend', () => node.classList.remove(className), { once: true });
}
