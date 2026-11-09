import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateBip44Wallet } from '../src/crypto/bip44.ts';

test('generate 12-word wallet with correct BIP44 hierarchy', () => {
  const wallet = generateBip44Wallet(12);
  const words = wallet.mnemonic.trim().split(/\s+/);
  assert.equal(words.length, 12);
  assert.equal(wallet.seedHex.length, 128); // 64 bytes in hex
  assert.equal(wallet.intermediateNodes.length, 5);

  const [root, purpose, coin, account, change] = wallet.intermediateNodes;
  assert.equal(root.path, 'm');
  assert.equal(purpose.path, "m/44'");
  assert.equal(coin.path, "m/44'/0'");
  assert.equal(account.path, "m/44'/0'/0'");
  assert.equal(change.path, "m/44'/0'/0'/0");

  for (const node of wallet.intermediateNodes) {
    assert.ok(node.privateKeyHex.length === 64, `Node ${node.path} privateKeyHex should be 64 chars`);
    assert.ok(node.chainCodeHex.length === 64, `Node ${node.path} chainCodeHex should be 64 chars`);
    assert.ok(node.wif.startsWith('K') || node.wif.startsWith('L'), `Node ${node.path} WIF should be mainnet`);
    assert.ok(node.xprv.startsWith('xprv'), `Node ${node.path} xprv should start with xprv`);
    assert.ok(node.xpub.startsWith('xpub'), `Node ${node.path} xpub should start with xpub`);
  }

  // Address derivation (first 10: 0 to 9)
  const addrs0to9 = wallet.getAddresses(0, 10);
  assert.equal(addrs0to9.length, 10);
  assert.equal(addrs0to9[0].index, 0);
  assert.equal(addrs0to9[0].path, "m/44'/0'/0'/0/0");
  assert.ok(addrs0to9[0].address.startsWith('1'), 'P2PKH address should start with 1');
  assert.equal(addrs0to9[9].index, 9);
  assert.equal(addrs0to9[9].path, "m/44'/0'/0'/0/9");

  // Refresh (next 10: 10 to 19)
  const addrs10to19 = wallet.getAddresses(10, 10);
  assert.equal(addrs10to19.length, 10);
  assert.equal(addrs10to19[0].index, 10);
  assert.equal(addrs10to19[0].path, "m/44'/0'/0'/0/10");
  assert.notEqual(addrs0to9[0].address, addrs10to19[0].address);

  // Wipe test
  wallet.wipe();
  assert.equal(wallet.rootNode.privateKey, null);
  assert.throws(() => wallet.rootNode.privateExtendedKey, /No private key/);
});

test('generate 24-word wallet with correct BIP44 hierarchy', () => {
  const wallet = generateBip44Wallet(24);
  const words = wallet.mnemonic.trim().split(/\s+/);
  assert.equal(words.length, 24);
  assert.equal(wallet.seedHex.length, 128);
  const addrs = wallet.getAddresses(0, 10);
  assert.equal(addrs.length, 10);
  wallet.wipe();
});
