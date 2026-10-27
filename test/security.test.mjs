import assert from 'node:assert/strict'
import { test } from 'node:test'
import bip39 from 'bip39'
import { Block, Psbt, Transaction } from 'bitcoinjs-lib'

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
