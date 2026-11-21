export type Wall = "north" | "south" | "east" | "west";
export type Frame = "none" | "thin" | "gold" | "black";

export type RoomConfig = {
  roomWidth: number;
  roomLength: number;
  roomHeight: number;
  wallColor: string;
  floorColor: string;
  ceilingColor: string;
  lightColor: string;
  lightIntensity: number;
  spawnX: number;
  spawnZ: number;
};

export type SceneArtwork = {
  id: number;
  title: string;
  artist: string;
  year: string;
  medium: string;
  description: string;
  imageUrl: string;
};

export type ScenePlacement = {
  id: number;
  artworkId: number;
  wall: Wall;
  offset: number;
  elevation: number;
  width: number;
  frame: Frame;
};
