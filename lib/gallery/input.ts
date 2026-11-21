export type TouchInput = {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
};

export const createTouchInput = (): TouchInput => ({ moveX: 0, moveY: 0, lookX: 0, lookY: 0 });
