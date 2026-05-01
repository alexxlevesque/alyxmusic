# Bulk Delete BAD Songs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "clean up?" link to the song counter that bulk-deletes all BAD-rated songs from Firebase Storage, and revert all rating UI from `main` so it only lives on a `cleanup` branch.

**Architecture:** Create a `cleanup` branch from current `main` (which already has the rating code), add the deletion feature there, then revert the 4 rating commits from `main` using `git revert`. The `cleanup` branch is long-lived — switch to it for cleanup sessions, back to `main` for normal use.

**Tech Stack:** React 19, Firebase v12 (Storage + Firestore), Vite

---

## File Map

| File | Branch | Change |
|------|--------|--------|
| `src/services/firebase.js` | `cleanup` | Add `deleteObject` import + `deleteSong` function |
| `src/components/MusicPlayer.jsx` | `cleanup` | Add `isConfirmingDelete` state, `badSongs`, `handleDeleteBad`, updated counter JSX |
| `src/index.css` | `cleanup` | Add counter link/confirm button styles |
| `storage.rules` | `cleanup` | Add `allow delete: if true` |
| `src/services/firebase.js` | `main` | Revert to pre-rating state (no Firestore) |
| `src/components/MusicPlayer.jsx` | `main` | Revert to pre-rating state (no ratings UI) |
| `src/index.css` | `main` | Revert to pre-rating state (no rating styles) |

---

## Task 1: Create the cleanup branch

**Files:** none (git only)

- [ ] **Step 1: Create `cleanup` branch from current `main`**

```bash
git checkout -b cleanup
```

Expected output: `Switched to a new branch 'cleanup'`

- [ ] **Step 2: Verify the branch has all rating code**

```bash
git log --oneline -6
```

Expected: see `feat: add BAD filter and badges to search panel` and the other rating commits in the log.

---

## Task 2: Add `deleteSong` to firebase.js

**Files:**
- Modify: `src/services/firebase.js`

- [ ] **Step 1: Add `deleteObject` to the storage import line and add `deleteSong`**

Replace:
```js
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
```
With:
```js
import { getStorage, ref, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
```

Then add this function after `removeRating`:
```js
export async function deleteSong(fullPath) {
    const fileRef = ref(storage, fullPath);
    await deleteObject(fileRef);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/firebase.js
git commit -m "feat(cleanup): add deleteSong to firebase.js"
```

---

## Task 3: Add deletion state and logic to MusicPlayer.jsx

**Files:**
- Modify: `src/components/MusicPlayer.jsx`

- [ ] **Step 1: Add `deleteSong` to the firebase import line**

Replace:
```js
import { fetchMusicList, getMusicURL, fetchAllRatings, setRating, removeRating } from '../services/firebase';
```
With:
```js
import { fetchMusicList, getMusicURL, fetchAllRatings, setRating, removeRating, deleteSong } from '../services/firebase';
```

- [ ] **Step 2: Add `isConfirmingDelete` state — insert after the `showBadOnly` useState line**

```js
const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
```

- [ ] **Step 3: Add `badSongs` computed value — insert right after the `filteredSongs` computed value**

```js
const badSongs = songs.filter(s => ratings.get(s.fullPath) === 'bad');
```

- [ ] **Step 4: Add `handleDeleteBad` callback — insert after the `handleRate` callback**

```js
const handleDeleteBad = useCallback(async () => {
    const toDelete = songs.filter(s => ratings.get(s.fullPath) === 'bad');
    const results = await Promise.allSettled(
        toDelete.map(song => Promise.all([
            deleteSong(song.fullPath),
            removeRating(song.fullPath),
        ]))
    );
    const succeededPaths = new Set(
        toDelete.filter((_, i) => results[i].status === 'fulfilled').map(s => s.fullPath)
    );
    const failCount = results.filter(r => r.status === 'rejected').length;
    setSongs(prev => prev.filter(s => !succeededPaths.has(s.fullPath)));
    setRatings(prev => {
        const next = new Map(prev);
        succeededPaths.forEach(p => next.delete(p));
        return next;
    });
    if (currentSong && succeededPaths.has(currentSong.fullPath)) {
        if (howlRef.current) howlRef.current.unload();
        howlRef.current = null;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setCurrentSong(null);
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        setDuration(0);
    }
    setIsConfirmingDelete(false);
    if (failCount > 0) {
        setError(`${failCount} song${failCount !== 1 ? 's' : ''} couldn't be deleted — try again.`);
    }
}, [songs, ratings, currentSong]);
```

- [ ] **Step 5: Commit**

```bash
git add src/components/MusicPlayer.jsx
git commit -m "feat(cleanup): add deletion state and handleDeleteBad"
```

---

## Task 4: Update the song counter JSX

**Files:**
- Modify: `src/components/MusicPlayer.jsx`

- [ ] **Step 1: Replace the song counter JSX at the bottom of the component**

Find and replace this block:
```jsx
{/* Song counter */}
{!initialLoad && (
    <motion.div
        className="song-counter"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
    >
        {songs.length > 0
            ? `${songs.length} track${songs.length !== 1 ? 's' : ''} in library`
            : 'No tracks found — upload to Firebase Storage /music'}
    </motion.div>
)}
```

With:
```jsx
{/* Song counter */}
{!initialLoad && (
    <motion.div
        className="song-counter"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
    >
        {songs.length > 0 ? (
            isConfirmingDelete ? (
                <>
                    {`Delete ${badSongs.length} BAD song${badSongs.length !== 1 ? 's' : ''} forever? `}
                    <span className="counter-confirm-btn" onClick={handleDeleteBad}>Yes, delete</span>
                    {' · '}
                    <span className="counter-cancel-btn" onClick={() => setIsConfirmingDelete(false)}>Cancel</span>
                </>
            ) : (
                <>
                    {`${songs.length} track${songs.length !== 1 ? 's' : ''} in library`}
                    {badSongs.length > 0 && (
                        <>
                            {` · ${badSongs.length} BAD — `}
                            <span className="counter-cleanup-link" onClick={() => setIsConfirmingDelete(true)}>clean up?</span>
                        </>
                    )}
                </>
            )
        ) : 'No tracks found — upload to Firebase Storage /music'}
    </motion.div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MusicPlayer.jsx
git commit -m "feat(cleanup): update song counter with BAD cleanup link"
```

---

## Task 5: Update storage.rules and add CSS

**Files:**
- Modify: `storage.rules`
- Modify: `src/index.css`

- [ ] **Step 1: Add `allow delete` to storage.rules**

Replace:
```
    match /music/{allPaths=**} {
      allow read: if true;
    }
```
With:
```
    match /music/{allPaths=**} {
      allow read: if true;
      allow delete: if true;
    }
```

- [ ] **Step 2: Add counter link styles to the end of `src/index.css` (before the `@media` block)**

```css
/* ========================= */
/* COUNTER CLEANUP LINKS     */
/* ========================= */
.counter-cleanup-link {
    color: #fca5a5;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-style: dotted;
    transition: color 0.2s ease;
}

.counter-cleanup-link:hover {
    color: #ef4444;
}

.counter-confirm-btn {
    color: #fca5a5;
    cursor: pointer;
    font-weight: 600;
    transition: color 0.2s ease;
}

.counter-confirm-btn:hover {
    color: #ef4444;
}

.counter-cancel-btn {
    color: var(--text-tertiary);
    cursor: pointer;
    transition: color 0.2s ease;
}

.counter-cancel-btn:hover {
    color: var(--text-secondary);
}
```

- [ ] **Step 3: Commit**

```bash
git add storage.rules src/index.css
git commit -m "feat(cleanup): add delete permission to storage rules and counter styles"
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`

1. Rate at least one song as BAD
2. Song counter shows: `"X tracks in library · 1 BAD — clean up?"`
3. Click "clean up?" → counter switches to: `"Delete 1 BAD song forever? Yes, delete · Cancel"`
4. Click Cancel → counter returns to normal
5. Click "clean up?" again → click "Yes, delete" → song disappears from library, counter updates
6. If the deleted song was playing, player resets to "No track selected"

---

## Task 6: Revert rating code from main

**Files:**
- Modify: `src/services/firebase.js` (main)
- Modify: `src/components/MusicPlayer.jsx` (main)
- Modify: `src/index.css` (main)

- [ ] **Step 1: Switch to main**

```bash
git checkout main
```

- [ ] **Step 2: Revert the 4 rating commits (newest first)**

```bash
git revert bb6c8b9 4cac7a5 bffbae3 45d4a06 --no-edit
```

Expected: 4 new revert commits created on main. No merge conflicts since these are clean sequential commits.

- [ ] **Step 3: Verify main is clean**

Run: `npm run dev`

Open the app — no GOOD/BAD buttons, no BAD filter, no "clean up?" link. Songs play normally.

- [ ] **Step 4: Verify cleanup branch still has everything**

```bash
git checkout cleanup
npm run dev
```

Open the app — GOOD/BAD buttons present, BAD filter present, "clean up?" link appears after rating a song BAD.

```bash
git checkout main
```
