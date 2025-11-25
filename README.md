# Game Smart Contracts

This project contains a minimal Hardhat setup with two Solidity contracts:

- RockPaperScissors: a commit–reveal ETH-wagered RPS game between two players.
- GameToken (ERC20): a simple token for rewards.

## Quick start

1. Install dependencies
2. Compile contracts
3. Run tests
4. Deploy locally or to your network
5. Serve the frontend and interact via MetaMask

### Install

```powershell
npm install
```

### Compile

```powershell
npx hardhat compile
```

### Test

```powershell
npx hardhat test
```

### Deploy (default Hardhat network)

```powershell
npx hardhat run scripts/deploy.js
```

### Frontend

Serve the static frontend and open it in your browser:

```powershell
npm run serve
```

Then:
- Paste the RockPaperScissors contract address printed by the deploy script into the RPS Address field.
- Connect your wallet (MetaMask) set to the same network (e.g., Hardhat localhost if you proxy it or a testnet).
- Create a game (it shows Game ID), have the opponent join with the same stake, then both reveal.

## Usage notes

- To create a commit, compute keccak256(abi.encode(move, salt)) with move in {0,1,2}.
- Reveal within the time window or your opponent can claim the pot.
- GameToken mints 1,000,000 tokens to the deployer on deployment.
