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
  p: number; // prime modulus (ignored if useFp=false)
  G: Point; // base point
  n: number; // order of base point
  useFp: boolean; // whether to use finite field Fp or real numbers R
}

// Default curve parameters (simplified for visualization)
export const defaultCurve: CurveParams = {
  a: -7,
  b: 10,
  p: 223, // prime
  G: { x: 47, y: 71, isInfinity: false }, // base point
  n: 227, // order
  useFp: true, // use finite field by default
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

  const { a, b, p, useFp } = curve;
  
  if (useFp) {
    const left = mod(point.y * point.y, p);
    const right = mod(point.x * point.x * point.x + a * point.x + b, p);
    return left === right;
  } else {
    // Real numbers: y² = x³ + ax + b
    const left = point.y * point.y;
    const right = point.x * point.x * point.x + a * point.x + b;
    return Math.abs(left - right) < 0.0001; // floating point tolerance
  }
}

// Point addition on elliptic curve
export function addPoints(P: Point, Q: Point, curve: CurveParams): Point {
  if (P.isInfinity) return Q;
  if (Q.isInfinity) return P;

  const { a, p, useFp } = curve;

  // Check if P and Q are additive inverses
  if (P.x === Q.x && P.y !== Q.y) {
    return POINT_AT_INFINITY;
  }

  let slope: number;

  if (useFp) {
    // Finite field arithmetic
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
  } else {
    // Real number arithmetic
    if (P.x === Q.x && P.y === Q.y) {
      // Point doubling
      if (P.y === 0) {
        return POINT_AT_INFINITY;
      }
      slope = (3 * P.x! * P.x! + a) / (2 * P.y!);
    } else {
      // Point addition
      if (Q.x === P.x) {
        return POINT_AT_INFINITY;
      }
      slope = (Q.y! - P.y!) / (Q.x! - P.x!);
    }

    const x3 = slope * slope - P.x! - Q.x!;
    const y3 = slope * (P.x! - x3) - P.y!;

    return { x: x3, y: y3, isInfinity: false };
  }
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
  const { a, b, p, useFp } = curve;

  if (!useFp) {
    // For real numbers, generate points in range [-10, 10]
    const xMin = -10;
    const xMax = 10;
    const step = 0.1;
    
    for (let x = xMin; x <= xMax; x += step) {
      const ySquared = x * x * x + a * x + b;
      if (ySquared >= 0) {
        const y = Math.sqrt(ySquared);
        points.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), isInfinity: false });
        if (y !== 0) {
          points.push({ x: Number(x.toFixed(2)), y: Number((-y).toFixed(2)), isInfinity: false });
        }
      }
    }
    return points;
  }

  // Finite field: Limit p to prevent browser freeze
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

// Simple hash function for ECDSA (simplified for educational purposes)
export function simpleHash(message: string): number {
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = ((hash << 5) - hash + message.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ECDSA Signature
export interface Signature {
  r: number;
  s: number;
}

// Sign a message using ECDSA
export function signMessage(
  message: string,
  privateKey: number,
  curve: CurveParams
): Signature {
  // Ensure n matches the actual order of G (nG must be Infinity)
  const n = (() => {
    const candidate = curve.n;
    const isValid = scalarMultiply(candidate, curve.G, curve).isInfinity;
    if (isValid) return candidate;
    // Compute the real order of G by repeated addition (small p so it's fast)
    let Q: Point = curve.G;
    let order = 1;
    const limit = curve.p + 2 * Math.ceil(Math.sqrt(curve.p)) + 10;
    while (!Q.isInfinity && order <= limit) {
      Q = addPoints(Q, curve.G, curve);
      order++;
    }
    return order;
  })();

  const z = simpleHash(message) % n; // hash of message reduced mod n

  // Generate random k (in practice, this should be cryptographically secure)
  let k = generatePrivateKey(n);

  // Calculate r = (k * G).x mod n
  const kG = scalarMultiply(k, curve.G, curve);
  if (kG.isInfinity || kG.x === null) {
    // Retry with different k if we hit infinity
    k = generatePrivateKey(n);
    return signMessage(message, privateKey, { ...curve, n });
  }

  const r = mod(kG.x, n);
  if (r === 0) {
    // Retry if r is 0
    return signMessage(message, privateKey, { ...curve, n });
  }

  // Calculate s = k^-1 * (z + r * privateKey) mod n
  const kInv = modInverse(k, n);
  const s = mod(kInv * (z + r * privateKey), n);

  if (s === 0) {
    // Retry if s is 0
    return signMessage(message, privateKey, { ...curve, n });
  }

  return { r, s };
}

// Verify an ECDSA signature
export function verifySignature(
  message: string,
  signature: Signature,
  publicKey: Point,
  curve: CurveParams
): boolean {
  const { r, s } = signature;

  // Ensure we use the actual order of G
  const n = (() => {
    const candidate = curve.n;
    const isValid = scalarMultiply(candidate, curve.G, curve).isInfinity;
    if (isValid) return candidate;
    let Q: Point = curve.G;
    let order = 1;
    const limit = curve.p + 2 * Math.ceil(Math.sqrt(curve.p)) + 10;
    while (!Q.isInfinity && order <= limit) {
      Q = addPoints(Q, curve.G, curve);
      order++;
    }
    return order;
  })();

  // Check that r and s are in valid range
  if (r <= 0 || r >= n || s <= 0 || s >= n) {
    return false;
  }

  const z = simpleHash(message) % n;

  // Calculate w = s^-1 mod n
  const w = modInverse(s, n);

  // Calculate u1 = z * w mod n
  const u1 = mod(z * w, n);

  // Calculate u2 = r * w mod n
  const u2 = mod(r * w, n);

  // Calculate point (x, y) = u1 * G + u2 * publicKey
  const u1G = scalarMultiply(u1, curve.G, curve);
  const u2Q = scalarMultiply(u2, publicKey, curve);
  const point = addPoints(u1G, u2Q, curve);

  if (point.isInfinity || point.x === null) {
    return false;
  }

  // Verify that r ≡ x (mod n)
  return mod(point.x, n) === r;
}
