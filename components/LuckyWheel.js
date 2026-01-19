'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const WHEEL_SIZE = 360;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = WHEEL_SIZE * 0.44;

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
        const spins = 360 * 6;
        const randomOffset = (Math.random() - 0.5) * (SEGMENT_ANGLE - 2);

        const sectorAngle = prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
        const targetRotation = current + spins + (270 - sectorAngle - (current % 360)) + randomOffset;

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
            const ease = 1 - Math.pow(1 - t, 4);
            const newRot = startRotaRef.current + (targetRotaRef.current - startRotaRef.current) * ease;

            rotationRef.current = newRot;
            if (wheelRef.current) {
                wheelRef.current.style.transform = `rotate(${newRot}deg)`;
            }

            const currentTick = Math.floor(newRot / SEGMENT_ANGLE);
            if (currentTick > lastTickRef.current) {
                playTickSound();
                lastTickRef.current = currentTick;
            }
            requestRef.current = requestAnimationFrame(animate);
        } else {
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
        <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto', userSelect: 'none' }}>

            {/* 1. OUTER RING (Hoi Xuan Decor) */}
            <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(#F59E0B, #FDE047, #F59E0B, #FDE047, #F59E0B)', padding: '8px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                <div className="w-full h-full rounded-full bg-red-900 border-2 border-yellow-600 relative">
                    {/* Lights */}
                    {Array.from({ length: 12 }).map((_, i) => {
                        const deg = i * (360 / 12);
                        return (
                            <div
                                key={i}
                                style={{
                                    position: 'absolute',
                                    top: '50%', left: '50%',
                                    width: '8px', height: '8px',
                                    borderRadius: '50%',
                                    background: '#FFF',
                                    transform: `translate(-50%, -50%) rotate(${deg}deg) translate(144px)`,
                                    boxShadow: '0 0 4px #FFF',
                                    animation: spinning ? `blink 0.5s infinite ${i % 2}s` : 'none'
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* 2. WHEEL */}
            <div className="absolute top-3 left-3 right-3 bottom-3 rounded-full overflow-hidden shadow-inner border-2 border-[#F59E0B]">
                <svg
                    ref={wheelRef}
                    viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
                    style={{ width: '100%', height: '100%', willChange: 'transform' }}
                >
                    {segments.map((seg, i) => {
                        const startA = i * SEGMENT_ANGLE;
                        const endA = (i + 1) * SEGMENT_ANGLE;
                        const start = getCoord(startA / 360, RADIUS);
                        const end = getCoord(endA / 360, RADIUS);
                        const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;
                        const path = `M ${CENTER} ${CENTER} L ${start[0]} ${start[1]} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end[0]} ${end[1]} Z`;

                        const midA = startA + SEGMENT_ANGLE / 2;
                        const dist = RADIUS * 0.65; // Center the icon
                        const tx = CENTER + dist * Math.cos(midA * Math.PI / 180);
                        const ty = CENTER + dist * Math.sin(midA * Math.PI / 180);

                        // Rotate icon to point inwards/outwards or just upright?
                        // For emoji, nice to be upright relative to the slice.
                        const rot = midA + 90;

                        return (
                            <g key={i}>
                                <path d={path} fill={seg.color} stroke="#FDE047" strokeWidth="2" />
                                <g transform={`translate(${tx}, ${ty}) rotate(${rot})`}>
                                    <text
                                        y="10"
                                        textAnchor="middle"
                                        fontSize="48"
                                        filter="drop-shadow(0 2px 2px rgba(0,0,0,0.2))"
                                    >
                                        {seg.emoji}
                                    </text>
                                    {/* Text Removed as requested */}
                                </g>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* 3. CENTER CAP */}
            <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%)', width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(to bottom right, #FCD34D, #F59E0B)', border: '4px solid #FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#B45309' }}>TÀI</span>
            </div>

            {/* 4. POINTER (Floating Top) */}
            <div className="absolute left-1/2" style={{ top: '-18px', transform: 'translateX(-50%)', zIndex: 30, filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.4))' }}>
                <svg width="40" height="50" viewBox="0 0 40 50" fill="none">
                    <path d="M20 50L5 15C5 15 0 5 10 0H30C40 0 35 15 35 15L20 50Z" fill="#DC2626" stroke="#fff" strokeWidth="3" />
                    <circle cx="20" cy="12" r="6" fill="#FCD34D" />
                </svg>
            </div>

            <style jsx>{`
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
            `}</style>
        </div>
    );
}
