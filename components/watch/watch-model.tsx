"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { MotionValue } from "motion/react";

import { CH, damp, range, track } from "@/lib/anim";
import { createFaceTexture, type FaceMode } from "./display-texture";

/**
 * A procedural "thewebvale One".
 *
 * Every part is generated here rather than loaded from a .glb, for one reason
 * that matters to this page: the exploded chapter needs each component to be an
 * independently addressable object with its own pivot. A downloaded model gives
 * you a welded mesh and no say in how it comes apart.
 *
 * Units: the case is 1.0 wide, so 1 world unit ~= 44mm.
 */

const CASE_W = 1.0;
const CASE_H = 1.18;
const CASE_R = 0.27;
const CASE_D = 0.3;
const CASE_BEVEL = 0.035;

/**
 * ExtrudeGeometry adds the bevel on top of `depth` and `extruded()` re-centres
 * the result, so the real front face is half the depth plus one bevel — not
 * CASE_D / 2. Stacking the panel, bezel and crystal against this constant is
 * what keeps the display from ending up buried inside the solid case.
 */
const FRONT = CASE_D / 2 + CASE_BEVEL;

/** Case + strap pairings shown in the finishes chapter. */
export const FINISHES = [
  { name: "Natural Titanium", case: "#b9b7b2", strap: "#1c1c1e", accent: "#d8d6d1" },
  { name: "Slate Graphite", case: "#4a4a4f", strap: "#2a2b30", accent: "#6e6e75" },
  { name: "Desert Gold", case: "#c4a179", strap: "#6b5741", accent: "#e0c39c" },
] as const;

function roundedRectShape(w: number, h: number, r: number) {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

function extruded(
  shape: THREE.Shape,
  depth: number,
  bevel: number,
  curveSegments = 48,
) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    curveSegments,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: bevel > 0 ? 8 : 0,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

/** Sweeps a rounded-rect cross section along a curve — used for both straps. */
function strapGeometry(points: THREE.Vector3[]) {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4);
  const section = roundedRectShape(0.66, 0.085, 0.042);
  const geo = new THREE.ExtrudeGeometry(section, {
    steps: 96,
    bevelEnabled: false,
    extrudePath: curve,
  });
  geo.computeVertexNormals();
  return geo;
}

export function WatchModel({ progress }: { progress: MotionValue<number> }) {
  // --- geometry -----------------------------------------------------------
  const geo = useMemo(() => {
    const caseShape = roundedRectShape(CASE_W, CASE_H, CASE_R);

    const bezelShape = roundedRectShape(CASE_W - 0.01, CASE_H - 0.01, CASE_R);
    bezelShape.holes.push(roundedRectShape(CASE_W - 0.15, CASE_H - 0.15, CASE_R - 0.07));

    const strapTopPts = [
      new THREE.Vector3(0, 0.5, 0.04),
      new THREE.Vector3(0, 0.78, -0.02),
      new THREE.Vector3(0, 1.04, -0.26),
      new THREE.Vector3(0, 1.16, -0.64),
      new THREE.Vector3(0, 1.04, -1.0),
      new THREE.Vector3(0, 0.78, -1.2),
    ];
    const strapBottomPts = strapTopPts.map(
      (p) => new THREE.Vector3(p.x, -p.y, p.z),
    );

    return {
      caseBody: extruded(caseShape, CASE_D, CASE_BEVEL),
      bezel: extruded(bezelShape, 0.05, 0.012),
      crystal: extruded(
        roundedRectShape(CASE_W - 0.14, CASE_H - 0.14, CASE_R - 0.06),
        0.03,
        0.03,
      ),
      panel: new THREE.PlaneGeometry(CASE_W - 0.2, CASE_H - 0.2),
      back: new THREE.CylinderGeometry(0.4, 0.43, 0.07, 64),
      sensorDome: new THREE.SphereGeometry(0.2, 48, 32),
      sensorDot: new THREE.CircleGeometry(0.045, 24),
      crown: new THREE.CylinderGeometry(0.085, 0.085, 0.075, 40),
      crownRidge: new THREE.TorusGeometry(0.082, 0.012, 10, 48),
      button: extruded(roundedRectShape(0.075, 0.26, 0.035), 0.06, 0.01, 16),
      lug: extruded(roundedRectShape(0.58, 0.1, 0.045), 0.16, 0.012, 16),
      strapTop: strapGeometry(strapTopPts),
      strapBottom: strapGeometry(strapBottomPts),
    };
  }, []);

  useEffect(() => {
    const g = geo;
    return () => Object.values(g).forEach((x) => x.dispose());
  }, [geo]);

  // --- watch face ---------------------------------------------------------
  // One texture per face state, built once and swapped by `map`.
  //
  // The first cut redrew a single canvas and flipped `texture.needsUpdate` from
  // the frame loop, which is a post-render mutation React will not allow on a
  // memo, on state, or through a ref read during render. Three textures cost a
  // few MB of VRAM and the state changes exactly twice over the whole scroll.
  const faces = useMemo(
    () => ({
      time: createFaceTexture("time").texture,
      activity: createFaceTexture("activity").texture,
      workout: createFaceTexture("workout").texture,
      dive: createFaceTexture("dive").texture,
      ecg: createFaceTexture("ecg").texture,
    }),
    [],
  );
  const [faceMode, setFaceMode] = useState<FaceMode>("time");
  const lastFace = useRef<FaceMode>("time");
  useEffect(() => {
    const f = faces;
    return () => Object.values(f).forEach((t) => t.dispose());
  }, [faces]);

  // --- refs driven per frame ---------------------------------------------
  const crystalRef = useRef<THREE.Group>(null);
  const bezelRef = useRef<THREE.Group>(null);
  const panelRef = useRef<THREE.Group>(null);
  const caseRef = useRef<THREE.Group>(null);
  const backRef = useRef<THREE.Group>(null);
  const sensorRef = useRef<THREE.Group>(null);
  const crownRef = useRef<THREE.Group>(null);
  const strapTopRef = useRef<THREE.Group>(null);
  const strapBottomRef = useRef<THREE.Group>(null);

  const caseMat = useRef<THREE.MeshStandardMaterial>(null);
  const backMat = useRef<THREE.MeshStandardMaterial>(null);
  const strapMat = useRef<THREE.MeshStandardMaterial>(null);
  const strapMat2 = useRef<THREE.MeshStandardMaterial>(null);

  // reusable scratch colours so the frame loop allocates nothing
  const scratch = useMemo(
    () => ({ caseC: new THREE.Color(), strapC: new THREE.Color() }),
    [],
  );

  useFrame((_, dt) => {
    const p = progress.get();
    const d = Math.min(dt, 1 / 30);

    // ---- explode -------------------------------------------------------
    // Parts separate along the face normal (+Z), peak mid-chapter, reassemble.
    const e = track(
      p,
      [CH.explode[0], CH.explode[0] + 0.05, CH.explode[1] - 0.05, CH.explode[1]],
      [0, 1, 1, 0],
    );

    const set = (
      ref: React.RefObject<THREE.Group | null>,
      z: number,
      y = 0,
      x = 0,
    ) => {
      const g = ref.current;
      if (!g) return;
      g.position.z = damp(g.position.z, z * e, 6, d);
      g.position.y = damp(g.position.y, y * e, 6, d);
      g.position.x = damp(g.position.x, x * e, 6, d);
    };

    set(crystalRef, 1.05);
    set(bezelRef, 0.72);
    set(panelRef, 0.42);
    set(caseRef, 0);
    set(backRef, -0.42);
    set(sensorRef, -0.78);
    set(crownRef, 0.1, 0, 0.42);
    set(strapTopRef, -0.1, 0.5);
    set(strapBottomRef, -0.1, -0.5);

    // ---- watch face state ----------------------------------------------
    const wanted: FaceMode =
      p < CH.water[0]
        ? "time"
        : p < CH.water[1]
          ? "dive"
          : p < CH.display[0] + 0.04
            ? "activity"
            : p < CH.display[0] + 0.08
              ? "workout"
              : p < CH.display[1]
                ? "ecg"
                : "time";
    if (wanted !== lastFace.current) {
      lastFace.current = wanted;
      setFaceMode(wanted);
    }

    // ---- finish --------------------------------------------------------
    // Three finishes cross-fade across the chapter; outside it, finish 0.
    const fi = range(p, CH.finishes[0] + 0.02, CH.finishes[1] - 0.02) * (FINISHES.length - 1);
    const i0 = Math.floor(fi);
    const i1 = Math.min(i0 + 1, FINISHES.length - 1);
    const ft = fi - i0;

    scratch.caseC.set(FINISHES[i0].case).lerp(new THREE.Color(FINISHES[i1].case), ft);
    scratch.strapC.set(FINISHES[i0].strap).lerp(new THREE.Color(FINISHES[i1].strap), ft);

    caseMat.current?.color.lerp(scratch.caseC, 1 - Math.exp(-8 * d));
    backMat.current?.color.lerp(scratch.caseC, 1 - Math.exp(-8 * d));
    strapMat.current?.color.lerp(scratch.strapC, 1 - Math.exp(-8 * d));
    strapMat2.current?.color.lerp(scratch.strapC, 1 - Math.exp(-8 * d));
  });

  const titanium = (
    <meshStandardMaterial
      ref={caseMat}
      color={FINISHES[0].case}
      metalness={1}
      roughness={0.24}
      envMapIntensity={1.35}
    />
  );

  return (
    <group>
      {/* ---- case ---- */}
      <group ref={caseRef}>
        <mesh geometry={geo.caseBody} castShadow receiveShadow>
          {titanium}
        </mesh>

        {/* lugs: where the strap meets the case */}
        <mesh geometry={geo.lug} position={[0, CASE_H / 2 - 0.035, -0.02]}>
          <meshStandardMaterial color="#17171a" metalness={0.6} roughness={0.45} />
        </mesh>
        <mesh geometry={geo.lug} position={[0, -CASE_H / 2 + 0.035, -0.02]}>
          <meshStandardMaterial color="#17171a" metalness={0.6} roughness={0.45} />
        </mesh>
      </group>

      {/* ---- digital crown + side button ---- */}
      <group ref={crownRef}>
        <mesh
          geometry={geo.crown}
          position={[CASE_W / 2 + 0.03, 0.2, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <meshStandardMaterial
            color={FINISHES[0].accent}
            metalness={1}
            roughness={0.18}
            envMapIntensity={1.5}
          />
        </mesh>
        <mesh
          geometry={geo.crownRidge}
          position={[CASE_W / 2 + 0.03, 0.2, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <meshStandardMaterial color="#8d8b86" metalness={1} roughness={0.35} />
        </mesh>
        <mesh geometry={geo.button} position={[CASE_W / 2 + 0.012, -0.12, 0]}>
          <meshStandardMaterial color="#9a9893" metalness={1} roughness={0.3} />
        </mesh>
      </group>

      {/* ---- display panel ---- */}
      <group ref={panelRef}>
        <mesh geometry={geo.panel} position={[0, 0, FRONT + 0.004]}>
          <meshBasicMaterial map={faces[faceMode]} toneMapped={false} />
        </mesh>
      </group>

      {/* ---- bezel ---- */}
      <group ref={bezelRef}>
        <mesh geometry={geo.bezel} position={[0, 0, FRONT + 0.012]}>
          <meshStandardMaterial color="#0d0d0f" metalness={0.9} roughness={0.28} />
        </mesh>
      </group>

      {/* ---- sapphire crystal ---- */}
      <group ref={crystalRef}>
        <mesh geometry={geo.crystal} position={[0, 0, FRONT + 0.03]}>
          <meshPhysicalMaterial
            transmission={0.96}
            thickness={0.08}
            ior={1.62}
            roughness={0.035}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.03}
            transparent
            opacity={1}
            /* low, or the dome mirrors the softbox and hides the display */
            envMapIntensity={0.45}
            specularIntensity={0.7}
          />
        </mesh>
      </group>

      {/* ---- caseback ---- */}
      <group ref={backRef}>
        <mesh
          geometry={geo.back}
          position={[0, 0, -FRONT - 0.005]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            ref={backMat}
            color={FINISHES[0].case}
            metalness={1}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* ---- optical sensor array ---- */}
      <group ref={sensorRef}>
        <mesh
          geometry={geo.sensorDome}
          position={[0, 0, -FRONT - 0.05]}
          scale={[1, 1, 0.34]}
        >
          <meshPhysicalMaterial
            color="#08080a"
            roughness={0.08}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>
        {[
          [0.085, 0.085],
          [-0.085, 0.085],
          [0.085, -0.085],
          [-0.085, -0.085],
        ].map(([x, y], i) => (
          <mesh
            key={i}
            geometry={geo.sensorDot}
            position={[x, y, -FRONT - 0.115]}
            rotation={[0, Math.PI, 0]}
          >
            <meshBasicMaterial
              color={i % 2 === 0 ? "#4dff88" : "#ff3b5c"}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* ---- straps ---- */}
      <group ref={strapTopRef}>
        <mesh geometry={geo.strapTop} castShadow>
          <meshStandardMaterial
            ref={strapMat}
            color={FINISHES[0].strap}
            roughness={0.82}
            metalness={0}
          />
        </mesh>
      </group>
      <group ref={strapBottomRef}>
        <mesh geometry={geo.strapBottom} castShadow>
          <meshStandardMaterial
            ref={strapMat2}
            color={FINISHES[0].strap}
            roughness={0.82}
            metalness={0}
          />
        </mesh>
      </group>
    </group>
  );
}
