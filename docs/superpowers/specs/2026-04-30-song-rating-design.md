# Song Rating Feature Design

**Date:** 2026-04-30  
**Status:** Approved

## Overview

Add GOOD/BAD rating buttons to the currently playing song. Ratings persist in Firestore so they survive page reloads and re-shuffles. The search panel gains a "Show BAD" filter so the user can identify songs to manually delete from Firebase Storage.

## Data Layer

**Firestore collection:** `ratings`

Each document ID is the song's `fullPath` with `/` replaced by `_` (e.g. `music/song.mp3` → `music_song.mp3`).

Document shape:
```json
{ "rating": "good" | "bad" }
```

Three new functions added to `src/services/firebase.js`:

- `fetchAllRatings()` — reads all docs in the `ratings` collection, returns `Map<fullPath, 'good'|'bad'>`
- `setRating(fullPath, rating)` — writes/overwrites one doc
- `removeRating(fullPath)` — deletes a doc (for un-rating)

## State & UI

**New state in `MusicPlayer.jsx`:**
- `ratings: Map<fullPath, 'good'|'bad'>` — loaded once on mount alongside `fetchMusicList()`

**Player card — rating buttons:**
- Placed below the song title, above the visualizer
- Two buttons: **GOOD** and **BAD**
- Active rating is highlighted; clicking the active rating removes it (toggle off)
- Clicking the other rating switches it
- Buttons are disabled while `isLoading` is true
- Only shown when a song is loaded (`currentSong` is not null)

**Rating writes:**
- `setRating` / `removeRating` called on Firestore
- Local `ratings` state updated immediately (optimistic update — no refetch)

**Search panel — BAD filter:**
- A "Show BAD" toggle button in the search panel header
- When active: list shows only BAD-rated songs, ignoring the text search query
- BAD-rated songs in the list show a small visual indicator (red badge or dot)

## Error Handling

- If `fetchAllRatings()` fails on mount: ratings silently degrade to empty, player still works, console error logged
- If `setRating()` / `removeRating()` fails: optimistic local update is rolled back, brief error shown via existing `error` state
- No authentication — ratings are global (single-user personal player)

## Out of Scope

- In-app deletion from Firebase Storage
- Per-user rating isolation
- Additional rating tiers beyond GOOD/BAD
