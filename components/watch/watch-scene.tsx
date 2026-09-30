"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
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
      [0, 0, -5.5, -5.5, -1.2, 1.8, 0, 0, 0.9, 1.7, 1.7],
    );
    const camY = trackEased(
      p,
      CAM,
      [0.12, 0.12, 1.45, 1.45, 0.1, -0.15, 0, 0, 0.3, 0.18, 0.18],
    );
    const camZ = trackEased(
      p,
      CAM,
      [6.4, 5.7, 4.65, 4.65, 4.8, 3.9, 3.45, 3.45, 5.2, 6.2, 6.2],
    );

    // `fov` is vertical, so a tall narrow viewport has a narrow *horizontal*
    // field and the watch blows out past both edges. Back the camera off by the
    // inverse aspect on portrait screens so the framing holds on a phone.
    const aspect = size.height > 0 ? size.width / size.height : 1;
    const isPortrait = aspect < 1;
    const fit = isPortrait ? Math.min(1 / aspect, 1.95) : 1;

    // On portrait viewports (mobile), damp horizontal displacement to keep the watch
    // inside the viewport, lift camY slightly to seat the watch in the top 55%,
    // leaving the bottom 45% clear for text copy above the dark gradient wash.
    const targetCamX = isPortrait ? camX * 0.32 : camX;
    const targetCamY = isPortrait ? camY + 0.28 : camY;
    const targetCamZ = camZ * fit;

    camera.position.x = damp(camera.position.x, targetCamX, 4.5, d);
    camera.position.y = damp(camera.position.y, targetCamY, 4.5, d);
    camera.position.z = damp(camera.position.z, targetCamZ, 4.5, d);
    camera.lookAt(target);

    const g = group.current;
    if (!g) return;

    // --- watch pose ------------------------------------------------------
    // Posed on the same stop grid as the camera.
    //
    // The explode angle is the load-bearing number here: parts separate along
    // the watch's own +Z, so if that axis points down the camera's view axis
    // the whole exploded view foreshortens into a solid-looking watch. These
    // values keep roughly 40 degrees between the two.
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
    const scale = trackEased(
      p,
      CAM,
      [1, 1, 0.94, 0.94, 0.98, 1.05, 1.02, 1.02, 0.96, 0.86, 0.86],
    );

    const px = reduce ? 0 : p3.x;
    const py = reduce ? 0 : p3.y;
    pointer.current.x = damp(pointer.current.x, px, 3, d);
    pointer.current.y = damp(pointer.current.y, py, 3, d);

    g.rotation.y = damp(g.rotation.y, rotY + pointer.current.x * 0.22, 5, d);
    g.rotation.x = damp(g.rotation.x, rotX - pointer.current.y * 0.16, 5, d);
    g.scale.setScalar(damp(g.scale.x, scale, 4, d));
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
    <Environment resolution={256} background={false}>
      <Lightformer
        form="rect"
        intensity={2.2}
        position={[0, 2.4, 1.4]}
        rotation={[-Math.PI / 3, 0, 0]}
        scale={[6, 3, 1]}
        color="#ffffff"
      />
      <Lightformer
        form="rect"
        intensity={1.7}
        position={[-2.6, 0.6, 1.6]}
        rotation={[0, Math.PI / 2.6, 0]}
        scale={[3.5, 4, 1]}
        color="#cfe4ff"
      />
      <Lightformer
        form="rect"
        intensity={2.0}
        position={[2.8, 0.2, 1.2]}
        rotation={[0, -Math.PI / 2.4, 0]}
        scale={[3.5, 4, 1]}
        color="#ffd9c2"
      />
      <Lightformer
        form="circle"
        intensity={1.1}
        position={[0, -2.4, 1.2]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={3}
        color="#8fa5c9"
      />
      <Lightformer
        form="rect"
        intensity={1.2}
        position={[0, 0, -3]}
        rotation={[0, Math.PI, 0]}
        scale={[8, 8, 1]}
        color="#20222b"
      />
    </Environment>
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
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 30, position: [0, 0.12, 6.4], near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <color attach="background" args={["#08080a"]} />
      <Rig
        progress={progress}
        reduce={reduce}
        overrideFaceMode={overrideFaceMode}
      />
      <Studio />
      <ContactShadows
        position={[0, -1.62, 0]}
        opacity={0.5}
        scale={8}
        blur={2.8}
        far={3}
        color="#000000"
      />
      {/* a touch of direct light so the titanium edges catch a hard specular */}
      <directionalLight position={[3, 5, 4]} intensity={0.75} />
      <directionalLight position={[-4, -1, 2]} intensity={0.35} color="#9db6de" />
    </Canvas>
  );
}
