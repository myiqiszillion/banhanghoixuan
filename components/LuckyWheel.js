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
        <div className="relative w-full max-w-[320px] h-[320px] mx-auto my-4">
            {/* Pointer (Standard Triangle at Top) */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 filter drop-shadow-md">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M20 40L5 10C5 10 10 0 20 0C30 0 35 10 35 10L20 40Z" fill="#fbbf24" stroke="#fff" strokeWidth="2" />
                    <circle cx="20" cy="10" r="5" fill="#fff" />
                </svg>
            </div>

            {/* SVG Wheel */}
            <div className="w-full h-full rounded-full shadow-2xl border-4 border-white/20 bg-gray-900 relative z-10 overflow-hidden">
                <svg
                    ref={wheelRef}
                    viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
                    className="w-full h-full transform will-change-transform"
                    style={{ transform: `rotate(0deg)` }}
                >
                    <defs>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.5" />
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
                        const rotateAngle = midAngle + 90;

                        return (
                            <g key={i}>
                                <path d={pathData} fill={segment.color} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                                <g transform={`translate(${tx}, ${ty}) rotate(${rotateAngle})`}>
                                    <text x="0" y="0" textAnchor="middle" dominantBaseline="middle" fontSize="32" filter="url(#shadow)">{segment.emoji}</text>
                                    <text x="0" y="24" textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="800" fill="#fff" stroke="#000" strokeWidth="0.5" fontFamily="sans-serif">
                                        {segment.name.length > 14 ? segment.name.substring(0, 12) + '..' : segment.name}
                                    </text>
                                </g>
                            </g>
                        );
                    })}
                </svg>

                {/* Center Cap */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-t from-gray-900 to-gray-700 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-20 flex items-center justify-center border-4 border-[#fbbf24]">
                    <span className="text-2xl pt-1">🎯</span>
                </div>
            </div>

            {/* Outer Glow Ring */}
            <div className="absolute inset-[-12px] rounded-full border-[6px] border-[#fbbf24]/40 pointer-events-none z-0 animate-pulse"></div>
        </div>
    );
}
