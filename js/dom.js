// Small helpers for building page elements.

export function element(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function link(href, text) {
  const node = element('a', text);
  node.href = href;
  return node;
}

// A link that looks like a button. Pass true for the main action on a screen.
export function buttonLink(href, text, isPrimary = false) {
  const node = link(href, text);
  node.className = isPrimary ? 'button button-primary' : 'button';
  return node;
}

// A column of actions, such as buttons and links at the end of a screen.
export function actions(...children) {
  const node = element('div');
  node.className = 'actions';
  node.append(...children);
  return node;
}

function rtl(lang, tag, text) {
  const node = element(tag, text);
  node.lang = lang;
  node.dir = 'rtl';
  return node;
}

export function persian(tag, text) {
  return rtl('fa', tag, text);
}

export function arabic(tag, text) {
  return rtl('ar', tag, text);
}
