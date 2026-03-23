# ADR 0004: Blockchain-Based Document Notarization for External Verifiability

## Status
Proposed -> Under Evaluation

## Date
2026-02-17

## Context and Problem Statement
In legal technology and federal environments, internal database integrity is often insufficient to prove "non-repudiation". While Pactura implements server-side audit logging and organization-level isolation, an internal administrator or attacker with database access could theoretically alter historical records. 

We need a mechanism to provide "Proof of Existence" and "Proof of Integrity" that is externally verifiable by third parties without exposing the sensitive contents of the contracts.

## Decision
We will implement an "Anchor-to-Chain" notarization strategy. 

1. **Cryptographic Hashing**: For every finalized document, the system will generate a deterministic SHA-256 hash of the document content.
2. **Public Ledger Anchoring**: This hash will be transmitted to an EVM-compatible blockchain (e.g., Polygon or Base) via a zero-value transaction.
3. **Immutable Receipt**: The resulting Transaction ID (TxID) will be stored in the `Document` metadata as a "Notary Receipt".
4. **External Verification**: Users can verify the integrity of a document by re-hashing the file and comparing it to the hash anchored on the public ledger via a block explorer.

## Implementation Roadmap
- Phase 1 (Current): Internal Firestore audit trail with 
  serverTimestamp — satisfies basic AU-10 requirements
- Phase 2 (Planned): Blockchain anchoring layer added 
  post-pilot as external verifiability upgrade

## Technical Implementation Details
- **Provider**: Alchemy/Infura via Ethers.js
- **Chain Candidates**: Arbitrum One, Polygon, or Base — 
  final selection pending cost/latency benchmarking
- **Storage**: The `blockchainTxId` and `contentHash` 
  will be added to the document record in Firestore 
  (replacing Prisma reference — stack uses Firebase)
- **Security**: Private keys for the notary wallet must 
  be stored in GCP Secret Manager, not in application 
  environment variables.

## Consequences
### Positive
- **Non-Repudiation**: Satisfies NIST 800-53 AU-10 and SI-7 controls.
- **Trust Architecture**: Provides a "Trust but Verify" model for external auditors.
- **Market Differentiation**: Positions Pactura as a leader in "Digital Trust" within the Legal Tech space.

### Negative
- **Latency**: Anchoring is an asynchronous process subject to block confirmation times.
- **Cost**: Requires a small amount of native gas tokens (e.g., MATIC or ETH) for each transaction.

## Compliance Mapping
- **NIST 800-53**: AC-4 (Information Flow), AU-10 (Non-repudiation), SI-7 (Software/Information Integrity).
- **CMMC Level 2**: AU.3.045 (Audit record review), 
  AU.3.046 (Alert on audit failure)