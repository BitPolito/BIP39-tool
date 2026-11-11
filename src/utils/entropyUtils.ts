import { sha256 } from '@noble/hashes/sha2.js';
import { hex } from '@scure/base';
import { wordlist } from '@scure/bip39/wordlists/english.js';

export type DiceExtractionMethod = 'sha256' | 'modulo2' | 'rejection';
export type JarType = 'hex' | 'binary' | 'decimal';
export type WordCountTarget = 12 | 24;

export function bytesToBinaryString(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += bytes[i].toString(2).padStart(8, '0');
  }
  return bin;
}

export function hexToBinaryString(hexStr: string): string {
  let bin = '';
  const clean = hexStr.replace(/[^0-9a-fA-F]/g, '');
  for (let i = 0; i < clean.length; i++) {
    bin += parseInt(clean[i], 16).toString(2).padStart(4, '0');
  }
  return bin;
}

export function binaryStringToHex(bits: string): string {
  let hex = '';
  for (let i = 0; i < bits.length; i += 4) {
    const chunk = bits.slice(i, i + 4);
    if (chunk.length === 4) {
      hex += parseInt(chunk, 2).toString(16);
    } else {
      hex += parseInt(chunk.padEnd(4, '0'), 2).toString(16);
    }
  }
  return hex;
}

export function calculateSha256(input: string | Uint8Array): Uint8Array {
  if (typeof input === 'string') {
    const encoder = new TextEncoder();
    return sha256(encoder.encode(input));
  }
  return sha256(input);
}

/**
 * Von Neumann extractor for debiasing independent Bernoulli trials (coins).
 * Consecutive non-overlapping pairs:
 * '01' -> '0'
 * '10' -> '1'
 * '00' & '11' -> discarded
 */
export function vonNeumannExtractor(rawBits: string): {
  extracted: string;
  keptPairs: number;
  discardedPairs: number;
  efficiency: number;
} {
  let extracted = '';
  let keptPairs = 0;
  let discardedPairs = 0;

  for (let i = 0; i + 1 < rawBits.length; i += 2) {
    const b1 = rawBits[i];
    const b2 = rawBits[i + 1];
    if (b1 === '0' && b2 === '1') {
      extracted += '0';
      keptPairs++;
    } else if (b1 === '1' && b2 === '0') {
      extracted += '1';
      keptPairs++;
    } else {
      discardedPairs++;
    }
  }

  const totalPairs = keptPairs + discardedPairs;
  const efficiency = totalPairs > 0 ? (keptPairs / totalPairs) * 100 : 0;

  return {
    extracted,
    keptPairs,
    discardedPairs,
    efficiency,
  };
}

/**
 * Dice entropy extraction methods:
 * 1. sha256: Hash all rolls with SHA-256 and convert to bits
 * 2. modulo2: odd -> '0', even -> '1'
 * 3. rejection: 1->'00', 2->'01', 3->'10', 4->'11', 5&6 discarded
 */
export function extractEntropyFromDice(
  rawRolls: string,
  method: DiceExtractionMethod,
  targetBits: number
): {
  bits: string;
  rollCount: number;
  estimatedRawEntropy: number;
  discardedRolls: number;
  sha256Hex?: string;
} {
  const rolls = rawRolls.replace(/[^1-6]/g, '');
  const rollCount = rolls.length;
  const estimatedRawEntropy = rollCount * Math.log2(6);

  if (method === 'sha256') {
    if (rollCount === 0) {
      return {
        bits: '',
        rollCount: 0,
        estimatedRawEntropy: 0,
        discardedRolls: 0,
      };
    }
    const hash = calculateSha256(rolls);
    const sha256Hex = hex.encode(hash);
    const bits = bytesToBinaryString(hash).slice(0, targetBits);
    return {
      bits,
      rollCount,
      estimatedRawEntropy,
      discardedRolls: 0,
      sha256Hex,
    };
  }

  if (method === 'modulo2') {
    let bits = '';
    for (const r of rolls) {
      const n = parseInt(r, 10);
      bits += n % 2 === 1 ? '0' : '1';
    }
    return {
      bits: bits.slice(0, targetBits),
      rollCount,
      estimatedRawEntropy,
      discardedRolls: 0,
    };
  }

  // rejection sampling
  let bits = '';
  let discardedRolls = 0;
  for (const r of rolls) {
    if (r === '1') bits += '00';
    else if (r === '2') bits += '01';
    else if (r === '3') bits += '10';
    else if (r === '4') bits += '11';
    else discardedRolls++;
  }
  return {
    bits: bits.slice(0, targetBits),
    rollCount,
    estimatedRawEntropy,
    discardedRolls,
  };
}

/**
 * Jar entropy extraction:
 * - hex: 4 bits per draw (0-F)
 * - binary: 1 bit per draw (0 or 1)
 * - decimal: 0-9 digits hashed with SHA-256
 */
export function extractEntropyFromJar(
  tokens: string[],
  jarType: JarType,
  targetBits: number
): {
  bits: string;
  tokenCount: number;
  estimatedEntropy: number;
} {
  const tokenCount = tokens.length;
  if (jarType === 'hex') {
    let bits = '';
    for (const t of tokens) {
      const clean = t.toUpperCase().replace(/[^0-9A-F]/g, '');
      if (clean) {
        bits += parseInt(clean, 16).toString(2).padStart(4, '0');
      }
    }
    return {
      bits: bits.slice(0, targetBits),
      tokenCount,
      estimatedEntropy: tokenCount * 4,
    };
  }

  if (jarType === 'binary') {
    let bits = '';
    for (const t of tokens) {
      if (t === '0' || t === '1') bits += t;
    }
    return {
      bits: bits.slice(0, targetBits),
      tokenCount,
      estimatedEntropy: tokenCount,
    };
  }

  // decimal
  const str = tokens.join('');
  const estimatedEntropy = tokenCount * Math.log2(10);
  if (tokenCount === 0) {
    return { bits: '', tokenCount: 0, estimatedEntropy: 0 };
  }
  const hash = calculateSha256(str);
  const bits = bytesToBinaryString(hash).slice(0, targetBits);
  return {
    bits,
    tokenCount,
    estimatedEntropy,
  };
}

/**
 * Extract entropy from image data
 */
export function extractEntropyFromImageData(
  data: Uint8ClampedArray,
  _width: number,
  _height: number,
  targetBits: number
): {
  hashHex: string;
  bits: string;
  isLowEntropy: boolean;
} {
  const hash = sha256(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
  const hashHex = hex.encode(hash);
  const bits = bytesToBinaryString(hash).slice(0, targetBits);

  // Check variance in image to detect completely uniform/blank image
  let sum = 0;
  const sampleStep = Math.max(1, Math.floor(data.length / 4000));
  let count = 0;
  for (let i = 0; i < data.length; i += sampleStep * 4) {
    sum += data[i] + data[i + 1] + data[i + 2];
    count += 3;
  }
  const mean = count > 0 ? sum / count : 0;
  let variance = 0;
  for (let i = 0; i < data.length; i += sampleStep * 4) {
    variance += Math.pow(data[i] - mean, 2);
    variance += Math.pow(data[i + 1] - mean, 2);
    variance += Math.pow(data[i + 2] - mean, 2);
  }
  variance = count > 0 ? variance / count : 0;
  const isLowEntropy = variance < 5;

  return {
    hashHex,
    bits,
    isLowEntropy,
  };
}

export interface Bip39WordInfo {
  index: number;
  binary: string;
  word: string;
  entropyBits: string;
  checksumBits: string;
  isChecksumWord: boolean;
}

export interface Bip39EntropyResult {
  entropyBitsUsed: string;
  checksumBits: string;
  combinedBits: string;
  fullBits: string;
  chunks11: string[];
  words: Bip39WordInfo[];
  mnemonic: string;
}

/**
 * Convert raw entropy bits to BIP-39 mnemonic
 */
export function computeBip39FromEntropyBits(
  bits: string,
  targetWords: WordCountTarget
): Bip39EntropyResult | null {
  const reqEntropyBits = targetWords === 12 ? 128 : 256;
  const reqChecksumBits = reqEntropyBits / 32; // 4 for 12 words, 8 for 24 words

  if (bits.length < reqEntropyBits) {
    return null;
  }

  const entropyBitsUsed = bits.slice(0, reqEntropyBits);

  // Convert entropy bits to Uint8Array bytes
  const bytes = new Uint8Array(reqEntropyBits / 8);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(entropyBitsUsed.slice(i * 8, (i + 1) * 8), 2);
  }

  // SHA-256 of entropy bytes for checksum
  const hash = sha256(bytes);
  const hashBits = bytesToBinaryString(hash);
  const checksumBits = hashBits.slice(0, reqChecksumBits);

  const combinedBits = entropyBitsUsed + checksumBits;
  const chunks11: string[] = [];
  const words: Bip39WordInfo[] = [];

  for (let i = 0; i < combinedBits.length; i += 11) {
    const chunk = combinedBits.slice(i, i + 11);
    chunks11.push(chunk);
    const wordIndex = parseInt(chunk, 2);

    const chunkStart = i;
    const chunkEnd = i + 11;

    let chunkEnt = '';
    let chunkCs = '';
    let isChecksumWord = false;

    if (chunkEnd <= reqEntropyBits) {
      chunkEnt = chunk;
    } else if (chunkStart < reqEntropyBits) {
      const entLen = reqEntropyBits - chunkStart;
      chunkEnt = chunk.slice(0, entLen);
      chunkCs = chunk.slice(entLen);
      isChecksumWord = true;
    } else {
      chunkCs = chunk;
      isChecksumWord = true;
    }

    words.push({
      index: wordIndex,
      binary: chunk,
      word: wordlist[wordIndex],
      entropyBits: chunkEnt,
      checksumBits: chunkCs,
      isChecksumWord,
    });
  }

  const mnemonic = words.map((w) => w.word).join(' ');

  return {
    entropyBitsUsed,
    checksumBits,
    combinedBits,
    fullBits: combinedBits,
    chunks11,
    words,
    mnemonic,
  };
}
