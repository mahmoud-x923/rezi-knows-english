# Rezi Knows English — Project Plan

**Iteration 1: functionality only.** Visual design, theme and animations come in iteration 2.

---

## 1. Overview

A mobile-first static website, hosted on **GitHub Pages**, built for **{{name}}** ({{fullName}}), a native Persian speaker.

It teaches two things over a **30-day journey**:
1. **English irregular verbs**: base form, past simple, past participle (3 per day, 90 total)
2. **Modern abbreviations and internet slang**: brb, idc, imho… (2 per day, 60 total)

Every item shows its meaning in **Persian (فارسی)** and **Arabic (العربية)**.

### Personal details (used in greetings)
The real values live in `PERSONAL.local.md`, which is gitignored and stored only locally. Never copy them into a tracked file.
- Name: **{{name}}** / **{{fullName}}**
- Nicknames: **{{nickname1}}**, **{{nickname2}}**

---

## 2. Tech stack

- Plain **HTML + CSS + vanilla JavaScript (ES modules)**, **no build step**
- Content in **JSON files** under `/data`
- Progress in **localStorage** (no backend, no login)
- **PWA**: installable to the home screen, works offline
- **Hash routing** (GitHub Pages has no server-side routing)
- **Web Speech API** (`speechSynthesis`) for English pronunciation
- **Vazirmatn** font (Google Fonts) for Persian and Arabic text

---

## 3. Structure

### Home page
1. **Hero**: a cheerful greeting picked at random on every page load (see §6, Greetings).
2. **Three tabs**:

| Tab | Content |
|---|---|
| **🌱 How It Works** | 3–4 simple steps: learn 5 new things a day → play the quiz → earn stars → keep your streak. Explains the daily + bonus lesson rule. A short Persian subtitle under each step. |
| **🗺️ My Journey** | A vertical path of 30 day "stops", each marked completed ✅ (with its stars), today ⭐ or locked 🔒. Shows streak, words learned and total stars. Tapping a completed day opens it for review. Includes a "Start today's lesson" button. |
| **🎯 Practice Arena** | Quizzes drawn from **everything learned so far**. Two modes: **Mixed** (random) and **Weak spots** (items answered wrong most often). Also the **Match pairs** game. Disabled with a friendly message until Day 1 is complete. |

A small ⚙️ **Settings** menu offers: reset progress, export progress (download a JSON file) and import progress (upload that file).

### Routes

| Route | Page |
|---|---|
| `#/` | Home: hero + tabs |
| `#/lesson` | Today's lesson (the next unlocked day) |
| `#/lesson/:day` | Review a completed day (no unlocking effects) |
| `#/quiz/:day` | End-of-lesson quiz for that day |
| `#/practice/:mode` | Practice Arena session (`mixed`, `weak`, `match`) |
| `#/graduation` | Shown after Day 30 is completed |

---

## 4. Daily lesson flow

```
Open today's lesson
   ↓
Verb card 1 → Verb card 2 → Verb card 3
   ↓
Abbreviation card 1 → Abbreviation card 2
   ↓
"Ready for your quiz?"
   ↓
Quiz: ~8 questions on today's 5 items + 2–3 review questions from earlier days
      (no review questions on Day 1)
   ↓
Result screen: score, stars, streak update, and either
  • "Bonus lesson 🚀" (if the bonus is still available today), or
  • "See you tomorrow, {{nickname1}} 👋", or
  • "Graduation 🎓" (after Day 30)
```

### Verb card
- The three forms, large and clear: **become → became → become**
- 🔊 Pronunciation button for each form
- Persian meaning: شدن
- Arabic meaning: يصبح / أصبح
- One example sentence per form, e.g. *"She became a doctor last year."*
- Pattern tag where useful, e.g. *A-A-A: cut / cut / cut*

### Abbreviation card
- **brb** → *be right back*
- 🔊 Pronunciation of the full phrase
- Persian: زود برمی‌گردم
- Arabic: سأعود حالاً
- Where it's used (texting, social media, never in formal email)
- A chat-bubble example: *"Hold on, brb 🏃‍♀️"*
- Mildly rude items show a 🌶️ badge and a one-line warning, e.g. "OK with close friends, never at work."

---

## 5. Quizzes and games

Each quiz mixes these question types at random:

| Type | Example |
|---|---|
| **Meaning (multiple choice)** | "شدن" in English is… → become / begin / bring / buy |
| **Missing form (multiple choice)** | go → ___ → gone → *went* |
| **Type the form** | Type the past participle of *write* → `written` |
| **Abbreviation decoder** | "imho" means… (4 options) |
| **Chat scenario** | *"sry, can't talk rn, ttyl"*. What does *ttyl* mean? |
| **Listen and choose** | 🔊 plays a word, she picks the correct spelling (skipped if the browser has no speech support) |

**Match pairs game** (Practice Arena): tap to match 5 abbreviations or verb forms with their meanings, with a timer for fun.

### Rules
- **Wrong answers** for multiple choice come from other learned items of the same kind.
- **Typed answers** are checked trimmed and case-insensitive. Accepted alternatives count as correct (e.g. *learned / learnt*). A near-miss (1 letter off) shows "Almost! check the spelling" and counts as wrong.
- Feedback appears after every answer, showing the correct answer and its Persian meaning.
- **Stars:** ≥90% = ⭐⭐⭐, ≥70% = ⭐⭐, completed = ⭐. Finishing the quiz completes the day whatever the score. She can retake any quiz, and the best stars are kept.
- Every answer updates `itemStats` (used for review questions and Weak spots).
- **Review questions** in daily quizzes are picked from earlier items, weighted toward ones with more wrong answers.

---

## 6. Content

### Verbs: 90, ordered most common first (be, have, do, go, get, make, say, …)
`data/verbs.json`
```json
{
  "id": "become",
  "base": "become",
  "past": ["became"],
  "participle": ["become"],
  "fa": "شدن",
  "ar": "يصبح / أصبح",
  "examples": {
    "base": "I want to become a teacher.",
    "past": "She became a doctor last year.",
    "participle": "It has become cold."
  },
  "pattern": "A-B-A"
}
```
`past` and `participle` are arrays so they can hold variants: `"be"` → `["was", "were"]`, `"learn"` → `["learned", "learnt"]`. The first entry is the one displayed as the main form.

### Abbreviations: 60, ordered most common first (lol, brb, idk, …)
`data/abbreviations.json`
```json
{
  "id": "brb",
  "short": "brb",
  "full": "be right back",
  "fa": "زود برمی‌گردم",
  "ar": "سأعود حالاً",
  "context": "texting",
  "tone": "neutral",
  "example": "Hold on, brb 🏃‍♀️"
}
```
- `tone`: `"neutral"` or `"rude"`
- **Mildly rude** abbreviations are included (e.g. *wtf*, *af*, *ffs*), tagged `"rude"` and spread through the second half of the journey. No sexual, hateful or slur-based terms.

### Curriculum: 30 days
`data/curriculum.json`
```json
[
  { "day": 1, "verbs": ["be", "have", "do"], "abbreviations": ["lol", "brb"] }
]
```
Kept separate from the content so the order can change without editing the items. Each verb and each abbreviation appears in exactly one day.

### Greetings: about 25
`data/greetings.json`. Short, cheerful messages using {{name}}, {{fullName}}, {{nickname1}} and {{nickname2}}. For example:
- "Good morning, {{nickname1}} 👋 Ready for today's 5 new words?"
- "{{nickname2}} is back! Let's make English easy today 💪"

Each greeting can have optional conditions: `time` (morning / afternoon / evening), `minStreak`, `nearGraduation`. Only greetings whose conditions match are picked.

### Translation review
A native Persian speaker must proofread all Persian text before launch. Slang translations are where mistakes are most likely. Arabic is reviewed by the project owner.

---

## 7. Unlocking rules (hybrid)

- **Day 1** is available immediately.
- Each calendar day, **one regular lesson** unlocks: the next uncompleted day.
- After completing it, **one bonus lesson** is available that same calendar day. Max **2 lessons per calendar day**.
- Missed days don't pile up. She continues from where she left off.
- **Streak** = consecutive calendar days with at least one completed lesson. Missing a whole day resets it to 0 (the next completed lesson makes it 1).
- Completed days can always be reviewed. Reviews and retakes don't count toward the daily limit.
- The calendar day uses the **device's local date** (`YYYY-MM-DD`).
- After Day 30: the graduation screen, and the Practice Arena stays available forever.

### Debug mode
Adding `?debug` to the URL shows a small panel to **override today's date** and **reset progress**, so day changes and unlocking can be tested without waiting. Hidden by default.

---

## 8. Progress storage (localStorage)

Key: `rezi-knows-english:v1`
```json
{
  "completedDays": { "1": { "stars": 3, "completedAt": "2026-11-05" } },
  "lessonsByDate": { "2026-11-05": [1, 2] },
  "streak": { "count": 1, "lastDate": "2026-11-05" },
  "itemStats": { "become": { "seen": 3, "wrong": 1 } }
}
```
- The next lesson number = highest completed day + 1.
- Lessons left today = 2 minus the number of new days completed on today's date.
- Export downloads this object as a JSON file. Import validates it and replaces the current progress.
- Stored with a version number so the format can change safely later.

---

## 9. Folder structure

```
/
├── index.html
├── manifest.json          # PWA manifest
├── sw.js                  # service worker: offline cache
├── icons/                 # PWA icons (192px, 512px)
├── css/
│   └── base.css           # minimal mobile-first layout only
├── js/
│   ├── app.js             # entry + hash router
│   ├── state.js           # localStorage progress, unlocking, streak
│   ├── date.js            # local date helper (+ debug override)
│   ├── data.js            # loads JSON content
│   ├── hero.js            # greeting picker
│   ├── tabs.js            # How It Works / My Journey / Practice Arena
│   ├── lesson.js          # lesson cards flow
│   ├── quiz.js            # quiz engine + question generators
│   ├── practice.js        # Practice Arena modes
│   ├── games/match.js     # match-pairs game
│   ├── speech.js          # text-to-speech helper
│   ├── settings.js        # reset / export / import
│   └── debug.js           # ?debug panel
└── data/
    ├── greetings.json
    ├── verbs.json
    ├── abbreviations.json
    └── curriculum.json
```

All paths are **relative** so the site works under a GitHub Pages sub-path (`username.github.io/repo-name/`).

---

## 10. Technical requirements

- **RTL:** Persian and Arabic text wrapped with `dir="rtl"` and `lang="fa"` / `lang="ar"`.
- **Mobile-first:** single column, tap targets ≥44px, usable one-handed, no horizontal scrolling at 360px width.
- **Accessibility basics:** semantic HTML, visible focus states, `aria-live` for quiz feedback.
- **Speech:** English voice (`en-US` or `en-GB`), with the 🔊 buttons hidden if `speechSynthesis` isn't available.
- **Offline:** the service worker caches all HTML, CSS, JS, JSON and icons.
- **No external dependencies** apart from the Google Fonts stylesheet.

---

## 11. Milestones (iteration 1)

1. Project skeleton, hash router, date helper, localStorage state module (unlocking + streak logic), debug panel
2. Hero with greeting picker, three tabs
3. Content: 90 verbs, 60 abbreviations, 30-day curriculum, ~25 greetings (in batches)
4. Daily lesson page with verb and abbreviation cards + text-to-speech
5. Quiz engine with all question types, result screen, stars, bonus lesson, graduation
6. Practice Arena (Mixed, Weak spots) + Match pairs game
7. Settings (reset / export / import), PWA manifest, icons, service worker
8. Testing on a real phone + GitHub Pages deployment steps in a README

**Iteration 2 (later):** theme, colors, illustrations, animations, sound effects, polish.
