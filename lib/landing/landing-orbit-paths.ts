import type { LandingModuleId } from "@/lib/landing/landing-modules";

export const HUB_CENTER = 50;
const CENTER_HALF_W = 14;
const CENTER_HALF_H = 12;
const NODE_INSET = 4.5;

export type OrbitNode = {
  id: LandingModuleId;
  x: number;
  y: number;
  floatY: number;
  floatX: number;
  floatDuration: number;
  floatDelay: number;
  delay: number;
};

export type OrbitPath = {
  id: LandingModuleId;
  d: string;
  length: number;
  delay: number;
  pulseDelay: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function hubEdgePoint(nodeX: number, nodeY: number) {
  const dx = nodeX - HUB_CENTER;
  const dy = nodeY - HUB_CENTER;

  if (Math.abs(dx) >= Math.abs(dy) * 0.75) {
    const edgeX = HUB_CENTER + (dx > 0 ? CENTER_HALF_W : -CENTER_HALF_W);
    const edgeY = HUB_CENTER + dy * 0.28;
    const endX = nodeX + (dx > 0 ? -NODE_INSET : NODE_INSET);
    return { x1: edgeX, y1: edgeY, x2: endX, y2: nodeY };
  }

  const edgeY = HUB_CENTER + (dy > 0 ? CENTER_HALF_H : -CENTER_HALF_H);
  const edgeX = HUB_CENTER + dx * 0.28;
  const endY = nodeY + (dy > 0 ? -NODE_INSET : NODE_INSET);
  return { x1: edgeX, y1: edgeY, x2: nodeX, y2: endY };
}

function curveControl(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const side = x2 < HUB_CENTER ? -0.2 : 0.2;
  return { cx: mx - dy * side, cy: my + dx * side };
}

function approximateQuadLength(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number
) {
  let length = 0;
  let px = x1;
  let py = y1;
  for (let t = 0.1; t <= 1.0001; t += 0.1) {
    const omt = 1 - t;
    const xt = omt * omt * x1 + 2 * omt * t * cx + t * t * x2;
    const yt = omt * omt * y1 + 2 * omt * t * cy + t * t * y2;
    length += Math.hypot(xt - px, yt - py);
    px = xt;
    py = yt;
  }
  return length;
}

export function buildOrbitNodes(
  layouts: { x: number; y: number; floatY: number; floatX: number; floatDuration: number; floatDelay: number }[],
  ids: LandingModuleId[]
): OrbitNode[] {
  return layouts.map((layout, i) => ({
    id: ids[i]!,
    ...layout,
    delay: 0.35 + i * 0.07,
  }));
}

export function buildOrbitPaths(nodes: OrbitNode[]): OrbitPath[] {
  return nodes.map((node, i) => {
    const { x1, y1, x2, y2 } = hubEdgePoint(node.x, node.y);
    const { cx, cy } = curveControl(x1, y1, x2, y2);
    const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
    return {
      id: node.id,
      d,
      length: approximateQuadLength(x1, y1, cx, cy, x2, y2),
      delay: 0.2 + i * 0.06,
      pulseDelay: i * 0.32,
      x1,
      y1,
      x2,
      y2,
    };
  });
}
