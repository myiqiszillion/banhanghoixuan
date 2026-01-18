'use client';

import { useEffect, useState } from 'react';

export default function Particles() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="particles" />;

    // Reduced particle count for better performance
    const particles = ['🔥', '❄️', '✨', '🌟'];
    const particleCount = 12; // Reduced from 20

    return (
        <div className="particles" aria-hidden="true">
            {Array.from({ length: particleCount }).map((_, i) => {
                const content = particles[i % particles.length];
                const style = {
                    left: `${(i * 8.5) % 100}%`, // Distributed evenly instead of random
                    top: `${(i * 9) % 100}%`,
                    fontSize: `${12 + (i % 3) * 6}px`,
                    opacity: `${0.15 + (i % 4) * 0.1}`,
                    animationDuration: `${15 + (i % 5) * 3}s`,
                    animationDelay: `${-i * 2}s`
                };

                return (
                    <div key={i} className="particle" style={style}>
                        {content}
                    </div>
                );
            })}
        </div>
    );
}
