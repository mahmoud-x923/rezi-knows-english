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

export function loadNames() {
  return loadJson('data/names.json');
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

// Splits a list into items taught up to the given day and items still to come.
function splitByDay(items, curriculum, key, day) {
  const learnedIds = curriculum.filter((entry) => entry.day <= day).flatMap((entry) => entry[key]);
  return {
    learned: items.filter((item) => learnedIds.includes(item.id)),
    upcoming: items.filter((item) => !learnedIds.includes(item.id)),
  };
}

// What a day's quiz needs: its new items, earlier items to review, and wrong-answer pools.
export async function loadQuizContent(day) {
  const [curriculum, verbs, abbreviations, today] = await Promise.all([
    loadCurriculum(),
    loadVerbs(),
    loadAbbreviations(),
    loadLesson(day),
  ]);
  const pools = {
    verbs: splitByDay(verbs, curriculum, 'verbs', day),
    abbreviations: splitByDay(abbreviations, curriculum, 'abbreviations', day),
  };
  const todayIds = [...today.verbs, ...today.abbreviations].map((item) => item.id);
  const earlier = [...pools.verbs.learned, ...pools.abbreviations.learned]
    .filter((item) => !todayIds.includes(item.id));
  return { today, earlier, pools };
}
