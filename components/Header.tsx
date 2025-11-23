"use client";

import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

interface HeaderProps {
    isDark: boolean;
    toggleTheme: () => void;
}

export default function Header({ isDark, toggleTheme }: HeaderProps) {



    return (
        <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/20 dark:bg-background/80 backdrop-blur-md border-b border-white/20 dark:border-border"
        >
            <div className="w-full px-8 md:px-12 py-4 flex items-center justify-between">
                <a
                    href="#home"
                    onClick={(e) => {
                        e.preventDefault();
                        const element = document.getElementById("home");
                        element?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex items-center gap-3 group"
                >
                    <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-pink-500/20 flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xl md:text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 dark:text-foreground dark:bg-none transition-colors">
                        TeknikMatematika
                    </span>
                </a>
                <nav className="hidden md:flex gap-10">
                    {["Home", "Upload", "Media"].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            onClick={(e) => {
                                e.preventDefault();
                                const element = document.getElementById(item.toLowerCase());
                                element?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="text-base font-medium text-slate-800 dark:text-zinc-400 hover:text-pink-600 dark:hover:text-white transition-colors"
                        >
                            {item}
                        </a>
                    ))}
                </nav>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground text-slate-800 dark:text-white transition-colors"
                    aria-label="Toggle theme"
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </motion.header>
    );
}
