"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useRef, Suspense } from "react";
import Terminal from "./Terminal";

interface HeroProps {
    onLogin: (username: string) => void;
    onLogout: () => void;
    isLoggedIn: boolean;
    username?: string;
}

export default function Hero({ onLogin, onLogout, isLoggedIn, username }: HeroProps) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    const textY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
    const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const terminalY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const terminalOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <section
            id="home"
            ref={ref}
            className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background pt-20 md:pt-0"
        >
            <motion.div
                style={{ y: bgY }}
                className="absolute inset-0 z-0"
            >
                {/* Dark Mode Background */}
                <img
                    src="https://i.pinimg.com/originals/e3/e4/fd/e3e4fdf3ac344304f2435f15b00d7bae.gif"
                    alt="Background Dark"
                    className="hidden dark:block w-full h-full object-cover opacity-30 scale-110"
                />
                {/* Light Mode Background */}
                <img
                    src="https://wallpapers-clan.com/wp-content/uploads/2024/04/cute-anime-girl-love-hearts-gif-desktop-wallpaper-preview.gif"
                    alt="Background Light"
                    className="block dark:hidden w-full h-full object-cover opacity-80 scale-110"
                />
            </motion.div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-100/20 via-background/40 to-background/80 dark:from-blue-900/20 dark:via-black/80 dark:to-black" />

            <div className="container mx-auto px-4 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <motion.div
                    style={{ y: textY, opacity: textOpacity }}
                    className="text-center md:text-left"
                >
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl font-bold tracking-tighter text-purple-950 dark:text-foreground mb-6"
                    >
                        Share anything <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 dark:text-foreground dark:bg-none">
                            you want
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg md:text-xl text-purple-900/80 dark:text-muted-foreground max-w-xl mx-auto md:mx-0 mb-10"
                    >
                        Upload your images, videos, and GIFs
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex justify-center md:justify-start"
                    >
                        <AnimatePresence mode="wait">
                            {!isLoggedIn ? (
                                <motion.a
                                    key="login-btn"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    href="#login"
                                    className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 dark:bg-blue-600 dark:bg-none dark:hover:bg-blue-700 rounded-full transition-all hover:scale-105 shadow-lg shadow-pink-500/30 dark:shadow-blue-500/30"
                                >
                                    Login via Terminal
                                </motion.a>
                            ) : (
                                <motion.a
                                    key="upload-btn"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    href="#upload"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 dark:bg-green-600 dark:bg-none dark:hover:bg-green-700 rounded-full transition-all hover:scale-105 shadow-lg shadow-cyan-500/30 dark:shadow-green-500/30"
                                >
                                    Start Uploading
                                </motion.a>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>

                <motion.div
                    id="login"
                    style={{ y: terminalY, opacity: terminalOpacity }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="w-full max-w-2xl mx-auto md:ml-auto backdrop-blur-md bg-white/10 dark:bg-transparent rounded-xl border border-white/20 dark:border-none shadow-2xl"
                >
                    <Suspense fallback={<div className="w-full h-[500px] bg-black/60 rounded-xl animate-pulse" />}>
                        <Terminal
                            onLogin={onLogin}
                            onLogout={onLogout}
                            isLoggedIn={isLoggedIn}
                            username={username}
                        />
                    </Suspense>
                </motion.div>
            </div>

            <AnimatePresence>
                {isLoggedIn && (
                    <motion.div
                        key="arrow"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.5 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground/40"
                    >
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <ArrowDown size={32} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
