"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";

interface LoadingScreenProps {
    isDark: boolean;
    onComplete?: () => void;
}

export default function LoadingScreen({ isDark, onComplete }: LoadingScreenProps) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.4,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: "easeOut" as const
            }
        }
    };

    // Auto-complete logic since we removed the loading bar trigger
    useEffect(() => {
        const timer = setTimeout(() => {
            if (onComplete) {
                onComplete();
            }
        }, 2500); // Adjust duration as needed

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{
                y: "-100%",
                transition: {
                    duration: 0.8,
                    ease: [0.76, 0, 0.24, 1]
                }
            }}
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-colors duration-500 ${isDark ? "bg-black text-white" : "bg-white text-slate-800"}`}
        >
            <motion.div
                className="relative z-10 flex flex-col items-center gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Logo */}
                <motion.div
                    variants={itemVariants}
                    className="relative w-20 h-20 overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-pink-500/20 flex items-center justify-center shadow-lg"
                >
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                </motion.div>

                {/* Title */}
                <motion.h1
                    variants={itemVariants}
                    className={`text-2xl font-bold tracking-tight ${isDark
                            ? "text-white"
                            : "text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500"
                        }`}
                >
                    Teknik Matematika
                </motion.h1>
            </motion.div>
        </motion.div>
    );
}
