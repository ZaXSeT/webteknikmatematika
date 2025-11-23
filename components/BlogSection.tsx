"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Heart, MessageCircle, Send, Trash2, Edit2, Save, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface BlogSectionProps {
    username?: string;
    limit?: number;
    showViewAll?: boolean;
    hideHeader?: boolean;
    fullWidth?: boolean;
    gridClassName?: string;
    forceSquare?: boolean;
}

export default function BlogSection({
    username: propUsername,
    limit,
    showViewAll = true,
    hideHeader = false,
    fullWidth = false,
    gridClassName = "columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4",
    forceSquare = false
}: BlogSectionProps) {
    const [currentUsername, setCurrentUsername] = useState<string | undefined>(propUsername);
    const [uploads, setUploads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [commentText, setCommentText] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // Initial check from localStorage on mount
    useEffect(() => {
        const checkLocalStorage = () => {
            const storedUsername = localStorage.getItem("username");
            if (storedUsername) {
                setCurrentUsername(storedUsername);
            }
        };

        checkLocalStorage();

        // Listen for storage events (cross-tab)
        window.addEventListener('storage', checkLocalStorage);

        // Polling fallback: Check every 1s if user is still missing
        const interval = setInterval(() => {
            if (!currentUsername) {
                checkLocalStorage();
            }
        }, 1000);

        return () => {
            window.removeEventListener('storage', checkLocalStorage);
            clearInterval(interval);
        };
    }, [currentUsername]);

    // Sync with prop if it changes and is valid
    useEffect(() => {
        if (propUsername) {
            setCurrentUsername(propUsername);
        }
    }, [propUsername]);

    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (selectedPost?.comments) {
            scrollToBottom();
        }
    }, [selectedPost?.comments]);

    useEffect(() => {
        const preventDefault = (e: Event) => {
            const target = e.target as HTMLElement;
            const scrollableSection = target.closest('.custom-scrollbar-light');
            if (!scrollableSection) {
                e.preventDefault();
            }
        };

        if (selectedPost) {
            setIsEditing(false);
            setEditTitle(selectedPost.title || "");
            setEditDescription(selectedPost.description || "");

            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            if ((window as any).lenis) (window as any).lenis.stop();

            window.addEventListener('wheel', preventDefault, { passive: false });
            window.addEventListener('touchmove', preventDefault, { passive: false });

            // Keyboard Navigation
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "ArrowRight") {
                    if (selectedPost.media && currentMediaIndex < selectedPost.media.length - 1) {
                        setCurrentMediaIndex(prev => prev + 1);
                    }
                } else if (e.key === "ArrowLeft") {
                    if (currentMediaIndex > 0) {
                        setCurrentMediaIndex(prev => prev - 1);
                    }
                } else if (e.key === "Escape") {
                    setSelectedPost(null);
                }
            };
            window.addEventListener('keydown', handleKeyDown);

            return () => {
                document.body.style.overflow = 'unset';
                document.documentElement.style.overflow = 'unset';
                if ((window as any).lenis) (window as any).lenis.start();
                window.removeEventListener('wheel', preventDefault);
                window.removeEventListener('touchmove', preventDefault);
                window.removeEventListener('keydown', handleKeyDown);
            };
        } else {
            document.body.style.overflow = 'unset';
            document.documentElement.style.overflow = 'unset';
            if ((window as any).lenis) (window as any).lenis.start();

            window.removeEventListener('wheel', preventDefault);
            window.removeEventListener('touchmove', preventDefault);
        }
    }, [selectedPost, currentMediaIndex]);

    const fetchUploads = async () => {
        try {
            const res = await fetch('/api/uploads');
            const data = await res.json();
            if (data.success) {
                // Parse 'gallery' types
                const parsedUploads = data.uploads.map((upload: any) => {
                    if (upload.type === 'gallery') {
                        try {
                            const mediaItems = JSON.parse(upload.url);
                            return {
                                ...upload,
                                media: mediaItems,
                                url: mediaItems[0]?.url, // Default to first item for preview
                                type: mediaItems[0]?.type // Default to first item type for preview
                            };
                        } catch (e) {
                            console.error("Failed to parse gallery media", e);
                            return upload;
                        }
                    }
                    return upload;
                });
                setUploads(parsedUploads);
            }
        } catch (error) {
            console.error("Failed to fetch uploads", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUploads();
    }, []);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;
        try {
            const res = await fetch(`/api/posts/${selectedPost.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUsername })
            });
            const data = await res.json();
            if (data.success) {
                setSelectedPost(null);
                fetchUploads();
            } else {
                alert(data.message || "Failed to delete");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to delete");
        }
    };

    const handleUpdate = async () => {
        try {
            const res = await fetch(`/api/posts/${selectedPost.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUsername, title: editTitle, description: editDescription })
            });
            const data = await res.json();
            if (data.success) {
                setIsEditing(false);
                const updatedPost = { ...selectedPost, title: editTitle, description: editDescription };
                setSelectedPost(updatedPost);
                setUploads(prev => prev.map(u => u.id === selectedPost.id ? updatedPost : u));
            } else {
                alert(data.message || "Failed to update");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to update");
        }
    };

    const handleLike = async (e: React.MouseEvent, post: any) => {
        e.stopPropagation();

        // Fail-safe: Check localStorage one last time if state is missing
        let activeUser = currentUsername;
        if (!activeUser) {
            const storedUsername = localStorage.getItem("username");
            if (storedUsername) {
                activeUser = storedUsername;
                setCurrentUsername(activeUser);
            }
        }

        if (!activeUser) return alert("Login to like!");

        const isLiked = post.likes?.some((l: any) => l.user?.username === currentUsername);
        const newLikes = isLiked
            ? post.likes.filter((l: any) => l.user?.username !== currentUsername)
            : [...(post.likes || []), { user: { username: currentUsername } }];

        const optimisticPost = { ...post, likes: newLikes };

        setSelectedPost(optimisticPost);
        setUploads(prev => prev.map(u => u.id === post.id ? optimisticPost : u));

        try {
            const res = await fetch(`/api/posts/${post.id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUsername })
            });
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message || "Failed to like");
            }
            fetchUploads();
        } catch (error: any) {
            console.error("Like failed", error);
            alert(error.message || "Failed to update like. Please try again.");
            setSelectedPost(post);
            setUploads(prev => prev.map(u => u.id === post.id ? post : u));
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();

        // Fail-safe: Check localStorage one last time
        let activeUser = currentUsername;
        if (!activeUser) {
            const storedUsername = localStorage.getItem("username");
            if (storedUsername) {
                activeUser = storedUsername;
                setCurrentUsername(activeUser);
            }
        }

        if (!activeUser) return alert("Login to comment!");
        if (!commentText.trim() || !selectedPost) return;

        const text = commentText;
        setCommentText("");

        const optimisticComment = {
            id: Date.now(),
            text: text,
            createdAt: new Date().toISOString(),
            user: { username: currentUsername }
        };

        const optimisticPost = {
            ...selectedPost,
            comments: [...(selectedPost.comments || []), optimisticComment]
        };

        setSelectedPost(optimisticPost);
        setUploads(prev => prev.map(u => u.id === selectedPost.id ? optimisticPost : u));

        try {
            const res = await fetch(`/api/posts/${selectedPost.id}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUsername, text })
            });
            const data = await res.json();

            if (data.success) {
                fetchUploads();
                const updatedRes = await fetch('/api/uploads');
                const updatedData = await updatedRes.json();
                if (updatedData.success) {
                    const updatedPost = updatedData.uploads.find((u: any) => u.id === selectedPost.id);
                    if (updatedPost) {
                        setSelectedPost(updatedPost);
                        setUploads(updatedData.uploads);
                    }
                }
            } else {
                throw new Error(data.message || "Failed to comment");
            }
        } catch (error: any) {
            console.error("Comment failed", error);
            alert(error.message || "Failed to post comment. Please try again.");
            fetchUploads();
        }
    };

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 30) return "Just now";

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    const displayedUploads = limit ? uploads.slice(0, limit) : uploads;

    return (
        <section id="media" className={`bg-background text-foreground ${hideHeader ? '' : 'py-24'}`}>
            <div className={fullWidth ? "w-full px-4" : "container mx-auto px-4"}>
                {!hideHeader && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 md:mb-16 gap-6 text-center md:text-left"
                    >
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Latest Uploads</h2>
                            <p className="text-muted-foreground max-w-md mx-auto md:mx-0">
                                Check out what's new.
                            </p>
                        </div>
                        {showViewAll && (
                            <Link href="/gallery" className="flex items-center gap-2 text-lg font-medium hover:gap-4 transition-all">
                                View all <ArrowRight size={20} />
                            </Link>
                        )}
                    </motion.div>
                )}

                {loading ? (
                    <div className="text-center py-20 text-muted-foreground">Loading...</div>
                ) : uploads.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">No uploads yet. Be the first to share!</div>
                ) : (
                    <div className={gridClassName}>
                        {displayedUploads.map((upload, index) => (
                            <motion.article
                                key={upload.id}
                                onClick={() => {
                                    setSelectedPost(upload);
                                    setCurrentMediaIndex(0);
                                }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className="group cursor-pointer break-inside-avoid mb-6"
                            >
                                <div className={`overflow-hidden rounded-2xl mb-2 bg-muted relative ${forceSquare ? 'aspect-square' : ''}`}>
                                    {upload.type === 'video/mp4' || upload.type === 'video/webm' ? (
                                        <video
                                            src={upload.url}
                                            className={`w-full ${forceSquare ? 'h-full object-cover' : 'h-auto object-contain'} transition-transform duration-700 group-hover:scale-105`}
                                            muted
                                            loop
                                            autoPlay
                                            playsInline
                                        />
                                    ) : (
                                        <img
                                            src={upload.url}
                                            alt={upload.title || "User upload"}
                                            className={`w-full ${forceSquare ? 'h-full object-cover' : 'h-auto object-contain'} transition-transform duration-700 group-hover:scale-105`}
                                        />
                                    )}
                                    {upload.media && upload.media.length > 1 && (
                                        <div className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white backdrop-blur-sm">
                                            <Layers size={14} />
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-sm font-bold mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight text-foreground">
                                    {upload.title || "Untitled"}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                                        {upload.user?.username?.[0]?.toUpperCase() || "?"}
                                    </div>
                                    <span className="font-medium text-foreground truncate">
                                        {upload.user?.username || "Anonymous"}
                                    </span>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                )}
            </div>

            {selectedPost && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedPost(null)}
                >
                    <div
                        className="bg-background rounded-3xl overflow-hidden w-full max-w-6xl h-[85vh] flex flex-col md:flex-row shadow-2xl border border-border"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="md:w-2/3 bg-black flex items-center justify-center relative h-full overflow-hidden">
                            <div className="w-full h-full overflow-hidden relative flex items-center">
                                <motion.div
                                    className="flex h-full w-full"
                                    animate={{ x: `-${currentMediaIndex * 100}%` }}
                                    transition={{ ease: "easeOut", duration: 0.3 }}
                                    drag={selectedPost.media && selectedPost.media.length > 1 ? "x" : false}
                                    dragElastic={0}
                                    onDragEnd={(e, { offset, velocity }) => {
                                        const swipe = offset.x;
                                        const threshold = 50; // Reduced threshold for easier swipe
                                        const mediaLength = selectedPost.media ? selectedPost.media.length : 1;

                                        if (swipe < -threshold && currentMediaIndex < mediaLength - 1) {
                                            setCurrentMediaIndex(prev => prev + 1);
                                        } else if (swipe > threshold && currentMediaIndex > 0) {
                                            setCurrentMediaIndex(prev => prev - 1);
                                        }
                                    }}
                                    style={{ touchAction: "none" }}
                                >
                                    {(selectedPost.media || [selectedPost]).map((item: any, index: number) => (
                                        <div key={index} className="min-w-full h-full flex items-center justify-center relative p-0 md:p-4">
                                            {item.type.startsWith('video') ? (
                                                <video
                                                    src={item.url}
                                                    controls
                                                    className="w-full h-full object-contain"
                                                    playsInline
                                                />
                                            ) : (
                                                <img
                                                    src={item.url}
                                                    alt={selectedPost.title}
                                                    className="w-full h-full object-contain pointer-events-none select-none"
                                                    draggable={false}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </motion.div>
                            </div>

                            {/* Navigation Buttons */}
                            {selectedPost.media && selectedPost.media.length > 1 && (
                                <>
                                    {currentMediaIndex > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentMediaIndex(prev => prev - 1);
                                            }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                    )}
                                    {currentMediaIndex < selectedPost.media.length - 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentMediaIndex(prev => prev + 1);
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    )}
                                    {/* Dots Indicator */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                        {selectedPost.media.map((_: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`w-2 h-2 rounded-full transition-all ${idx === currentMediaIndex ? "bg-white w-4" : "bg-white/50"}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            <button
                                onClick={() => setSelectedPost(null)}
                                className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 md:hidden z-20"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="md:w-1/3 flex flex-col h-full bg-background">
                            <div className="p-6 border-b border-border flex justify-between items-start shrink-0">
                                <div className="flex-1 mr-4">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="w-full text-2xl font-bold mb-1 border-b border-border bg-transparent focus:border-blue-500 outline-none text-foreground"
                                        />
                                    ) : (
                                        <h3 className="text-2xl font-bold mb-1 line-clamp-1 text-foreground">{selectedPost.title || "Untitled"}</h3>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        by <span className="font-medium text-foreground">{selectedPost.user?.username}</span> • {timeAgo(selectedPost.createdAt)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {(currentUsername === selectedPost.user?.username || currentUsername === 'zackysetiawan') && (
                                        <>
                                            {isEditing ? (
                                                <button onClick={handleUpdate} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 p-2 rounded-full transition-colors">
                                                    <Save size={20} />
                                                </button>
                                            ) : (
                                                <button onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-full transition-colors">
                                                    <Edit2 size={20} />
                                                </button>
                                            )}
                                            <button onClick={handleDelete} className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-colors">
                                                <Trash2 size={20} />
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => setSelectedPost(null)} className="hidden md:block text-muted-foreground hover:text-foreground transition-colors p-2">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="px-6 pt-6 shrink-0">
                                {isEditing ? (
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="w-full text-muted-foreground bg-transparent mb-6 pb-6 border-b border-border focus:border-blue-500 outline-none resize-none h-24"
                                    />
                                ) : (
                                    selectedPost.description && (
                                        <p className="text-muted-foreground mb-6 pb-6 border-b border-border">{selectedPost.description}</p>
                                    )
                                )}
                                <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-4">Comments</h4>
                            </div>

                            <div
                                className="px-6 pb-6 flex-1 overflow-y-auto custom-scrollbar-light flex flex-col min-h-0"
                                data-lenis-prevent
                                style={{ overscrollBehavior: 'contain' }}
                            >
                                <div className="space-y-6">
                                    {selectedPost.comments?.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                            <MessageCircle size={32} className="mb-2 opacity-20" />
                                            <p className="text-sm italic">No comments yet.</p>
                                        </div>
                                    ) : (
                                        selectedPost.comments?.map((comment: any) => (
                                            <div key={comment.id} className="flex gap-3 group">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs shrink-0">
                                                    {comment.user?.username?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-baseline justify-between">
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="font-semibold text-sm text-foreground">{comment.user?.username}</span>
                                                            <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{comment.text}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={commentsEndRef} />
                                </div>
                            </div>

                            <div className="p-4 border-t border-border bg-background shrink-0">
                                <div className="flex items-center gap-6 mb-4">
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => handleLike(e, selectedPost)}
                                        className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors group"
                                    >
                                        <motion.div
                                            initial={false}
                                            animate={{
                                                scale: selectedPost.likes?.some((l: any) => l.user?.username === currentUsername) ? [1, 1.2, 1] : 1,
                                                color: selectedPost.likes?.some((l: any) => l.user?.username === currentUsername) ? "#ef4444" : "currentColor"
                                            }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Heart
                                                size={24}
                                                className={selectedPost.likes?.some((l: any) => l.user?.username === currentUsername) ? "fill-red-500 stroke-red-500" : "stroke-current"}
                                            />
                                        </motion.div>
                                        <span className="font-medium text-sm">{selectedPost.likes?.length || 0} likes</span>
                                    </motion.button>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MessageCircle size={24} className="stroke-current" />
                                        <span className="font-medium text-sm">{selectedPost.comments?.length || 0} comments</span>
                                    </div>
                                </div>

                                <form onSubmit={handleComment} className="flex items-center gap-3">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder={currentUsername ? "Add a comment..." : "Login to comment"}
                                            disabled={!currentUsername}
                                            className="w-full bg-muted border-none rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:bg-background transition-all outline-none placeholder:text-muted-foreground text-foreground"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!currentUsername || !commentText.trim()}
                                        className="p-3 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-sm"
                                    >
                                        <Send size={18} className={commentText.trim() ? "ml-0.5" : ""} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
