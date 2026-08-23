import { useEffect, useRef, useState } from 'react'
import './App.css'

const flagModules = import.meta.glob('./assets/flags-png/stack*/**/*.png', {
  eager: true,
  import: 'default',
});

const allFlags = Object.values(flagModules);

const getRandomEdgePosition = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const side = Math.floor(Math.random() * 4);

  switch (side) {
    case 0: return [Math.random() * width, 0]; // top
    case 1: return [width, Math.random() * height]; // right
    case 2: return [Math.random() * width, height]; // bottom
    default: return [0, Math.random() * height]; // left
  }
};

const getRandomFlag = () => {
  const src = allFlags[Math.floor(Math.random() * allFlags.length)];
  const [x, y] = getRandomEdgePosition();
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const angleIn = Math.atan2(centerY - y, centerX - x);
  const speed = (0.3 + Math.random() * 0.4) * 1.15;
  const id = Math.random().toString(36).slice(2);

  return {
    id,
    src,
    x,
    y,
    dx: Math.cos(angleIn) * speed,
    dy: Math.sin(angleIn) * speed,
    outbound: false,
    bounceCount: 0,
    ttl: 1200 + Math.floor(Math.random() * 500),
    fadeOut: false,
    fadeInFrames: 60, // new fade-in flag
    speed,
  };
};

export default function SentientProxy() {
  const containerRef = useRef(null);
  const [frame, setFrame] = useState(0);
  const [activeFlags, setActiveFlags] = useState(() =>
    Array.from({ length: 25 }, getRandomFlag)
  );

  useEffect(() => {
    let animationId;

    const animate = () => {
      setActiveFlags((prevFlags) =>
        prevFlags
          .map((flag) => {
            let { x, y, dx, dy, outbound, bounceCount, speed, ttl, fadeOut, fadeInFrames } = flag;
            const width = window.innerWidth;
            const height = window.innerHeight;
            const centerX = width / 2;
            const centerY = height / 2;

            x += dx;
            y += dy;
            ttl -= 1;
            if (fadeInFrames > 0) fadeInFrames--;

            if (ttl <= 150) fadeOut = true;

            if (!outbound && Math.abs(x - centerX) < 40 && Math.abs(y - centerY) < 40 && !fadeOut) {
              const angle = Math.random() * 2 * Math.PI;
              dx = Math.cos(angle) * speed;
              dy = Math.sin(angle) * speed;
              outbound = true;
            }

            if (outbound && (x <= 0 || x >= width - 48 || y <= 0 || y >= height - 32)) {
              const angle = Math.atan2(centerY - y, centerX - x);
              dx = Math.cos(angle) * speed;
              dy = Math.sin(angle) * speed;
              outbound = false;
              bounceCount++;
            }

            return { ...flag, x, y, dx, dy, outbound, bounceCount, ttl, fadeOut, fadeInFrames };
          })
          .filter((flag) => flag.ttl > 0)
      );

      setActiveFlags((prevFlags) => {
        const needed = 25 - prevFlags.length;
        if (needed <= 0) return prevFlags;
        const newFlags = Array.from({ length: needed }, getRandomFlag);
        return [...prevFlags, ...newFlags];
      });

      setFrame((f) => f + 1);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-white font-sans">
      {activeFlags.map((flag) => {
        const fadeInOpacity = 1 - flag.fadeInFrames / 60;
        const fadeOutOpacity = flag.fadeOut ? flag.ttl / 150 : 1;
        const opacity = Math.min(fadeInOpacity, fadeOutOpacity);

        return (
          <img
            key={flag.id}
            src={flag.src}
            alt="flag"
            className="absolute w-12 h-8 drop-shadow-md transition-transform duration-150"
            style={{
              transform: `translate(${flag.x}px, ${flag.y}px)`,
              opacity,
              willChange: 'transform, opacity',
              zIndex: flag.outbound ? 10 : 1,
            }}
          />
        );
      })}

      <div className="fixed top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-3 py-1 rounded shadow z-50">
        Flags: {activeFlags.length} • Frame: {frame} • Pool: 250 Total
      </div>

      <footer className="absolute bottom-4 w-full text-center text-xs text-gray-500 px-4">
        <p>
          🌍 <strong>Flag Drift Showcase</strong> – This animated interface is a placeholder UI using real-world flag icons.<br />
          Repurpose for educational, interactive, or visual use cases. No backend or personal data is used.<br />
          Built with <strong>React + Vite</strong>. Assets sourced from local archive. Licensed under <a href="https://opensource.org/licenses/MIT" className="underline">MIT</a>.
        </p>
      </footer>
    </div>
  );
}
