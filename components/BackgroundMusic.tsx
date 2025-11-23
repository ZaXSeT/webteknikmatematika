"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";

export default function BackgroundMusic() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Local music file
    const musicUrl = "/music.mp3";

    useEffect(() => {
        // Set volume immediately
        if (audioRef.current) {
            audioRef.current.volume = 0.3;
            audioRef.current.currentTime = 0; // Ensure start from beginning on mount/refresh
        }

        const playAudio = async () => {
            if (audioRef.current) {
                try {
                    // Attempt immediate playback
                    await audioRef.current.play();
                    setIsPlaying(true);
                } catch (err) {
                    console.log("Autoplay blocked. Waiting for interaction.");
                    setIsPlaying(false);

                    // Fallback: Play on ANY interaction
                    const startAudio = () => {
                        if (audioRef.current) {
                            audioRef.current.play().then(() => {
                                setIsPlaying(true);
                                // Cleanup listeners
                                ['click', 'keydown', 'touchstart', 'scroll', 'mousemove'].forEach(event =>
                                    document.removeEventListener(event, startAudio)
                                );
                            }).catch(console.error);
                        }
                    };

                    // Add aggressive listeners
                    ['click', 'keydown', 'touchstart', 'scroll', 'mousemove'].forEach(event =>
                        document.addEventListener(event, startAudio, { once: true })
                    );
                }
            }
        };

        playAudio();
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
