export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
export interface Point {
  x: number;
  y: number;
}
export function reverseDragRoute(
  history: Point[],
  start: Point,
  width: number,
  height: number,
  obstacles: Box[],
): Point[] {
  const route = [{ ...start }];
  for (const target of history.slice().reverse()) {
    const current = route[route.length - 1];
    if (Math.hypot(target.x - current.x, target.y - current.y) < 0.1) continue;
    const reached = reachablePoint(current, target, width, height, obstacles);
    if (Math.hypot(reached.x - current.x, reached.y - current.y) > 0.1)
      route.push(reached);
    if (Math.hypot(reached.x - target.x, reached.y - target.y) > 1) break;
  }
  return route;
}
export function routeSampler(points: Point[]) {
  const cumulative = [0];
  for (let i = 1; i < points.length; i++)
    cumulative.push(
      cumulative[i - 1] +
        Math.hypot(
          points[i].x - points[i - 1].x,
          points[i].y - points[i - 1].y,
        ),
    );
  const length = cumulative[cumulative.length - 1];
  return {
    length,
    at(progress: number): Point {
      if (!length) return { ...points[0] };
      const d = Math.max(0, Math.min(1, progress)) * length;
      let i = 1;
      while (i < cumulative.length - 1 && cumulative[i] < d) i++;
      const ratio =
        (d - cumulative[i - 1]) / (cumulative[i] - cumulative[i - 1]);
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * ratio,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * ratio,
      };
    },
  };
}
/** Clip a straight route at the first obstacle; never choose an unrelated destination. */
export function reachablePoint(
  start: Point,
  target: Point,
  width: number,
  height: number,
  obstacles: Box[],
): Point {
  const distance = Math.hypot(target.x - start.x, target.y - start.y);
  const steps = Math.max(1, Math.ceil(distance / 3));
  let last = { ...start };
  for (let i = 1; i <= steps; i++) {
    const p = {
      x: start.x + ((target.x - start.x) * i) / steps,
      y: start.y + ((target.y - start.y) * i) / steps,
    };
    const sweep = {
      left: Math.min(last.x, p.x),
      top: Math.min(last.y, p.y),
      right: Math.max(last.x, p.x) + width,
      bottom: Math.max(last.y, p.y) + height,
    };
    if (
      obstacles.some(
        (r) =>
          sweep.left < r.right + 10 &&
          sweep.right > r.left - 10 &&
          sweep.top < r.bottom + 10 &&
          sweep.bottom > r.top - 10,
      )
    )
      break;
    last = p;
  }
  return last;
}
