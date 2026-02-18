# 🎵 Shuffle — Personal Music Player

A personal, cloud-backed music player built for listening to your own library. Shuffle pulls tracks from Firebase Storage and plays them randomly — no playlists, no algorithms, just your music on shuffle.

Live at [alyxmusic.vercel.app](https://alyxmusic.vercel.app)

---

## What It Does

Shuffle is a minimal, single-purpose music player. You upload your audio files to Firebase Storage, and the app streams them directly in the browser. There's no queue management, no search, and no library browsing — just a single button that picks a random track and plays it.

When a song ends, the next one plays automatically. You can also hit shuffle at any time to skip to something new.

---

## How It Works

The app fetches a list of all files from a `/music` folder in Firebase Storage on load. When you hit shuffle, it picks a random file, generates a signed download URL, and streams it through [Howler.js](https://howlerjs.com). Progress, volume, and playback state are all managed locally in React.

Song names are derived from filenames — dashes and underscores are replaced with spaces and the result is title-cased.

---

## UI

- Animated vinyl disc that spins during playback
- Audio visualizer with 7 bars that animate while playing
- Seekable progress bar with elapsed / total time
- Volume slider with mute toggle
- Smooth transitions via Framer Motion
- Dark theme with glassmorphism card and gradient accents

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 19 + Vite |
| Audio | Howler.js |
| Storage | Firebase Storage |
| Animations | Framer Motion |
| Styling | Vanilla CSS |
| Hosting | Vercel |

---

## Project Structure

```
src/
├── components/
│   └── MusicPlayer.jsx   # The entire player UI and logic
├── services/
│   └── firebase.js       # Firebase init, file listing, URL generation
├── App.jsx
├── main.jsx
└── index.css             # Design system, animations, layout
```

The app is intentionally simple — one component handles everything from fetching the track list to rendering the UI.
