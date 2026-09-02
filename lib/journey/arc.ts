import type { LatLng } from '@/lib/domain/journey';

/** Arc sagitta as a fraction of the great-circle angle. 0.12 ≈ 107 km on an 895 km leg. */
const BOW_RATIO = 0.12;

type Vec3 = { x: number; y: number; z: number };

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const scale = (v: Vec3, factor: number): Vec3 => ({ x: v.x * factor, y: v.y * factor, z: v.z * factor });

const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(v.x, v.y, v.z);
  return length === 0 ? { x: 0, y: 0, z: 0 } : scale(v, 1 / length);
}

function toVector({ lat, lng }: LatLng): Vec3 {
  const phi = toRadians(lat);
  const lambda = toRadians(lng);
  const cosPhi = Math.cos(phi);

  return { x: cosPhi * Math.cos(lambda), y: cosPhi * Math.sin(lambda), z: Math.sin(phi) };
}

function toLatLng({ x, y, z }: Vec3): LatLng {
  const length = Math.hypot(x, y, z) || 1;

  return { lat: toDegrees(Math.asin(z / length)), lng: toDegrees(Math.atan2(y, x)) };
}

/**
 * Great-circle interpolation displaced by a perpendicular sine bow. The bow is
 * what makes a flight readable: Changsha→Changzhi runs almost due north, so the
 * bare great circle is pixel-identical to a straight line. Coincident and
 * antipodal endpoints yield a zero normal, which degrades to an unbowed path.
 */
export function greatCircleArc(from: LatLng, to: LatLng, steps: number): LatLng[] {
  const start = toVector(from);
  const end = toVector(to);
  const angle = Math.acos(Math.min(1, Math.max(-1, dot(start, end))));
  const sinAngle = Math.sin(angle);
  const normal = normalize(cross(start, end));
  const count = Math.max(1, Math.floor(steps));

  return Array.from({ length: count + 1 }, (_, index) => {
    const ratio = index / count;
    const base =
      sinAngle > 1e-9
        ? add(
            scale(start, Math.sin((1 - ratio) * angle) / sinAngle),
            scale(end, Math.sin(ratio * angle) / sinAngle),
          )
        : add(scale(start, 1 - ratio), scale(end, ratio));

    return toLatLng(add(base, scale(normal, BOW_RATIO * angle * Math.sin(Math.PI * ratio))));
  });
}
