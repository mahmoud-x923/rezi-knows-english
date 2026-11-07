// The Match pairs game: tap an English word and its Persian meaning.

import { element, link, persian } from '../dom.js';
import { createGuide, say } from '../guide.js';
import { replay } from '../motion.js';
import { play } from '../sound.js';
import { shuffled } from '../quiz.js';
import { recordAnswer } from '../state.js';

const PAIR_COUNT = 5;

function createPair(item, random) {
  if (!('base' in item)) return { itemId: item.id, english: item.short, meaning: item.fa };
  const forms = [item.base, item.past[0], item.participle[0]];
  return { itemId: item.id, english: forms[Math.floor(random() * forms.length)], meaning: item.fa };
}

// A round uses one kind of item. Early on there may be too few, so kinds can mix.
export function createPairs(items, random = Math.random) {
  const verbs = items.filter((item) => 'base' in item);
  const abbreviations = items.filter((item) => !('base' in item));
  const kinds = [verbs, abbreviations].filter((kind) => kind.length >= PAIR_COUNT);
  const source = kinds.length > 0 ? kinds[Math.floor(random() * kinds.length)] : items;
  return shuffled(source, random).slice(0, PAIR_COUNT).map((item) => createPair(item, random));
}

function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function createMatchGame(items, random = Math.random) {
  const game = element('div');

  function start() {
    const pairs = createPairs(items, random);
    const startedAt = Date.now();
    const elapsed = () => Math.floor((Date.now() - startedAt) / 1000);

    const clock = element('p', `⏱️ ${formatTime(0)}`);
    clock.className = 'match-clock';
    const timer = setInterval(() => {
      if (!clock.isConnected) clearInterval(timer);
      else clock.textContent = `⏱️ ${formatTime(elapsed())}`;
    }, 1000);

    const message = element('p');
    message.className = 'match-message';
    message.setAttribute('aria-live', 'polite');

    const selected = { english: null, meaning: null };
    let matched = 0;
    let misses = 0;

    const createTile = (pair, side) => {
      const text = pair[side];
      const button = side === 'meaning' ? persian('button', text) : element('button', text);
      button.type = 'button';
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => choose(side, { button, pair }));
      return button;
    };

    function clearSelection() {
      for (const side of ['english', 'meaning']) {
        selected[side]?.button.setAttribute('aria-pressed', 'false');
        selected[side] = null;
      }
    }

    function choose(side, tile) {
      const isSame = selected[side]?.button === tile.button;
      selected[side]?.button.setAttribute('aria-pressed', 'false');
      selected[side] = isSame ? null : tile;
      if (!isSame) tile.button.setAttribute('aria-pressed', 'true');
      if (selected.english && selected.meaning) checkPair();
    }

    function checkPair() {
      const { english, meaning } = selected;
      const isMatch = english.pair.itemId === meaning.pair.itemId;
      recordAnswer(english.pair.itemId, isMatch);
      clearSelection();
      if (!isMatch) {
        misses++;
        message.textContent = '❌ Not a pair, try again';
        play('wrong');
        replay(english.button, 'shake');
        replay(meaning.button, 'shake');
        return;
      }
      matched++;
      message.textContent = '✅ Matched!';
      for (const { button, pair, side } of [
        { ...english, side: 'english' },
        { ...meaning, side: 'meaning' },
      ]) {
        button.disabled = true;
        button.textContent = `✅ ${pair[side]}`;
        replay(button, 'matched');
      }
      if (matched === pairs.length) {
        play('matchDone');
        finish();
      } else {
        play('pair');
        game.querySelector('.match-board button:not(:disabled)').focus();
      }
    }

    function finish() {
      clearInterval(timer);
      const result = element('div');
      result.className = 'result';
      result.tabIndex = -1;

      const again = element('button', 'Play again');
      again.type = 'button';
      again.className = 'button-primary';
      again.addEventListener('click', () => {
        start();
        game.querySelector('.match-board button').focus();
      });

      const actions = element('div');
      actions.className = 'result-actions';
      actions.append(again, link('#/', 'Back to home'));

      const missText = misses === 1 ? '1 miss' : `${misses} misses`;
      const cheer = misses === 0
        ? say('matchPerfect') ?? 'Not a single miss! 🙌'
        : say('matchDone') ?? 'You matched them all 💕';
      result.append(
        element('h2', `All matched in ${formatTime(elapsed())} with ${missText} 🎯`),
        createGuide(misses === 0 ? 'cheer' : 'sweet', cheer),
        actions,
      );
      game.replaceChildren(result);
      result.focus();
    }

    const board = element('div');
    board.className = 'match-board';
    const englishColumn = element('div');
    englishColumn.append(...shuffled(pairs, random).map((pair) => createTile(pair, 'english')));
    const meaningColumn = element('div');
    meaningColumn.append(...shuffled(pairs, random).map((pair) => createTile(pair, 'meaning')));
    board.append(englishColumn, meaningColumn);

    const exit = link('#/', 'Exit game');
    exit.className = 'exit-link';
    game.replaceChildren(
      createGuide('cozy', 'Tap a word, then tap its meaning.', say('matchIntro')),
      clock,
      board,
      message,
      exit,
    );
  }

  start();
  return game;
}
