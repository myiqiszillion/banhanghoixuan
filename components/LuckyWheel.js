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

            {/* 1. SIMPLE OUTER RING (No lights, just border) */}
            <div className="absolute inset-0 rounded-full border-[8px] border-yellow-500 bg-white shadow-xl"></div>

            {/* 2. WHEEL */}
            <div className="absolute top-2 left-2 right-2 bottom-2 rounded-full overflow-hidden">
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
                        const dist = RADIUS * 0.75;
                        const tx = CENTER + dist * Math.cos(midA * Math.PI / 180);
                        const ty = CENTER + dist * Math.sin(midA * Math.PI / 180);

                        // Simple Rotation: Always +90 tangent
                        let rot = midA + 90;
                        if (midA > 90 && midA < 270) rot += 180;

                        return (
                            <g key={i}>
                                <path d={path} fill={seg.color} stroke="#FFF" strokeWidth="2" />
                                <g transform={`translate(${tx}, ${ty}) rotate(${rot})`}>
                                    <text
                                        y={midA > 90 && midA < 270 ? 20 : -10}
                                        textAnchor="middle"
                                        fontSize="28"
                                    >
                                        {seg.emoji}
                                    </text>
                                    <text
                                        y={midA > 90 && midA < 270 ? -10 : 20}
                                        textAnchor="middle"
                                        fontSize="12"
                                        fontWeight="bold"
                                        fill={seg.textCol || '#fff'}
                                        style={{ fontFamily: 'Arial, sans-serif' }}
                                    >
                                        {seg.name}
                                    </text>
                                </g>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* 3. POINTER (Simple Triangle Top) */}
            <div className="absolute left-1/2" style={{ top: '-15px', transform: 'translateX(-50%)', zIndex: 30, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))' }}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M20 40L5 10C5 10 10 0 20 0C30 0 35 10 35 10L20 40Z" fill="#DC2626" stroke="#FFF" strokeWidth="3" />
                </svg>
            </div>

            {/* 4. CENTER CAP (Small) */}
            <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%)', width: '50px', height: '50px', borderRadius: '50%', background: '#FFF', border: '4px solid #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                <span style={{ fontSize: '1.5rem' }}>🎯</span>
            </div>

        </div>
    );
}
