# Bulk Delete BAD Songs Design

**Date:** 2026-05-01  
**Status:** Approved

## Overview

Add a "clean up?" link to the song counter that lets the user delete all BAD-rated songs from Firebase Storage in one action. All rating UI (GOOD/BAD buttons, BAD filter, cleanup link) lives exclusively on a long-lived `cleanup` branch — `main` is reverted to the clean player with no rating UI.

## Branch Architecture

| Branch | Contents |
|--------|----------|
| `main` | Clean music player — no rating UI, no Firestore functions |
| `cleanup` | All rating code + new bulk deletion feature |

**Workflow:** When the user wants to rate and delete songs, they run the app from the `cleanup` branch. When done, they switch back to `main`. Firestore ratings data persists in the cloud between sessions.

The `cleanup` branch is long-lived and periodically rebased onto `main` to stay current.

## Revert main

All changes introduced by the song-rating feature must be removed from `main`:
- `src/services/firebase.js` — remove Firestore import, `db` init, `fetchAllRatings`, `setRating`, `removeRating`
- `src/components/MusicPlayer.jsx` — remove `ratings` state, `showBadOnly` state, `handleRate`, rating buttons JSX, BAD filter row, BAD badge, updated `filteredSongs`, updated `handleSearchToggle`, updated `loadData`
- `src/index.css` — remove rating button styles, filter row styles, BAD badge styles

## Deletion Feature (cleanup branch only)

### Data Layer

New function in `src/services/firebase.js`:

```js
export async function deleteSong(fullPath) {
    const fileRef = ref(storage, fullPath);
    await deleteObject(fileRef);
}
```

Also update `storage.rules` to allow delete (on cleanup branch only):

```
match /music/{allPaths=**} {
    allow read: if true;
    allow delete: if true;
}
```

### UI — Song Counter

Current: `"24 tracks in library"`

When BAD songs exist: `"24 tracks in library · 3 BAD — clean up?"`  
- "clean up?" is a small red-tinted clickable span

Clicking "clean up?" switches to confirmation state:  
`"Delete 3 BAD songs forever? [Yes, delete] [Cancel]"`

Cancelling returns to normal display. Confirming triggers deletion.

### Deletion Process

On confirm, for each BAD-rated song in parallel (`Promise.allSettled`):
1. `deleteSong(fullPath)` — removes file from Firebase Storage
2. `removeRating(fullPath)` — removes rating doc from Firestore

After all settle:
- Successfully deleted songs removed from local `songs` state
- Their entries removed from local `ratings` state
- If currently playing song was deleted: playback stops, `currentSong` set to null
- If any failed: error message shows "X songs couldn't be deleted — try again"
- Counter returns to normal display

## Error Handling

- Partial failure is fine — `Promise.allSettled` applies successes even when some fail
- Failed deletions are reported by count; user can retry (re-confirm)
- If all succeed, counter returns to normal with updated track count
