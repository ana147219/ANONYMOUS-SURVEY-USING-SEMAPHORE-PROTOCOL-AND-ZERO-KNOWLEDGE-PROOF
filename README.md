# ANONYMOUS SURVEY USING SEMAPHORE PROTOCOL AND ZERO KNOWLEDGE PROOF

## Project description
This project enables a registration system that generates a unique identity, deterministically based on their credentials and a salt, for each user and adds them to a Merkle tree. The Merkle tree structure ensures the integrity and verifiability of the identities while maintaining anonymity. Once registered, the system allows users to cast votes anonymously by generating a ZK proof.

The registration process involves the creation of a unique identity for each user and specific subject, which is securely added to the Merkle tree, providing a decentralized and immutable record of all registered participants. The Merkle tree serves as a secure way to verify a user's identity without revealing sensitive information.

Once registered and added to the Merkle tree, users can vote in the system. The system generates a proof of their participation without exposing their identity. This proof can be used to validate their vote without compromising privacy.

To prevent multiple voting, the system verifies the user’s identity using a nullifier. The nullifier ensures that a user can only cast one vote, effectively blocking any attempt at duplicate voting and maintaining the integrity of the voting process.

The generation of the proof also involves the scope that represents the exact ID pool from which the vote is being cast. This scope ensures that the proof can only be generated for a single valid vote in the correct ID pool, preventing the reuse of a single proof for different pools.

This solution leverages the power of cryptography to ensure both transparency and privacy, allowing secure, anonymous voting in any system that requires identity verification while preserving user anonymity.
