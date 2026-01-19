'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const WHEEL_SIZE = 360; // Standard size
const CENTER = WHEEL_SIZE / 2;
const RADIUS = WHEEL_SIZE * 0.42; // Leave room for border

// --- Audio Helpers ---
const playTickSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) { }
};

const playWinSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;
        [0, 0.2, 0.4, 0.6].forEach((delay, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = 600 + i * 200;
            gain.gain.setValueAtTime(0.1, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.3);
        });
    } catch (e) { }
};

export default function LuckyWheel({ segments, spinning, prizeIndex, onStop }) {
    const wheelRef = useRef(null);
    const rotationRef = useRef(0);
    const requestRef = useRef();
    const lastTickRef = useRef(0);
    const startTimeRef = useRef();
    const startRotaRef = useRef(0);
    const targetRotaRef = useRef(0);

    const SEGMENT_ANGLE = 360 / segments.length;

    useEffect(() => {
        if (spinning && prizeIndex !== null) {
            startSpin();
        }
    }, [spinning, prizeIndex]);

    const startSpin = () => {
        const current = rotationRef.current;
        const spins = 360 * 6; // Spin 6 times
        const randomOffset = (Math.random() - 0.5) * (SEGMENT_ANGLE - 2);
        // Logic: Pointer is at TOP (270deg is top in SVG if 0 is right)
        // Actually, we rotate the <g> group.
        // Let's assume Segment 0 starts at 0deg (Right).
        // To make Segment 0 hit Top (270deg), we need Rotation = 270.
        // Index i center: i*Angle + Angle/2.
        // Rotation + (i*Angle + Angle/2) = 270
        // => Rotation = 270 - (i*Angle + Angle/2)

        const sectorAngle = prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
        const targetRotation = current + spins + (270 - sectorAngle - (current % 360)) + randomOffset;

        // Normalize
        const finalTarget = targetRotation < current + 360 * 5 ? targetRotation + 360 : targetRotation;

        startTimeRef.current = null;
        startRotaRef.current = current;
        targetRotaRef.current = finalTarget;
        lastTickRef.current = Math.floor(current / SEGMENT_ANGLE);

        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(animate);
    };

    const animate = (time) => {
        if (!startTimeRef.current) startTimeRef.current = time;
        const elapsed = time - startTimeRef.current;
        const duration = 5000;

        if (elapsed < duration) {
            const t = elapsed / duration;
            const ease = 1 - Math.pow(1 - t, 4); // Quartic Ease Out
            const newRot = startRotaRef.current + (targetRotaRef.current - startRotaRef.current) * ease;

            // DOM Update
            rotationRef.current = newRot;
            if (wheelRef.current) {
                wheelRef.current.style.transform = `rotate(${newRot}deg)`;
            }

            // Sound
            const currentTick = Math.floor(newRot / SEGMENT_ANGLE);
            if (currentTick > lastTickRef.current) {
                playTickSound();
                lastTickRef.current = currentTick;
            }
            requestRef.current = requestAnimationFrame(animate);
        } else {
            // Finish
            const finalRot = targetRotaRef.current;
            rotationRef.current = finalRot;
            if (wheelRef.current) wheelRef.current.style.transform = `rotate(${finalRot}deg)`;

            playWinSound();
            fireConfetti();
            onStop();
        }
    };

    const fireConfetti = () => {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    };

    const getCoord = (percent, r = RADIUS) => [
        CENTER + r * Math.cos(2 * Math.PI * percent),
        CENTER + r * Math.sin(2 * Math.PI * percent)
    ];

    return (
        <div className="relative w-[320px] h-[320px] mx-auto select-none">
            {/* 1. OUTER DECORATION RING + LIGHTS */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-yellow-600 via-yellow-400 to-yellow-700 shadow-2xl p-2">
                <div className="w-full h-full rounded-full bg-red-900 border-4 border-yellow-800 relative">
                    {/* Dots / Lights */}
                    {Array.from({ length: 24 }).map((_, i) => {
                        const angle = (i * 360 / 24) * (Math.PI / 180);
                        const r = 152; // bit smaller than container
                        const x = 156 + r * Math.cos(angle); // 156 approx center for 320/2-border
                        const y = 156 + r * Math.sin(angle);
                        return (
                            <div
                                key={i}
                                className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_5px_#fff]"
                                style={{
                                    left: '50%', top: '50%',
                                    transform: `translate(${r * Math.cos(angle) - 6}px, ${r * Math.sin(angle) - 6}px)`,
                                    animation: spinning ? `blink 1s infinite ${i % 2 * 0.5}s` : 'none'
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* 2. THE ROTATING WHEEL */}
            <div className="absolute top-4 left-4 right-4 bottom-4 rounded-full overflow-hidden shadow-inner ring-4 ring-yellow-500/50 bg-[#FFFBE6]">
                <svg
                    ref={wheelRef}
                    viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
                    className="w-full h-full will-change-transform"
                    style={{ transform: 'rotate(0deg)' }}
                >
                    {segments.map((seg, i) => {
                        const startA = i * SEGMENT_ANGLE;
                        const endA = (i + 1) * SEGMENT_ANGLE;
                        const start = getCoord(startA / 360, RADIUS);
                        const end = getCoord(endA / 360, RADIUS);
                        const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;
                        const path = `M ${CENTER} ${CENTER} L ${start[0]} ${start[1]} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end[0]} ${end[1]} Z`;

                        // Text Position
                        const midA = startA + SEGMENT_ANGLE / 2;
                        const dist = RADIUS * 0.65;
                        const tx = CENTER + dist * Math.cos(midA * Math.PI / 180);
                        const ty = CENTER + dist * Math.sin(midA * Math.PI / 180);
                        // Rotate text to be readable (tangent + flip)
                        // Rotate (midA + 90) make it tangent.
                        return (
                            <g key={i}>
                                <path d={path} fill={seg.color} stroke="#fff" strokeWidth="2" />
                                <g transform={`translate(${tx}, ${ty}) rotate(${midA + 90})`}>
                                    <text
                                        y="-10"
                                        textAnchor="middle"
                                        fontSize="36"
                                        filter="drop-shadow(0 2px 2px rgba(0,0,0,0.3))"
                                    >
                                        {seg.emoji}
                                    </text>
                                    <text
                                        y="25"
                                        textAnchor="middle"
                                        fontSize="14"
                                        fontWeight="900"
                                        fill={seg.textCol || '#fff'}
                                        stroke="#fff"
                                        strokeWidth="0.5" // White outline for contrast
                                        fontFamily="Arial, sans-serif"
                                    >
                                        {seg.name}
                                    </text>
                                </g>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* 3. CENTER CAP */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border-4 border-white shadow-xl z-20 flex items-center justify-center">
                <span className="text-2xl font-bold text-red-700 drop-shadow-sm">TÀI</span>
            </div>

            {/* 4. POINTER (Absolute Top Center) */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 drop-shadow-xl filter">
                {/* Simple Arrow SVG */}
                <svg width="40" height="50" viewBox="0 0 40 50" fill="none">
                    {/* Main body */}
                    <path d="M20 50L5 15C5 15 0 5 10 0H30C40 0 35 15 35 15L20 50Z" fill="#DC2626" stroke="#fff" strokeWidth="3" />
                    <circle cx="20" cy="12" r="6" fill="#FCD34D" />
                </svg>
            </div>

            <style jsx>{`
                @keyframes blink { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
            `}</style>
        </div>
    );
}
