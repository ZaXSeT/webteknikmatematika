"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Heart, MessageCircle, Send, Trash2, Edit2, Save, ChevronLeft, ChevronRight, Layers, Bookmark } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import VideoPlayer from "./VideoPlayer";

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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [direction, setDirection] = useState(0);
    const [fixedAspectRatio, setFixedAspectRatio] = useState(1);
    const [isDesktop, setIsDesktop] = useState(false);

    const handleCloseModal = () => {
        setIsClosing(true);
    };

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (selectedPost && !isClosing) {
            if (activePostIdRef.current === selectedPost.id) {
                return;
            }
            activePostIdRef.current = selectedPost.id;

            if (overlayRef.current) overlayRef.current.style.willChange = 'opacity';
            if (contentRef.current) contentRef.current.style.willChange = 'opacity';

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
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

    useEffect(() => {
        const checkLocalStorage = () => {
            const storedUsername = localStorage.getItem("username");
            if (storedUsername) {
                setCurrentUsername(storedUsername);
            }
        };

        checkLocalStorage();
        window.addEventListener('storage', checkLocalStorage);
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

    useEffect(() => {
        if (propUsername) {
            setCurrentUsername(propUsername);
        }
    }, [propUsername]);

    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: "auto" });
    };

    useEffect(() => {
        if (selectedPost) {
            setIsEditing(false);
            setEditTitle(selectedPost.title || "");
            setEditDescription(selectedPost.description || "");

            document.body.style.overflow = 'hidden';

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "ArrowRight") {
                    if (selectedPost.media && currentMediaIndex < selectedPost.media.length - 1) {
                        setCurrentMediaIndex(prev => prev + 1);
                        setDirection(1);
                    }
                } else if (e.key === "ArrowLeft") {
                    if (currentMediaIndex > 0) {
                        setCurrentMediaIndex(prev => prev - 1);
                        setDirection(-1);
                    }
                } else if (e.key === "Escape") {
                    handleCloseModal();
                }
            };
            window.addEventListener('keydown', handleKeyDown);

            return () => {
                document.body.style.overflow = 'unset';
                window.removeEventListener('keydown', handleKeyDown);
            };
        } else {
            document.body.style.overflow = 'unset';
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

    const handleLike = async (post: any) => {
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
        } catch (error: any) {
            console.error("Like failed", error);
            alert(error.message || "Failed to update like. Please try again.");
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
                if (data.comment) {
                    const realComment = data.comment;
                    setUploads(prev => prev.map(u => {
                        if (u.id === selectedPost.id) {
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

    const paginate = (newDirection: number) => {
        setDirection(newDirection);
        setCurrentMediaIndex(prev => prev + newDirection);
    };

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

    const onReply = (comment: any) => {
        setReplyingTo(comment);
        commentInputRef.current?.focus();
    };

    const displayedUploads = limit ? uploads.slice(0, limit) : uploads;

    useEffect(() => {
        if (selectedPost) {
            setCurrentMediaIndex(0);
            setDirection(0);
            setMediaAspectRatios({});

            let initialRatio = 1;
            if (gridAspectRatios[selectedPost.id]) {
                initialRatio = gridAspectRatios[selectedPost.id];
            }
            setFixedAspectRatio(initialRatio);
        }
    }, [selectedPost?.id, gridAspectRatios]);

    useEffect(() => {
        if (mediaAspectRatios[0]) {
            setFixedAspectRatio(mediaAspectRatios[0]);
        }
    }, [mediaAspectRatios]);

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
                                className="group cursor-pointer break-inside-avoid mb-0 md:mb-6"
                            >
                                <div className={`overflow-hidden rounded-sm md:rounded-2xl mb-0 md:mb-2 bg-muted relative ${forceSquare ? 'aspect-square' : ''}`}>
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
                                <h3 className="hidden md:block text-sm font-bold mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight text-foreground">
                                    {upload.title || "Untitled"}
                                </h3>
                                <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
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
                            className="bg-card rounded-xl overflow-y-auto md:overflow-hidden shadow-2xl flex flex-col md:flex-row relative w-full md:w-auto md:max-w-[90vw] md:h-[85vh] opacity-0"
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
                            <div className="relative bg-black flex items-center justify-center overflow-hidden flex-1 min-h-[40vh] md:min-h-full md:min-w-[40vw] lg:min-w-[50vw]"
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
                                                drag="x"
                                                dragConstraints={{ left: 0, right: 0 }}
                                                dragElastic={1}
                                                onDragEnd={(e, { offset, velocity }) => {
                                                    const swipe = swipePower(offset.x, velocity.x);

                                                    if (swipe < -swipeConfidenceThreshold) {
                                                        paginate(1);
                                                    } else if (swipe > swipeConfidenceThreshold) {
                                                        paginate(-1);
                                                    }
                                                }}
                                                className="absolute inset-0 flex items-center justify-center"
                                            >
                                                {(() => {
                                                    const media = selectedPost.media[currentMediaIndex];
                                                    const isVideo = media.type?.startsWith('video') || media.url.match(/\.(mp4|webm|ogg)$/i);

                                                    if (isVideo) {
                                                        return (
                                                            <div
                                                                className="w-full h-full pointer-events-auto z-10 relative flex items-center justify-center overflow-hidden bg-black"
                                                                onPointerDown={(e) => e.stopPropagation()}
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                onTouchStart={(e) => e.stopPropagation()}
                                                            >
                                                                <VideoPlayer
                                                                    src={media.url}
                                                                    poster={media.poster}
                                                                    className="w-full h-full object-contain"
                                                                    onLoadedMetadata={(e) => handleMediaLoad(e, currentMediaIndex)}
                                                                    autoPlay={true}
                                                                />
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                                                            <img
                                                                src={media.url}
                                                                alt={selectedPost.title}
                                                                className="w-full h-full object-contain pointer-events-none"
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
                                    <div className="text-white">No media</div>
                                )}
                            </div>

                            {/* Comments Section (Right Side on Desktop, Bottom on Mobile) */}
                            <div className="flex flex-col w-full md:w-[400px] bg-card border-l border-border h-full max-h-[50vh] md:max-h-full">
                                {/* Header */}
                                <div className="p-4 border-b border-border flex items-center gap-3 shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                                        {selectedPost.user?.username?.[0]?.toUpperCase() || "?"}
                                    </div>
                                    <span className="font-semibold">{selectedPost.user?.username || "Anonymous"}</span>
                                    {currentUsername === selectedPost.user?.username && (
                                        <button
                                            onClick={handleDelete}
                                            className="ml-auto p-2 text-red-500 hover:bg-red-50 rounded-full md:hidden"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>

                                {/* Caption & Comments List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {/* Caption */}
                                    {selectedPost.title && (
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground shrink-0">
                                                {selectedPost.user?.username?.[0]?.toUpperCase() || "?"}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm">
                                                    <span className="font-semibold mr-2">{selectedPost.user?.username}</span>
                                                    {selectedPost.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Uploaded by {selectedPost.user?.username}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {timeAgo(selectedPost.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Comments */}
                                    {selectedPost.comments?.filter((c: any) => !c.parentId).map((comment: any) => (
                                        <CommentItem
                                            key={comment.id}
                                            comment={comment}
                                            allComments={selectedPost.comments}
                                            onReply={onReply}
                                        />
                                    ))}
                                </div>

                                {/* Actions & Input */}
                                <div className="p-4 border-t border-border bg-card shrink-0">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleLike(selectedPost)}
                                                className={`transition-transform active:scale-125 ${selectedPost.likes?.some((l: any) => l.user?.username === currentUsername)
                                                    ? "text-red-500"
                                                    : "text-foreground hover:text-muted-foreground"
                                                    }`}
                                            >
                                                <Heart
                                                    size={24}
                                                    fill={selectedPost.likes?.some((l: any) => l.user?.username === currentUsername) ? "currentColor" : "none"}
                                                />
                                            </button>
                                            <button className="text-foreground hover:text-muted-foreground" onClick={() => commentInputRef.current?.focus()}>
                                                <MessageCircle size={24} />
                                            </button>
                                            <button className="text-foreground hover:text-muted-foreground">
                                                <Send size={24} />
                                            </button>
                                        </div>
                                        <button className="text-foreground hover:text-muted-foreground">
                                            <Bookmark size={24} />
                                        </button>
                                    </div>

                                    <div className="mb-3">
                                        <div className="font-semibold text-sm">
                                            {selectedPost.likes?.length || 0} likes
                                        </div>
                                        <div className="text-[10px] text-muted-foreground uppercase mt-0.5">
                                            {new Date(selectedPost.createdAt).toLocaleDateString(undefined, {
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>

                                    <form onSubmit={handleComment} className="flex items-center gap-2 relative">
                                        {replyingTo && (
                                            <div className="absolute -top-10 left-0 right-0 bg-muted/80 backdrop-blur-sm px-3 py-1.5 text-xs flex justify-between items-center rounded-t-md border-t border-x border-border">
                                                <span className="truncate">Replying to <span className="font-semibold">{replyingTo.user?.username}</span></span>
                                                <button
                                                    type="button"
                                                    onClick={() => setReplyingTo(null)}
                                                    className="p-1 hover:bg-black/10 rounded-full"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}
                                        <input
                                            ref={commentInputRef}
                                            type="text"
                                            placeholder={replyingTo ? `Reply to ${replyingTo.user?.username}...` : "Add a comment..."}
                                            className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm placeholder:text-muted-foreground"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                        />
                                        {commentText.trim() && (
                                            <button
                                                type="submit"
                                                className="text-blue-500 font-semibold text-sm hover:text-blue-700 disabled:opacity-50"
                                            >
                                                Post
                                            </button>
                                        )}
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
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

            {replies.length > 0 && depth === 0 && (
                <div className="pl-11 mt-1">
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
