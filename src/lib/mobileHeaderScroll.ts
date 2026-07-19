export type ScrollDirection = "up" | "down" | null;

export interface MobileHeaderScrollState {
  lastY: number;
  direction: ScrollDirection;
  distance: number;
  collapsed: boolean;
}

export function createMobileHeaderScrollState(): MobileHeaderScrollState {
  return {
    lastY: 0,
    direction: null,
    distance: 0,
    collapsed: false,
  };
}

export function updateMobileHeaderScroll(
  state: MobileHeaderScrollState,
  currentY: number,
  isMobile: boolean,
  threshold = 12,
  topBoundary = 24,
): MobileHeaderScrollState {
  const nextY = Math.max(0, currentY);

  if (!isMobile || nextY <= topBoundary) {
    return {
      lastY: nextY,
      direction: null,
      distance: 0,
      collapsed: false,
    };
  }

  const delta = nextY - state.lastY;
  if (delta === 0) {
    return { ...state, lastY: nextY };
  }

  const direction: ScrollDirection = delta > 0 ? "down" : "up";
  const distance =
    direction === state.direction
      ? state.distance + Math.abs(delta)
      : Math.abs(delta);

  return {
    lastY: nextY,
    direction,
    distance,
    collapsed:
      distance >= threshold ? direction === "down" : state.collapsed,
  };
}
