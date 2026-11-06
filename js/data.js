// Loads JSON content from /data.

const cache = new Map();

// Keeps each file after its first load. A failed load can be tried again.
function loadJson(path) {
  if (!cache.has(path)) {
    const request = fetch(path).then((response) => {
      if (!response.ok) throw new Error(`Could not load ${path}: ${response.status}`);
      return response.json();
    });
    request.catch(() => cache.delete(path));
    cache.set(path, request);
  }
  return cache.get(path);
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

// One day's verbs and abbreviations, in curriculum order.
export async function loadLesson(day) {
  const [curriculum, verbs, abbreviations] = await Promise.all([
    loadCurriculum(),
    loadVerbs(),
    loadAbbreviations(),
  ]);
  const entry = curriculum.find((item) => item.day === day);
  return {
    verbs: entry.verbs.map((id) => verbs.find((verb) => verb.id === id)),
    abbreviations: entry.abbreviations.map((id) => abbreviations.find((item) => item.id === id)),
  };
}
