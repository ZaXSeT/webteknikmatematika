import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ZoomIn, RotateCw, Image as ImageIcon } from 'lucide-react';
import getCroppedImg from '@/lib/imageUtils';

interface CropModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (croppedFile: File) => void;
    file: File | null;
}

const ASPECT_RATIOS = [
    { label: 'Original', value: undefined },
    { label: '1:1', value: 1 / 1 },
    { label: '4:5', value: 4 / 5 },
    { label: '16:9', value: 16 / 9 },
];

export default function CropModal({ isOpen, onClose, onComplete, file }: CropModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState<number | undefined>(undefined); // Default to Original
    const [activeRatioLabel, setActiveRatioLabel] = useState<string>('Original');
    const [naturalRatio, setNaturalRatio] = useState<number>(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    useEffect(() => {
        if (file) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result?.toString() || null);
            });
            reader.readAsDataURL(file);
            // Reset states
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setRotation(0);
            setAspect(undefined);
            setActiveRatioLabel('Original');
        }
    }, [file]);

    const onMediaLoaded = useCallback((mediaSize: { naturalWidth: number; naturalHeight: number }) => {
        const ratio = mediaSize.naturalWidth / mediaSize.naturalHeight;
        setNaturalRatio(ratio);
        if (activeRatioLabel === 'Original') {
            setAspect(ratio);
        }
    }, [activeRatioLabel]);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels || !file) return;

        try {
            const croppedBlob = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation
            );

            if (croppedBlob) {
                const newFile = new File([croppedBlob], file.name, { type: file.type });
                onComplete(newFile);
                onClose();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-background rounded-3xl overflow-hidden w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h3 className="font-semibold text-lg">Crop Image</h3>
                            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Cropper Area */}
                        <div className="relative flex-1 min-h-[400px] bg-black/5">
                            {imageSrc && (
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    rotation={rotation}
                                    aspect={aspect}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    onRotationChange={setRotation}
                                    onMediaLoaded={onMediaLoaded}
                                    classes={{
                                        containerClassName: "rounded-none",
                                        mediaClassName: "",
                                        cropAreaClassName: "rounded-none border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                                    }}
                                />
                            )}
                        </div>

                        {/* Controls */}
                        <div className="p-6 space-y-6 bg-background">
                            {/* Aspect Ratio Selector */}
                            <div className="flex justify-center gap-4">
                                {ASPECT_RATIOS.map((ratio) => (
                                    <button
                                        key={ratio.label}
                                        onClick={() => {
                                            setActiveRatioLabel(ratio.label);
                                            if (ratio.value === undefined) {
                                                setAspect(naturalRatio);
                                                setZoom(1);
                                                setCrop({ x: 0, y: 0 });
                                            } else {
                                                setAspect(ratio.value);
                                            }
                                        }}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeRatioLabel === ratio.label
                                                ? 'bg-foreground text-background'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                    >
                                        {ratio.label}
                                    </button>
                                ))}
                            </div>

                            {/* Sliders */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <ZoomIn size={20} className="text-muted-foreground" />
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        aria-labelledby="Zoom"
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-foreground"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <RotateCw size={20} className="text-muted-foreground" />
                                    <input
                                        type="range"
                                        value={rotation}
                                        min={0}
                                        max={360}
                                        step={1}
                                        aria-labelledby="Rotation"
                                        onChange={(e) => setRotation(Number(e.target.value))}
                                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-foreground"
                                    />
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-full font-medium text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2.5 rounded-full font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Check size={18} />
                                    Apply Crop
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
