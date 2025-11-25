"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";

export default function BackgroundMusic() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true); // Default to muted
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Local music file
    const musicUrl = "/reze_theme.mp3";

    useEffect(() => {
        // Initialize audio state
        if (audioRef.current) {
            audioRef.current.volume = 0.3;
            audioRef.current.muted = true; // Ensure it starts muted
        }

        // Attempt to play automatically (muted)
        const attemptPlay = async () => {
            if (!audioRef.current) return;

            try {
                // Browsers generally allow autoplay if muted
                await audioRef.current.play();
                setIsPlaying(true);
            } catch (err) {
                console.log("Autoplay prevented:", err);
                setIsPlaying(false);
            }
        };

        attemptPlay();
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
            // Toggle mute state
            const newMutedState = !isMuted;
            audioRef.current.muted = newMutedState;
            setIsMuted(newMutedState);
        }
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
                <audio
                    ref={audioRef}
                    src={musicUrl}
                    loop
                    muted // Default attribute
                    playsInline
                    preload="auto"
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />

                <button
                    onClick={togglePlay}
                    className={`group flex items-center gap-3 px-4 py-2.5 rounded-full backdrop-blur-xl border transition-all duration-300 shadow-sm hover:shadow-md ${isPlaying
                        ? "bg-background/80 dark:bg-zinc-900/80 border-border/50 text-foreground"
                        : "bg-background/60 dark:bg-zinc-900/60 border-border/30 text-muted-foreground hover:bg-background/80 dark:hover:bg-zinc-900/80"
                        }`}
                >
                    <div className={`relative flex items-center justify-center w-4 h-4`}>
                        {isPlaying ? (
                            <div className="flex items-end gap-[3px] h-3.5">
                                <span className="w-0.5 rounded-full bg-pink-500 dark:bg-pink-400 animate-[music-bar_1s_ease-in-out_infinite]" style={{ animationDelay: '0s' }} />
                                <span className="w-0.5 rounded-full bg-purple-500 dark:bg-purple-400 animate-[music-bar_1s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }} />
                                <span className="w-0.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-[music-bar_1s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }} />
                            </div>
                        ) : (
                            <Music size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                        )}
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase hidden md:block opacity-80 group-hover:opacity-100 transition-opacity">
                        {isPlaying ? "Playing" : "Paused"}
                    </span>
                </button>

                <button
                    onClick={toggleMute}
                    className={`p-2.5 rounded-full backdrop-blur-xl border transition-all duration-300 shadow-sm hover:shadow-md ${isMuted
                        ? "bg-red-500/10 border-red-500/20 text-red-500"
                        : "bg-background/60 dark:bg-zinc-900/60 border-border/30 text-muted-foreground hover:text-foreground hover:bg-background/80 dark:hover:bg-zinc-900/80"
                        }`}
                >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

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
