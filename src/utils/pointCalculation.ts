// Helper functions for calculating y values from x on elliptic curve
import { CurveParams, mod } from "./ellipticCurve";

// Modular exponentiation for square root calculation
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

// Calculate y values for a given x on the elliptic curve
export function calculateYFromX(x: number, curve: CurveParams): number[] {
  const { a, b, p, useFp } = curve;

  if (useFp) {
    // Finite field: y² = x³ + ax + b (mod p)
    const ySquared = mod(x * x * x + a * x + b, p);
    return modSqrt(ySquared, p);
  } else {
    // Real numbers: y² = x³ + ax + b
    const ySquared = x * x * x + a * x + b;
    if (ySquared < 0) return []; // No real solution
    if (ySquared === 0) return [0];
    const y = Math.sqrt(ySquared);
    return [Number(y.toFixed(4)), Number((-y).toFixed(4))];
  }
}
