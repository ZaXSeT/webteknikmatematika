"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Heart, MessageCircle, Send, Trash2, Edit2, Save, ChevronLeft, ChevronRight, Layers, Bookmark } from "lucide-react";
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
    const [mediaAspectRatios, setMediaAspectRatios] = useState<Record<number, number>>({});
    const [gridAspectRatios, setGridAspectRatios] = useState<Record<string, number>>({});
    const [commentText, setCommentText] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const commentsEndRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const activePostIdRef = useRef<number | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any | null>(null);
    const commentInputRef = useRef<HTMLInputElement>(null);

    const handleCloseModal = () => {
        setIsClosing(true);
    };

    useEffect(() => {
        if (selectedPost && !isClosing) {
            // If we are already showing this post, don't re-animate
            if (activePostIdRef.current === selectedPost.id) {
                return;
            }
            activePostIdRef.current = selectedPost.id;

            // Prepare for animation - promote to GPU
            if (overlayRef.current) overlayRef.current.style.willChange = 'opacity';
            if (contentRef.current) contentRef.current.style.willChange = 'opacity';

            // Wait for 2 frames to ensure layout is settled and browser is ready
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Enter animation
                    overlayRef.current?.animate([
                        { opacity: 0 },
                        { opacity: 1 }
                    ], {
                        duration: 100,
                        easing: 'ease-out',
                        fill: 'forwards',
                        composite: 'replace'
                    });

                    contentRef.current?.animate([
                        { opacity: 0 },
                        { opacity: 1 }
                    ], {
                        duration: 100,
                        easing: 'ease-out',
                        fill: 'forwards',
                        composite: 'replace'
                    });
                });
            });
        } else if (isClosing) {
            // Exit animation
            const overlayAnim = overlayRef.current?.animate([
                { opacity: 1 },
                { opacity: 0 }
            ], {
                duration: 100,
                easing: 'ease-in',
                fill: 'forwards'
            });

            const contentAnim = contentRef.current?.animate([
                { opacity: 1 },
                { opacity: 0 }
            ], {
                duration: 100,
                easing: 'ease-in',
                fill: 'forwards'
            });

            const cleanup = () => {
                setSelectedPost(null);
                setIsClosing(false);
                activePostIdRef.current = null;
                // Cleanup will-change to save memory
                if (overlayRef.current) overlayRef.current.style.willChange = 'auto';
                if (contentRef.current) contentRef.current.style.willChange = 'auto';
            };

            if (contentAnim) {
                contentAnim.onfinish = cleanup;
            } else {
                cleanup();
            }
        }
    }, [selectedPost, isClosing]);

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
        commentsEndRef.current?.scrollIntoView({ behavior: "auto" });
    };

    // Removed auto-scroll to bottom on comments change to prevent jumping
    // useEffect(() => {
    //     if (selectedPost?.comments) {
    //         scrollToBottom();
    //     }
    // }, [selectedPost?.comments]);

    useEffect(() => {
        if (selectedPost) {
            setIsEditing(false);
            setEditTitle(selectedPost.title || "");
            setEditDescription(selectedPost.description || "");

            document.body.style.overflow = 'hidden';
            // document.documentElement.style.overflow = 'hidden';

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
                // document.documentElement.style.overflow = 'unset';

                window.removeEventListener('keydown', handleKeyDown);
            };
        } else {
            document.body.style.overflow = 'unset';
            // document.documentElement.style.overflow = 'unset';
        }
    }, [selectedPost, currentMediaIndex]);

    const fetchUploads = async () => {
        try {
            const res = await fetch('/api/uploads');
            const data = await res.json();
            if (data.success) {
                const parsedUploads = data.uploads.map((upload: any) => {
                    if (upload.type === 'gallery') {
                        try {
                            const mediaItems = JSON.parse(upload.url);
                            return {
                                ...upload,
                                media: mediaItems,
                                url: mediaItems[0]?.url,
                                type: mediaItems[0]?.type
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

    const handleDelete = () => {
        setShowDeleteConfirm(true);
    };

    const performDelete = async () => {
        try {
            const res = await fetch(`/api/posts/${selectedPost.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUsername })
            });
            const data = await res.json();
            if (data.success) {
                setSelectedPost(null);
                setShowDeleteConfirm(false);
                fetchUploads();
            } else {
                alert(data.message || "Failed to delete");
                setShowDeleteConfirm(false);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to delete");
            setShowDeleteConfirm(false);
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
            // fetchUploads(); // Removed to prevent flickering
        } catch (error: any) {
            console.error("Like failed", error);
            alert(error.message || "Failed to update like. Please try again.");
            // Revert optimistic update
            setSelectedPost(post);
            setUploads(prev => prev.map(u => u.id === post.id ? post : u));
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
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
            user: { username: currentUsername },
            parentId: replyingTo?.id
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
                body: JSON.stringify({
                    username: currentUsername,
                    text,
                    parentId: replyingTo?.id
                })
            });
            setReplyingTo(null);
            const data = await res.json();

            if (data.success) {
                // Update the specific post with the real data from the server response (e.g. real comment ID)
                // without refetching everything to avoid flicker
                if (data.comment) {
                    const realComment = data.comment;
                    setUploads(prev => prev.map(u => {
                        if (u.id === selectedPost.id) {
                            // Replace optimistic comment with real one
                            // For simplicity in this fix, we just append the real one if not found (unlikely) or replace.
                            return { ...u, comments: [...(u.comments.filter((c: any) => c.id !== optimisticComment.id)), realComment] };
                        }
                        return u;
                    }));

                    setSelectedPost((prev: any) => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            comments: [...(prev.comments.filter((c: any) => c.id !== optimisticComment.id)), realComment]
                        };
                    });
                }
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            console.error("Comment failed", error);
            alert("Failed to post comment");
            // Revert
            setSelectedPost(selectedPost);
            setUploads(prev => prev.map(u => u.id === selectedPost.id ? selectedPost : u));
        }
    };

    const swipeConfidenceThreshold = 100;
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    const variants = {
        enter: (direction: number) => ({
            zIndex: 0,
            x: direction > 0 ? "100%" : "-100%",
            opacity: 1
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? "100%" : "-100%",
            opacity: 1
        })
    };

    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const paginate = (newDirection: number) => {
        setDirection(newDirection);
        setCurrentMediaIndex(prev => prev + newDirection);
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [direction, setDirection] = useState(0);
    const activeAspectRatio = mediaAspectRatios[0] || 1;

    const handleMediaLoad = (event: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>, index: number) => {
        const { naturalWidth, naturalHeight, videoWidth, videoHeight } = event.currentTarget as any;
        const width = naturalWidth || videoWidth;
        const height = naturalHeight || videoHeight;
        if (width && height) {
            const ratio = width / height;
            setMediaAspectRatios(prev => ({ ...prev, [index]: ratio }));
        }
    };

    const handleGridMediaLoad = (event: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>, id: string) => {
        const { naturalWidth, naturalHeight, videoWidth, videoHeight } = event.currentTarget as any;
        const width = naturalWidth || videoWidth;
        const height = naturalHeight || videoHeight;
        if (width && height) {
            const ratio = width / height;
            setGridAspectRatios(prev => ({ ...prev, [id]: ratio }));
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

    const onReply = (comment: any) => {
        setReplyingTo(comment);
        commentInputRef.current?.focus();
    };

    const displayedUploads = limit ? uploads.slice(0, limit) : uploads;

    useEffect(() => {
        if (selectedPost) {
            if (gridAspectRatios[selectedPost.id]) {
                setMediaAspectRatios({ 0: gridAspectRatios[selectedPost.id] });
            } else {
                setMediaAspectRatios({});
            }
            setCurrentMediaIndex(0);
            setDirection(0);
        }
    }, [selectedPost?.id]);

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
                                    setDirection(0);
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
                                            onLoadedMetadata={(e) => handleGridMediaLoad(e, upload.id)}
                                        />
                                    ) : (
                                        <img
                                            src={upload.url}
                                            alt={upload.title || "User upload"}
                                            className={`w-full ${forceSquare ? 'h-full object-cover' : 'h-auto object-contain'} transition-transform duration-700 group-hover:scale-105`}
                                            onLoad={(e) => handleGridMediaLoad(e, upload.id)}
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

                {selectedPost && (
                    <div
                        ref={overlayRef}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 opacity-0"
                        onClick={handleCloseModal}
                    >
                        <AnimatePresence>
                            {showDeleteConfirm && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <motion.div
                                        initial={{ scale: 1.1, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.95, opacity: 0 }}
                                        transition={{ type: "spring", damping: 25, stiffness: 400 }}
                                        className="bg-card w-[260px] rounded-xl overflow-hidden text-center shadow-2xl"
                                    >
                                        <div className="p-6 border-b border-border">
                                            <h3 className="text-lg font-semibold">Delete post?</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Are you sure you want to delete this post?
                                            </p>
                                        </div>
                                        <div className="flex flex-col">
                                            <button
                                                onClick={performDelete}
                                                className="p-3 text-red-500 font-bold border-b border-border hover:bg-muted transition-colors text-sm"
                                            >
                                                Delete
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="p-3 text-foreground hover:bg-muted transition-colors text-sm"
                                            >
                                                Don't delete
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {/* Modal Content */}
                        <div
                            ref={contentRef}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card rounded-xl overflow-y-auto md:overflow-hidden shadow-2xl flex flex-col md:flex-row relative max-h-[95vh] w-full md:w-auto opacity-0"
                            style={{
                                '--aspect-ratio': activeAspectRatio,
                                '--sidebar-width': isDesktop ? '400px' : '0px',
                                '--max-modal-width': 'calc(100vw - 40px)',
                                '--max-modal-height': 'calc(100vh - 40px)',
                                '--max-img-width': 'min(1200px, calc(var(--max-modal-width) - var(--sidebar-width)))',

                                // Calculate dimensions based on aspect ratio
                                '--perfect-height': 'calc(var(--max-img-width) / var(--aspect-ratio))',
                                '--constrained-height': 'min(var(--max-modal-height), var(--perfect-height))',

                                // Final dimensions
                                '--calculated-height': 'var(--constrained-height)',
                                '--calculated-width': 'calc(var(--calculated-height) * var(--aspect-ratio))',

                                height: isDesktop ? 'var(--calculated-height)' : 'auto',
                                width: isDesktop ? 'calc(var(--calculated-width) + var(--sidebar-width))' : '100%',
                                maxWidth: 'var(--max-modal-width)'
                            } as React.CSSProperties}
                        >
                            {/* Top Right Actions */}
                            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                                {currentUsername === selectedPost.user?.username && (
                                    <button
                                        onClick={handleDelete}
                                        className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full backdrop-blur-sm transition-colors"
                                        title="Delete Post"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Image/Video Section */}
                            <div className="relative bg-black flex items-center justify-center overflow-hidden"
                                style={{
                                    width: isDesktop ? 'var(--calculated-width)' : '100%',
                                    height: isDesktop ? '100%' : 'auto',
                                    aspectRatio: isDesktop ? 'auto' : `${activeAspectRatio}`
                                }}
                            >
                                {selectedPost.media && selectedPost.media.length > 0 ? (
                                    <>
                                        {/* Navigation Buttons */}
                                        {selectedPost.media.length > 1 && (
                                            <>
                                                {currentMediaIndex > 0 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            paginate(-1);
                                                        }}
                                                        className="absolute left-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                                                    >
                                                        <ChevronLeft size={24} />
                                                    </button>
                                                )}
                                                {currentMediaIndex < selectedPost.media.length - 1 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            paginate(1);
                                                        }}
                                                        className="absolute right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                                                    >
                                                        <ChevronRight size={24} />
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {/* Media Content */}
                                        <AnimatePresence initial={false} custom={direction}>
                                            <motion.div
                                                key={currentMediaIndex}
                                                custom={direction}
                                                variants={variants}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={{
                                                    x: { type: "tween", ease: "easeInOut", duration: 0.3 },
                                                    opacity: { duration: 0.2 }
                                                }}
                                                style={{ willChange: 'transform' }}
                                                drag="x"
                                                dragConstraints={{ left: 0, right: 0 }}
                                                dragElastic={1}
                                                onDragEnd={(e, { offset, velocity }) => {
                                                    const swipe = swipePower(offset.x, velocity.x);

                                                    if (swipe < -swipeConfidenceThreshold) {
                                                        if (currentMediaIndex < selectedPost.media.length - 1) {
                                                            paginate(1);
                                                        }
                                                    } else if (swipe > swipeConfidenceThreshold) {
                                                        if (currentMediaIndex > 0) {
                                                            paginate(-1);
                                                        }
                                                    }
                                                }}
                                                className="absolute w-full h-full flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing"
                                            >
                                                {(() => {
                                                    const media = selectedPost.media[currentMediaIndex];
                                                    const isVideo = media.type?.startsWith('video') || media.url.match(/\.(mp4|webm|ogg)$/i);

                                                    if (isVideo) {
                                                        return (
                                                            <div
                                                                className="w-full h-full pointer-events-auto z-10 relative flex items-center justify-center"
                                                                onPointerDown={(e) => e.stopPropagation()}
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                onTouchStart={(e) => e.stopPropagation()}
                                                            >
                                                                <video
                                                                    src={media.url}
                                                                    controls
                                                                    autoPlay
                                                                    muted
                                                                    loop
                                                                    playsInline
                                                                    preload="auto"
                                                                    className="w-full h-full object-contain"
                                                                    poster={media.poster}
                                                                    onLoadedMetadata={(e) => handleMediaLoad(e, currentMediaIndex)}
                                                                />
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="relative w-full h-full">
                                                            <img
                                                                src={media.url}
                                                                alt={selectedPost.title}
                                                                className="w-full h-full object-contain"
                                                                draggable={false}
                                                                onLoad={(e) => handleMediaLoad(e, currentMediaIndex)}
                                                            />
                                                        </div>
                                                    );
                                                })()}
                                            </motion.div>
                                        </AnimatePresence>

                                        {/* Dots Indicator */}
                                        {selectedPost.media.length > 1 && (
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                                                {selectedPost.media.map((_: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentMediaIndex ? "bg-white" : "bg-white/50"
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <img
                                        src={selectedPost.url}
                                        alt={selectedPost.title}
                                        className="w-full h-full object-contain"
                                        onLoad={(e) => handleMediaLoad(e, 0)}
                                    />
                                )}
                            </div>

                            {/* Sidebar (Comments & Info) */}
                            <div className="flex flex-col bg-card w-full md:w-[var(--sidebar-width)] h-auto md:h-full border-l border-border">
                                {/* Header */}
                                <div className="p-4 border-b border-border flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {selectedPost.user?.username?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm">
                                                {selectedPost.user?.username || "Anonymous"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Comments Scroll Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar-light">
                                    {/* Caption */}
                                    <div className="flex gap-3">

                                        <div className="text-sm w-full">
                                            {selectedPost.title && <div className="font-bold text-base mb-1">{selectedPost.title}</div>}
                                            {selectedPost.description && (
                                                <div className="whitespace-pre-wrap text-sm">
                                                    {selectedPost.description}
                                                </div>
                                            )}
                                            <div className="text-xs text-muted-foreground mt-2">
                                                {timeAgo(selectedPost.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Comments List */}
                                    {selectedPost.comments?.filter((c: any) => !c.parentId).map((comment: any) => (
                                        <CommentItem
                                            key={comment.id}
                                            comment={comment}
                                            allComments={selectedPost.comments}
                                            onReply={onReply}
                                        />
                                    ))}
                                    <div ref={commentsEndRef} />
                                </div>

                                {/* Actions & Input */}
                                <div className="p-4 border-t border-border bg-card">
                                    <div className="flex items-center gap-4 mb-4">
                                        <button
                                            onClick={(e) => handleLike(e, selectedPost)}
                                            className="hover:opacity-70 transition-opacity"
                                        >
                                            <Heart
                                                className={selectedPost.likes?.some((l: any) => (l.user?.username || l.username) === currentUsername) ? "fill-red-500 text-red-500" : ""}
                                                size={24}
                                            />
                                        </button>
                                        <button className="hover:opacity-70 transition-opacity">
                                            <MessageCircle size={24} />
                                        </button>

                                    </div>
                                    <div className="text-sm font-semibold mb-2">
                                        {selectedPost.likes?.length || 0} likes
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase mb-4">
                                        {timeAgo(selectedPost.createdAt)}
                                    </div>
                                    {replyingTo && (
                                        <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg mb-2 text-xs">
                                            <span className="text-muted-foreground">
                                                Replying to <span className="font-bold text-foreground">@{replyingTo.user?.username}</span>
                                            </span>
                                            <button
                                                onClick={() => setReplyingTo(null)}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                    <form onSubmit={handleComment} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add a comment..."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            className="flex-1 bg-transparent border-none outline-none text-sm focus:ring-0 px-0"
                                            ref={commentInputRef}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!commentText.trim()}
                                            className="text-blue-500 font-semibold text-sm disabled:opacity-50 hover:text-blue-600"
                                        >
                                            Post
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section >
    );
}

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

const getAllReplies = (rootId: string, allComments: any[]) => {
    let replies: any[] = [];
    const directChildren = allComments.filter(c => c.parentId === rootId);

    directChildren.forEach(child => {
        replies.push(child);
        const grandChildren = getAllReplies(child.id, allComments);
        replies = [...replies, ...grandChildren];
    });

    return replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

const CommentItem = ({ comment, allComments, depth = 0, onReply }: { comment: any, allComments: any[], depth?: number, onReply: (c: any) => void }) => {
    const [visibleCount, setVisibleCount] = useState(0);

    // Only fetch replies if we are at the top level (depth 0)
    // If depth > 0, we assume the parent has already fetched and flattened us into the list
    const replies = depth === 0 ? getAllReplies(comment.id, allComments) : [];

    const handleViewReplies = () => {
        setVisibleCount(prev => prev + 6);
    };

    return (
        <div className="flex flex-col gap-1 mb-5">
            <div className="flex gap-3">
                <div className={`rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold shrink-0 ${depth > 0 ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'}`}>
                    {comment.user?.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="text-sm w-full">
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm mr-2">
                            {comment.user?.username || "Anonymous"}
                            <span className="font-normal text-foreground/90 ml-2">{comment.text}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                        <div className="text-xs text-muted-foreground">
                            {timeAgo(comment.createdAt)}
                        </div>
                        <button
                            onClick={() => onReply(comment)}
                            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Reply
                        </button>
                    </div>
                </div>
            </div>

            {/* Replies Section - Only rendered for top-level comments */}
            {replies.length > 0 && depth === 0 && (
                <div className="pl-11 mt-1">
                    {/* Render Visible Replies */}
                    {visibleCount > 0 && (
                        <div className="space-y-4 mt-2 mb-2">
                            {replies.slice(0, visibleCount).map(reply => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    allComments={allComments}
                                    depth={depth + 1}
                                    onReply={onReply}
                                />
                            ))}
                        </div>
                    )}

                    {/* View/Hide Controls */}
                    <div className="flex items-center gap-4">
                        {visibleCount < replies.length && (
                            <button
                                onClick={handleViewReplies}
                                className="text-xs font-semibold text-muted-foreground/70 flex items-center gap-3 hover:text-foreground transition-colors group"
                            >
                                {visibleCount === 0 && <div className="w-8 h-[1px] bg-muted-foreground/40 group-hover:bg-foreground/60 transition-colors"></div>}
                                {visibleCount === 0 ? `View replies (${replies.length})` : `View ${Math.min(6, replies.length - visibleCount)} more replies`}
                            </button>
                        )}

                        {visibleCount > 0 && (
                            <button
                                onClick={() => setVisibleCount(0)}
                                className="text-xs font-semibold text-muted-foreground/70 hover:text-foreground transition-colors"
                            >
                                Hide replies
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
