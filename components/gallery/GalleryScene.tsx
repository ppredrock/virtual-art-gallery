"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { FRAME_STYLES, placementTransform } from "@/lib/gallery/geometry";
import type { TouchInput } from "@/lib/gallery/input";
import type { RoomConfig, SceneArtwork, ScenePlacement } from "@/lib/types";

type SceneProps = {
  room: RoomConfig;
  artworks: SceneArtwork[];
  placements: ScenePlacement[];
  mode: "walk" | "orbit";
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  onNear?: (artworkId: number | null) => void;
  onLockChange?: (locked: boolean) => void;
  lockSelector?: string;
  controls?: "pointer-lock" | "touch";
  touchInput?: RefObject<TouchInput>;
};

type PlacementWithTransform = ScenePlacement & { transform: ReturnType<typeof placementTransform> };

function Room({ room }: { room: RoomConfig }) {
  const { roomWidth: W, roomLength: L, roomHeight: H } = room;
  const walls = [
    { pos: [0, H / 2, -L / 2], rot: 0, size: [W, H] },
    { pos: [0, H / 2, L / 2], rot: Math.PI, size: [W, H] },
    { pos: [W / 2, H / 2, 0], rot: -Math.PI / 2, size: [L, H] },
    { pos: [-W / 2, H / 2, 0], rot: Math.PI / 2, size: [L, H] },
  ] as const;

  const lights = useMemo(() => {
    const nx = Math.max(1, Math.round(W / 6));
    const nz = Math.max(1, Math.round(L / 6));
    const out: [number, number][] = [];
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) out.push([-W / 2 + (W * (i + 0.5)) / nx, -L / 2 + (L * (j + 0.5)) / nz]);
    return out;
  }, [W, L]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color={room.floorColor} roughness={0.55} />
      </mesh>
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color={room.ceilingColor} roughness={1} />
      </mesh>
      {walls.map((w, i) => (
        <mesh key={i} position={[w.pos[0], w.pos[1], w.pos[2]]} rotation={[0, w.rot, 0]}>
          <planeGeometry args={[w.size[0], w.size[1]]} />
          <meshStandardMaterial color={room.wallColor} roughness={0.95} />
        </mesh>
      ))}
      <ambientLight color={room.lightColor} intensity={0.55 * room.lightIntensity} />
      {lights.map(([x, z], i) => (
        <pointLight key={i} position={[x, H - 0.4, z]} color={room.lightColor} intensity={22 * room.lightIntensity} decay={2} />
      ))}
    </group>
  );
}

function Artwork({
  placement,
  artwork,
  selected,
  onSelect,
}: {
  placement: PlacementWithTransform;
  artwork: SceneArtwork | undefined;
  selected: boolean;
  onSelect?: (id: number) => void;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const url = artwork?.imageUrl;

  useEffect(() => {
    if (!url) return;
    let alive = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        if (alive) setTexture(t);
      },
      undefined,
      () => {},
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
          <boxGeometry args={[w + frame.thickness * 2 + 0.14, h + frame.thickness * 2 + 0.14, 0.02]} />
          <meshBasicMaterial color="#d9b84a" />
        </mesh>
      )}
      {frame.thickness > 0 && (
        <mesh>
          <boxGeometry args={[w + frame.thickness * 2, h + frame.thickness * 2, 0.05]} />
          <meshStandardMaterial color={frame.color} roughness={0.4} metalness={placement.frame === "gold" ? 0.3 : 0} />
        </mesh>
      )}
      <mesh position={[0, 0, 0.027]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial
          key={texture ? "textured" : "placeholder"}
          map={texture ?? undefined}
          color={texture ? "#ffffff" : "#d4d4d4"}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

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
        : THREE.MathUtils.clamp(
            THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(PORTRAIT_TARGET_HFOV) / 2) / aspect)),
            BASE_FOV,
            MAX_FOV,
          );
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}

function Walker({
  room,
  placements,
  onNear,
  touchInput,
}: {
  room: RoomConfig;
  placements: PlacementWithTransform[];
  onNear?: (artworkId: number | null) => void;
  touchInput?: RefObject<TouchInput>;
}) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const nearRef = useRef<number | null>(null);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useEffect(() => {
    camera.position.set(room.spawnX, 1.7, room.spawnZ);
    camera.rotation.order = "YXZ";
    camera.rotation.set(0, 0, 0);
  }, [camera, room.spawnX, room.spawnZ]);

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

  useFrame((_, dt) => {
    const k = keys.current;
    const speed = (k.ShiftLeft || k.ShiftRight ? 5 : 2.8) * Math.min(dt, 0.05);
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    right.crossVectors(dir, up);

    if (k.KeyW || k.ArrowUp) camera.position.addScaledVector(dir, speed);
    if (k.KeyS || k.ArrowDown) camera.position.addScaledVector(dir, -speed);
    if (k.KeyD) camera.position.addScaledVector(right, speed);
    if (k.KeyA) camera.position.addScaledVector(right, -speed);
    if (k.ArrowLeft) camera.rotation.y += 1.6 * Math.min(dt, 0.05);
    if (k.ArrowRight) camera.rotation.y -= 1.6 * Math.min(dt, 0.05);

    const touch = touchInput?.current;
    if (touch) {
      if (touch.moveY) camera.position.addScaledVector(dir, speed * touch.moveY);
      if (touch.moveX) camera.position.addScaledVector(right, speed * touch.moveX);
      if (touch.lookX || touch.lookY) {
        camera.rotation.y -= touch.lookX * 0.0045;
        camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - touch.lookY * 0.0045, -1.1, 1.1);
        touch.lookX = 0;
        touch.lookY = 0;
      }
    }

    const mx = room.roomWidth / 2 - 0.5;
    const mz = room.roomLength / 2 - 0.5;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -mx, mx);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -mz, mz);
    camera.position.y = 1.7;

    if (!onNear) return;
    camera.getWorldDirection(dir);
    let best: { id: number; score: number } | null = null;
    for (const p of placements) {
      const [px, , pz] = p.transform.position;
      const dx = px - camera.position.x;
      const dz = pz - camera.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 3.6 || dist < 0.01) continue;
      const facing = (dx * dir.x + dz * dir.z) / dist / Math.max(Math.hypot(dir.x, dir.z), 0.001);
      if (facing < 0.75) continue;
      const score = dist - facing;
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

export function GalleryScene({
  room,
  artworks,
  placements,
  mode,
  selectedId,
  onSelect,
  onNear,
  onLockChange,
  lockSelector,
  controls = "pointer-lock",
  touchInput,
}: SceneProps) {
  const byId = useMemo(() => new Map(artworks.map((a) => [a.id, a])), [artworks]);
  const withTransform = useMemo<PlacementWithTransform[]>(
    () => placements.map((p) => ({ ...p, transform: placementTransform(p, room) })),
    [placements, room],
  );

  return (
    <Canvas
      dpr={[1, 2]}
      camera={
        mode === "walk"
          ? { fov: BASE_FOV, near: 0.1, far: 100, position: [room.spawnX, 1.7, room.spawnZ] }
          : { fov: 50, near: 0.1, far: 200, position: [0, room.roomHeight * 3.2, room.roomLength * 0.9] }
      }
      style={{ background: "#150a33" }}
    >
      <Room room={room} />
      {withTransform.map((p) => (
        <Artwork
          key={p.id}
          placement={p}
          artwork={byId.get(p.artworkId)}
          selected={selectedId === p.id}
          onSelect={onSelect}
        />
      ))}
      {mode === "walk" ? (
        <>
          <ResponsiveFov />
          <Walker room={room} placements={withTransform} onNear={onNear} touchInput={touchInput} />
          {controls === "pointer-lock" && (
            <PointerLockControls
              selector={lockSelector}
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
