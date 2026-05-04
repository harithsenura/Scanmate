import { useRef, useCallback } from 'react';
import gsap from 'gsap';

interface FlipCardProps {
  image: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cwe: string;
}

const severityConfig = {
  critical: { color: 'bg-ruby', label: 'CRITICAL' },
  high: { color: 'bg-rose-400', label: 'HIGH' },
  medium: { color: 'bg-amber', label: 'MEDIUM' },
  low: { color: 'bg-blue', label: 'LOW' },
};

export default function FlipCard({ image, title, description, severity, cwe }: FlipCardProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const isFlipped = useRef(false);

  const handleMouseEnter = useCallback(() => {
    if (isFlipped.current) return;
    isFlipped.current = true;

    const tl = gsap.timeline();
    tl.to(innerRef.current, {
      rotationX: 90,
      duration: 0.6,
      ease: 'power2.out',
    })
      .to(innerRef.current, {
        rotationX: 180,
        duration: 0.4,
        ease: 'power2.in',
      }, '+=0.1');

    gsap.to(shadowRef.current, {
      scaleY: -0.5,
      skewX: 20,
      opacity: 0.5,
      duration: 0.8,
      ease: 'power2.out',
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!isFlipped.current) return;
    isFlipped.current = false;

    const tl = gsap.timeline();
    tl.to(innerRef.current, {
      rotationX: 90,
      duration: 0.4,
      ease: 'power2.out',
    })
      .to(innerRef.current, {
        rotationX: 0,
        duration: 0.6,
        ease: 'power2.in',
      }, '+=0.1');

    gsap.to(shadowRef.current, {
      scaleY: 1,
      skewX: 0,
      opacity: 0.2,
      duration: 0.8,
      ease: 'power2.out',
    });
  }, []);

  const config = severityConfig[severity];

  return (
    <div
      className="flip-card relative w-full h-[300px] cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Shadow */}
      <div
        ref={shadowRef}
        className="absolute inset-0 bg-black/40 rounded-xl opacity-20"
        style={{ transformOrigin: 'center bottom' }}
      />

      {/* Card Inner */}
      <div
        ref={innerRef}
        className="flip-card-inner relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div className="flip-card-front absolute inset-0 rounded-xl overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className={`inline-block ${config.color} text-white text-[10px] font-mono font-bold px-2 py-1 rounded mb-3`}>
              {config.label}
            </div>
            <h3 className="text-2xl font-medium text-white tracking-tight">{title}</h3>
          </div>
        </div>

        {/* Back */}
        <div className="flip-card-back absolute inset-0 bg-obsidian rounded-xl border border-white/10 p-6 flex flex-col">
          <div className={`inline-block ${config.color} text-white text-[10px] font-mono font-bold px-2 py-1 rounded mb-4 self-start`}>
            {config.label}
          </div>
          <h3 className="text-xl font-medium text-white tracking-tight mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{description}</p>
          <div className="mt-auto pt-4 border-t border-white/10">
            <span className="text-xs font-mono text-emerald">{cwe}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
