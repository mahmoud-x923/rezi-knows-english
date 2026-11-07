// Names and nicknames for greetings and Curly's lines.

export function pickNickname(names, random = Math.random) {
  return names.nicknames[Math.floor(random() * names.nicknames.length)];
}

// The values text can use. Each call picks a nickname at random.
export function getNameValues(names, random = Math.random) {
  return { name: names.name, fullName: names.fullName, nickname: pickNickname(names, random) };
}

// Returns the text with placeholders filled, or null if a value is missing.
export function fillPlaceholders(text, values) {
  let isComplete = true;
  const filled = text.replace(/\{\{(\w+)\}\}/g, (placeholder, name) => {
    if (values[name]) return values[name];
    isComplete = false;
    return placeholder;
  });
  return isComplete ? filled : null;
}
