"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Upload, X } from "lucide-react";
import { useState, useRef } from "react";

interface UploadSectionProps {
    username?: string;
    compact?: boolean;
}

export default function UploadSection({ username, compact = false }: UploadSectionProps) {
    const ref = useRef(null);
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Compression states
    const [compressionProgress, setCompressionProgress] = useState<number>(0);
    const [isCompressing, setIsCompressing] = useState(false);
    const ffmpegRef = useRef<any>(null);

    const loadFFmpeg = async () => {
        if (ffmpegRef.current) return ffmpegRef.current;

        const { FFmpeg } = await import('@ffmpeg/ffmpeg');
        const { toBlobURL } = await import('@ffmpeg/util');

        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;

        if (!ffmpeg.loaded) {
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
        }

        return ffmpeg;
    };

    const compressVideo = async (file: File): Promise<File> => {
        setIsCompressing(true);
        setUploadStatus("Initializing compression...");

        try {
            const ffmpeg = await loadFFmpeg();
            const { fetchFile } = await import('@ffmpeg/util');

            const inputName = 'input.mp4';
            const outputName = 'output.mp4';

            await ffmpeg.writeFile(inputName, await fetchFile(file));

            ffmpeg.on('progress', ({ progress }: { progress: number }) => {
                setCompressionProgress(Math.round(progress * 100));
                setUploadStatus(`Compressing video: ${Math.round(progress * 100)}%`);
            });

            // Compress: Scale to 720p, CRF 28 (lower quality but decent), ultrafast preset
            await ffmpeg.exec([
                '-i', inputName,
                '-vf', 'scale=720:-2', // Scale width to 720, height auto (divisible by 2)
                '-c:v', 'libx264',
                '-crf', '28',
                '-preset', 'ultrafast',
                outputName
            ]);

            const data = await ffmpeg.readFile(outputName);
            const compressedBlob = new Blob([data], { type: 'video/mp4' });

            return new File([compressedBlob], file.name, { type: 'video/mp4' });

        } catch (error) {
            console.error("Compression error:", error);
            throw new Error("Failed to compress video");
        } finally {
            setIsCompressing(false);
            setCompressionProgress(0);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files).filter(file =>
                file.type.startsWith('image/') || file.type.startsWith('video/')
            );
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).filter(file =>
                file.type.startsWith('image/') || file.type.startsWith('video/')
            );
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (!username) {
            setUploadStatus("Error: You must be logged in to upload.");
            return;
        }

        setIsUploading(true);
        setUploadStatus("Starting upload...");

        try {
            const { supabase } = await import("@/lib/supabase");
            const mediaItems: { url: string, type: string }[] = [];

            for (const file of files) {
                let fileToUpload = file;

                // Check if video needs compression (e.g., > 20MB)
                if (file.type.startsWith('video/') && file.size > 20 * 1024 * 1024) {
                    setUploadStatus(`Compressing ${file.name}...`);
                    try {
                        fileToUpload = await compressVideo(file);
                        setUploadStatus("Compression finished. Uploading...");
                    } catch (e) {
                        console.error("Compression failed, trying original file", e);
                        setUploadStatus("Compression failed. Trying original file...");
                    }
                }

                // 1. Upload to Supabase Storage directly
                const filename = `${Date.now()}-${fileToUpload.name.replace(/\s/g, '-')}`;

                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from('uploads')
                    .upload(filename, fileToUpload, {
                        contentType: fileToUpload.type,
                        upsert: false
                    });

                if (uploadError) {
                    throw new Error(`Storage Error: ${uploadError.message}`);
                }

                // 2. Get Public URL
                const { data: { publicUrl } } = supabase
                    .storage
                    .from('uploads')
                    .getPublicUrl(filename);

                mediaItems.push({ url: publicUrl, type: fileToUpload.type });
            }

            // 3. Save metadata to DB via API (Single Post)
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    media: mediaItems,
                    title: title || (files.length === 1 ? files[0].name : `${files.length} items`),
                    description: description || `Uploaded by ${username}`
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to save post metadata");
            }
            setUploadStatus("Upload successful!");
            setFiles([]);
            setTitle("");
            setDescription("");

            setTimeout(() => {
                sessionStorage.setItem("scrollTo", "media");
                window.location.reload();
            }, 1000);
        } catch (error: any) {
            console.error(error);
            setUploadStatus(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
            setIsCompressing(false);
        }
    };

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <section ref={ref} id="upload" className={`${compact ? 'py-0' : 'py-16 md:py-24'} bg-background text-foreground relative overflow-hidden`}>
            {!compact && (
                <motion.div
                    style={{ y, opacity }}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
                >
                    <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
                </motion.div>
            )}

            <div className="container mx-auto px-4 relative z-10">
                {!compact && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Upload anything here</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Drag and drop your media here.
                        </p>
                    </motion.div>
                )}

                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className={`
              relative border-2 border-dashed rounded-3xl p-6 md:p-12 text-center transition-all duration-300
              ${isDragging
                                ? "border-blue-500 bg-blue-500/10"
                                : "border-border bg-muted/30 hover:border-muted-foreground/50 hover:bg-muted/50"
                            }
            `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isUploading}
                        />

                        <div className="flex flex-col items-center gap-4 pointer-events-none">
                            <div className="p-4 rounded-full bg-muted text-blue-600 dark:text-blue-400">
                                <Upload size={32} />
                            </div>
                            <div>
                                <p className="text-xl font-medium mb-2">
                                    Drop your shit here or click to browse
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Support: PNG, JPG, GIF, MP4 and WEBP
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-12"
                        >
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                {files.map((file, index) => (
                                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-muted">
                                        {file.type.startsWith('video/') ? (
                                            <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                        ) : (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt="preview"
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => removeFile(index)}
                                                className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                            <p className="text-xs text-white truncate">{file.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="max-w-md mx-auto space-y-4 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1 text-left">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Give your post a title..."
                                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1 text-left">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Tell us about your upload..."
                                        rows={3}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading || !title.trim()}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-full font-medium transition-all hover:scale-105 active:scale-95"
                                >
                                    {isUploading ? (isCompressing ? `Compressing ${compressionProgress}%...` : "Uploading...") : `Upload ${files.length} Files`}
                                </button>
                                {uploadStatus && (
                                    <p className={`text-sm ${uploadStatus.includes("failed") || uploadStatus.includes("Error") ? "text-red-400" : "text-green-400"}`}>
                                        {uploadStatus}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </section >
    );
}
