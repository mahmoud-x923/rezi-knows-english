// The quiz engine: question generators, the question flow and the result screen.

import { loadQuizContent } from './data.js';
import { element, link, persian } from './dom.js';
import { renderLoadError } from './lesson.js';
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

function shuffled(list, random) {
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
function typesFor(item) {
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
  return [
    element('p', headings[result]),
    element('p', `Answer: ${question.answers.join(' / ')}`),
    persian('p', question.meaning),
  ];
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
        if (question.answers.includes(value)) other.textContent = `✅ ${value}`;
      });
      if (!isCorrect) button.textContent = `❌ ${option}`;
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
    onAnswer(checkTypedAnswer(input.value, question.answers));
  });
  return form;
}

// Runs through the questions, then calls onFinish with the number answered correctly.
export function createQuizRunner(questions, onFinish) {
  const position = element('p');
  const content = element('div');
  content.tabIndex = -1;
  let correctCount = 0;

  function show(index, moveFocus = true) {
    stopSpeaking();
    const question = questions[index];
    position.textContent = `Question ${index + 1} of ${questions.length}`;

    const feedback = element('div');
    feedback.className = 'feedback';
    feedback.setAttribute('aria-live', 'polite');
    const next = element('div');

    const answerArea = question.options
      ? createOptions(question, handleAnswer)
      : createTypedAnswer(question, handleAnswer);

    function handleAnswer(result) {
      const isCorrect = result === 'correct';
      if (isCorrect) correctCount++;
      recordAnswer(question.itemId, isCorrect);
      feedback.replaceChildren(...createFeedback(result, question));

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
  return [position, content];
}

function renderNextStep(isRetake) {
  if (hasGraduated()) return link('#/graduation', 'Graduation 🎓');
  if (isRetake) return null;
  if (isBonusAvailable()) return link('#/lesson', 'Bonus lesson 🚀');
  return canStartLesson() ? link('#/lesson', "Start today's lesson") : element('p', 'See you tomorrow 👋');
}

function createResult(day, correct, total, isRetake, isSaved, onRetake) {
  const stars = getStarsForScore(correct, total);
  const best = getProgress().completedDays[day]?.stars;
  const result = element('div');
  result.className = 'result';
  result.tabIndex = -1;

  const heading = element('h2', `You got ${correct} of ${total} right`);
  const earned = element('p', '⭐'.repeat(stars));
  earned.className = 'result-stars';
  result.append(heading, earned);

  if (isRetake && best > stars) result.append(element('p', `Your best for this day: ${'⭐'.repeat(best)}`));
  if (!isSaved) result.append(element('p', "You've reached today's lesson limit, so this result wasn't saved."));
  result.append(element('p', `🔥 Streak: ${getStreak()}`));

  const nextStep = isSaved ? renderNextStep(isRetake) : null;
  if (nextStep) result.append(nextStep);

  const actions = element('div');
  actions.className = 'result-actions';
  const retake = element('button', 'Retake the quiz');
  retake.type = 'button';
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
  try {
    content = await loadQuizContent(day);
  } catch {
    return renderLoadError(title);
  }

  const page = element('div');

  function start() {
    const questions = generateDailyQuiz(content, getProgress().itemStats);
    const exit = link(HOME, 'Exit quiz');
    const runner = createQuizRunner(questions, (correct) => {
      stopSpeaking();
      const isRetake = getDayStatus(day) === 'completed';
      const stars = getStarsForScore(correct, questions.length);
      const isSaved = completeLesson(day, stars);
      const result = createResult(day, correct, questions.length, isRetake, isSaved, () => {
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
