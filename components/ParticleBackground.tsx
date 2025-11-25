"use client";

import { useEffect, useRef } from "react";

interface ParticleBackgroundProps {
    isDark: boolean;
    onInteract?: () => void;
}

export default function ParticleBackground({ isDark, onInteract }: ParticleBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let mouseX = -1000;
        let mouseY = -1000;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        const colors = isDark
            ? ["#ffffff"]
            : ["#ec4899", "#a855f7", "#06b6d4"];

        class Particle {
            x: number;
            y: number;
            size: number;
            baseX: number;
            baseY: number;
            density: number;
            color: string;
            friction: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * 2 + 0.5;
                this.baseX = this.x;
                this.baseY = this.y;
                this.density = (Math.random() * 0.04) + 0.01; // Speed factor
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.friction = 0.95;
            }

            update() {
                if (mouseX === -1000 && mouseY === -1000) return;

                // Calculate distance to mouse
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;

                // Smooth chase logic
                // Particles move towards the cursor with a speed based on their 'density'
                this.x += dx * this.density;
                this.y += dy * this.density;

                // Trigger interaction callback if close enough (optional, for the "Hol on" text)
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 100 && onInteract) {
                    onInteract();
                }
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }
        }

        const init = () => {
            particles = [];
            const particleCount = (canvas.width * canvas.height) / 25000;
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        init();
        animate();

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.x;
            mouseY = e.y;
        };

        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isDark, onInteract]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 pointer-events-none"
        />
    );
}
