import { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import earthTextureSrc from "@/assets/earth-texture.jpg";

const EarthMesh = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, earthTextureSrc);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.2 * delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
};

const EarthScene = () => (
  <>
    <ambientLight intensity={0.4} />
    <directionalLight position={[5, 3, 5]} intensity={1.2} />
    <EarthMesh />
  </>
);

const CircularProgress = ({ progress }: { progress: number }) => {
  const radius = 72;
  const stroke = 3;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={radius * 2 + stroke * 2}
      height={radius * 2 + stroke * 2}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
    >
      {/* Track */}
      <circle
        cx={radius + stroke}
        cy={radius + stroke}
        r={radius}
        fill="none"
        stroke="hsl(18 100% 62% / 0.15)"
        strokeWidth={stroke}
      />
      {/* Progress */}
      <circle
        cx={radius + stroke}
        cy={radius + stroke}
        r={radius}
        fill="none"
        stroke="hsl(18 100% 62%)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${radius + stroke} ${radius + stroke})`}
        style={{
          filter: "drop-shadow(0 0 6px hsl(18 100% 62% / 0.6))",
          transition: "stroke-dashoffset 0.1s linear",
        }}
      />
    </svg>
  );
};

export const PageLoader = ({ onComplete }: { onComplete: () => void }) => {
  const loaderRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: 100,
      duration: 2.5,
      ease: "power2.inOut",
      onUpdate: () => setProgress(Math.round(obj.val)),
      onComplete: () => {
        // Fade out
        gsap.to(loaderRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.inOut",
          onComplete,
        });
      },
    });

    return () => { tween.kill(); };
  }, [onComplete]);

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6"
      style={{ background: "hsl(15 35% 9%)" }}
    >
      {/* Globe + circular progress wrapper */}
      <div className="relative w-[160px] h-[160px]">
        <div className="absolute inset-[8px] rounded-full overflow-hidden">
          <Canvas
            camera={{ position: [0, 0, 4], fov: 45 }}
            dpr={Math.min(window.devicePixelRatio, 1.5)}
            gl={{ antialias: true, alpha: true }}
            style={{ background: "transparent" }}
          >
            <EarthScene />
          </Canvas>
          {/* Radar sweep overlay */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "conic-gradient(from 0deg, transparent 0deg, hsl(18 100% 62% / 0.25) 30deg, transparent 60deg)",
              animation: "radar-sweep 2s linear infinite",
            }}
          />
          {/* Scan line overlay */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 3px, hsl(18 100% 62% / 0.04) 3px, hsl(18 100% 62% / 0.04) 4px)",
            }}
          />
        </div>
        <CircularProgress progress={progress} />
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-2xl font-mono font-bold tracking-wider text-primary">
          {progress}%
        </span>
        <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-mono">
          Initializing SAR-RANG Systems
        </span>
      </div>

      <style>{`
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
