'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

const WHEEL_SIZE = 400;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = WHEEL_SIZE * 0.45;

const playTickSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
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
        [400, 500, 600, 800].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.1);
            osc.stop(ctx.currentTime + i * 0.1 + 0.3);
        });
    } catch (e) { }
};

export default function LuckyWheel({
    segments,
    spinning,
    prizeIndex,
    onStop
}) {
    const wheelRef = useRef(null);
    const rotationRef = useRef(0);

    // Animation refs
    const requestRef = useRef();
    const startTimeRef = useRef();
    const startRotationRef = useRef(0);
    const targetRotationRef = useRef(0);
    const lastTickRef = useRef(0);

    const SEGMENT_ANGLE = 360 / segments.length;

    useEffect(() => {
        if (spinning && prizeIndex !== null) {
            startSpin();
        }
    }, [spinning, prizeIndex]);

    const startSpin = () => {
        const currentRot = rotationRef.current;
        const spins = 360 * 5;
        const randomOffset = (Math.random() - 0.5) * (SEGMENT_ANGLE - 10);

        const sectorAngle = prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
        const desiredRotation = 270 - sectorAngle + randomOffset;

        let target = currentRot + spins + (desiredRotation - (currentRot % 360));
        if (target < currentRot + spins) target += 360;

        startRotationRef.current = currentRot;
        targetRotationRef.current = target;
        startTimeRef.current = null;
        lastTickRef.current = Math.floor(currentRot / SEGMENT_ANGLE);

        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(animate);
    };

    const animate = (time) => {
        if (!startTimeRef.current) startTimeRef.current = time;
        const elapsed = time - startTimeRef.current;
        const duration = 5000;

        if (elapsed < duration) {
            const t = elapsed / duration;
            const easeOut = 1 - Math.pow(1 - t, 4);

            const newRot = startRotationRef.current + (targetRotationRef.current - startRotationRef.current) * easeOut;

            // Direct DOM update
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
            const finalRot = targetRotationRef.current;
            rotationRef.current = finalRot;
            if (wheelRef.current) {
                wheelRef.current.style.transform = `rotate(${finalRot}deg)`;
            }
            playWinSound();
            fireConfetti();
            onStop();
        }
    };

    const fireConfetti = () => {
        const count = 200;
        const defaults = { origin: { y: 0.7 } };
        function fire(particleRatio, opts) {
            confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
        }
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    };

    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    }

    return (
        <div className="relative w-full max-w-[320px] aspect-square mx-auto">
            {/* Pointer (Explicit Size to prevent giant svg) */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20" style={{ width: '40px', height: '50px' }}>
                <svg width="100%" height="100%" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
                    <path d="M15 40L0 15C0 6.71573 6.71573 0 15 0C23.2843 0 30 6.71573 30 15L15 40Z" fill="#fbbf24" stroke="#fff" strokeWidth="2" />
                </svg>
            </div>

            {/* SVG Wheel */}
            <div className="w-full h-full rounded-full shadow-[0_0_20px_rgba(251,191,36,0.2)] border-4 border-orange-500/50 bg-gray-800 relative z-10 overflow-hidden">
                <svg
                    ref={wheelRef}
                    viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
                    className="w-full h-full transform will-change-transform"
                    style={{ transform: `rotate(0deg)` }}
                >
                    <defs>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                            <feOffset dx="1" dy="1" result="offsetblur" />
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.5" />
                            </feComponentTransfer>
                            <feMerge>
                                <feMergeNode in="offsetblur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {segments.map((segment, i) => {
                        const startAngle = i * SEGMENT_ANGLE;
                        const endAngle = (i + 1) * SEGMENT_ANGLE;
                        const start = getCoordinatesForPercent(startAngle / 360);
                        const end = getCoordinatesForPercent(endAngle / 360);
                        const largeArcFlag = SEGMENT_ANGLE > 180 ? 1 : 0;
                        const sx = CENTER + start[0] * RADIUS;
                        const sy = CENTER + start[1] * RADIUS;
                        const ex = CENTER + end[0] * RADIUS;
                        const ey = CENTER + end[1] * RADIUS;

                        const pathData = `M ${CENTER} ${CENTER} L ${sx} ${sy} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${ex} ${ey} Z`;

                        const midAngle = startAngle + SEGMENT_ANGLE / 2;
                        const midRad = midAngle * Math.PI / 180;
                        const dist = RADIUS * 0.72;
                        const tx = CENTER + Math.cos(midRad) * dist;
                        const ty = CENTER + Math.sin(midRad) * dist;

                        return (
                            <g key={i}>
                                <path d={pathData} fill={segment.color} stroke="#fff" strokeWidth="1" />
                                <g transform={`translate(${tx}, ${ty}) rotate(${midAngle + 90})`}>
                                    <text x="0" y="0" textAnchor="middle" dominantBaseline="middle" fontSize="36" filter="url(#shadow)">{segment.emoji}</text>
                                    <text x="0" y="28" textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="bold" fill="#fff" stroke="#000" strokeWidth="0.5">
                                        {segment.name.length > 12 ? segment.name.substring(0, 10) + '..' : segment.name}
                                    </text>
                                </g>
                            </g>
                        );
                    })}
                </svg>

                {/* Center Cap */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 shadow-xl z-20 flex items-center justify-center border-2 border-white">
                    <span className="text-xl">🎯</span>
                </div>
            </div>

            {/* Outer Glow Ring (Static) */}
            <div className="absolute inset-[-6px] rounded-full border-2 border-yellow-400/30 pointer-events-none z-0"></div>
        </div>
    );
}
