# Song Rating Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent GOOD/BAD rating buttons to the currently playing song, backed by Firestore, with a BAD filter in the search panel.

**Architecture:** Three Firestore utility functions in `firebase.js` handle all reads/writes. `MusicPlayer.jsx` loads all ratings on mount into a `Map`, uses optimistic updates on every rating action, and rolls back on failure. The search panel gains a "Show BAD" toggle that filters the song list client-side.

**Tech Stack:** React 19, Firebase v12 (Firestore + Storage), Framer Motion, Howler, Vite

---

## File Map

| File | Change |
|------|--------|
| `src/services/firebase.js` | Add Firestore init + `fetchAllRatings`, `setRating`, `removeRating` |
| `src/components/MusicPlayer.jsx` | Add `ratings` state, `handleRate`, rating buttons JSX, BAD filter |
| `src/index.css` | Add styles for rating buttons, filter toggle, BAD badge |

---

## Pre-requisite: Enable Firestore in Firebase Console

> **Manual step — do this before writing any code.**

1. Go to [Firebase Console](https://console.firebase.google.com) → your project
2. In the left sidebar: **Build → Firestore Database**
3. Click **Create database** → choose **Start in test mode** → pick a region → **Done**
4. Once created, go to **Rules** tab and set:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Click **Publish**

> Test mode rules allow all reads/writes — fine for a personal single-user app.

---

## Task 1: Add Firestore functions to firebase.js

**Files:**
- Modify: `src/services/firebase.js`

- [ ] **Step 1: Replace the contents of `src/services/firebase.js`**

```js
import { initializeApp } from 'firebase/app';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

export async function fetchMusicList() {
    const musicRef = ref(storage, 'music');
    const result = await listAll(musicRef);
    return result.items.map((item) => ({
        name: item.name,
        fullPath: item.fullPath,
    }));
}

export async function getMusicURL(fullPath) {
    const fileRef = ref(storage, fullPath);
    return getDownloadURL(fileRef);
}

function pathToDocId(fullPath) {
    return encodeURIComponent(fullPath);
}

export async function fetchAllRatings() {
    const snapshot = await getDocs(collection(db, 'ratings'));
    const map = new Map();
    snapshot.forEach(d => {
        map.set(d.data().fullPath, d.data().rating);
    });
    return map;
}

export async function setRating(fullPath, rating) {
    await setDoc(doc(db, 'ratings', pathToDocId(fullPath)), { fullPath, rating });
}

export async function removeRating(fullPath) {
    await deleteDoc(doc(db, 'ratings', pathToDocId(fullPath)));
}

export { storage };
```

- [ ] **Step 2: Verify the app still loads**

Run: `npm run dev`  
Open `http://localhost:5173` — the player should load and songs should still fetch. No console errors related to Firebase init.

- [ ] **Step 3: Commit**

```bash
git add src/services/firebase.js
git commit -m "feat: add Firestore rating functions to firebase.js"
```

---

## Task 2: Wire ratings state into MusicPlayer

**Files:**
- Modify: `src/components/MusicPlayer.jsx` (import line + useState + useEffect)

- [ ] **Step 1: Update the import line at the top of `MusicPlayer.jsx`**

Replace:
```js
import { fetchMusicList, getMusicURL } from '../services/firebase';
```
With:
```js
import { fetchMusicList, getMusicURL, fetchAllRatings, setRating, removeRating } from '../services/firebase';
```

- [ ] **Step 2: Add `ratings` state — insert after the `showSearch` useState line (line ~101)**

```js
const [ratings, setRatings] = useState(new Map());
```

- [ ] **Step 3: Replace the `loadSongs` useEffect with `loadData` that fetches both songs and ratings in parallel**

Replace this block:
```js
useEffect(() => {
    async function loadSongs() {
        try {
            const list = await fetchMusicList();
            setSongs(list);
        } catch (err) {
            console.error('Failed to fetch songs:', err);
            setError('Could not connect to music library. Check your Firebase config.');
        } finally {
            setInitialLoad(false);
        }
    }
    loadSongs();
}, []);
```

With:
```js
useEffect(() => {
    async function loadData() {
        try {
            const [list, ratingsMap] = await Promise.all([
                fetchMusicList(),
                fetchAllRatings().catch(err => {
                    console.error('Failed to fetch ratings:', err);
                    return new Map();
                }),
            ]);
            setSongs(list);
            setRatings(ratingsMap);
        } catch (err) {
            console.error('Failed to fetch songs:', err);
            setError('Could not connect to music library. Check your Firebase config.');
        } finally {
            setInitialLoad(false);
        }
    }
    loadData();
}, []);
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`  
Open app — songs load as before. Open browser DevTools → Network tab — you should see a Firestore request to `ratings` (it returns empty, which is fine).

- [ ] **Step 5: Commit**

```bash
git add src/components/MusicPlayer.jsx
git commit -m "feat: load ratings from Firestore on mount"
```

---

## Task 3: Add GOOD/BAD buttons to the player card

**Files:**
- Modify: `src/components/MusicPlayer.jsx` (add `handleRate` callback + JSX)
- Modify: `src/index.css` (add rating button styles)

- [ ] **Step 1: Add the `handleRate` callback — insert after the `playSong` callback (~line 213)**

```js
const handleRate = useCallback(async (rating) => {
    if (!currentSong) return;
    const { fullPath } = currentSong;
    const existing = ratings.get(fullPath);
    const newRatings = new Map(ratings);
    if (existing === rating) {
        newRatings.delete(fullPath);
    } else {
        newRatings.set(fullPath, rating);
    }
    setRatings(newRatings);
    try {
        if (existing === rating) {
            await removeRating(fullPath);
        } else {
            await setRating(fullPath, rating);
        }
    } catch (err) {
        setRatings(ratings);
        setError('Failed to save rating. Try again.');
        console.error(err);
    }
}, [currentSong, ratings]);
```

- [ ] **Step 2: Add rating buttons JSX — insert between the closing `</AnimatePresence>` of song-info and the `<div className="visualizer"...>` line**

```jsx
{currentSong && (
    <div className="rating-buttons">
        <button
            className={`rating-btn good${ratings.get(currentSong.fullPath) === 'good' ? ' active' : ''}`}
            onClick={() => handleRate('good')}
            disabled={isLoading}
            aria-label="Rate good"
        >
            GOOD
        </button>
        <button
            className={`rating-btn bad${ratings.get(currentSong.fullPath) === 'bad' ? ' active' : ''}`}
            onClick={() => handleRate('bad')}
            disabled={isLoading}
            aria-label="Rate bad"
        >
            BAD
        </button>
    </div>
)}
```

- [ ] **Step 3: Add rating button styles to the end of `src/index.css`**

```css
/* ========================= */
/* RATING BUTTONS            */
/* ========================= */
.rating-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
}

.rating-btn {
    padding: 6px 20px;
    border-radius: var(--radius-full);
    border: 1.5px solid var(--border-subtle);
    background: transparent;
    color: var(--text-tertiary);
    font-family: var(--font-primary);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.2s ease;
}

.rating-btn:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.15);
    color: var(--text-secondary);
}

.rating-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

.rating-btn.good.active {
    background: rgba(16, 185, 129, 0.12);
    border-color: var(--accent-emerald);
    color: var(--accent-emerald);
}

.rating-btn.bad.active {
    background: rgba(239, 68, 68, 0.12);
    border-color: #ef4444;
    color: #fca5a5;
}
```

- [ ] **Step 4: Verify in browser**

1. Shuffle to a song
2. GOOD and BAD buttons appear below the song title
3. Click GOOD → button highlights green
4. Click GOOD again → unhighlights (toggle off)
5. Click BAD → highlights red; GOOD unhighlights
6. Shuffle to a different song → buttons reset
7. Shuffle back to the first song → rating reappears (loaded from Firestore)
8. Check Firebase Console → Firestore → `ratings` collection — documents should be visible

- [ ] **Step 5: Commit**

```bash
git add src/components/MusicPlayer.jsx src/index.css
git commit -m "feat: add GOOD/BAD rating buttons to player card"
```

---

## Task 4: Add BAD filter to the search panel

**Files:**
- Modify: `src/components/MusicPlayer.jsx` (state + filteredSongs + JSX)
- Modify: `src/index.css` (filter button + badge styles)

- [ ] **Step 1: Add `showBadOnly` state — insert after the `searchQuery` useState line**

```js
const [showBadOnly, setShowBadOnly] = useState(false);
```

- [ ] **Step 2: Update `handleSearchToggle` to reset `showBadOnly` on close**

Replace:
```js
const handleSearchToggle = () => {
    if (!showSearch) {
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
        setShowSearch(false);
        setSearchQuery('');
    }
};
```

With:
```js
const handleSearchToggle = () => {
    if (!showSearch) {
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
        setShowSearch(false);
        setSearchQuery('');
        setShowBadOnly(false);
    }
};
```

- [ ] **Step 3: Update the `filteredSongs` computed value**

Replace:
```js
const filteredSongs = searchQuery.trim()
    ? songs.filter(s =>
        cleanSongName(s.name).toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : songs;
```

With:
```js
const filteredSongs = showBadOnly
    ? songs.filter(s => ratings.get(s.fullPath) === 'bad')
    : searchQuery.trim()
        ? songs.filter(s =>
            cleanSongName(s.name).toLowerCase().includes(searchQuery.toLowerCase().trim())
          )
        : songs;
```

- [ ] **Step 4: Add the "Show BAD" filter row to the search panel JSX — insert between the closing `</div>` of `search-input-wrapper` and the `<ul className="search-results"...>`**

```jsx
<div className="search-filter-row">
    <button
        className={`filter-bad-btn${showBadOnly ? ' active' : ''}`}
        onClick={() => setShowBadOnly(v => !v)}
    >
        Show BAD
    </button>
</div>
```

- [ ] **Step 5: Add BAD badge to search result items — update the `<li>` inside `search-results`**

Replace:
```jsx
<li
    key={song.fullPath}
    className={`search-result-item${currentSong?.fullPath === song.fullPath ? ' active' : ''}`}
    onClick={() => playSong(song)}
    role="option"
    aria-selected={currentSong?.fullPath === song.fullPath}
>
    <span className="result-icon">
        {currentSong?.fullPath === song.fullPath && isPlaying ? '▶' : '♪'}
    </span>
    <span className="result-name">{cleanSongName(song.name)}</span>
</li>
```

With:
```jsx
<li
    key={song.fullPath}
    className={`search-result-item${currentSong?.fullPath === song.fullPath ? ' active' : ''}`}
    onClick={() => playSong(song)}
    role="option"
    aria-selected={currentSong?.fullPath === song.fullPath}
>
    <span className="result-icon">
        {currentSong?.fullPath === song.fullPath && isPlaying ? '▶' : '♪'}
    </span>
    <span className="result-name">{cleanSongName(song.name)}</span>
    {ratings.get(song.fullPath) === 'bad' && (
        <span className="bad-badge">BAD</span>
    )}
</li>
```

- [ ] **Step 6: Add filter and badge styles to the end of `src/index.css`**

```css
/* ========================= */
/* SEARCH BAD FILTER         */
/* ========================= */
.search-filter-row {
    display: flex;
    gap: 8px;
}

.filter-bad-btn {
    padding: 4px 12px;
    border-radius: var(--radius-full);
    border: 1.5px solid var(--border-subtle);
    background: transparent;
    color: var(--text-tertiary);
    font-family: var(--font-primary);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: all 0.2s ease;
}

.filter-bad-btn:hover {
    border-color: rgba(239, 68, 68, 0.3);
    color: #fca5a5;
}

.filter-bad-btn.active {
    background: rgba(239, 68, 68, 0.12);
    border-color: #ef4444;
    color: #fca5a5;
}

.bad-badge {
    margin-left: auto;
    flex-shrink: 0;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #fca5a5;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.2);
}
```

- [ ] **Step 7: Verify in browser**

1. Open the search panel
2. A "Show BAD" button appears below the search input
3. Click "Show BAD" → button highlights red → list filters to only BAD-rated songs
4. Click "Show BAD" again → all songs return
5. BAD-rated songs in the full list show a red "BAD" badge
6. Close and re-open the search panel → "Show BAD" is off (reset correctly)

- [ ] **Step 8: Commit**

```bash
git add src/components/MusicPlayer.jsx src/index.css
git commit -m "feat: add BAD filter and badges to search panel"
```
