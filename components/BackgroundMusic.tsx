"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";

export default function BackgroundMusic() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [showOverlay, setShowOverlay] = useState(true); // Default true until we check autoplay

    // Local music file
    const musicUrl = "/music.mp3";

    useEffect(() => {
        // Restore state from localStorage
        const savedTime = localStorage.getItem("musicTime");

        if (audioRef.current) {
            if (savedTime) {
                audioRef.current.currentTime = parseFloat(savedTime);
            }
            audioRef.current.volume = 0.3;
        }

        // Try to play automatically
        const playAudio = async () => {
            if (audioRef.current) {
                try {
                    await audioRef.current.play();
                    setIsPlaying(true);
                    setShowOverlay(false); // If successful, no need for overlay
                } catch (err) {
                    console.log("Autoplay blocked by browser, showing overlay");
                    setIsPlaying(false);
                    setShowOverlay(true); // If blocked, show overlay to force click
                }
            }
        };

        playAudio();

        // Save state periodically
        const interval = setInterval(() => {
            if (audioRef.current) {
                localStorage.setItem("musicTime", audioRef.current.currentTime.toString());
            }
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const handleEnter = () => {
        if (audioRef.current) {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
                setShowOverlay(false);
            }).catch(console.error);
        }
    };

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
            {/* Intro Overlay - Only shows if autoplay is blocked */}
            {showOverlay && (
                <div
                    onClick={handleEnter}
                    className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center cursor-pointer transition-opacity duration-700"
                >
                    <div className="text-center animate-pulse">
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tighter">
                            TeknikMatematika
                        </h1>
                        <p className="text-muted-foreground text-sm uppercase tracking-widest">
                            Click anywhere to enter
                        </p>
                    </div>
                </div>
            )}

            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
                <audio
                    ref={audioRef}
                    src={musicUrl}
                    loop
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
