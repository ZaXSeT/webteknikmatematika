"use client";

import { useEffect, useState } from "react";
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
    }, []);

    return (
        <main className="bg-background min-h-screen">
            <div className="w-full px-4 pt-6">
                <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <ArrowLeft size={20} /> Back to Home
                </Link>
                <div className="mb-6">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">Gallery</h1>
                    <p className="text-muted-foreground mt-2">Browse all uploads.</p>
                </div>
            </div>
            {/* Use fullWidth to make posts expand to fill the screen */}
            <div className="-mt-24">
                <BlogSection username={username} showViewAll={false} fullWidth={true} />
            </div>
        </main>
    );
}
