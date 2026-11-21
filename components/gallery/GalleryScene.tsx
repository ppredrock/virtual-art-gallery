"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PointerLockControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { FRAME_STYLES, placementTransform } from "@/lib/gallery/geometry";
import type { TouchInput } from "@/lib/gallery/input";
import type { RoomConfig, SceneArtwork, ScenePlacement } from "@/lib/types";

export type Pose = { x: number; z: number; yaw: number };

type SceneProps = {
  room: RoomConfig;
  artworks: SceneArtwork[];
  placements: ScenePlacement[];
  mode: "walk" | "orbit";
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  onNear?: (artworkId: number | null) => void;
  onLockChange?: (locked: boolean) => void;
  onProgress?: (loaded: number, total: number) => void;
  lockSelector?: string;
  controls?: "pointer-lock" | "touch";
  touchInput?: RefObject<TouchInput>;
  /** Walk mode: true while the visitor is inside the tour (drives the enter / leave camera moves). */
  active?: boolean;
  /** Walk mode: written every frame so a minimap can follow the visitor. */
  poseRef?: RefObject<Pose>;
};

type PlacementWithTransform = ScenePlacement & { transform: ReturnType<typeof placementTransform> };

const EYE = 1.7;
const clamp = THREE.MathUtils.clamp;
const damp = (a: number, b: number, lambda: number, dt: number) => THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/* ------------------------------------------------------------------ */
/* Procedural materials                                               */
/* ------------------------------------------------------------------ */

function makeWoodTexture(base: string, repeatX: number, repeatY: number) {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const col = new THREE.Color(base);
  const planks = 8;
  const pw = size / planks;
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  for (let i = 0; i < planks; i++) {
    let y = -rnd() * size * 0.5;
    while (y < size) {
      const len = size * (0.4 + rnd() * 0.6);
      const top = Math.max(y, 0);
      const h = Math.min(y + len, size) - top;
      if (h > 0) {
        const shade = 0.8 + rnd() * 0.32;
        g.fillStyle = `#${col.clone().multiplyScalar(shade).getHexString()}`;
        g.fillRect(i * pw, top, pw, h);
        for (let k = 0; k < 28; k++) {
          const gx = i * pw + rnd() * pw;
          g.strokeStyle = rnd() > 0.5 ? `rgba(0,0,0,${0.04 + rnd() * 0.07})` : `rgba(255,225,190,${0.03 + rnd() * 0.05})`;
          g.lineWidth = 0.6 + rnd() * 1.4;
          g.beginPath();
          g.moveTo(gx, top);
          g.bezierCurveTo(gx + (rnd() - 0.5) * 8, top + h * 0.3, gx + (rnd() - 0.5) * 8, top + h * 0.7, gx + (rnd() - 0.5) * 5, top + h);
          g.stroke();
        }
        g.fillStyle = "rgba(0,0,0,0.38)";
        g.fillRect(i * pw, top, pw, 1.6);
      }
      y += len;
    }
    g.fillStyle = "rgba(0,0,0,0.42)";
    g.fillRect(i * pw, 0, 1.6, size);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 8;
  return t;
}

/* ------------------------------------------------------------------ */
/* Room                                                               */
/* ------------------------------------------------------------------ */

type Bench = { x: number; z: number; hx: number; hz: number };

function benchesFor(room: RoomConfig): Bench[] {
  if (room.roomWidth < 8 || room.roomLength < 9) return [];
  return [{ x: 0, z: -room.roomLength * 0.08, hx: 1.2, hz: 0.3 }];
}

function BenchMesh({ bench }: { bench: Bench }) {
  return (
    <group position={[bench.x, 0, bench.z]}>
      <mesh position={[0, 0.46, 0]}>
        <boxGeometry args={[bench.hx * 2, 0.1, bench.hz * 2]} />
        <meshStandardMaterial color="#1c1417" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[bench.hx * 2 - 0.1, 0.06, bench.hz * 2 - 0.1]} />
        <meshStandardMaterial color="#5a2230" roughness={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (bench.hx - 0.18), 0.22, 0]}>
          <boxGeometry args={[0.07, 0.44, bench.hz * 2 - 0.12]} />
          <meshStandardMaterial color="#b8903a" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function Room({ room, placements, walk }: { room: RoomConfig; placements: PlacementWithTransform[]; walk: boolean }) {
  const { roomWidth: W, roomLength: L, roomHeight: H } = room;
  const wood = useMemo(() => makeWoodTexture(room.floorColor, W / 2.2, L / 2.2), [room.floorColor, W, L]);
  useEffect(() => () => wood.dispose(), [wood]);

  const walls = [
    { pos: [0, H / 2, -L / 2], rot: 0, size: [W, H] },
    { pos: [0, H / 2, L / 2], rot: Math.PI, size: [W, H] },
    { pos: [W / 2, H / 2, 0], rot: -Math.PI / 2, size: [L, H] },
    { pos: [-W / 2, H / 2, 0], rot: Math.PI / 2, size: [L, H] },
  ] as const;

  const trim = new THREE.Color(room.wallColor).multiplyScalar(0.55);
  const benches = useMemo(() => benchesFor(room), [room]);

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial map={wood} roughness={0.42} metalness={0.08} />
      </mesh>
      {/* ceiling */}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color={room.ceilingColor} roughness={1} />
      </mesh>
      {/* walls */}
      {walls.map((w, i) => (
        <mesh key={i} position={[w.pos[0], w.pos[1], w.pos[2]]} rotation={[0, w.rot, 0]}>
          <planeGeometry args={[w.size[0], w.size[1]]} />
          <meshStandardMaterial color={room.wallColor} roughness={0.92} />
        </mesh>
      ))}
      {/* baseboards + crown */}
      {walls.map((w, i) => (
        <group key={`t${i}`} position={[w.pos[0], 0, w.pos[2]]} rotation={[0, w.rot, 0]}>
          <mesh position={[0, 0.09, 0.025]}>
            <boxGeometry args={[w.size[0], 0.18, 0.05]} />
            <meshStandardMaterial color={trim} roughness={0.6} />
          </mesh>
          <mesh position={[0, H - 0.06, 0.03]}>
            <boxGeometry args={[w.size[0], 0.12, 0.06]} />
            <meshStandardMaterial color={trim} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* gentle fill so the room is never pitch black */}
      <hemisphereLight args={["#fff2dc", "#1a1220", 0.35 * room.lightIntensity]} />
      <ambientLight color={room.lightColor} intensity={0.18 * room.lightIntensity} />
      {/* a soft overhead wash in the centre of the room */}
      <pointLight position={[0, H - 0.5, 0]} color={room.lightColor} intensity={14 * room.lightIntensity} decay={2} />

      {placements.map((p) => (
        <ArtworkSpot key={p.id} placement={p} room={room} />
      ))}

      {benches.map((b, i) => (
        <BenchMesh key={i} bench={b} />
      ))}

      {walk && <Sparkles count={50} scale={[W - 1, H - 0.8, L - 1]} position={[0, H / 2, 0]} size={2.2} speed={0.15} opacity={0.35} color="#ffe7b0" />}
    </group>
  );
}

/** A ceiling fixture that throws a soft cone of light on one artwork. */
function ArtworkSpot({ placement, room }: { placement: PlacementWithTransform; room: RoomConfig }) {
  const t = placement.transform;
  const target = useMemo(() => new THREE.Object3D(), []);
  const [nx, , nz] = t.normal;
  const pos: [number, number, number] = [t.position[0] + nx * 1.7, room.roomHeight - 0.18, t.position[2] + nz * 1.7];
  useEffect(() => {
    target.position.set(t.position[0], t.position[1], t.position[2]);
    target.updateMatrixWorld();
  }, [target, t.position]);

  return (
    <group>
      <primitive object={target} />
      <spotLight
        position={pos}
        target={target}
        color={room.lightColor}
        intensity={70 * room.lightIntensity}
        angle={0.55}
        penumbra={0.85}
        decay={2}
      />
      <mesh position={pos}>
        <cylinderGeometry args={[0.06, 0.09, 0.14, 16]} />
        <meshStandardMaterial color="#0e0b10" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Artwork                                                            */
/* ------------------------------------------------------------------ */

function Artwork({
  placement,
  artwork,
  selected,
  onSelect,
  onSettled,
}: {
  placement: PlacementWithTransform;
  artwork: SceneArtwork | undefined;
  selected: boolean;
  onSelect?: (id: number) => void;
  onSettled?: () => void;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const url = artwork?.imageUrl;
  const settled = useRef(onSettled);
  settled.current = onSettled;

  useEffect(() => {
    if (!url) {
      settled.current?.();
      return;
    }
    let alive = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        if (alive) setTexture(t);
        settled.current?.();
      },
      undefined,
      () => settled.current?.(),
    );
    return () => {
      alive = false;
    };
  }, [url]);

  const image = texture?.image as { width: number; height: number } | undefined;
  const aspect = image ? image.height / image.width : 4 / 3;
  const w = placement.width;
  const h = w * aspect;
  const frame = FRAME_STYLES[placement.frame];
  const t = placement.transform;
  const matted = placement.frame !== "none";
  const mat = matted ? 0.07 : 0;
  const outerW = w + mat * 2 + frame.thickness * 2;
  const outerH = h + mat * 2 + frame.thickness * 2;

  return (
    <group
      position={[t.position[0], t.position[1], t.position[2]]}
      rotation={[0, t.rotationY, 0]}
      onClick={
        onSelect
          ? (e) => {
              e.stopPropagation();
              onSelect(placement.id);
            }
          : undefined
      }
    >
      {selected && (
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[outerW + 0.14, outerH + 0.14, 0.02]} />
          <meshBasicMaterial color="#d9b84a" />
        </mesh>
      )}
      {/* soft contact shadow behind the frame */}
      <mesh position={[0, -0.03, -0.004]}>
        <planeGeometry args={[outerW + 0.18, outerH + 0.18]} />
        <meshBasicMaterial color="#000" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      {frame.thickness > 0 && (
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[outerW, outerH, 0.06]} />
          <meshStandardMaterial
            color={frame.color}
            roughness={placement.frame === "gold" ? 0.32 : 0.45}
            metalness={placement.frame === "gold" ? 0.65 : 0.05}
            emissive={placement.frame === "gold" ? "#3a2a08" : "#000000"}
          />
        </mesh>
      )}
      {matted && (
        <mesh position={[0, 0, 0.042]}>
          <planeGeometry args={[w + mat * 2, h + mat * 2]} />
          <meshStandardMaterial color="#f3ecdd" roughness={1} />
        </mesh>
      )}
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          key={texture ? "textured" : "placeholder"}
          map={texture ?? undefined}
          color={texture ? "#ffffff" : "#bdb6a8"}
          emissive="#ffffff"
          emissiveMap={texture ?? undefined}
          emissiveIntensity={texture ? 0.42 : 0.05}
          roughness={0.75}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Camera: responsive FOV + the walking / enter / leave state machine */
/* ------------------------------------------------------------------ */

const BASE_FOV = 70;
const PORTRAIT_TARGET_HFOV = 80;
const MAX_FOV = 100;

function ResponsiveFov() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = size.width / size.height;
    camera.fov =
      aspect >= 1
        ? BASE_FOV
        : clamp(
            THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(PORTRAIT_TARGET_HFOV) / 2) / aspect)),
            BASE_FOV,
            MAX_FOV,
          );
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}

type CamPose = { x: number; y: number; z: number; yaw: number; pitch: number };
type Phase = "idle" | "enter" | "walk" | "leave";

function vantageOf(room: RoomConfig): CamPose {
  const mz = room.roomLength / 2 - 0.4;
  return {
    x: room.spawnX,
    y: Math.min(room.roomHeight - 0.9, 3.3),
    z: Math.min(room.spawnZ + 2, mz),
    yaw: 0,
    pitch: -0.3,
  };
}

function Walker({
  room,
  placements,
  active,
  onNear,
  touchInput,
  poseRef,
}: {
  room: RoomConfig;
  placements: PlacementWithTransform[];
  active: boolean;
  onNear?: (artworkId: number | null) => void;
  touchInput?: RefObject<TouchInput>;
  poseRef?: RefObject<Pose>;
}) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const nearRef = useRef<number | null>(null);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const vel = useRef(new THREE.Vector2());
  const yawVel = useRef(0);
  const bob = useRef({ phase: 0, amp: 0 });
  const phase = useRef<Phase>("idle");
  const idleT = useRef(0);
  const anim = useRef<{ t: number; dur: number; from: CamPose; to: CamPose }>({
    t: 0,
    dur: 1,
    from: vantageOf(room),
    to: vantageOf(room),
  });
  const lastWalk = useRef<CamPose | null>(null);
  const benches = useMemo(() => benchesFor(room), [room]);

  const readPose = (): CamPose => ({
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    yaw: camera.rotation.y,
    pitch: camera.rotation.x,
  });
  const applyPose = (p: CamPose) => {
    camera.position.set(p.x, p.y, p.z);
    camera.rotation.set(p.pitch, p.yaw, 0, "YXZ");
  };

  // place the camera at the overview vantage when the room changes
  useEffect(() => {
    camera.rotation.order = "YXZ";
    applyPose(vantageOf(room));
    phase.current = "idle";
    idleT.current = 0;
    lastWalk.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, room.spawnX, room.spawnZ, room.roomHeight, room.roomLength]);

  // enter / leave transitions
  useEffect(() => {
    if (active && (phase.current === "idle" || phase.current === "leave")) {
      const to = lastWalk.current ?? { x: room.spawnX, y: EYE, z: room.spawnZ, yaw: 0, pitch: 0 };
      anim.current = { t: 0, dur: lastWalk.current ? 1.6 : 2.6, from: readPose(), to };
      phase.current = "enter";
    } else if (!active && (phase.current === "walk" || phase.current === "enter")) {
      const cur = readPose();
      if (phase.current === "walk") lastWalk.current = cur;
      anim.current = { t: 0, dur: 1.8, from: cur, to: vantageOf(room) };
      phase.current = "leave";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const upHandler = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", upHandler);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", upHandler);
    };
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const ph = phase.current;
    const publish = () => {
      if (poseRef?.current) {
        poseRef.current.x = camera.position.x;
        poseRef.current.z = camera.position.z;
        poseRef.current.yaw = camera.rotation.y;
      }
    };

    if (ph === "idle") {
      idleT.current += dt;
      const v = vantageOf(room);
      const s = idleT.current;
      applyPose({
        x: v.x + Math.sin(s * 0.23) * 0.7,
        y: v.y + Math.sin(s * 0.31) * 0.08,
        z: v.z,
        yaw: Math.sin(s * 0.17) * 0.16,
        pitch: v.pitch + Math.sin(s * 0.2) * 0.02,
      });
      publish();
      if (nearRef.current !== null) {
        nearRef.current = null;
        onNear?.(null);
      }
      return;
    }

    if (ph === "enter" || ph === "leave") {
      const a = anim.current;
      a.t += dt;
      const u = clamp(a.t / a.dur, 0, 1);
      const e = easeInOut(u);
      applyPose({
        x: THREE.MathUtils.lerp(a.from.x, a.to.x, e),
        // rise/dip a touch slower than the horizontal move for a more cinematic arc
        y: THREE.MathUtils.lerp(a.from.y, a.to.y, easeInOut(Math.min(1, u * 1.05))),
        z: THREE.MathUtils.lerp(a.from.z, a.to.z, e),
        yaw: a.from.yaw + wrapAngle(a.to.yaw - a.from.yaw) * e,
        pitch: THREE.MathUtils.lerp(a.from.pitch, a.to.pitch, e),
      });
      publish();
      if (u >= 1) {
        if (ph === "enter") {
          phase.current = "walk";
          vel.current.set(0, 0);
        } else {
          phase.current = "idle";
          idleT.current = 0;
        }
      }
      return;
    }

    // ---- walking ----
    const k = keys.current;
    const touch = touchInput?.current;
    const running = k.ShiftLeft || k.ShiftRight;
    const maxSpeed = running ? 4.6 : 2.6;

    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    right.crossVectors(dir, up);

    let fwd = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    let str = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
    if (touch) {
      fwd += touch.moveY;
      str += touch.moveX;
    }
    const mag = Math.hypot(fwd, str);
    if (mag > 1) {
      fwd /= mag;
      str /= mag;
    }

    // smooth acceleration / deceleration instead of an instant start and stop
    const tx = (dir.x * fwd + right.x * str) * maxSpeed;
    const tz = (dir.z * fwd + right.z * str) * maxSpeed;
    const moving = mag > 0.01;
    vel.current.x = damp(vel.current.x, tx, moving ? 7 : 9, dt);
    vel.current.y = damp(vel.current.y, tz, moving ? 7 : 9, dt);
    camera.position.x += vel.current.x * dt;
    camera.position.z += vel.current.y * dt;

    // keyboard turning, eased
    const turnTarget = (k.ArrowLeft ? 1 : 0) - (k.ArrowRight ? 1 : 0);
    yawVel.current = damp(yawVel.current, turnTarget * 1.7, 8, dt);
    camera.rotation.y += yawVel.current * dt;

    if (touch && (touch.lookX || touch.lookY)) {
      camera.rotation.y -= touch.lookX * 0.0045;
      camera.rotation.x = clamp(camera.rotation.x - touch.lookY * 0.0045, -1.1, 1.1);
      touch.lookX = 0;
      touch.lookY = 0;
    }

    // keep the visitor inside the room and out of the bench
    const mx = room.roomWidth / 2 - 0.7;
    const mz = room.roomLength / 2 - 0.7;
    camera.position.x = clamp(camera.position.x, -mx, mx);
    camera.position.z = clamp(camera.position.z, -mz, mz);
    for (const b of benches) {
      const px = camera.position.x - b.x;
      const pz = camera.position.z - b.z;
      const ex = b.hx + 0.4;
      const ez = b.hz + 0.4;
      if (Math.abs(px) < ex && Math.abs(pz) < ez) {
        if (ex - Math.abs(px) < ez - Math.abs(pz)) camera.position.x = b.x + Math.sign(px || 1) * ex;
        else camera.position.z = b.z + Math.sign(pz || 1) * ez;
      }
    }

    // gentle head bob that scales with speed
    const speed = vel.current.length();
    bob.current.amp = damp(bob.current.amp, clamp(speed / 2.6, 0, 1.4), 6, dt);
    bob.current.phase += speed * dt * 2.3;
    camera.position.y = EYE + Math.sin(bob.current.phase) * 0.022 * bob.current.amp;
    camera.rotation.z = Math.sin(bob.current.phase * 0.5) * 0.0028 * bob.current.amp;
    publish();

    if (!onNear) return;
    camera.getWorldDirection(dir);
    let best: { id: number; score: number } | null = null;
    for (const p of placements) {
      const [px, , pz] = p.transform.position;
      const dx = px - camera.position.x;
      const dz = pz - camera.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 3.8 || dist < 0.01) continue;
      const facing = (dx * dir.x + dz * dir.z) / dist / Math.max(Math.hypot(dir.x, dir.z), 0.001);
      if (facing < 0.72) continue;
      const score = dist - facing * 1.5;
      if (!best || score < best.score) best = { id: p.artworkId, score };
    }
    const next = best?.id ?? null;
    if (next !== nearRef.current) {
      nearRef.current = next;
      onNear(next);
    }
  });

  return null;
}

/* ------------------------------------------------------------------ */

export function GalleryScene({
  room,
  artworks,
  placements,
  mode,
  selectedId,
  onSelect,
  onNear,
  onLockChange,
  onProgress,
  lockSelector,
  controls = "pointer-lock",
  touchInput,
  active = false,
  poseRef,
}: SceneProps) {
  const byId = useMemo(() => new Map(artworks.map((a) => [a.id, a])), [artworks]);
  const withTransform = useMemo<PlacementWithTransform[]>(
    () => placements.map((p) => ({ ...p, transform: placementTransform(p, room) })),
    [placements, room],
  );

  const [loaded, setLoaded] = useState(0);
  const total = withTransform.length;
  useEffect(() => {
    onProgress?.(Math.min(loaded, total), total);
  }, [loaded, total, onProgress]);

  const walk = mode === "walk";

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={
        walk
          ? { fov: BASE_FOV, near: 0.1, far: 100, position: [room.spawnX, 3.3, room.spawnZ] }
          : { fov: 50, near: 0.1, far: 200, position: [0, room.roomHeight * 3.2, room.roomLength * 0.9] }
      }
      style={{ background: "#0d0816" }}
    >
      {walk && <fog attach="fog" args={["#0d0816", 14, 34]} />}
      <Room room={room} placements={withTransform} walk={walk} />
      {withTransform.map((p) => (
        <Artwork
          key={p.id}
          placement={p}
          artwork={byId.get(p.artworkId)}
          selected={selectedId === p.id}
          onSelect={onSelect}
          onSettled={() => setLoaded((n) => n + 1)}
        />
      ))}
      {walk ? (
        <>
          <ResponsiveFov />
          <Walker room={room} placements={withTransform} active={active} onNear={onNear} touchInput={touchInput} poseRef={poseRef} />
          {controls === "pointer-lock" && (
            <PointerLockControls
              selector={lockSelector}
              pointerSpeed={0.85}
              onLock={() => onLockChange?.(true)}
              onUnlock={() => onLockChange?.(false)}
            />
          )}
        </>
      ) : (
        <OrbitControls target={[0, room.roomHeight / 2, 0]} maxPolarAngle={Math.PI / 2.05} />
      )}
    </Canvas>
  );
}
