# Rezi Knows English

A mobile-first website for learning 90 English irregular verbs and 60 modern abbreviations over 30 days, with Persian and Arabic meanings. Each day has a short lesson, a quiz, stars and a streak, plus a Practice Arena for review.

It's plain HTML, CSS and JavaScript, with no build step and no backend. Progress is saved on the device, and the site can be installed on a phone and used offline.

## Run it locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Install on Android

1. Open the site in Chrome.
2. Tap the **⋮** menu, then **Install app** or **Add to Home screen**.

The app opens full screen from the home screen and works offline after the first visit.

## Test on a real phone

Before handing the site over, check these on the phone it will be used on:

- [x] The home page fits the screen with no sideways scrolling.
- [x] Persian and Arabic text reads right to left in the Vazirmatn font.
- [x] 🔊 buttons speak in an English voice, and listening questions play their word.
- [x] A typed quiz answer opens the keyboard without auto-capitalizing or auto-correcting.
- [x] Finishing Day 1 offers the bonus lesson, and finishing that says "See you tomorrow".
- [x] The app installs, opens from the home screen, and works in airplane mode.
- [x] **⚙️ Settings → Export progress** saves a file, and **Import progress** restores it.

## Debug mode

Add `?debug` to the address, for example `http://localhost:8000/?debug`, to show a panel that can change today's date and reset progress. It's for testing unlocking and streaks without waiting a day.

The date change only applies while `?debug` is in the address.

## Changing the site

- **Content** lives in `data/`. Lessons follow `data/curriculum.json`, so the order can change without editing the items. All Persian text should be checked by a native speaker.
- **New files** must be added to the `FILES` list in `sw.js`, or they won't work offline. If you remove a file, also change the `CACHE` name there.

## Prize songs

When Rezi gets every answer in a quiz right, Curly shows a random song from `data/songs.json`. To add one, paste its YouTube link into the list:

```json
[
  "https://youtu.be/49tpIMDy9BE",
  "https://www.youtube.com/watch?v=VIDEO_ID"
]
```

Any normal YouTube link works. The video must allow embedding, which most music videos do. Playing a song needs the internet.

## Progress and backups

Progress is stored only in the browser on each device. Clearing the browser's site data or uninstalling the app deletes it, so export a backup from **⚙️ Settings** now and then.
