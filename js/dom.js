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
