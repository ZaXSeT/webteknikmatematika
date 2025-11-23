"use client";

import { useState, useEffect } from "react";
import Hero from "./Hero";
import UploadSection from "./UploadSection";
import BlogSection from "./BlogSection";
import Footer from "./Footer";
import Header from "./Header";
import { AnimatePresence, motion } from "framer-motion";

export default function ClientHome() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");

    const [isDark, setIsDark] = useState(false);

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
                    element.scrollIntoView({ behavior: "smooth" });
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

    return (
        <main className="min-h-screen bg-background">
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
                        <BlogSection username={username} limit={9} fullWidth={true} gridClassName="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" forceSquare={true} />
                        <Footer isDark={isDark} />
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
