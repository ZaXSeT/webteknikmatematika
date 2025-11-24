import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoPlayerProps {
    src: string;
    poster?: string;
    className?: string;
    onLoadedMetadata?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
    autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, className, onLoadedMetadata, autoPlay = false }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay policy
    const [volume, setVolume] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [showCenterPlay, setShowCenterPlay] = useState(false); // For transient animation

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateProgress = () => {
            if (video.duration) {
                setProgress((video.currentTime / video.duration) * 100);
                setCurrentTime(video.currentTime);
            }
        };

        const handleLoadedData = () => setIsLoading(false);
        const handleWaiting = () => setIsLoading(true);
        const handlePlaying = () => {
            setIsLoading(false);
            setIsPlaying(true);
        };
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);

        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('timeupdate', updateProgress);
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('playing', handlePlaying);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
        };
    }, []);

    useEffect(() => {
        if (autoPlay && videoRef.current) {
            videoRef.current.play().catch(() => {
                // Autoplay failed (likely due to unmuted), try muting
                if (videoRef.current) {
                    videoRef.current.muted = true;
                    setIsMuted(true);
                    videoRef.current.play().catch(console.error);
                }
            });
        }
    }, [autoPlay, src]);

    // Sync volume and mute state with video element
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
            videoRef.current.volume = volume;
        }
    }, [isMuted, volume]);

    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            // Trigger animation
            setShowCenterPlay(true);
            setTimeout(() => setShowCenterPlay(false), 600);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
        if (isMuted && volume === 0) {
            setVolume(1); // Reset volume to 100% if unmuting from 0
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = pos * videoRef.current.duration;
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div
            ref={containerRef}
            className={`relative group bg-black overflow-hidden ${className}`}
            onClick={togglePlay}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="w-full h-full object-contain"
                onLoadedMetadata={(e) => {
                    setDuration(e.currentTarget.duration);
                    if (onLoadedMetadata) onLoadedMetadata(e);
                }}
                playsInline
                loop
                muted={isMuted}
            />

            {/* Loading Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] z-20 pointer-events-none">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
            )}

            {/* Center Animated Icon (Transient) */}
            <AnimatePresence>
                {showCenterPlay && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1.2, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="bg-black/40 backdrop-blur-md rounded-full p-5 text-white shadow-2xl border border-white/10"
                        >
                            {isPlaying ? <Pause fill="currentColor" size={32} /> : <Play fill="currentColor" size={32} />}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Persistent Play Icon (When Paused & Not Animating) */}
            {!isPlaying && !isLoading && !showCenterPlay && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black/30 backdrop-blur-sm rounded-full p-4 text-white/90 shadow-lg"
                    >
                        <Play fill="currentColor" size={40} />
                    </motion.div>
                </div>
            )}

            {/* Bottom Gradient Overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Controls Container */}
            <div className="absolute bottom-0 left-0 right-0 z-40 flex flex-col px-4 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">

                {/* Info & Buttons Row */}
                <div className="flex items-end justify-between mb-3">
                    {/* Left: Play/Pause & Time */}
                    <div className="flex items-center gap-4">
                        <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white hover:text-white/80 transition-colors">
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>

                        <span className="text-xs font-medium text-white/90 tabular-nums tracking-wide">
                            {formatTime(currentTime)} / {formatTime(duration || 0)}
                        </span>
                    </div>

                    {/* Right: Volume & Fullscreen */}
                    <div className="flex items-center gap-4">
                        <div className="relative group/volume flex items-center justify-center">
                            {/* Vertical Volume Slider Container */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-8 h-24 bg-black/60 backdrop-blur-md rounded-full flex flex-col items-center justify-end pb-3 pt-3 opacity-0 invisible group-hover/volume:opacity-100 group-hover/volume:visible transition-all duration-200 ease-out">
                                <div className="relative w-1 h-full bg-white/30 rounded-full">
                                    <div
                                        className="absolute bottom-0 left-0 w-full bg-white rounded-full"
                                        style={{ height: `${isMuted ? 0 : volume * 100}%` }}
                                    />
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                                        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                                    />
                                </div>
                            </div>

                            <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors relative z-10">
                                {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Progress Bar - TikTok Style */}
                <div
                    className="relative w-full h-2 group/progress cursor-pointer flex items-end pb-1"
                    onClick={handleSeek}
                >
                    {/* Background Track */}
                    <div className="w-full h-[3px] bg-white/20 rounded-full overflow-visible relative transition-all duration-200 group-hover/progress:h-[5px]">
                        {/* Progress Fill */}
                        <div
                            className="absolute top-0 left-0 h-full bg-white rounded-full"
                            style={{ width: `${progress}%` }}
                        >
                            {/* Knob - Only visible on hover */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover/progress:scale-100 transition-transform duration-200" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
