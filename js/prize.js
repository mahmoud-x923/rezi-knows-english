// The prize song: a YouTube video shown after a quiz with every answer right.

import { element } from './dom.js';

let lastSongId = null;

// Works with youtu.be links, watch?v= links, embed and shorts links, or a bare video ID.
export function getVideoId(link) {
  if (typeof link !== 'string') return null;
  const match = link.trim().match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})(?![\w-])/)
    ?? link.trim().match(/^([\w-]{11})$/);
  return match ? match[1] : null;
}

// A random song, avoiding the one shown last time when there's a choice.
export function pickSong(links, random = Math.random) {
  const ids = [...new Set(links.map(getVideoId).filter(Boolean))];
  if (ids.length === 0) return null;
  const choices = ids.length > 1 ? ids.filter((id) => id !== lastSongId) : ids;
  lastSongId = choices[Math.floor(random() * choices.length)];
  return lastSongId;
}

export function createPrizeSong(videoId) {
  const prize = element('section');
  prize.className = 'prize-song';

  const player = element('iframe');
  player.className = 'prize-video';
  player.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`;
  player.title = 'Your prize song';
  player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  player.allowFullscreen = true;
  // YouTube needs to know which site embeds the video, or it may refuse to play it.
  player.referrerPolicy = 'strict-origin-when-cross-origin';

  prize.append(element('h3', '🎵 Your prize song'), player);
  if (!navigator.onLine) {
    prize.append(element('p', 'Your song needs the internet. Connect and it will be ready to play 🎶'));
  }
  return prize;
}
