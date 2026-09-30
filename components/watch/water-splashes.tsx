"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { MotionValue } from "motion/react";

import { CH, damp, hold, range } from "@/lib/anim";

const DROPLET_COUNT = 140;

interface DropletData {
  origin: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  rotationSpeed: THREE.Vector3;
  seed: number;
}

export function WaterSplashes({ progress }: { progress: MotionValue<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const ripple1Ref = useRef<THREE.Mesh>(null);
  const ripple2Ref = useRef<THREE.Mesh>(null);
  const mistRef = useRef<THREE.Points>(null);

  // Scratch objects for zero-allocation useFrame updates
  const scratch = useMemo(() => {
    return {
      matrix: new THREE.Matrix4(),
      position: new THREE.Vector3(),
      scale: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      quaternion: new THREE.Quaternion(),
    };
  }, []);

  // Precompute randomized droplet trajectories
  const droplets = useMemo<DropletData[]>(() => {
    const list: DropletData[] = [];
    for (let i = 0; i < DROPLET_COUNT; i++) {
      const angle = (i / DROPLET_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const radius = 0.52 + Math.random() * 0.22;
      const zOffset = (Math.random() - 0.5) * 0.35;

      const origin = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * (radius * 1.15),
        zOffset,
      );

      // Ejection velocity radiates outward and forward with turbulent spray
      const speed = 1.8 + Math.random() * 3.2;
      const sprayAngle = angle + (Math.random() - 0.5) * 0.5;
      const velocity = new THREE.Vector3(
        Math.cos(sprayAngle) * speed * (0.8 + Math.random() * 0.5),
        Math.sin(sprayAngle) * speed * (0.8 + Math.random() * 0.5) + (Math.random() - 0.2) * 1.5,
        (Math.random() - 0.3) * speed * 1.4 + 0.6,
      );

      list.push({
        origin,
        velocity,
        size: 0.022 + Math.random() * 0.045,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
        ),
        seed: Math.random(),
      });
    }
    return list;
  }, []);

  // Micro-mist particle geometry
  const mistGeo = useMemo(() => {
    const count = 90;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 0.6 + Math.random() * 1.6;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.sin(theta) * r;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((_, dt) => {
    const p = progress.get();
    const g = groupRef.current;
    if (!g) return;

    // Visibility culling outside water chapter
    const inChapter = p >= CH.water[0] - 0.02 && p <= CH.water[1] + 0.02;
    g.visible = inChapter;
    if (!inChapter) return;

    const d = Math.min(dt, 1 / 30);

    // Normalized progress within the water chapter (0 -> 1)
    const t = range(p, CH.water[0], CH.water[1]);

    // Envelope intensity curve: explodes rapidly upon entry, holds, then gently evaporates
    const intensity = hold(
      p,
      [CH.water[0], CH.water[0] + 0.035, CH.water[1] - 0.04, CH.water[1]],
      [0, 1, 1, 0],
    );

    // Animate Instanced Droplets
    const mesh = meshRef.current;
    if (mesh) {
      for (let i = 0; i < DROPLET_COUNT; i++) {
        const item = droplets[i];

        // Particle lifecycle based on time offset
        const lifetime = ((t * 2.2 + item.seed * 0.4) % 1.0);
        const flight = lifetime;

        // Ballistic trajectory with gravity and water drag
        const drag = Math.exp(-2.2 * flight);
        const px = item.origin.x + item.velocity.x * flight * drag;
        const py = item.origin.y + item.velocity.y * flight * drag - 0.5 * 1.8 * flight * flight;
        const pz = item.origin.z + item.velocity.z * flight * drag;

        scratch.position.set(px, py, pz);

        // Scale: droplet blooms, stretches slightly along motion, then fades
        const scaleVal =
          Math.sin(lifetime * Math.PI) *
          item.size *
          intensity *
          (1 + Math.sin(p * 20 + item.seed * 10) * 0.2);

        // Slight non-spherical deformation for fluid surface tension
        scratch.scale.set(
          scaleVal * 0.9,
          scaleVal * 1.2,
          scaleVal * 0.9,
        );

        scratch.rotation.set(
          item.rotationSpeed.x * lifetime * 4,
          item.rotationSpeed.y * lifetime * 4,
          item.rotationSpeed.z * lifetime * 4,
        );
        scratch.quaternion.setFromEuler(scratch.rotation);

        scratch.matrix.compose(
          scratch.position,
          scratch.quaternion,
          scratch.scale,
        );
        mesh.setMatrixAt(i, scratch.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Concentric expanding impact shockwave ripples
    if (ripple1Ref.current) {
      const rScale = damp(ripple1Ref.current.scale.x, (0.8 + t * 3.4), 8, d);
      ripple1Ref.current.scale.set(rScale, rScale, rScale);
      const rMat = ripple1Ref.current.material as THREE.MeshBasicMaterial;
      if (rMat) {
        rMat.opacity = Math.max(0, (1 - t * 1.6)) * intensity * 0.55;
      }
    }

    if (ripple2Ref.current) {
      const r2Progress = Math.max(0, t - 0.15) * 1.25;
      const r2Scale = damp(ripple2Ref.current.scale.x, (0.6 + r2Progress * 3.8), 8, d);
      ripple2Ref.current.scale.set(r2Scale, r2Scale, r2Scale);
      const r2Mat = ripple2Ref.current.material as THREE.MeshBasicMaterial;
      if (r2Mat) {
        r2Mat.opacity = Math.max(0, (1 - r2Progress * 1.5)) * intensity * 0.45;
      }
    }

    // Micro mist spray gentle spin
    if (mistRef.current) {
      mistRef.current.rotation.z += d * 0.35;
      const mMat = mistRef.current.material as THREE.PointsMaterial;
      if (mMat) {
        mMat.opacity = intensity * 0.32;
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* 3D Physical Refractive Droplets (Water IOR 1.333) */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, DROPLET_COUNT]}
        castShadow
      >
        <sphereGeometry args={[1, 16, 14]} />
        <meshPhysicalMaterial
          color="#d5f4ff"
          roughness={0.04}
          metalness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.02}
          specularIntensity={1.2}
          transparent
          opacity={0.78}
          envMapIntensity={2.4}
        />
      </instancedMesh>

      {/* Primary Expanding Ripple Ring */}
      <mesh
        ref={ripple1Ref}
        rotation={[-Math.PI / 2.3, 0, 0]}
        position={[0, -0.1, 0.15]}
      >
        <ringGeometry args={[0.9, 0.98, 64]} />
        <meshBasicMaterial
          color="#6ee7b7"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Secondary Expanding Ripple Ring */}
      <mesh
        ref={ripple2Ref}
        rotation={[-Math.PI / 2.3, 0, 0]}
        position={[0, -0.1, 0.15]}
      >
        <ringGeometry args={[0.85, 0.92, 64]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Micro-droplet Mist Spray */}
      <points ref={mistRef} geometry={mistGeo}>
        <pointsMaterial
          size={0.045}
          color="#bae6fd"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
