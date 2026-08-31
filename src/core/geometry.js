// Pure hit-testing helpers used by gesture combat.
function pointInsideRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function segmentIntersectsRect(x1, y1, x2, y2, rect) {
  if (pointInsideRect(x1, y1, rect) || pointInsideRect(x2, y2, rect)) return true;

  return segmentsIntersect(x1, y1, x2, y2, rect.left, rect.top, rect.right, rect.top) ||
    segmentsIntersect(x1, y1, x2, y2, rect.right, rect.top, rect.right, rect.bottom) ||
    segmentsIntersect(x1, y1, x2, y2, rect.right, rect.bottom, rect.left, rect.bottom) ||
    segmentsIntersect(x1, y1, x2, y2, rect.left, rect.bottom, rect.left, rect.top);
}

function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const abx = bx - ax;
  const aby = by - ay;
  const cdx = dx - cx;
  const cdy = dy - cy;
  const denominator = (abx * cdy) - (aby * cdx);
  if (Math.abs(denominator) < 0.0001) return false;

  const acx = cx - ax;
  const acy = cy - ay;
  const t = ((acx * cdy) - (acy * cdx)) / denominator;
  const u = ((acx * aby) - (acy * abx)) / denominator;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

export { pointInsideRect, segmentIntersectsRect, segmentsIntersect };
