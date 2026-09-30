"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion, type MotionValue } from "motion/react";

import { damp, trackEased } from "@/lib/anim";
import { WatchModel } from "./watch-model";
import { WaterSplashes } from "./water-splashes";
import type { FaceMode } from "./display-texture";

/**
 * One persistent WebGL canvas sits behind the whole document. Chapters do not
 * each get their own canvas — a second WebGL context would cost as much as the
 * first, and the watch has to carry continuity from section to section anyway.
 */

/** Camera and watch pose as a function of global scroll progress. */
function Rig({
  progress,
  reduce,
  overrideFaceMode,
}: {
  progress: MotionValue<number>;
  reduce: boolean;
  overrideFaceMode?: FaceMode | null;
}) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, pointer: p3, size }, dt) => {
    const p = progress.get();
    const d = Math.min(dt, 1 / 30);

    // --- camera ---------------------------------------------------------
    // Stops are the chapter boundaries:
    // [Hero-start, Hero-end, Orbit-end, Explode-hold, Water-start, Water-mid, Water-end, Display-mid, Finishes, Specs, Outro]
    const CAM = [0, 0.08, 0.20, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63, 0.76, 0.88];
    const camX = trackEased(
      p,
      CAM,
      [0, 0, -1.2, -1.4, -1.3, -1.2, 0.8, 0.8, -0.7, 0.85, 0],
    );
    const camY = trackEased(
      p,
      CAM,
      [0.12, 0.12, 0.45, 0.45, 0.1, -0.1, 0, 0, 0.2, 0.12, 0.12],
    );
    const camZ = trackEased(
      p,
      CAM,
      [6.4, 5.7, 4.8, 4.8, 4.8, 4.2, 3.8, 3.8, 5.2, 5.8, 6.2],
    );

    const aspect = size.height > 0 ? size.width / size.height : 1;
    const isPortrait = aspect < 1;
    const fit = isPortrait ? Math.min(1 / aspect, 1.7) : 1;

    // Mobile: strictly center X at 0, elevate Y slightly (-0.52) so watch stays in upper 46%
    // Desktop: center target at origin (0, 0, 0)
    const targetY = isPortrait ? -0.52 : 0;
    target.set(0, targetY, 0);

    const targetCamX = isPortrait ? 0 : camX;
    const targetCamY = isPortrait ? camY + 0.1 : camY;
    const targetCamZ = camZ * fit;

    camera.position.x = damp(camera.position.x, targetCamX, 4.5, d);
    camera.position.y = damp(camera.position.y, targetCamY, 4.5, d);
    camera.position.z = damp(camera.position.z, targetCamZ, 4.5, d);
    camera.lookAt(target);

    const g = group.current;
    if (!g) return;

    // --- watch pose ------------------------------------------------------
    // Posed on the same stop grid as the camera.
    const TWO_PI = Math.PI * 2;
    const rotY = trackEased(
      p,
      CAM,
      [
        -0.35,
        -0.35,
        -TWO_PI - 0.35,
        -TWO_PI - 0.12,
        -TWO_PI - 0.35,
        -TWO_PI + 0.30,
        -TWO_PI,
        -TWO_PI,
        -TWO_PI - 0.5,
        -TWO_PI - 0.7,
        -TWO_PI - 0.9,
      ],
    );
    const rotX = trackEased(
      p,
      CAM,
      [0.16, 0.16, -0.05, -0.05, 0.18, -0.22, 0, 0, 0.08, 0.12, 0.16],
    );
    const scaleBase = trackEased(
      p,
      CAM,
      [1, 1, 0.94, 0.94, 0.98, 1.02, 1.0, 1.0, 0.96, 0.88, 0.88],
    );
    const finalScale = isPortrait ? scaleBase * 0.88 : scaleBase;

    const px = reduce ? 0 : p3.x;
    const py = reduce ? 0 : p3.y;
    pointer.current.x = damp(pointer.current.x, px, 3, d);
    pointer.current.y = damp(pointer.current.y, py, 3, d);

    g.rotation.y = damp(g.rotation.y, rotY + pointer.current.x * 0.22, 5, d);
    g.rotation.x = damp(g.rotation.x, rotX - pointer.current.y * 0.16, 5, d);
    g.scale.setScalar(damp(g.scale.x, finalScale, 4, d));
  });

  return (
    <group ref={group}>
      <WatchModel progress={progress} overrideFaceMode={overrideFaceMode} />
      <WaterSplashes progress={progress} />
    </group>
  );
}

/**
 * Studio lighting built from Lightformers rather than a downloaded HDRI: a
 * product shot wants named, placed highlights (a long softbox streak down the
 * case edge, rim lights either side), and an equirect map cannot be aimed.
 */
function Studio() {
  return (
    <>
      <ambientLight intensity={1.4} color="#ffffff" />
      <directionalLight position={[0, 4, 3]} intensity={2.6} color="#ffffff" />
      <directionalLight position={[-4, 2, 2]} intensity={2.0} color="#cfe4ff" />
      <directionalLight position={[4, 1, 2]} intensity={2.0} color="#ffd9c2" />
      <hemisphereLight args={["#ffffff", "#101015", 0.9]} />
    </>
  );
}

export default function WatchScene({
  progress,
  overrideFaceMode,
}: {
  progress: MotionValue<number>;
  overrideFaceMode?: FaceMode | null;
}) {
  const reduce = useReducedMotion() === true;

  return (
    <Canvas
      style={{ background: "transparent" }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
        stencil: false,
        depth: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      camera={{ fov: 30, position: [0, 0.12, 6.4], near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
        });
      }}
    >
      <Rig
        progress={progress}
        reduce={reduce}
        overrideFaceMode={overrideFaceMode}
      />
      <Studio />
    </Canvas>
  );
}
