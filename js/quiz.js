// The quiz engine: question generators, the question flow and the result screen.

import { loadNames, loadQuizContent, loadSongs } from './data.js';
import { buttonLink, element, link, persian } from './dom.js';
import { createBurst } from './decor.js';
import { createGuide, say } from './guide.js';
import { pickNickname } from './names.js';
import { createPrizeSong, pickSong } from './prize.js';
import { renderLoadError } from './lesson.js';
import { play } from './sound.js';
import { isSpeechAvailable, speak, stopSpeaking } from './speech.js';
import {
  canStartLesson,
  completeLesson,
  getDayStatus,
  getProgress,
  getStreak,
  hasGraduated,
  isBonusAvailable,
  recordAnswer,
} from './state.js';

const HOME = '#/';
const NEW_ITEM_QUESTIONS = 8;
const REVIEW_QUESTIONS = 3;
const OPTION_COUNT = 4;
const VERB_TYPES = ['meaning', 'missingForm', 'typeForm', 'listen'];
const ABBREVIATION_TYPES = ['decoder', 'chat'];
const FORM_NAMES = { past: 'past simple', participle: 'past participle' };
const BLANK = '___';

// These can sound the same, so one can't be a wrong option for the other when listening.
const HOMOPHONES = { shone: 'shown', shown: 'shone' };

function isVerb(item) {
  return 'base' in item;
}

export function shuffled(list, random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickOne(list, random) {
  return list[Math.floor(random() * list.length)];
}

function allForms(verb) {
  return [verb.base, ...verb.past, ...verb.participle];
}

// Learned items come first. Upcoming items only fill in when too few have been learned.
function buildOptions(correct, excluded, getValues, pool, random) {
  const candidates = [...shuffled(pool.learned, random), ...pool.upcoming].flatMap(getValues);
  const distractors = [];
  for (const value of candidates) {
    if (distractors.length === OPTION_COUNT - 1) break;
    if (!excluded.includes(value) && !distractors.includes(value)) distractors.push(value);
  }
  return shuffled([correct, ...distractors], random);
}

const QUESTION_BUILDERS = {
  meaning(verb, pools, random) {
    return {
      promptFa: verb.fa,
      prompt: 'in English is…',
      answers: [verb.base],
      options: buildOptions(verb.base, allForms(verb), (other) => [other.base], pools.verbs, random),
    };
  },

  missingForm(verb, pools, random) {
    const slot = pickOne(['past', 'participle'], random);
    const line = slot === 'past'
      ? [verb.base, BLANK, verb.participle[0]]
      : [verb.base, verb.past[0], BLANK];
    return {
      prompt: `Choose the missing ${FORM_NAMES[slot]}:`,
      formLine: line.join(' → '),
      answers: verb[slot],
      options: buildOptions(verb[slot][0], allForms(verb), (other) => other[slot], pools.verbs, random),
    };
  },

  typeForm(verb, pools, random) {
    const slot = pickOne(['past', 'participle'], random);
    return {
      prompt: `Type the ${FORM_NAMES[slot]} of “${verb.base}”:`,
      answers: verb[slot],
    };
  },

  listen(verb, pools, random) {
    const word = pickOne([verb.base, verb.past[0], verb.participle[0]], random);
    return {
      prompt: 'Listen and choose the correct spelling:',
      speakText: word,
      answers: [word],
      options: buildOptions(word, [...allForms(verb), HOMOPHONES[word]], allForms, pools.verbs, random),
    };
  },

  decoder(item, pools, random) {
    return {
      prompt: `“${item.short}” means…`,
      answers: [item.full],
      options: buildOptions(item.full, [item.full], (other) => [other.full], pools.abbreviations, random),
    };
  },

  chat(item, pools, random) {
    return {
      bubble: item.example,
      prompt: `What does “${item.short}” mean?`,
      answers: [item.full],
      options: buildOptions(item.full, [item.full], (other) => [other.full], pools.abbreviations, random),
    };
  },
};

// The listening question is skipped when the browser has no speech support.
export function typesFor(item) {
  if (!isVerb(item)) return ABBREVIATION_TYPES;
  return isSpeechAvailable() ? VERB_TYPES : VERB_TYPES.filter((type) => type !== 'listen');
}

export function createQuestion(item, type, pools, random = Math.random) {
  return { itemId: item.id, type, meaning: item.fa, ...QUESTION_BUILDERS[type](item, pools, random) };
}

// Items answered wrong more often are more likely to be picked.
export function pickWeighted(items, count, stats, random = Math.random) {
  const remaining = [...items];
  const picked = [];
  while (picked.length < count && remaining.length > 0) {
    const weights = remaining.map((item) => 1 + (stats[item.id]?.wrong ?? 0));
    let roll = random() * weights.reduce((sum, weight) => sum + weight, 0);
    let index = weights.findIndex((weight) => (roll -= weight) < 0);
    if (index === -1) index = remaining.length - 1;
    picked.push(...remaining.splice(index, 1));
  }
  return picked;
}

export function generateDailyQuiz({ today, earlier, pools }, stats, random = Math.random) {
  const items = [...today.verbs, ...today.abbreviations];

  // Every new item gets one question, then the rest are different questions on them.
  const chosen = items.map((item) => ({ item, type: pickOne(typesFor(item), random) }));
  const unused = items.flatMap((item) => typesFor(item)
    .filter((type) => !chosen.some((entry) => entry.item === item && entry.type === type))
    .map((type) => ({ item, type })));
  chosen.push(...shuffled(unused, random).slice(0, NEW_ITEM_QUESTIONS - items.length));

  const review = pickWeighted(earlier, REVIEW_QUESTIONS, stats, random)
    .map((item) => ({ item, type: pickOne(typesFor(item), random) }));

  const questions = [...chosen, ...review]
    .map(({ item, type }) => createQuestion(item, type, pools, random));
  return shuffled(questions, random);
}

function normalize(text) {
  return text.trim().toLowerCase();
}

function isOneEditApart(a, b) {
  if (Math.abs(a.length - b.length) > 1 || a === b) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const [restA, restB] = [a.slice(i), b.slice(i)];
  return restA.slice(1) === restB.slice(1) || restA === restB.slice(1) || restA.slice(1) === restB;
}

// Returns "correct", "almost" (one letter off, which still counts as wrong) or "wrong".
export function checkTypedAnswer(typed, answers) {
  const value = normalize(typed);
  const accepted = answers.map(normalize);
  if (accepted.includes(value)) return 'correct';
  return accepted.some((answer) => isOneEditApart(value, answer)) ? 'almost' : 'wrong';
}

export function getStarsForScore(correct, total) {
  const score = correct / total;
  if (score >= 0.9) return 3;
  return score >= 0.7 ? 2 : 1;
}

function createFeedback(result, question) {
  const headings = {
    correct: '✅ Correct!',
    almost: '🤏 Almost! check the spelling',
    wrong: '❌ Not quite',
  };
  const heading = element('p', headings[result]);
  heading.className = 'feedback-result';
  return createGuide(
    result === 'correct' ? 'proud' : 'thinking',
    heading,
    say(result),
    `Answer: ${question.answers.join(' / ')}`,
    persian('p', question.meaning),
  );
}

function createPrompt(question) {
  const prompt = element('div');
  prompt.className = 'question';
  if (question.bubble) {
    const bubble = element('p', question.bubble);
    bubble.className = 'chat-bubble';
    prompt.append(bubble);
  }
  if (question.promptFa) {
    const word = persian('p', question.promptFa);
    word.className = 'question-word';
    prompt.append(word);
  }
  const heading = element('h2', question.prompt);
  prompt.append(heading);
  if (question.formLine) {
    const line = element('p', question.formLine);
    line.className = 'question-word';
    prompt.append(line);
  }
  if (question.speakText) {
    const replay = element('button', '🔊 Play the word');
    replay.type = 'button';
    replay.addEventListener('click', () => speak(question.speakText));
    prompt.append(replay);
  }
  return prompt;
}

function createOptions(question, onAnswer) {
  const list = element('ul');
  list.className = 'options';
  const buttons = question.options.map((option) => {
    const button = element('button', option);
    button.type = 'button';
    button.addEventListener('click', () => {
      const isCorrect = question.answers.includes(option);
      buttons.forEach((other) => {
        other.disabled = true;
        const value = question.options[buttons.indexOf(other)];
        if (question.answers.includes(value)) {
          other.textContent = `✅ ${value}`;
          other.classList.add('is-correct');
        }
      });
      if (isCorrect) {
        button.append(createBurst());
      } else {
        button.textContent = `❌ ${option}`;
        button.classList.add('is-wrong');
      }
      onAnswer(isCorrect ? 'correct' : 'wrong');
    });
    return button;
  });
  list.append(...buttons.map((button) => {
    const item = element('li');
    item.append(button);
    return item;
  }));
  return list;
}

function createTypedAnswer(question, onAnswer) {
  const form = element('form');
  form.className = 'typed-answer';
  const input = element('input');
  input.type = 'text';
  input.autocomplete = 'off';
  input.setAttribute('autocapitalize', 'none');
  input.setAttribute('autocorrect', 'off');
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Your answer');
  input.dataset.autofocus = '';
  const submit = element('button', 'Check');
  submit.type = 'submit';
  form.append(input, submit);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!input.value.trim()) return;
    input.readOnly = true;
    submit.disabled = true;
    const result = checkTypedAnswer(input.value, question.answers);
    input.classList.add(result === 'correct' ? 'is-correct' : 'is-wrong');
    onAnswer(result);
  });
  return form;
}

// Runs through the questions, then calls onFinish with the number answered correctly.
export function createQuizRunner(questions, onFinish) {
  const position = element('p');
  position.className = 'lesson-position';
  const bar = element('div');
  bar.className = 'progress-bar';
  bar.setAttribute('aria-hidden', 'true');
  const filled = element('span');
  bar.append(filled);
  const content = element('div');
  content.tabIndex = -1;
  let correctCount = 0;

  function show(index, moveFocus = true) {
    stopSpeaking();
    const question = questions[index];
    position.textContent = `Question ${index + 1} of ${questions.length}`;
    filled.style.setProperty('--progress', (index + 1) / questions.length);

    const feedback = element('div');
    feedback.className = 'feedback';
    feedback.setAttribute('aria-live', 'polite');
    const next = element('div');
    next.className = 'feedback-next';

    const answerArea = question.options
      ? createOptions(question, handleAnswer)
      : createTypedAnswer(question, handleAnswer);

    function handleAnswer(result) {
      const isCorrect = result === 'correct';
      if (isCorrect) correctCount++;
      play(isCorrect ? 'correct' : 'wrong');
      recordAnswer(question.itemId, isCorrect);
      feedback.className = `feedback feedback-${result}`;
      feedback.replaceChildren(createFeedback(result, question));

      const isLast = index === questions.length - 1;
      const button = element('button', isLast ? 'See my result' : 'Next question');
      button.type = 'button';
      button.addEventListener('click', () => {
        if (isLast) onFinish(correctCount);
        else show(index + 1);
      });
      next.replaceChildren(button);
      button.focus();
    }

    content.replaceChildren(createPrompt(question), answerArea, feedback, next);
    if (question.speakText) speak(question.speakText);
    if (moveFocus) (content.querySelector('[data-autofocus]') ?? content).focus();
  }

  show(0, false);
  return [position, bar, content];
}

const RESULT_MESSAGES = {
  3: ['cheer', "Perfect! I'm so proud of you 🙌"],
  2: ['sweet', "So good! You're getting better every day 💕"],
  1: ['thinking', "Every try counts. Let's keep going together 🌱"],
};

// One rising note per star, timed with the stars popping in, then a chime if the streak grew.
function playResultSounds(stars, streakGrew) {
  for (let i = 0; i < stars; i++) play(`star${i + 1}`, 0.15 + i * 0.15);
  if (streakGrew) play('streak', 0.25 + stars * 0.15);
}

function createResultGuide(stars) {
  const [mood, fallback] = RESULT_MESSAGES[stars];
  const guide = createGuide(mood, say(`result${stars}`) ?? fallback);
  if (stars === 3) guide.classList.add('guide-large');
  return guide;
}

// The main next action, or a goodbye from Curly when today's lessons are done.
function renderNextStep(isRetake, names) {
  if (hasGraduated()) return buttonLink('#/graduation', 'Graduation 🎓', true);
  if (isRetake) return null;
  if (isBonusAvailable()) return buttonLink('#/lesson', 'Bonus lesson 🚀', true);
  if (canStartLesson()) return buttonLink('#/lesson', "Start today's lesson", true);
  return createGuide(
    'sleepy',
    names ? `See you tomorrow, ${pickNickname(names)} 👋` : 'See you tomorrow 👋',
    say('seeYouTomorrow'),
  );
}

// Every answer right earns a random prize song. Otherwise Curly reminds her it's there.
function createSongReward(correct, total, songs) {
  if (!songs.length) return null;
  if (correct < total) {
    const hint = element('p', say('prizeHint') ?? 'Get every answer right next time and I will play you a song 🎶');
    hint.className = 'prize-hint';
    return hint;
  }
  const videoId = pickSong(songs);
  if (!videoId) return null;
  const prize = createPrizeSong(videoId);
  prize.prepend(createGuide('sweet', say('prizeSong') ?? "Every answer right! Here's a song for you 🎶"));
  return prize;
}

function createResult(day, correct, total, isRetake, isSaved, names, songs, onRetake) {
  const stars = getStarsForScore(correct, total);
  const best = getProgress().completedDays[day]?.stars;
  const result = element('div');
  result.className = 'result';
  result.tabIndex = -1;

  const heading = element('h2', `You got ${correct} of ${total} right`);
  const earned = element('p');
  earned.className = 'result-stars';
  earned.setAttribute('role', 'img');
  earned.setAttribute('aria-label', `${stars} of 3 stars`);
  for (let i = 0; i < stars; i++) {
    const star = element('span', '⭐');
    star.style.setProperty('--i', i);
    earned.append(star);
  }
  result.append(heading, earned, createResultGuide(stars));
  const reward = createSongReward(correct, total, songs);
  if (reward) result.append(reward);

  if (isRetake && best > stars) result.append(element('p', `Your best for this day: ${'⭐'.repeat(best)}`));
  if (!isSaved) result.append(element('p', "You've reached today's lesson limit, so this result wasn't saved."));
  const streak = element('p');
  streak.className = 'result-streak';
  const flame = element('span', '🔥');
  flame.className = 'flame';
  streak.append(flame, ` Streak: ${getStreak()}`);
  result.append(streak);

  const nextStep = isSaved ? renderNextStep(isRetake, names) : null;
  const isGoodbye = nextStep?.classList.contains('guide');
  if (isGoodbye) result.append(nextStep);

  const actions = element('div');
  actions.className = 'result-actions';
  if (nextStep && !isGoodbye) actions.append(nextStep);
  const retake = element('button', 'Retake the quiz');
  retake.type = 'button';
  if (!nextStep || isGoodbye) retake.className = 'button-primary';
  retake.addEventListener('click', onRetake);
  actions.append(retake, link(HOME, 'Back to home'));
  result.append(actions);
  return result;
}

// Works for today's lesson and for retaking a completed day. Locked days redirect.
export async function renderQuiz(dayParam) {
  const day = Number(dayParam);
  if (getDayStatus(day) === 'locked') {
    location.replace('#/lesson');
    return null;
  }

  const title = `Quiz for Day ${day}`;
  let content;
  let names;
  let songs;
  try {
    [content, names, songs] = await Promise.all([
      loadQuizContent(day),
      loadNames().catch(() => null),
      loadSongs().then((list) => (Array.isArray(list) ? list : [])).catch(() => []),
    ]);
  } catch {
    return renderLoadError(title);
  }

  const page = element('div');

  function start() {
    const questions = generateDailyQuiz(content, getProgress().itemStats);
    const exit = link(HOME, 'Exit quiz');
    exit.className = 'exit-link';
    const runner = createQuizRunner(questions, (correct) => {
      stopSpeaking();
      const isRetake = getDayStatus(day) === 'completed';
      const stars = getStarsForScore(correct, questions.length);
      const streakBefore = getStreak();
      const isSaved = completeLesson(day, stars);
      playResultSounds(stars, getStreak() > streakBefore);
      const result = createResult(day, correct, questions.length, isRetake, isSaved, names, songs, () => {
        start();
        (page.querySelector('[data-autofocus]') ?? page.querySelector('[tabindex="-1"]')).focus();
      });
      page.replaceChildren(result);
      result.focus();
    });
    page.replaceChildren(...runner, exit);
  }

  start();
  return [element('h1', title), page];
}
