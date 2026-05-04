import { useEffect, useRef, useState } from 'react';

interface CubeData {
  id: number;
  left: number;
  delay: number;
}

const cubes: CubeData[] = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: 1000 + i * 10 * (window.innerWidth / 100),
  delay: i * 0.5,
}));

export default function RollingCubeGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setRotation({
        x: (y * -10) + 5,
        y: (x * -10) + 5,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="gallery-container absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none"
      style={{
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: 'transform 0.3s ease-out',
      }}
    >
      <div className="gallery-track">
        {cubes.map((cube) => (
          <div
            key={cube.id}
            className="cube"
            style={{
              left: `${cube.left}px`,
              top: '50%',
              marginTop: '-140px',
              animation: `cube-breathe 8s ease-in-out infinite`,
              animationDelay: `${cube.delay}s`,
            }}
          >
            <div className="cube-face front">
              <div className="p-4 h-full flex flex-col gap-2">
                <div className="flex gap-1.5 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-ruby/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald/60" />
                </div>
                <div className="h-1.5 w-3/4 bg-blue-500/30 rounded" />
                <div className="h-1.5 w-1/2 bg-purple-500/30 rounded" />
                <div className="h-1.5 w-5/6 bg-amber-500/30 rounded" />
                <div className="h-1.5 w-2/3 bg-blue-500/30 rounded mt-2" />
                <div className="h-1.5 w-1/3 bg-emerald-500/30 rounded" />
                <div className="mt-auto text-[8px] font-mono text-muted-foreground">
                  file_{cube.id}.py
                </div>
              </div>
            </div>
            <div className="cube-face back">
              <div className="p-4 h-full flex flex-col gap-2">
                <div className="h-1.5 w-full bg-ruby/20 rounded" />
                <div className="h-1.5 w-3/4 bg-amber/20 rounded" />
                <div className="h-1.5 w-1/2 bg-emerald/20 rounded" />
              </div>
            </div>
            <div className="cube-face right" />
            <div className="cube-face left" />
          </div>
        ))}
      </div>
    </div>
  );
}
