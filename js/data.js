// Loads JSON content from /data.

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}: ${response.status}`);
  return response.json();
}

export function loadGreetings() {
  return loadJson('data/greetings.json');
}

export function loadVerbs() {
  return loadJson('data/verbs.json');
}

export function loadAbbreviations() {
  return loadJson('data/abbreviations.json');
}

export function loadCurriculum() {
  return loadJson('data/curriculum.json');
}
