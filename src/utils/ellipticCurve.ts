// Elliptic Curve utilities for cryptography
// Using curve equation: y² = x³ + ax + b (mod p)

export interface Point {
  x: number | null;
  y: number | null;
  isInfinity: boolean;
}

export interface CurveParams {
  a: number;
  b: number;
  p: number; // prime modulus
  G: Point; // base point
  n: number; // order of base point
}

// Default curve parameters (simplified for visualization)
export const defaultCurve: CurveParams = {
  a: -7,
  b: 10,
  p: 223, // prime
  G: { x: 47, y: 71, isInfinity: false }, // base point
  n: 227, // order
};

export const POINT_AT_INFINITY: Point = {
  x: null,
  y: null,
  isInfinity: true,
};

// Modular arithmetic helpers
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function modInverse(a: number, m: number): number {
  let [old_r, r] = [a, m];
  let [old_s, s] = [1, 0];

  while (r !== 0) {
    const quotient = Math.floor(old_r / r);
    [old_r, r] = [r, old_r - quotient * r];
    [old_s, s] = [s, old_s - quotient * s];
  }

  return mod(old_s, m);
}

// Modular exponentiation: (base^exp) % mod
function modPow(base: number, exp: number, mod: number): number {
  let result = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2 === 1) {
      result = (result * base) % mod;
    }
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
}

// Tonelli-Shanks algorithm for modular square root
function modSqrt(n: number, p: number): number[] {
  n = mod(n, p);
  
  // Special case: p = 2
  if (p === 2) return [n];
  
  // Check if n is a quadratic residue
  if (modPow(n, (p - 1) / 2, p) !== 1) return [];
  
  // Special case: p ≡ 3 (mod 4)
  if (p % 4 === 3) {
    const r = modPow(n, (p + 1) / 4, p);
    return [r, p - r];
  }
  
  // General case: Tonelli-Shanks
  let s = p - 1;
  let e = 0;
  while (s % 2 === 0) {
    s /= 2;
    e++;
  }
  
  // Find a non-residue
  let q = 2;
  while (modPow(q, (p - 1) / 2, p) === 1) {
    q++;
  }
  
  let x = modPow(n, (s + 1) / 2, p);
  let b = modPow(n, s, p);
  let g = modPow(q, s, p);
  let r = e;
  
  while (true) {
    let t = b;
    let m = 0;
    for (m = 0; m < r; m++) {
      if (t === 1) break;
      t = modPow(t, 2, p);
    }
    
    if (m === 0) {
      return [x, p - x];
    }
    
    const gs = modPow(g, 1 << (r - m - 1), p);
    g = (gs * gs) % p;
    x = (x * gs) % p;
    b = (b * g) % p;
    r = m;
  }
}

// Check if point is on curve
export function isOnCurve(point: Point, curve: CurveParams): boolean {
  if (point.isInfinity) return true;
  if (point.x === null || point.y === null) return false;

  const { a, b, p } = curve;
  const left = mod(point.y * point.y, p);
  const right = mod(point.x * point.x * point.x + a * point.x + b, p);

  return left === right;
}

// Point addition on elliptic curve
export function addPoints(P: Point, Q: Point, curve: CurveParams): Point {
  if (P.isInfinity) return Q;
  if (Q.isInfinity) return P;

  const { a, p } = curve;

  // Check if P and Q are additive inverses
  if (P.x === Q.x && P.y !== Q.y) {
    return POINT_AT_INFINITY;
  }

  let slope: number;

  if (P.x === Q.x && P.y === Q.y) {
    // Point doubling
    if (P.y === 0) {
      return POINT_AT_INFINITY;
    }
    const numerator = mod(3 * P.x! * P.x! + a, p);
    const denominator = mod(2 * P.y!, p);
    slope = mod(numerator * modInverse(denominator, p), p);
  } else {
    // Point addition
    const numerator = mod(Q.y! - P.y!, p);
    const denominator = mod(Q.x! - P.x!, p);
    slope = mod(numerator * modInverse(denominator, p), p);
  }

  const x3 = mod(slope * slope - P.x! - Q.x!, p);
  const y3 = mod(slope * (P.x! - x3) - P.y!, p);

  return { x: x3, y: y3, isInfinity: false };
}

// Scalar multiplication (k * P)
export function scalarMultiply(k: number, P: Point, curve: CurveParams): Point {
  if (k === 0 || P.isInfinity) {
    return POINT_AT_INFINITY;
  }

  let result = POINT_AT_INFINITY;
  let addend = P;

  while (k > 0) {
    if (k & 1) {
      result = addPoints(result, addend, curve);
    }
    addend = addPoints(addend, addend, curve);
    k >>= 1;
  }

  return result;
}

// Get all points on the curve (optimized with Tonelli-Shanks)
export function getAllPoints(curve: CurveParams): Point[] {
  const points: Point[] = [POINT_AT_INFINITY];
  const { a, b, p } = curve;

  // Limit p to prevent browser freeze
  if (p > 1000) {
    console.warn(`Prime p=${p} is too large. Limiting point generation to sample points.`);
    // For large p, only generate sample points
    const sampleSize = Math.min(100, p);
    const step = Math.floor(p / sampleSize);
    for (let i = 0; i < p; i += step) {
      const ySquared = mod(i * i * i + a * i + b, p);
      const yValues = modSqrt(ySquared, p);
      yValues.forEach(y => {
        points.push({ x: i, y, isInfinity: false });
      });
    }
    return points;
  }

  // For reasonable p values, use efficient algorithm
  for (let x = 0; x < p; x++) {
    const ySquared = mod(x * x * x + a * x + b, p);
    const yValues = modSqrt(ySquared, p);
    
    yValues.forEach(y => {
      points.push({ x, y, isInfinity: false });
    });
  }

  return points;
}

// Convert point to string
export function pointToString(point: Point): string {
  if (point.isInfinity) {
    return "O (Point at Infinity)";
  }
  return `(${point.x}, ${point.y})`;
}

// Generate random private key
export function generatePrivateKey(n: number): number {
  return Math.floor(Math.random() * (n - 1)) + 1;
}

// Compute public key from private key
export function computePublicKey(privateKey: number, curve: CurveParams): Point {
  return scalarMultiply(privateKey, curve.G, curve);
}

// Derive shared secret using ECDH
export function deriveSharedSecret(
  privateKey: number,
  publicKey: Point,
  curve: CurveParams
): Point {
  return scalarMultiply(privateKey, publicKey, curve);
}
