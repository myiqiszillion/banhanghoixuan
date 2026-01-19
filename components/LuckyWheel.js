'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

const WHEEL_SIZE = 400;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = WHEEL_SIZE * 0.45; // 90% of half size

// Sound effect helper
const playTickSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05); // "Tick" drop

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
        // Ignore audio errors (interaction policy etc)
    }
};

const playWinSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();

        // Simple arpeggio
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
    const canvasRef = useRef(null);
    const [rotation, setRotation] = useState(0);

    // Animation refs
    const requestRef = useRef();
    const startTimeRef = useRef();
    const startRotationRef = useRef(0);
    const targetRotationRef = useRef(0);
    const lastTickRef = useRef(0);

    const SEGMENT_ANGLE = 360 / segments.length;

    // Handle spin trigger
    useEffect(() => {
        if (spinning && prizeIndex !== null) {
            startSpin();
        }
    }, [spinning, prizeIndex]);

    const startSpin = () => {
        // Calculate target rotation
        // Must rotate at least 5 times (1800 deg)
        // Correction to land on prizeIndex
        // The pointer is at TOP (270 deg in canvas, OR just 0 if we rotate canvas correctly)
        // Let's assume pointer is at Top (Index 0 starts at -90deg?)
        // Standard setup: Index 0 is at [0, segmentAngle]
        // To land Index i at TOP (-90deg or 270deg):
        // Target = Current + Spins + (TargetAngle - Current%360) ???

        // Simpler: Current Rotation is X.
        // We want final position such that Pointer points to Prize.
        // Pointer is static at top.
        // If we rotate the WHEEL clockwise.
        // The segment at TOP will be: (360 - (rotation % 360)) / segmentAngle ?

        // Let's reverse:
        // Target Rotation = (Full Spins) + Offset
        // Offset = (360 - (prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE/2)) 
        // Example: Prize 0. Center is 22.5 deg. We want 22.5 deg to be at TOP (270 or -90).
        // If Wheel Rotation is RGB. 
        // Position of Sector 0 center = Rotation + 22.5.
        // We want Position = 270 (Top).
        // => Rotation + 22.5 = 270 => Rotation = 247.5.

        const currentRot = rotation;
        const spins = 360 * 5; // 5 full spins
        // Randomize landing within the segment (+- 15 deg) to look natural
        const randomOffset = (Math.random() - 0.5) * (SEGMENT_ANGLE - 10);

        // Calculate offset to land Index at Top (270deg)
        // Sector Center Angle = index * SEGMENT_ANGLE + SEGMENT_ANGLE/2
        // We want: (ActionRotation + SectorAngle) % 360 = 270
        const sectorAngle = prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
        const desiredRotation = 270 - sectorAngle + randomOffset;

        // Add multiples of 360 to ensure we move forward and spin enough
        // Current could be 1000. 
        // We want Target > Current + MinSpins

        let target = currentRot + spins + (desiredRotation - (currentRot % 360));
        // Normalize to ensure positive jump
        if (target < currentRot + spins) target += 360;

        startRotationRef.current = currentRot;
        targetRotationRef.current = target;
        startTimeRef.current = null;

        // Start animation loop
        requestRef.current = requestAnimationFrame(animate);
    };

    const animate = (time) => {
        if (!startTimeRef.current) startTimeRef.current = time;
        const elapsed = time - startTimeRef.current;
        const duration = 5000; // 5 seconds spin

        if (elapsed < duration) {
            // Cubic Ease Out
            // t goes from 0 to 1
            const t = elapsed / duration;
            const easeOut = 1 - Math.pow(1 - t, 4); // Quartic ease out

            const newRot = startRotationRef.current + (targetRotationRef.current - startRotationRef.current) * easeOut;
            setRotation(newRot);

            // Sound Logic
            // Check if we crossed a pin (SEGMENT_ANGLE intervals)
            // Pins are at: 0, 45, 90... + Rotation
            // Pin at Top happens when Rotation % 45 == 0 (simplified)
            // Actually tick happens when a separator passes the pointer
            const anglePerTick = SEGMENT_ANGLE;
            const currentTick = Math.floor(newRot / anglePerTick);
            if (currentTick > lastTickRef.current) {
                playTickSound();
                lastTickRef.current = currentTick;
            }

            requestRef.current = requestAnimationFrame(animate);
        } else {
            // End
            setRotation(targetRotationRef.current);
            playWinSound();
            fireConfetti();
            onStop();
        }
    };

    const fireConfetti = () => {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });
        fire(0.2, {
            spread: 60,
        });
        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    };

    // Render Helpers
    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    }

    return (
        <div className="relative w-full max-w-[350px] aspect-square mx-auto">
            {/* Pointer (Static at Top) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-8 h-10 filter drop-shadow-lg">
                <svg viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 40L0 15C0 6.71573 6.71573 0 15 0C23.2843 0 30 6.71573 30 15L15 40Z" fill="#fbbf24" stroke="#fff" strokeWidth="2" />
                </svg>
            </div>

            {/* SVG Wheel */}
            <div className="w-full h-full rounded-full shadow-[0_0_30px_rgba(251,191,36,0.3)] border-4 border-orange-500/50 bg-gray-800 relative z-10 overflow-hidden">
                <svg
                    viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
                    className="w-full h-full transform transition-none ease-linear will-change-transform"
                    style={{ transform: `rotate(${rotation}deg)` }}
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
                        // Draw Slice
                        const startAngle = i * SEGMENT_ANGLE;
                        const endAngle = (i + 1) * SEGMENT_ANGLE;

                        // Convert to radians usually, but let's use Rotation Transform for Slices? 
                        // No, let's draw paths

                        const start = getCoordinatesForPercent(startAngle / 360);
                        const end = getCoordinatesForPercent(endAngle / 360);

                        const largeArcFlag = SEGMENT_ANGLE > 180 ? 1 : 0;

                        // Scale to radius
                        const sx = CENTER + start[0] * RADIUS;
                        const sy = CENTER + start[1] * RADIUS;
                        const ex = CENTER + end[0] * RADIUS;
                        const ey = CENTER + end[1] * RADIUS;

                        const pathData = [
                            `M ${CENTER} ${CENTER}`,
                            `L ${sx} ${sy}`,
                            `A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${ex} ${ey}`,
                            `Z`
                        ].join(' ');

                        // Emoji Position
                        // Angle in middle of segment
                        const midAngle = startAngle + SEGMENT_ANGLE / 2;
                        const midRad = midAngle * Math.PI / 180;
                        const dist = RADIUS * 0.75; // 75% from center
                        const tx = CENTER + Math.cos(midRad) * dist;
                        const ty = CENTER + Math.sin(midRad) * dist;

                        return (
                            <g key={i}>
                                <path d={pathData} fill={segment.color} stroke="#fff" strokeWidth="2" />

                                {/* Text/Emoji Transform: Rotate text to face center? or upright?
                                    Usually upright relative to the slice.
                                    Rotate by midAngle + 90
                                */}
                                <g transform={`translate(${tx}, ${ty}) rotate(${midAngle + 90})`}>
                                    <text
                                        x="0" y="0"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="32"
                                        filter="url(#shadow)"
                                    >
                                        {segment.emoji}
                                    </text>
                                    <text
                                        x="0" y="24"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="12"
                                        fontWeight="bold"
                                        fill="#fff"
                                        stroke="#000"
                                        strokeWidth="0.5"
                                    >
                                        {segment.name.length > 10 ? segment.name.substring(0, 8) + '...' : segment.name}
                                    </text>
                                </g>
                            </g>
                        );
                    })}
                </svg>

                {/* Center Cap */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-2/1 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 shadow-xl z-20 flex items-center justify-center border-4 border-white">
                    <span className="text-2xl animate-pulse">🎯</span>
                </div>
            </div>

            {/* Outer Glow Ring (Static) */}
            <div className="absolute inset-[-10px] rounded-full border-4 border-yellow-400/30 animate-pulse pointer-events-none z-0"></div>
        </div>
    );
}
