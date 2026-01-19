'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const WHEEL_SIZE = 360;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = WHEEL_SIZE * 0.45;

// Simple sound (Clicking sound)
const playTickSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
    } catch (e) { }
};

const playWinSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        [500, 600, 800].forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = f;
            gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.1 + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.1);
            osc.stop(ctx.currentTime + i * 0.1 + 0.2);
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
        const spins = 360 * 5;
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
        const duration = 4000;

        if (elapsed < duration) {
            const t = elapsed / duration;
            const ease = 1 - Math.pow(1 - t, 3); // Cubic Ease Out
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
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    };

    const getCoord = (percent, r = RADIUS) => [
        CENTER + r * Math.cos(2 * Math.PI * percent),
        CENTER + r * Math.sin(2 * Math.PI * percent)
    ];

    return (
        <div style={{ width: '100%', maxWidth: '340px', margin: '0 auto', position: 'relative', padding: '20px 0' }}>

            {/* POINTER (Top Center) - Outside Wheel Container to avoid clipping */}
            <div style={{
                position: 'absolute',
                top: '0',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 50,
                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))'
            }}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M20 40L5 5H35L20 40Z" fill="#FCD34D" stroke="#000" strokeWidth="2" />
                </svg>
            </div>

            {/* WHEEL CONTAINER */}
            <div style={{
                width: '300px',
                height: '300px',
                margin: '0 auto',
                borderRadius: '50%',
                border: '8px solid #374151',
                background: '#FFF',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}>
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
                        const dist = RADIUS * 0.72;
                        const tx = CENTER + dist * Math.cos(midA * Math.PI / 180);
                        const ty = CENTER + dist * Math.sin(midA * Math.PI / 180);

                        // Flip Logic for Text Readability
                        let rot = midA + 90;
                        if (midA > 90 && midA < 270) rot += 180;

                        return (
                            <g key={i}>
                                <path d={path} fill={seg.color} stroke="#FFF" strokeWidth="1" />
                                <g transform={`translate(${tx}, ${ty}) rotate(${rot})`}>
                                    <text
                                        y={midA > 90 && midA < 270 ? 25 : -10}
                                        textAnchor="middle"
                                        fontSize="32"
                                    >
                                        {seg.emoji}
                                    </text>
                                    <text
                                        y={midA > 90 && midA < 270 ? -5 : 20}
                                        textAnchor="middle"
                                        fontSize="14"
                                        fontWeight="bold"
                                        fill={seg.textCol || '#000'}
                                        style={{ fontFamily: 'Arial, user-select: none' }}
                                    >
                                        {seg.name}
                                    </text>
                                </g>
                            </g>
                        );
                    })}
                </svg>

                {/* CENTER CAP */}
                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '40px', height: '40px',
                    backgroundColor: '#374151',
                    borderRadius: '50%',
                    border: '3px solid #FFF',
                    zIndex: 20
                }}></div>
            </div>
        </div>
    );
}
