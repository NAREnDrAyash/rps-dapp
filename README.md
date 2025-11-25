
# Rock–Paper–Scissors Blockchain dApp

This project is a full-stack decentralized application (dApp) for playing Rock–Paper–Scissors on the Ethereum blockchain. It uses Solidity smart contracts, a Hardhat development environment, and a browser-based frontend that connects via MetaMask.

## Features

- **Commit–reveal gameplay:** Moves are hidden until revealed, ensuring fairness.
- **ETH wagering:** Players stake ETH; winner takes the pot, draw refunds both.
- **Timeout protection:** If a player fails to reveal, the other can claim the pot.
- **ERC20 token rewards:** The GameToken contract mints 1,000,000 tokens to the deployer for future in-game rewards.
- **Simple frontend:** Interact with the game using MetaMask and a clean UI.

## How It Works

1. **Create a game:** Player 1 chooses a move (Rock=0, Paper=1, Scissors=2), generates a random salt, and submits a commit hash (keccak256(abi.encodePacked(move, salt))) with ETH stake.
2. **Join and commit:** Player 2 joins by submitting their own commit hash and matching the stake.
3. **Reveal:** Both players reveal their move and salt. The contract checks the hash and determines the winner.
4. **Timeout:** If a player fails to reveal before the deadline, the other can claim the pot.

## Project Structure

- `contracts/` — Solidity smart contracts
	- `RockPaperScissors.sol`: Main game logic
	- `GameToken.sol`: ERC20 token
- `scripts/` — Deployment scripts
- `test/` — Automated tests
- `frontend/` — Static web UI (HTML, JS, CSS)

## Quick Start

### 1. Install dependencies
```powershell
npm install
```

### 2. Compile contracts
```powershell
npx hardhat compile
```

### 3. Run tests
```powershell
npx hardhat test
```

### 4. Deploy contracts
```powershell
npx hardhat run scripts/deploy.js
```
Copy the RockPaperScissors contract address printed in the terminal.

### 5. Serve the frontend
```powershell
npm run serve
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

## Using the dApp

1. **Connect MetaMask:** Click "Connect Wallet" in the UI. Make sure MetaMask is set to the same network as your deployment (e.g., Hardhat local node or testnet).
2. **Load contract:** Paste the RockPaperScissors contract address into the RPS Address field and click "Load".
3. **Create a game:** Enter opponent address, stake (ETH), move, and salt (leave blank to auto-generate). Save your salt!
4. **Join & commit:** Opponent enters game ID, move, and salt, then joins with matching stake.
5. **Reveal:** Both players reveal their move and salt before the deadline.
6. **Claim timeout:** If your opponent fails to reveal, claim the pot after the deadline.
7. **Game info:** Enter game ID and click "Fetch" to view game details.

## MetaMask Setup

- Install MetaMask browser extension.
- Add a local Hardhat network (if testing locally):
	- Network name: Hardhat
	- RPC URL: http://127.0.0.1:8545
	- Chain ID: 31337
- Import an account using a private key from Hardhat (optional for testing).

## Example Commit & Reveal

- **Commit:**
	- Move: 0 (Rock)
	- Salt: 0xabc123...
	- Commit hash: keccak256(abi.encodePacked(0, 0xabc123...))
- **Reveal:**
	- Submit move and salt. Contract checks hash matches your commit.

## GameToken Usage

- On deployment, the contract mints 1,000,000 GTN tokens to the deployer.
- You can use these tokens for rewards, leaderboards, or other features.

## Troubleshooting

- If MetaMask doesn’t connect, check your network and RPC settings.
- If transactions fail, ensure you have enough ETH and the correct contract address.
- If you see “dubious ownership” errors with git, run:
	```powershell
	git config --global --add safe.directory D:/django
	```

## License

MIT
