"use client";

import { useEffect, useRef } from "react";

// Custom Discord Icon SVG
const DiscordIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
    </svg>
);

interface FooterProps {
    isDark?: boolean;
}

export default function Footer({ isDark = true }: FooterProps) {
    const currentYear = new Date().getFullYear();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = canvas.offsetWidth;
        let height = canvas.height = canvas.offsetHeight;
        let animationId: number;

        // Rain variables
        const drops: { x: number, y: number, speed: number, length: number, opacity: number }[] = [];
        const maxDrops = 80;

        // Cloud variables
        const clouds: { x: number, y: number, speed: number, size: number }[] = [];
        const maxClouds = 5;

        // Initialize Rain
        const initRain = () => {
            drops.length = 0;
            for (let i = 0; i < maxDrops; i++) {
                drops.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    speed: Math.random() * 3 + 2,
                    length: Math.random() * 15 + 10,
                    opacity: Math.random() * 0.3 + 0.1
                });
            }
        };

        // Initialize Clouds
        const initClouds = () => {
            clouds.length = 0;
            for (let i = 0; i < maxClouds; i++) {
                clouds.push({
                    x: Math.random() * width,
                    y: Math.random() * (height / 2),
                    speed: Math.random() * 0.5 + 0.2,
                    size: Math.random() * 30 + 40
                });
            }
        };

        const drawRain = () => {
            ctx.clearRect(0, 0, width, height);
            drops.forEach(drop => {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(173, 216, 230, ${drop.opacity})`;
                ctx.lineWidth = 1.5;
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x, drop.y + drop.length);
                ctx.stroke();

                drop.y += drop.speed;
                if (drop.y > height) {
                    drop.y = -drop.length;
                    drop.x = Math.random() * width;
                }
            });
        };

        const drawSunAndClouds = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw Sun
            const sunX = width - 100;
            const sunY = 60;
            const sunRadius = 40;

            // Sun Glow
            const gradient = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 2);
            gradient.addColorStop(0, "rgba(255, 255, 200, 0.8)");
            gradient.addColorStop(0.5, "rgba(255, 200, 50, 0.4)");
            gradient.addColorStop(1, "rgba(255, 200, 50, 0)");

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
            ctx.fill();

            // Sun Core
            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
            ctx.fill();

            // Draw Clouds
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            clouds.forEach(cloud => {
                ctx.beginPath();
                ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
                ctx.arc(cloud.x + cloud.size * 0.8, cloud.y - cloud.size * 0.5, cloud.size * 0.9, 0, Math.PI * 2);
                ctx.arc(cloud.x + cloud.size * 1.6, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
                ctx.fill();

                cloud.x += cloud.speed;
                if (cloud.x > width + 100) {
                    cloud.x = -150;
                    cloud.y = Math.random() * (height / 2);
                }
            });
        };

        const animate = () => {
            if (isDark) {
                drawRain();
            } else {
                drawSunAndClouds();
            }
            animationId = requestAnimationFrame(animate);
        };

        // Initial setup
        if (isDark) {
            initRain();
        } else {
            initClouds();
        }

        animate();

        const handleResize = () => {
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
            if (isDark) initRain(); else initClouds();
        };

        window.addEventListener('resize', handleResize);
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
        };
    }, [isDark]);

    return (
        <footer className={`relative border-t overflow-hidden py-12 font-mono transition-colors duration-500 ${isDark ? 'bg-black text-white border-zinc-800' : 'bg-gradient-to-r from-pink-100 via-purple-100 to-cyan-100 text-slate-800 border-pink-200'}`}>
            {/* Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-60" />

            {/* Gradient Overlay for depth */}
            <div className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${isDark ? 'bg-gradient-to-t from-black via-transparent to-transparent' : 'bg-gradient-to-t from-white/60 via-transparent to-transparent'}`} />

            <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">

                {/* Clean Brand */}
                <div className={`text-2xl font-bold tracking-tighter select-none transition-colors ${isDark ? 'text-zinc-500' : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500'}`}>
                    TeknikMatematika
                </div>

                <div className={`text-xs font-medium transition-colors ${isDark ? 'text-zinc-500' : 'text-slate-800'}`}>
                    © {currentYear} TeknikMatematika. All rights reserved.
                </div>

                {/* Discord Icon */}
                <a
                    href="#"
                    className={`group relative p-2 rounded-lg border transition-all duration-300 ${isDark ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800' : 'bg-white/50 border-white/50 hover:border-white hover:bg-white'}`}
                >
                    <DiscordIcon className={`w-5 h-5 transition-colors ${isDark ? 'text-zinc-400 group-hover:text-white' : 'text-slate-500 group-hover:text-blue-500'}`} />
                </a>
            </div>
        </footer>
    );
}
