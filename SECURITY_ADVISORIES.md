# BitcoinJS security update — 2026-10-27

The locked dependencies previously contained seven applicable advisories from
the BitcoinJS disclosure. The current UI does not invoke these APIs, but the
dependencies must be patched before wallet features use them.

| Advisory | Affected locked version | Patched version | Regression coverage |
|---|---|---|---|
| [GHSA-39w3-8jr6-f676](https://github.com/bitcoinjs/bip39/security/advisories/GHSA-39w3-8jr6-f676) | bip39 3.1.0 | 3.1.2 | Inherited wordlist names are rejected |
| [GHSA-726r-qj3q-vrxm](https://github.com/bitcoinjs/bip39/security/advisories/GHSA-726r-qj3q-vrxm) | bip39 3.1.0 | 3.1.2 | Malformed entropy is rejected; valid BIP39 vector preserved |
| [GHSA-h52v-8xwg-7j95](https://github.com/bitcoinjs/bitcoinjs-lib/security/advisories/GHSA-h52v-8xwg-7j95) | bitcoinjs-lib 7.0.2 | 7.0.5 | Every finalized PSBT input needs its UTXO amount |
| [GHSA-4mfv-5394-26c7](https://github.com/bitcoinjs/bitcoinjs-lib/security/advisories/GHSA-4mfv-5394-26c7) | bitcoinjs-lib 7.0.2 | 7.0.5 | Conflicting prevout records are rejected |
| [GHSA-4vm8-79jj-j6w4](https://github.com/bitcoinjs/bitcoinjs-lib/security/advisories/GHSA-4vm8-79jj-j6w4) | bitcoinjs-lib 7.0.2 | 7.0.5 | Invalid compact proof-of-work targets are rejected |
| [GHSA-88jr-9qj4-ccm4](https://github.com/bitcoinjs/bitcoinjs-lib/security/advisories/GHSA-88jr-9qj4-ccm4) | bitcoinjs-lib 7.0.2 | 7.0.5 | Transaction parsing stays within a bounded copy budget |
| [GHSA-8247-5gp7-95qh](https://github.com/bitcoinjs/bitcoinjs-lib/security/advisories/GHSA-8247-5gp7-95qh) | bitcoinjs-lib 7.0.2 | 7.0.5 | Block parsing stays within a bounded copy budget |

All seven tests fail with the previous library versions and pass with the
patched lockfile. The parsing fixtures are small and unsigned. No wallet,
network connection, real key, or funds are needed. Copy budgets avoid unreliable
wall-clock timing assertions.

The bitcoinjs-lib parsing tree resolves `uint8array-tools` 0.0.10,
`varuint-bitcoin` 2.0.1 and `bip174` 3.0.1, including nested copies. BIP32 uses a
separate older helper copy; its extended-key decoder checks the 78-byte length
before integer reads, so that path does not expose the unbounded transaction
parsing issue described by GHSA-88jr-9qj4-ccm4.

The Merkle duplication issue GHSA-8vv3-6qpc-gpw6 was already fixed in
bitcoinjs-lib 7.0.2. This project does not install tiny-secp256k1, its asm.js
backend, bip38, bip32-utils, merkle-lib or bolt11; the separate advisories for
those packages do not apply to this dependency tree.

Validation:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run lint
npm run build
```

The build fix removes unused starter state and types the existing browser
polyfill setup without changing its runtime purpose. Vite is also updated from
8.3.0 to 8.3.5 for its separately published advisories. No major dependency
migration is included.
