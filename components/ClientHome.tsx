"use client";

import { useState, useEffect } from "react";
import Hero from "./Hero";
import UploadSection from "./UploadSection";
import BlogSection from "./BlogSection";
import Footer from "./Footer";
import Header from "./Header";
import { AnimatePresence, motion } from "framer-motion";
import LoadingScreen from "./LoadingScreen";

export default function ClientHome() {
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");

    const [isDark, setIsDark] = useState(false);

    // Removed the timeout-based loading logic
    // Loading completion is now handled by the LoadingScreen callback

    useEffect(() => {
        const storedUsername = localStorage.getItem("username");
        if (storedUsername) {
            setUsername(storedUsername);
            setIsLoggedIn(true);
        }

        // Initialize theme
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDark(false);
            document.documentElement.classList.remove('dark');
        }

        // Check for scroll restoration
        const scrollToId = sessionStorage.getItem("scrollTo");
        if (scrollToId) {
            sessionStorage.removeItem("scrollTo");
            // Wait for animation/render
            setTimeout(() => {
                const element = document.getElementById(scrollToId);
                if (element) {
                    element.scrollIntoView({ behavior: "auto" });
                }
            }, 500);
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
            setIsDark(true);
        }
    };

    const handleLogin = (user: string) => {
        setUsername(user);
        setIsLoggedIn(true);
        localStorage.setItem("username", user);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUsername("");
        localStorage.removeItem("username");
    };

    const handleLoadingComplete = () => {
        setIsLoading(false);
    };

    return (
        <main className="min-h-screen bg-background">
            <AnimatePresence>
                {isLoading && (
                    <LoadingScreen
                        key="loader"
                        isDark={isDark}
                        onComplete={handleLoadingComplete}
                    />
                )}
            </AnimatePresence>

            {/* Render content but hide it or let it sit behind while loading */}
            {!isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <Header isDark={isDark} toggleTheme={toggleTheme} />
                    <Hero
                        isLoggedIn={isLoggedIn}
                        onLogin={handleLogin}
                        onLogout={handleLogout}
                        username={username}
                    />
                    <AnimatePresence>
                        {isLoggedIn && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <UploadSection username={username} />
                                <BlogSection
                                    username={username}
                                    limit={12}
                                    fullWidth={true}
                                    gridClassName="grid grid-cols-3 gap-0.5 md:grid-cols-3 lg:grid-cols-4 md:gap-4"
                                    forceSquare={true}
                                />
                                <Footer isDark={isDark} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </main>
    );
}
