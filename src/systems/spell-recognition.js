import { clamp } from '../core/utils.js';

// Pure gesture analysis: converts a pointer path into a recognized circular spell.
export function analyzeStaffCircle(points, suppliedPathLength = 0) {
  if (!Array.isArray(points) || points.length < 20) {
    return { accepted: false };
  }

  const resamplePath = (source, sampleCount = 48) => {
    if (source.length < 2) return source.slice();

    const distances = [0];
    let total = 0;

    for (let i = 1; i < source.length; i += 1) {
      total += Math.hypot(
        source[i].x - source[i - 1].x,
        source[i].y - source[i - 1].y
      );
      distances.push(total);
    }

    if (total <= 0) return source.slice(0, 1);

    const samples = [];
    let segment = 1;

    for (let i = 0; i < sampleCount; i += 1) {
      const target = (total * i) / (sampleCount - 1);

      while (segment < distances.length - 1 && distances[segment] < target) {
        segment += 1;
      }

      const startDistance = distances[segment - 1];
      const endDistance = distances[segment];
      const span = Math.max(.0001, endDistance - startDistance);
      const t = clamp((target - startDistance) / span, 0, 1);
      const a = source[segment - 1];
      const b = source[segment];

      samples.push({
        x: a.x + ((b.x - a.x) * t),
        y: a.y + ((b.y - a.y) * t),
      });
    }

    return samples;
  };

  const smoothPath = (source, radius = 2) => {
    return source.map((_, index) => {
      let x = 0;
      let y = 0;
      let count = 0;

      for (let offset = -radius; offset <= radius; offset += 1) {
        const sampleIndex = clamp(index + offset, 0, source.length - 1);
        x += source[sampleIndex].x;
        y += source[sampleIndex].y;
        count += 1;
      }

      return { x: x / count, y: y / count };
    });
  };

  const sampled = resamplePath(points, 48);
  if (sampled.length < 20) return { accepted: false };

  // Smooth only for shape analysis. The visible spell trail still follows
  // the player's original drawing exactly.
  const analyzed = smoothPath(sampled, 2);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  analyzed.forEach((point) => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });

  const width = maxX - minX;
  const height = maxY - minY;
  const diameter = (width + height) / 2;
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);
  const aspectRatio = maxDimension > 0 ? minDimension / maxDimension : 0;

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const first = analyzed[0];
  const last = analyzed[analyzed.length - 1];
  const closureDistance = Math.hypot(last.x - first.x, last.y - first.y);
  const closureRatio = diameter > 0 ? closureDistance / diameter : 1;

  let pathLength = suppliedPathLength || 0;
  if (!pathLength) {
    for (let i = 1; i < points.length; i += 1) {
      pathLength += Math.hypot(
        points[i].x - points[i - 1].x,
        points[i].y - points[i - 1].y
      );
    }
  }

  const radii = analyzed.map((point) =>
    Math.hypot(point.x - centerX, point.y - centerY)
  );
  const meanRadius = radii.reduce((sum, radius) => sum + radius, 0) / radii.length;
  const variance = radii.reduce(
    (sum, radius) => sum + ((radius - meanRadius) ** 2),
    0
  ) / radii.length;
  const radialDeviation = meanRadius > 0
    ? Math.sqrt(variance) / meanRadius
    : 1;

  let totalAngle = 0;
  for (let i = 1; i < analyzed.length; i += 1) {
    const a = Math.atan2(
      analyzed[i - 1].y - centerY,
      analyzed[i - 1].x - centerX
    );
    const b = Math.atan2(
      analyzed[i].y - centerY,
      analyzed[i].x - centerX
    );

    let delta = b - a;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    totalAngle += delta;
  }

  const angleCoverage = Math.abs(totalAngle);
  const expectedCircumference = Math.max(1, Math.PI * 2 * meanRadius);
  const circumferenceRatio = pathLength / expectedCircumference;

  let polygonAreaTwice = 0;
  let closedPerimeter = 0;

  for (let i = 0; i < analyzed.length; i += 1) {
    const a = analyzed[i];
    const b = analyzed[(i + 1) % analyzed.length];
    polygonAreaTwice += (a.x * b.y) - (b.x * a.y);
    closedPerimeter += Math.hypot(b.x - a.x, b.y - a.y);
  }

  const polygonArea = Math.abs(polygonAreaTwice) / 2;
  const circularity = closedPerimeter > 0
    ? (4 * Math.PI * polygonArea) / (closedPerimeter ** 2)
    : 0;

  // Corner rejection is now the main protection against triangles,
  // rectangles and other polygons. A larger tangent span keeps normal
  // hand jitter from being mistaken for a corner.
  const turns = [];
  const turnSpan = 3;

  for (let i = turnSpan; i < analyzed.length - turnSpan; i += 1) {
    const before = analyzed[i - turnSpan];
    const current = analyzed[i];
    const after = analyzed[i + turnSpan];

    const angleA = Math.atan2(
      current.y - before.y,
      current.x - before.x
    );
    const angleB = Math.atan2(
      after.y - current.y,
      after.x - current.x
    );

    let delta = angleB - angleA;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    turns.push(Math.abs(delta));
  }

  const sortedTurns = turns.slice().sort((a, b) => a - b);
  const maxTurn = sortedTurns.length
    ? sortedTurns[sortedTurns.length - 1]
    : Math.PI;
  const p90Turn = sortedTurns.length
    ? sortedTurns[Math.min(sortedTurns.length - 1, Math.floor(sortedTurns.length * .9))]
    : Math.PI;
  const sharpCornerCount = turns.filter((turn) => turn > .92).length;

  const accepted =
    minDimension >= 62 &&
    pathLength >= 145 &&
    aspectRatio >= .66 &&
    closureRatio <= .34 &&
    radialDeviation <= .24 &&
    angleCoverage >= 5.05 &&
    angleCoverage <= 7.35 &&
    circumferenceRatio >= .68 &&
    circumferenceRatio <= 1.48 &&
    circularity >= .74 &&
    maxTurn <= 1.18 &&
    p90Turn <= .72 &&
    sharpCornerCount <= 1;

  return {
    accepted,
    centerX,
    centerY,
    width,
    height,
    pathLength,
    aspectRatio,
    closureRatio,
    radialDeviation,
    angleCoverage,
    circumferenceRatio,
    circularity,
    maxTurn,
    p90Turn,
    sharpCornerCount,
  };
}
