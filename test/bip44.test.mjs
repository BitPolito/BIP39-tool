import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  deriveHdWalletFromMnemonic,
  generateBip44Wallet,
  generateHdWallet,
  translateHdWallet,
  validateUserMnemonic,
  WORDLISTS,
} from '../src/components/bip39/utils/derivationLogic.ts';

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

test('generate HD wallet supporting BIP44, BIP84 Native SegWit, and BIP86 Taproot', () => {
  const wallet = generateHdWallet(12);

  const bip44Nodes = wallet.getIntermediateNodes('bip44');
  assert.equal(bip44Nodes[1].path, "m/44'");
  assert.equal(bip44Nodes[4].path, "m/44'/0'/0'/0");
  const bip44Addrs = wallet.getAddresses('bip44', 0, 5);
  assert.equal(bip44Addrs[0].path, "m/44'/0'/0'/0/0");
  assert.ok(bip44Addrs[0].address.startsWith('1'), 'BIP44 P2PKH address should start with 1');

  const bip84Nodes = wallet.getIntermediateNodes('bip84');
  assert.equal(bip84Nodes.length, 5);
  assert.equal(bip84Nodes[0].path, 'm');
  assert.equal(bip84Nodes[1].path, "m/84'");
  assert.equal(bip84Nodes[2].path, "m/84'/0'");
  assert.equal(bip84Nodes[3].path, "m/84'/0'/0'");
  assert.equal(bip84Nodes[4].path, "m/84'/0'/0'/0");

  const bip86Nodes = wallet.getIntermediateNodes('bip86');
  assert.equal(bip86Nodes.length, 5);
  assert.equal(bip86Nodes[0].path, 'm');
  assert.equal(bip86Nodes[1].path, "m/86'");
  assert.equal(bip86Nodes[2].path, "m/86'/0'");
  assert.equal(bip86Nodes[3].path, "m/86'/0'/0'");
  assert.equal(bip86Nodes[4].path, "m/86'/0'/0'/0");

  for (const node of bip44Nodes) {
    assert.ok(node.xprv.startsWith('xprv'), `BIP44 node ${node.path} xprv should start with xprv`);
    assert.ok(node.xpub.startsWith('xpub'), `BIP44 node ${node.path} xpub should start with xpub`);
  }
  for (const node of bip84Nodes) {
    assert.ok(node.xprv.startsWith('zprv'), `BIP84 node ${node.path} xprv should start with zprv`);
    assert.ok(node.xpub.startsWith('zpub'), `BIP84 node ${node.path} xpub should start with zpub`);
  }
  for (const node of bip86Nodes) {
    assert.ok(node.xprv.startsWith('xprv'), `BIP86 node ${node.path} xprv should start with xprv`);
    assert.ok(node.xpub.startsWith('xpub'), `BIP86 node ${node.path} xpub should start with xpub`);
  }

  const bip84Addrs = wallet.getAddresses('bip84', 0, 10);
  assert.equal(bip84Addrs.length, 10);
  assert.equal(bip84Addrs[0].path, "m/84'/0'/0'/0/0");
  assert.ok(bip84Addrs[0].address.startsWith('bc1q'), 'BIP84 Native SegWit address should start with bc1q');
  assert.notEqual(bip44Addrs[0].address, bip84Addrs[0].address);

  const bip86Addrs = wallet.getAddresses('bip86', 0, 10);
  assert.equal(bip86Addrs.length, 10);
  assert.equal(bip86Addrs[0].path, "m/86'/0'/0'/0/0");
  assert.ok(bip86Addrs[0].address.startsWith('bc1p'), 'BIP86 Taproot address should start with bc1p');
  assert.notEqual(bip44Addrs[0].address, bip86Addrs[0].address);
  assert.notEqual(bip84Addrs[0].address, bip86Addrs[0].address);

  wallet.wipe();
  assert.equal(wallet.rootNode.privateKey, null);
});

test('translate HD wallet across all 10 BIP39 wordlists preserving word indices and deriving distinct seeds', () => {
  const baseWallet = generateHdWallet(12, 'english');
  const englishWords = baseWallet.mnemonic.trim().split(/\s+/);
  const englishIndices = englishWords.map((w) => WORDLISTS.english.indexOf(w));

  const languages = [
    'japanese',
    'spanish',
    'simplified-chinese',
    'traditional-chinese',
    'french',
    'italian',
    'korean',
    'czech',
    'portuguese',
  ];

  for (const lang of languages) {
    const translated = translateHdWallet(baseWallet.mnemonic, 'english', lang, 12);
    const words = translated.mnemonic.trim().split(/\s+/);
    assert.equal(words.length, 12, `${lang} mnemonic should have 12 words`);
    assert.deepEqual(
      words.map((w) => WORDLISTS[lang].indexOf(w)),
      englishIndices,
      `${lang} word indices should match English word indices`,
    );
    assert.equal(translated.seedHex.length, 128);
    assert.notEqual(translated.seedHex, baseWallet.seedHex);

    const addrs = translated.getAddresses('bip84', 0, 1);
    assert.ok(addrs[0].address.startsWith('bc1q'));

    // Roundtrip back to English should recover the exact same mnemonic and seed
    const roundtrip = translateHdWallet(translated.mnemonic, lang, 'english', 12);
    assert.equal(roundtrip.mnemonic, baseWallet.mnemonic);
    assert.equal(roundtrip.seedHex, baseWallet.seedHex);

    translated.wipe();
    roundtrip.wipe();
  }

  baseWallet.wipe();
});

test('derive paths and addresses interchangeably for BTC, BTC regtest, and Litecoin with custom account and change', () => {
  const wallet = generateHdWallet(12, 'english');

  // BTC regtest (coinType 1', account 2', change 1)
  const regtestParams = { coin: 'btc-regtest', account: 2, change: 1 };
  const regtestBip44Nodes = wallet.getIntermediateNodes('bip44', regtestParams);
  assert.equal(regtestBip44Nodes[0].path, 'm');
  assert.equal(regtestBip44Nodes[1].path, "m/44'");
  assert.equal(regtestBip44Nodes[2].path, "m/44'/1'");
  assert.equal(regtestBip44Nodes[3].path, "m/44'/1'/2'");
  assert.equal(regtestBip44Nodes[4].path, "m/44'/1'/2'/1");
  assert.ok(regtestBip44Nodes[0].xprv.startsWith('tprv'));
  assert.ok(regtestBip44Nodes[0].xpub.startsWith('tpub'));
  assert.ok(
    regtestBip44Nodes[4].wif.startsWith('c'),
    `Regtest WIF should start with c, got ${regtestBip44Nodes[4].wif}`,
  );

  const regtestBip44Addrs = wallet.getAddresses('bip44', 0, 3, regtestParams);
  assert.equal(regtestBip44Addrs[0].path, "m/44'/1'/2'/1/0");
  assert.ok(
    regtestBip44Addrs[0].address.startsWith('m') || regtestBip44Addrs[0].address.startsWith('n'),
    `Regtest P2PKH should start with m or n, got ${regtestBip44Addrs[0].address}`,
  );

  const regtestBip84Nodes = wallet.getIntermediateNodes('bip84', regtestParams);
  assert.ok(regtestBip84Nodes[0].xprv.startsWith('vprv'));
  assert.ok(regtestBip84Nodes[0].xpub.startsWith('vpub'));
  const regtestBip84Addrs = wallet.getAddresses('bip84', 0, 3, regtestParams);
  assert.equal(regtestBip84Addrs[0].path, "m/84'/1'/2'/1/0");
  assert.ok(regtestBip84Addrs[0].address.startsWith('bcrt1q'));

  const regtestBip86Addrs = wallet.getAddresses('bip86', 0, 3, regtestParams);
  assert.equal(regtestBip86Addrs[0].path, "m/86'/1'/2'/1/0");
  assert.ok(regtestBip86Addrs[0].address.startsWith('bcrt1p'));

  // Litecoin (coinType 2', account 1', change 0)
  const ltcParams = { coin: 'ltc', account: 1, change: 0 };
  const ltcBip44Nodes = wallet.getIntermediateNodes('bip44', ltcParams);
  assert.equal(ltcBip44Nodes[2].path, "m/44'/2'");
  assert.equal(ltcBip44Nodes[3].path, "m/44'/2'/1'");
  assert.equal(ltcBip44Nodes[4].path, "m/44'/2'/1'/0");
  assert.ok(
    ltcBip44Nodes[4].wif.startsWith('T') || ltcBip44Nodes[4].wif.startsWith('6'),
    `Litecoin WIF should start with T or 6, got ${ltcBip44Nodes[4].wif}`,
  );

  const ltcBip44Addrs = wallet.getAddresses('bip44', 0, 3, ltcParams);
  assert.equal(ltcBip44Addrs[0].path, "m/44'/2'/1'/0/0");
  assert.ok(ltcBip44Addrs[0].address.startsWith('L'));

  const ltcBip84Addrs = wallet.getAddresses('bip84', 0, 3, ltcParams);
  assert.equal(ltcBip84Addrs[0].path, "m/84'/2'/1'/0/0");
  assert.ok(ltcBip84Addrs[0].address.startsWith('ltc1q'));

  const ltcBip86Addrs = wallet.getAddresses('bip86', 0, 3, ltcParams);
  assert.equal(ltcBip86Addrs[0].path, "m/86'/2'/1'/0/0");
  assert.ok(ltcBip86Addrs[0].address.startsWith('ltc1p'));

  // Incremental depth recalculation: changing change (depth 4) preserves depths 0..3
  const btcAccount0Change0 = wallet.getIntermediateNodes('bip84', {
    coin: 'btc',
    account: 0,
    change: 0,
  });
  const depth4Change1 = wallet.getIntermediateNodeAtDepth('bip84', 4, {
    coin: 'btc',
    account: 0,
    change: 1,
  });
  assert.equal(depth4Change1.path, "m/84'/0'/0'/1");
  assert.notEqual(depth4Change1.privateKeyHex, btcAccount0Change0[4].privateKeyHex);
  assert.equal(
    wallet.getIntermediateNodeAtDepth('bip84', 3, { coin: 'btc', account: 0, change: 1 })
      .privateKeyHex,
    btcAccount0Change0[3].privateKeyHex,
  );

  // Explicit coinType override works independently of coin defaults
  const customCoinTypeNode = wallet.getIntermediateNodeAtDepth('bip44', 2, {
    coin: 'btc',
    coinType: 99,
  });
  assert.equal(customCoinTypeNode.path, "m/44'/99'");

  wallet.wipe();
});

test('validate and derive HD wallet from user-supplied 12-word and 24-word mnemonics', () => {
  // Published BIP39 test vectors (do not use with real funds)
  const mnemonic12 = 'abandon '.repeat(11) + 'about';
  const validation12 = validateUserMnemonic(mnemonic12.split(' '), 'english');
  assert.equal(validation12.valid, true);
  assert.equal(validation12.wordCount, 12);

  const wallet12 = deriveHdWalletFromMnemonic(mnemonic12, 'english');
  assert.equal(wallet12.wordCount, 12);
  assert.equal(wallet12.mnemonic, mnemonic12);
  assert.equal(
    wallet12.seedHex,
    '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4',
  );
  const firstBip44Addr = wallet12.getAddresses('bip44', 0, 1)[0];
  assert.equal(firstBip44Addr.address, '1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabA');
  wallet12.wipe();

  // 24-word BIP39 zero-entropy vector
  const mnemonic24 = 'abandon '.repeat(23) + 'art';
  const validation24 = validateUserMnemonic(mnemonic24, 'english');
  assert.equal(validation24.valid, true);
  assert.equal(validation24.wordCount, 24);
  const wallet24 = deriveHdWalletFromMnemonic(mnemonic24, 'english');
  assert.equal(wallet24.wordCount, 24);
  assert.equal(wallet24.getAddresses('bip84', 0, 1)[0].path, "m/84'/0'/0'/0/0");
  wallet24.wipe();

  // Invalid word detection
  const badWordRes = validateUserMnemonic(
    [...Array(11).fill('abandon'), 'notaword'],
    'english',
  );
  assert.equal(badWordRes.valid, false);
  assert.equal(badWordRes.errorCode, 'invalid_word');
  assert.deepEqual(badWordRes.invalidWordIndices, [11]);

  // Invalid checksum detection
  const badChecksumRes = validateUserMnemonic('abandon '.repeat(12).trim(), 'english');
  assert.equal(badChecksumRes.valid, false);
  assert.equal(badChecksumRes.errorCode, 'checksum');
  assert.throws(() => deriveHdWalletFromMnemonic('abandon '.repeat(12).trim(), 'english'));

  // Incomplete word count detection
  const incompleteRes = validateUserMnemonic(['abandon', 'abandon', ''], 'english');
  assert.equal(incompleteRes.valid, false);
  assert.equal(incompleteRes.errorCode, 'word_count');
});
