'use client';

import { useEffect, useState } from 'react';

export default function Particles() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="particles" />;

    const particles = ['🔥', '❄️', '✨', '🌟', '💫'];
    const particleCount = 20;

    return (
        <div className="particles" aria-hidden="true">
            {Array.from({ length: particleCount }).map((_, i) => {
                const content = particles[Math.floor(Math.random() * particles.length)];
                const style = {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    fontSize: `${Math.random() * 20 + 10}px`,
                    opacity: `${Math.random() * 0.5 + 0.1}`,
                    animationDuration: `${Math.random() * 10 + 10}s`,
                    animationDelay: `-${Math.random() * 20}s` // Start at random positions
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
