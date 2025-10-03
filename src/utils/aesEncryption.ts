// AES encryption/decryption utilities using Web Crypto API

// Convert string to ArrayBuffer
function str2ab(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// Convert ArrayBuffer to string
function ab2str(buf: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buf);
}

// Convert ArrayBuffer to hex string
function ab2hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert hex string to ArrayBuffer
function hex2ab(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

// Derive AES key from shared secret coordinates
export async function deriveAESKey(x: number, y: number): Promise<CryptoKey> {
  // Combine x and y coordinates to create key material
  const keyMaterial = `${x}-${y}`;
  const keyData = str2ab(keyMaterial);

  // Import as raw key material
  const baseKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive AES-GCM key
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: str2ab('elliptic-curve-crypto'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return aesKey;
}

// Encrypt message using AES-GCM
export async function encryptMessage(
  message: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    str2ab(message)
  );

  return {
    ciphertext: ab2hex(encrypted),
    iv: ab2hex(iv.buffer)
  };
}

// Decrypt message using AES-GCM
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: hex2ab(iv)
    },
    key,
    hex2ab(ciphertext)
  );

  return ab2str(decrypted);
}
