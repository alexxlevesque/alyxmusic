import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';
import { fetchMusicList, getMusicURL } from '../services/firebase';

/* ——— Icon Components ——— */
const PlayIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
);

const PauseIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

const ShuffleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8" />
        <line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" />
        <line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
);

const VolumeHighIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
);

const VolumeMuteIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
);

const VolumeLowIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
    </svg>
);

/* ——— Helper: format seconds ——— */
function formatTime(secs) {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ——— Clean filename ——— */
function cleanSongName(filename) {
    return filename
        .replace(/\.[^/.]+$/, '')          // remove extension
        .replace(/[-_]/g, ' ')             // replace dashes/underscores
        .replace(/\b\w/g, c => c.toUpperCase()); // title case
}

export default function MusicPlayer() {
    const [songs, setSongs] = useState([]);
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    const howlRef = useRef(null);
    const rafRef = useRef(null);
    const previousVolume = useRef(0.7);

    // Load song list on mount
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

    // Progress updater
    const updateProgress = useCallback(() => {
        if (howlRef.current && howlRef.current.playing()) {
            const seek = howlRef.current.seek() || 0;
            const dur = howlRef.current.duration() || 0;
            setCurrentTime(seek);
            setDuration(dur);
            setProgress(dur > 0 ? (seek / dur) * 100 : 0);
            rafRef.current = requestAnimationFrame(updateProgress);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (howlRef.current) howlRef.current.unload();
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const playRandomSong = async () => {
        if (songs.length === 0) return;

        setIsLoading(true);
        setError(null);

        // Stop current
        if (howlRef.current) {
            howlRef.current.unload();
            howlRef.current = null;
        }
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        // Pick random song (avoid repeating if possible)
        let randomIndex;
        if (songs.length === 1) {
            randomIndex = 0;
        } else {
            do {
                randomIndex = Math.floor(Math.random() * songs.length);
            } while (currentSong && songs[randomIndex].fullPath === currentSong.fullPath);
        }

        const song = songs[randomIndex];

        try {
            const url = await getMusicURL(song.fullPath);
            const howl = new Howl({
                src: [url],
                html5: true,
                volume: isMuted ? 0 : volume,
                onplay: () => {
                    setIsPlaying(true);
                    setIsLoading(false);
                    setDuration(howl.duration());
                    rafRef.current = requestAnimationFrame(updateProgress);
                },
                onend: () => {
                    setIsPlaying(false);
                    setProgress(0);
                    setCurrentTime(0);
                    // Auto-play next random
                    playRandomSong();
                },
                onloaderror: (_, err) => {
                    setIsLoading(false);
                    setError('Failed to load this track. Trying another...');
                    console.error('Load error:', err);
                },
                onstop: () => {
                    setIsPlaying(false);
                },
            });

            howlRef.current = howl;
            setCurrentSong(song);
            howl.play();
        } catch (err) {
            setIsLoading(false);
            setError('Failed to get the download URL. Check Firebase Storage rules.');
            console.error(err);
        }
    };

    const togglePlayPause = () => {
        if (!howlRef.current) return;
        if (isPlaying) {
            howlRef.current.pause();
            setIsPlaying(false);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        } else {
            howlRef.current.play();
        }
    };

    const handleProgressClick = (e) => {
        if (!howlRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        const seekTo = pct * duration;
        howlRef.current.seek(seekTo);
        setCurrentTime(seekTo);
        setProgress(pct * 100);
    };

    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        setIsMuted(val === 0);
        if (howlRef.current) howlRef.current.volume(val);
    };

    const toggleMute = () => {
        if (isMuted) {
            const restored = previousVolume.current || 0.7;
            setVolume(restored);
            setIsMuted(false);
            if (howlRef.current) howlRef.current.volume(restored);
        } else {
            previousVolume.current = volume;
            setVolume(0);
            setIsMuted(true);
            if (howlRef.current) howlRef.current.volume(0);
        }
    };

    const VolumeIcon = isMuted ? VolumeMuteIcon : volume < 0.4 ? VolumeLowIcon : VolumeHighIcon;

    const vinylClass = isPlaying ? 'spinning' : currentSong ? 'paused' : '';

    return (
        <div className="app-container">
            {/* Ambient Background */}
            <div className="ambient-bg" />

            {/* Header */}
            <motion.header
                className="app-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <h1 className="app-logo">Shuffle</h1>
                <p className="app-tagline">Random Music Player</p>
            </motion.header>

            {/* Player Card */}
            <motion.div
                className="player-card"
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
            >
                {/* Vinyl Disc */}
                <motion.div
                    className="vinyl-container"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <div className={`vinyl-disc ${vinylClass}`}>
                        <div className="vinyl-grooves" />
                        <div className="vinyl-center" />
                    </div>
                </motion.div>

                {/* Song Info */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSong?.fullPath || 'empty'}
                        className="song-info"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {currentSong ? (
                            <>
                                <span className="song-title">{cleanSongName(currentSong.name)}</span>
                                <span className="song-status">
                                    <span className={`status-dot ${isPlaying ? '' : 'idle'}`} />
                                    {isLoading ? 'Loading...' : isPlaying ? 'Now Playing' : 'Paused'}
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="song-title" style={{ color: 'var(--text-secondary)' }}>
                                    No track selected
                                </span>
                                <span className="song-status">
                                    <span className="status-dot idle" />
                                    Hit shuffle to begin
                                </span>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Visualizer */}
                <div className={`visualizer ${isPlaying ? 'active' : ''}`}>
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="visualizer-bar" />
                    ))}
                </div>

                {/* Progress */}
                {currentSong && (
                    <motion.div
                        className="progress-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div
                            className="progress-bar-wrapper"
                            onClick={handleProgressClick}
                            id="progress-bar"
                        >
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="progress-times">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </motion.div>
                )}

                {/* Controls */}
                <div className="controls">
                    <button
                        className="play-btn"
                        onClick={currentSong ? togglePlayPause : playRandomSong}
                        disabled={isLoading || (initialLoad && songs.length === 0)}
                        id="play-pause-btn"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isLoading ? (
                            <div className="loading-spinner" />
                        ) : isPlaying ? (
                            <PauseIcon />
                        ) : (
                            <PlayIcon />
                        )}
                    </button>
                </div>

                {/* Shuffle Button */}
                <motion.button
                    className="shuffle-btn"
                    onClick={playRandomSong}
                    disabled={isLoading || songs.length === 0}
                    whileTap={{ scale: 0.97 }}
                    id="shuffle-btn"
                >
                    <ShuffleIcon />
                    <span>Shuffle Random Track</span>
                </motion.button>

                {/* Volume */}
                {currentSong && (
                    <motion.div
                        className="volume-control"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="volume-icon" onClick={toggleMute}>
                            <VolumeIcon />
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="volume-slider"
                            id="volume-slider"
                            aria-label="Volume"
                        />
                    </motion.div>
                )}

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="error-message"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

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
        </div>
    );
}
