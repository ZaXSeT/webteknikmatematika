"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";

export default function BackgroundMusic() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Local music file
    const musicUrl = "/reze_theme.mp3";

    useEffect(() => {
        // Set volume immediately
        if (audioRef.current) {
            audioRef.current.volume = 0.3;
            audioRef.current.currentTime = 0; // Ensure start from beginning on mount/refresh
        }

        const attemptPlay = async () => {
            if (!audioRef.current) return;

            // Strategy: Try unmuted first. If blocked, try muted.
            try {
                // 1. Try normal unmuted play
                await audioRef.current.play();
                setIsPlaying(true);
            } catch (err) {
                // 2. Fallback: Muted play (usually allowed by browsers)
                try {
                    audioRef.current.muted = true;
                    await audioRef.current.play();
                    setIsPlaying(true);
                    setIsMuted(true); // Sync state
                } catch (mutedErr) {
                    // Both failed, will retry in interval
                }
            }
        };

        // Try immediately
        attemptPlay();

        // Retry every 2 seconds
        const interval = setInterval(() => {
            if (audioRef.current) {
                if (audioRef.current.paused) {
                    attemptPlay();
                } else {
                    // If playing, we can stop the interval
                    clearInterval(interval);
                    setIsPlaying(true);
                }
            }
        }, 2000);

        // "Magic" Unmute on First Interaction
        const handleFirstInteraction = () => {
            if (audioRef.current) {
                // If it's muted (likely due to fallback), unmute it!
                if (audioRef.current.muted) {
                    audioRef.current.muted = false;
                    setIsMuted(false);
                }
                // If it was paused (unlikely with interval, but possible), play it!
                if (audioRef.current.paused) {
                    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
                }

                // Remove listeners once we've successfully interacted
                ['click', 'keydown', 'scroll', 'touchstart'].forEach(event =>
                    window.removeEventListener(event, handleFirstInteraction)
                );
            }
        };

        // Add global listeners to catch the very first user action
        ['click', 'keydown', 'scroll', 'touchstart'].forEach(event =>
            window.addEventListener(event, handleFirstInteraction, { once: true })
        );

        return () => {
            clearInterval(interval);
            ['click', 'keydown', 'scroll', 'touchstart'].forEach(event =>
                window.removeEventListener(event, handleFirstInteraction)
            );
        };
    }, []);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
                <audio
                    ref={audioRef}
                    src={musicUrl}
                    loop
                    autoPlay
                    playsInline
                    preload="auto"
                    onEnded={() => setIsPlaying(false)}
                />

                <button
                    onClick={togglePlay}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all duration-300 ${isPlaying
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        : "bg-black/40 border-white/10 text-muted-foreground hover:bg-black/60"
                        }`}
                >
                    <div className={`relative flex items-center justify-center w-5 h-5`}>
                        {isPlaying ? (
                            <div className="flex items-end gap-[2px] h-3">
                                <span className="w-1 bg-current animate-[music-bar_1s_ease-in-out_infinite] h-full" style={{ animationDelay: '0s' }} />
                                <span className="w-1 bg-current animate-[music-bar_1s_ease-in-out_infinite] h-2/3" style={{ animationDelay: '0.2s' }} />
                                <span className="w-1 bg-current animate-[music-bar_1s_ease-in-out_infinite] h-full" style={{ animationDelay: '0.4s' }} />
                            </div>
                        ) : (
                            <Music size={16} />
                        )}
                    </div>
                    <span className="text-xs font-mono font-medium hidden md:block">
                        {isPlaying ? "PLAYING" : "PAUSED"}
                    </span>
                </button>

                {isPlaying && (
                    <button
                        onClick={toggleMute}
                        className="p-2 rounded-full bg-black/40 border border-white/10 text-muted-foreground hover:text-white transition-colors backdrop-blur-md"
                    >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                )}

                <style jsx global>{`
                    @keyframes music-bar {
                        0%, 100% { height: 40%; }
                        50% { height: 100%; }
                    }
                `}</style>
            </div>
        </>
    );
}
