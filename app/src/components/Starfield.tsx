import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const STAR_COUNT = 6000;
const SPHERE_RADIUS = 90;

const vertexShader = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  uniform float uTime;
  uniform vec2 uRotation;

  void main() {
    vColor = color;
    float rotationX = uRotation.y * 0.0001;
    float rotationY = uRotation.x * 0.0001;

    mat3 rotationMatrixX = mat3(
      1.0, 0.0, 0.0,
      0.0, cos(rotationX), -sin(rotationX),
      0.0, sin(rotationX), cos(rotationX)
    );

    mat3 rotationMatrixY = mat3(
      cos(rotationY), 0.0, sin(rotationY),
      0.0, 1.0, 0.0,
      -sin(rotationY), 0.0, cos(rotationY)
    );

    vec3 rotatedPosition = rotationMatrixY * rotationMatrixX * position;
    vec4 mvPosition = modelViewMatrix * vec4(rotatedPosition, 1.0);
    gl_PointSize = size * (400.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform float uTime;
  varying vec3 vColor;
  uniform float uPixelRatio;

  void main() {
    vec2 center = 2.0 * gl_PointCoord - 1.0;
    float dist = length(center);

    float twinkle = sin(uTime * 2.0 + vColor.r * 10.0) * 0.3 + 0.7;
    twinkle *= step(dist, 0.2);

    float diffuse = max(1.0 - dist * dist, 0.0);

    vec3 finalColor = vColor * twinkle + vColor * diffuse;
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function StarPoints() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  const rotation = useRef({ x: 0, y: 0 });
  const zoom = useRef(0);
  const targetZoom = useRef(0);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const autoRotate = useRef(0);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);

    const colorWhite = new THREE.Color('#ffffff');
    const colorBlue = new THREE.Color('#3b82f6');
    const colorRed = new THREE.Color('#e11d48');

    for (let i = 0; i < STAR_COUNT; i++) {
      const r = Math.cbrt(Math.random()) * SPHERE_RADIUS;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const rand = Math.random();
      let color: THREE.Color;
      if (rand < 0.7) {
        color = colorWhite;
      } else if (rand < 0.85) {
        color = colorBlue;
      } else {
        color = colorRed;
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.5 + Math.random() * 1.0;
    }

    return { positions, colors, sizes };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRotation: { value: new THREE.Vector2(0, 0) },
      uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

      if (!isDragging.current) {
        autoRotate.current += 0.05;
        rotation.current.y = autoRotate.current;
      }

      materialRef.current.uniforms.uRotation.value.set(
        rotation.current.x,
        rotation.current.y
      );
    }

    // Smooth zoom
    zoom.current += (targetZoom.current - zoom.current) * 0.1;
    camera.position.z = 5 + zoom.current;
  });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    targetZoom.current += e.deltaY * 0.005;
    targetZoom.current = Math.max(-10, Math.min(20, targetZoom.current));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastMouse.current.x;
    const deltaY = e.clientY - lastMouse.current.y;
    rotation.current.x += deltaY * 0.5;
    rotation.current.y += deltaX * 0.5;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <points
      ref={pointsRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

export default function Starfield() {
  return (
    <div className="w-full h-full min-h-[100vh]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: '#09090b', cursor: 'grab' }}
      >
        <StarPoints />
      </Canvas>
    </div>
  );
}
