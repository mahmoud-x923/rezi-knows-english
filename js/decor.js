// Small decorative drawings that take their colors from the theme.

const SHAPES = {
  heart: '<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.5 3 5 6.4 5c2 0 3.5 1.1 4.3 2.6h2.6C14.1 6.1 15.6 5 17.6 5 21 5 23.1 8.5 21.6 11.8 19.5 16.4 12 21 12 21z"/>',
  sparkle: '<path d="M12 1.5c.7 4.9 2.6 8 7.5 9-4.9 1-6.8 4.1-7.5 9-.7-4.9-2.6-8-7.5-9 4.9-1 6.8-4.1 7.5-9z"/>',
  star: '<path d="M12 2.5l2.8 6 6.4.6-4.8 4.3 1.4 6.4L12 16.5l-5.8 3.3 1.4-6.4-4.8-4.3 6.4-.6z" stroke-linejoin="round" stroke-width="1.5"/>',
  moon: '<path d="M15.5 2.5A9.5 9.5 0 1 0 21.5 17 7.5 7.5 0 0 1 15.5 2.5z"/>',
  cloud: '<path d="M7 19a5 5 0 0 1-.6-10A6.5 6.5 0 0 1 19 9.5a4.75 4.75 0 0 1-.5 9.5z"/>',
};

export function decor(shape, className = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', `decor decor-${shape} ${className}`.trim());
  svg.innerHTML = SHAPES[shape];
  return svg;
}

// Sparkles that fly out from a correct answer, then fade.
export function createBurst() {
  const burst = document.createElement('span');
  burst.className = 'burst';
  burst.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 6; i++) {
    const sparkle = decor('sparkle');
    sparkle.style.setProperty('--angle', `${i * 60}deg`);
    burst.append(sparkle);
  }
  return burst;
}

// Hearts and sparkles that float up behind the graduation page.
export function createFloaters() {
  const floaters = document.createElement('div');
  floaters.className = 'floaters';
  floaters.setAttribute('aria-hidden', 'true');
  const shapes = ['heart', 'sparkle', 'heart', 'star', 'heart', 'sparkle', 'heart', 'sparkle'];
  shapes.forEach((shape, i) => {
    const drawing = decor(shape);
    drawing.style.setProperty('--x', `${6 + i * 12}%`);
    drawing.style.setProperty('--delay', `${(i * 0.7) % 4}s`);
    drawing.style.setProperty('--duration', `${5 + (i % 3)}s`);
    floaters.append(drawing);
  });
  return floaters;
}

// A short row of drawings, such as a moon and stars.
export function decorRow(...shapes) {
  const row = document.createElement('div');
  row.className = 'decor-row';
  row.setAttribute('aria-hidden', 'true');
  row.append(...shapes.map((shape) => decor(shape)));
  return row;
}
