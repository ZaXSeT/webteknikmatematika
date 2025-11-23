"use client";

import { useEffect, useState } from "react";
import UploadSection from "@/components/UploadSection";
import BlogSection from "@/components/BlogSection";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GalleryPage() {
    const [username, setUsername] = useState<string | undefined>(undefined);
    const [isUserLoaded, setIsUserLoaded] = useState(false);

    useEffect(() => {
        const storedUsername = localStorage.getItem("username");
        if (storedUsername) {
            setUsername(storedUsername);
        }
        setIsUserLoaded(true);

        // Initialize theme to fix dark mode on refresh
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    return (
        <main className="bg-background min-h-screen">
            <div className="w-full px-4 pt-6">
                <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <ArrowLeft size={20} /> Back to Home
                </Link>
                <div className="mb-6">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">Recent Uploads</h1>
                    <p className="text-muted-foreground mt-2">Share your moments and see what others are up to.</p>
                </div>
            </div>

            <div className="mt-6 md:-mt-12 mb-12">
                <UploadSection username={username} compact={true} />
            </div>

            {/* Use fullWidth to make posts expand to fill the screen */}
            <div className="">
                <BlogSection username={username} showViewAll={false} fullWidth={true} hideHeader={true} />
            </div>
        </main>
    );
}
