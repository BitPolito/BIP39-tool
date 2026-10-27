import assert from 'node:assert/strict'
import { test } from 'node:test'
import bip39 from 'bip39'
import { Block, Psbt, Transaction } from 'bitcoinjs-lib'
import { Buffer } from 'node:buffer'

test('reject inherited names instead of selecting a zero-entropy wordlist', () => {
  try {
    for (const name of ['__proto__', 'constructor', 'toString']) {
      assert.throws(() => bip39.setDefaultWordlist(name))
    }
  } finally {
    bip39.setDefaultWordlist('english')
  }
})

test('reject malformed entropy rather than silently truncating it', () => {
  const entropy = '00'.repeat(16)
  for (const suffix of ['f', 'zz']) {
    assert.throws(() => bip39.entropyToMnemonic(entropy + suffix))
  }
  // Published BIP39 zero-entropy vector; never use this seed for funds.
  assert.equal(bip39.entropyToMnemonic(entropy), 'abandon '.repeat(11) + 'about')
})

test('require a UTXO amount for every finalized PSBT input', () => {
  const psbt = new Psbt()
    .addInput({ hash: new Uint8Array(32).fill(1), index: 0,
      witnessUtxo: { script: Uint8Array.of(0x51), value: 10_000n },
      finalScriptSig: Uint8Array.of(0x51) })
    .addInput({ hash: new Uint8Array(32).fill(2), index: 0,
      finalScriptSig: Uint8Array.of(0x51) })
    .addOutput({ script: Uint8Array.of(0x51), value: 9_000n })
  for (const calculate of [() => psbt.getFee(), () => psbt.getFeeRate(), () => psbt.extractTransaction()]) {
    assert.throws(calculate)
  }
})

test('reject conflicting witness and non-witness prevout amounts', () => {
  const previous = new Transaction()
  previous.addInput(new Uint8Array(32).fill(3), 0)
  previous.addOutput(Uint8Array.of(0x51), 100_000n)
  assert.throws(() => new Psbt()
    .addInput({ hash: previous.getId(), index: 0,
      nonWitnessUtxo: previous.toBuffer(),
      witnessUtxo: { script: Uint8Array.of(0x51), value: 10_000n },
      finalScriptSig: Uint8Array.of(0x51) })
    .addOutput({ script: Uint8Array.of(0x51), value: 9_000n })
    .getFee())
})

test('reject negative, zero and overflowing compact proof-of-work targets', () => {
  for (const bits of [0x20800001, 0x22000100, 0x23000001, 0x01000001]) {
    const block = new Block()
    block.prevHash = new Uint8Array(32)
    block.merkleRoot = new Uint8Array(32)
    block.bits = bits
    block.getHash = () => new Uint8Array(32)
    assert.equal(block.checkProofOfWork(), false)
  }
})

// Count copied bytes instead of asserting wall-clock timings. Fixtures are small
// and unsigned; no network, real keys or large denial-of-service payloads are used.
function measureCopies(parse) {
  const from = Buffer.from
  const slice = Uint8Array.prototype.slice
  let copied = 0
  try {
    Buffer.from = function (value, ...args) {
      if (ArrayBuffer.isView(value)) copied += value.byteLength
      return Reflect.apply(from, this, [value, ...args])
    }
    Uint8Array.prototype.slice = function (...args) {
      const result = Reflect.apply(slice, this, args)
      copied += result.byteLength
      return result
    }
    return { parsed: parse(), copiedBytes: () => copied }
  } finally {
    Buffer.from = from
    Uint8Array.prototype.slice = slice
  }
}

test('transaction decoding stays within a linear copy budget (GHSA-88jr-9qj4-ccm4)', () => {
  const transaction = new Transaction()
  transaction.addInput(new Uint8Array(32).fill(1), 0)
  for (let i = 0; i < 256; i++) transaction.addOutput(Uint8Array.of(0x51), 1n)
  const encoded = transaction.toBuffer()
  const { parsed, copiedBytes } = measureCopies(() => Transaction.fromBuffer(encoded))
  assert.equal(parsed.outs.length, 256)
  assert.equal(parsed.toHex(), transaction.toHex())
  assert.ok(copiedBytes() <= 16 * encoded.length, 'transaction parsing copies excessive input data')
})

test('block decoding stays within a linear copy budget (GHSA-8247-5gp7-95qh)', () => {
  const transaction = new Transaction()
  transaction.addInput(new Uint8Array(32).fill(1), 0)
  transaction.addOutput(Uint8Array.of(0x51), 1n)
  const block = new Block()
  block.prevHash = new Uint8Array(32)
  block.merkleRoot = new Uint8Array(32)
  block.transactions = Array.from({ length: 128 }, () => transaction)
  const encoded = block.toBuffer()
  const { parsed, copiedBytes } = measureCopies(() => Block.fromBuffer(encoded))
  assert.equal(parsed.transactions.length, 128)
  assert.equal(parsed.toHex(), block.toHex())
  assert.ok(copiedBytes() <= 16 * encoded.length, 'block parsing copies excessive input data')
})
