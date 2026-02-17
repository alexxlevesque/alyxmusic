# 🎵 Shuffle — Random Music Player

A beautiful, modern music player that plays random tracks from your Firebase Storage library. Built with React, Vite, Firebase, and Howler.js.

![Music Player](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Storage-FFCA28?logo=firebase)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite)

## ✨ Features

- 🎲 **Random playback** — Shuffle through your music library
- 🎨 **Premium UI** — Dark theme with glassmorphism and gradient accents
- 💿 **Animated vinyl disc** — Spins when music plays
- 📊 **Audio visualizer** — Dynamic bars that react to playback
- 🎚️ **Volume control** — Adjustable volume with mute toggle
- ⏱️ **Progress tracking** — Seekable progress bar with time display
- 📱 **Responsive design** — Works on all screen sizes
- 🔄 **Auto-play next** — Automatically plays another random track when one ends

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- A Firebase account (free tier works perfectly)

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project (or use existing)
   - Add a web app to get your config
   - Copy `.env.example` to `.env` and fill in your Firebase credentials

3. **Configure Firebase Storage:**
   
   **Option A: Using Firebase Console (Easiest)**
   - Go to Firebase Console → Storage → Rules
   - Replace the rules with:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /music/{allPaths=**} {
         allow read: if true;
       }
     }
   }
   ```
   - Click **Publish**

   **Option B: Using Firebase CLI**
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Login: `firebase login`
   - Initialize: `firebase init storage`
   - Edit `storage.rules` with the rules above
   - Deploy: `firebase deploy --only storage`

4. **Upload your music:**
   - In Firebase Console, go to **Storage**
   - Create a folder called `music`
   - Upload your audio files (`.mp3`, `.wav`, `.ogg`, `.m4a`)
   - Supported formats: MP3, WAV, OGG, M4A, FLAC

5. **Run the app:**
   ```bash
   npm run dev
   ```
   - Open [http://localhost:5173](http://localhost:5173)
   - Click "Shuffle Random Track" to start playing!

## 🎵 Adding Music

### Via Firebase Console (Recommended)
1. Go to Firebase Console → Storage
2. Navigate to the `music/` folder
3. Click "Upload file" and select your audio files
4. Wait for upload to complete
5. Refresh your app — the new tracks will appear!

### Via Firebase CLI
```bash
firebase storage:upload local-file.mp3 music/song-name.mp3
```

## 🛠️ Tech Stack

- **React 19** — UI framework
- **Vite 7** — Build tool and dev server
- **Firebase Storage** — Cloud file storage (5GB free)
- **Howler.js** — Audio playback engine
- **Framer Motion** — Smooth animations
- **CSS3** — Custom design system with gradients and glassmorphism

## 📁 Project Structure

```
music-player/
├── src/
│   ├── components/
│   │   └── MusicPlayer.jsx    # Main player component
│   ├── services/
│   │   └── firebase.js         # Firebase config & helpers
│   ├── App.jsx                 # App shell
│   ├── main.jsx                # Entry point
│   └── index.css               # Design system & styles
├── .env                        # Firebase credentials (gitignored)
├── .env.example                # Template for .env
└── package.json
```

## 🎨 Design Features

- **Dark theme** with deep navy background
- **Glassmorphism** card with backdrop blur
- **Gradient accents** (purple → pink → cyan)
- **Animated vinyl disc** with realistic grooves
- **Audio visualizer** with 7 animated bars
- **Smooth transitions** using Framer Motion
- **Responsive layout** for mobile and desktop

## 🔧 Configuration

### Environment Variables

Create a `.env` file with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Firebase Storage Rules

For **development** (allows anyone to read):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /music/{allPaths=**} {
      allow read: if true;
    }
  }
}
```

For **production** (requires authentication):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /music/{allPaths=**} {
      allow read: if request.auth != null;
    }
  }
}
```

## 🐛 Troubleshooting

### "Could not connect to music library"
- Check that your `.env` file exists and has correct Firebase credentials
- Restart the dev server after creating/editing `.env`

### "No tracks found"
- Make sure you've uploaded files to the `music/` folder in Firebase Storage
- Check that your Storage rules allow reading (see Configuration above)

### CORS errors in console
- Update your Firebase Storage rules to allow read access
- Make sure you're using the correct bucket name in your config

### Music won't play
- Check browser console for errors
- Verify the audio file format is supported (MP3, WAV, OGG, M4A)
- Ensure files are in the `music/` folder, not a subfolder

## 📝 License

MIT

## 🙏 Credits

Built with:
- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Firebase](https://firebase.google.com)
- [Howler.js](https://howlerjs.com)
- [Framer Motion](https://www.framer.com/motion)

---

**Enjoy your music!** 🎧
