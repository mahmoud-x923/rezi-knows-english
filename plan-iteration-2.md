# Rezi Knows English — Iteration 2 Plan

**Goal:** make the site feel cute, cozy and girly, and make Rezi feel that Mahmoud is with her through the whole journey. Iteration 1 is unchanged: same features, same rules, same data. This iteration only changes how things look, what she sees, and how it moves.

The same constraints apply: vanilla JS, no build step, mobile-first, no dependencies apart from Google Fonts, and everything works offline.

---

## The guide

The sticker sheet shows Mahmoud as a chibi character in a black hoodie. He appears as **the guide**, called **Curly** (Rezi's nickname for him, because of his curly hair): a sticker next to a speech bubble, talking to Rezi at the moments that matter. Every message comes from Curly, so the site feels like he is sitting next to her.

- Each bubble is labeled **Curly**.
- Guide messages are in **English only**.

| Sticker | Mood | Where he appears |
|---|---|---|
| Peace sign ✌️ | Welcoming | Home hero, first visit, app icon |
| Thumbs up and wink 👍 | Proud | Correct answer, finished lesson cards |
| Arms up, cheering 🙌 | Celebrating | 3-star result, graduation, new streak |
| Hand on chin, "?" 🤔 | Gently helping | Wrong or "Almost!" answer, Weak spots |
| Speech bubble "…" 💬 | Calm, listening | How It Works, loading, empty states |
| Drinking boba 🧋 | Cozy | Practice Arena, afternoon greetings |
| Asleep on a pillow 😴 | Resting | "See you tomorrow", daily limit reached, evening |
| Blushing with hearts 💕 | Sweet | Nickname greetings, 2-star result |
| Pouting, angry marks 😤 | Playful | 🌶️ rude abbreviation cards ("don't say this at work!") |

---

## Milestone 1 — Look and feel

A complete visual style for every screen, in light and dark mode. The guide uses a placeholder emoji until the real stickers arrive in Milestone 2.

### Theme
- **Light:** warm cream background, soft pink and lavender accents, peach highlights, dark plum text.
- **Dark:** deep plum-navy background, muted rose and lavender accents, soft cream text. Cozy, not pure black.
- All colors defined once as CSS variables, so every screen switches together.
- **Light/dark switch:** follows the phone's setting by default, with a choice of **System / Light / Dark** in ⚙️ Settings. The choice is remembered on the device.
- The browser and Android status bar color (`theme-color`) follows the theme.

### Typography
- **English:** a rounded, friendly Google Font (Nunito or Quicksand), large and easy to read.
- **Persian and Arabic:** Vazirmatn, as now.

### Components
- **Guide bubble:** sticker plus speech bubble labeled "Curly", reused everywhere.
- **Buttons:** soft, rounded, pill-shaped, with a clear pressed state.
- **Tabs:** a rounded segmented control with a sliding highlight.
- **Cards:** rounded corners, soft shadows, generous padding.
- **Chat bubbles:** look like a real messaging app, for abbreviation examples and chat questions.
- **Quiz options:** clear correct and wrong states using color *and* ✅/❌ markers, never color alone.
- **Stars, streak and stats:** small rounded "pills" with icons.

### Screens
- **Home:** guide in the hero with the greeting in his speech bubble.
- **My Journey:** a winding path of 30 round stops, with completed, today and locked states that are easy to tell apart.
- **Lesson cards:** progress dots for the 5 cards, the verb forms as large friendly "chips".
- **Quiz:** a progress bar, roomy option buttons, the guide reacting under each answer.
- **Result:** big stars, score and streak, with the guide's message.
- **Practice Arena, Match pairs, Settings and Graduation:** same style throughout.
- **Debug panel:** kept plain, it's only for testing.

### Accessibility
- Text contrast meets WCAG AA (4.5:1) in both themes, checked by a script.
- Visible focus rings, 44px tap targets, no sideways scrolling at 360px, as in Iteration 1.

### Done when
Every screen is styled in both themes, tested at 360px and 412px, with screenshots of each screen in light and dark mode for review.

---

## Milestone 2 — Assets

### Stickers
- Cut the sheet into **9 separate stickers** with transparent backgrounds, keeping the white sticker outline, which also looks good in dark mode.
- Crop out the faint text in the bottom-right corner of the sheet.
- Save each at about 2× display size as WebP with a PNG fallback, aiming for under 40 KB each.
- Put each sticker in its place from the guide table above.

### Guide messages
- Write Curly's lines for each moment: greeting, correct, almost, wrong, results for 1, 2 and 3 stars, bonus lesson, see you tomorrow, locked practice, no weak spots, load error, graduation.
- Several lines per moment, picked at random like the greetings, in English only, and using the nicknames.
- Stored in `data/guide.json` so they can be edited without touching code.

### Icons
- **App icon and favicon:** the peace-sign sticker on a soft pink background, sized for Android's round and squircle masks (192px, 512px and a small favicon).
- The install splash screen uses the theme's background color.

### Small illustrations
- Simple decorative inline SVGs drawn in code: hearts, sparkles, stars, clouds and a moon. They follow the theme colors in light and dark mode.
- Used around the journey path, empty states and the graduation page.
- No new character art: the guide only uses the 9 stickers from the sheet. More poses would need new stickers from you.

### Offline
- All new files added to the service worker list, so stickers work offline too.

### Done when
Every sticker, icon and illustration is in place, the app installs with the new icon, and everything loads offline.

---

## Milestone 3 — Animations

Small, gentle movements that make the app feel alive, never in the way.

### Ideas
- **How It Works:** the guide sticker floats up and down gently, with a slight sway, as if hovering beside the steps.
- **Guide bubble:** pops in with a small bounce whenever he says something new.
- **Tabs:** the highlight slides to the chosen tab, and the content fades in.
- **Lesson cards:** slide left and right between cards.
- **Buttons:** a soft "squish" when tapped.
- **Correct answer:** the option bounces, and a few sparkles burst out.
- **Wrong answer:** a small, gentle shake.
- **Result:** the stars pop in one by one.
- **Streak:** the 🔥 flickers softly.
- **My Journey:** today's stop pulses gently, and a locked stop wiggles when tapped.
- **Match pairs:** matched tiles pop and fade.
- **Graduation:** hearts and sparkles float up around the cheering sticker. No confetti, since it was removed earlier with the birthday wording.

### Rules
- CSS only (transform and opacity), short (150–400ms) except the gentle loops.
- **Reduced motion:** if the phone has "Remove animations" turned on, all movement stops and everything still works.
- Looping animations pause when the app is in the background, to save battery.
- No animation delays an action: taps respond straight away.

### Done when
Every animation runs smoothly on an emulated mid-range Android phone, and everything works with reduced motion turned on.

---

## Milestone 4 — Sound effects

Soft, short sounds that match the animations, so the app feels alive to hear as well as to see.

### Sounds
- **Tap:** a tiny, quiet pop on buttons and tabs.
- **Card change:** a soft swish between lesson cards.
- **Correct answer:** a bright two-note chime.
- **Wrong or "Almost!":** a gentle, low "boop", never harsh.
- **Stars:** one rising note per star as they pop in on the result screen.
- **Match pairs:** a sparkle sound for each matched pair, and a short tune when all five are done.
- **Streak:** a warm chime when the streak grows.
- **Graduation:** a short, happy melody.

### How they're made
- Generated in the browser with the Web Audio API, so there are no sound files to download, and they work offline with no extra size.
- Played only after a tap, as Android requires, so nothing plays by surprise when the app opens.

### Rules
- **On by default, at a soft volume,** so Rezi doesn't need to set anything up. A **Sounds: On / Off** switch in ⚙️ Settings turns them off, remembered on the device.
- Effects never play over the 🔊 pronunciation, so a word is always heard clearly.
- No sound is needed to use the app: every sound goes with something visible.

### Done when
Every sound plays at the right moment, nothing overlaps the pronunciation, and the Settings switch silences everything.
