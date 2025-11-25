import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.1/dist/ethers.min.js";

const rpsAbi = [
  "function nextGameId() view returns (uint256)",
  "function games(uint256) view returns (address player1,address player2,uint256 stake,bytes32 commit1,bytes32 commit2,uint8 move1,uint8 move2,uint8 stage,uint256 deadline)",
  "function createGame(address opponent, bytes32 yourCommit) payable returns (uint256)",
  "function joinAndCommit(uint256 gameId, bytes32 yourCommit) payable",
  "function reveal(uint256 gameId, uint8 move, bytes32 salt)",
  "function claimTimeout(uint256 gameId)"
];

let provider, signer, rps;

const $ = (id) => document.getElementById(id);
const statusEl = $("status");

function setStatus(text) {
  statusEl.textContent = text;
}

function hex32(str) {
  if (!str) return ethers.hexlify(ethers.randomBytes(32));
  if (str.startsWith("0x")) return ethers.hexlify(ethers.zeroPadValue(str, 32));
  // interpret as utf8 and hash for convenience
  return ethers.keccak256(ethers.toUtf8Bytes(str));
}

function commitHash(move, salt32) {
  return ethers.solidityPackedKeccak256(["uint8", "bytes32"], [Number(move), salt32]);
}

async function connect() {
  if (!window.ethereum) {
    alert("MetaMask not found. Install a wallet.");
    return;
  }
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  setStatus(`Connected: ${await signer.getAddress()}`);
}

function requireRps() {
  if (!rps) throw new Error("Load RPS address first");
}

$("connectBtn").addEventListener("click", connect);

$("loadRps").addEventListener("click", async () => {
  const addr = $("rpsAddress").value.trim();
  if (!ethers.isAddress(addr)) return alert("Invalid address");
  if (!provider) await connect();
  rps = new ethers.Contract(addr, rpsAbi, signer);
  setStatus(`RPS loaded at ${addr}`);
});

$("createGame").addEventListener("click", async () => {
  try {
    requireRps();
    const opponent = $("opponent").value.trim();
    if (!ethers.isAddress(opponent)) return alert("Bad opponent");
    const stakeEth = $("stake").value.trim() || "0";
    const move = $("move").value;
    const salt = hex32($("salt").value.trim());

    const c = commitHash(move, salt);
    const tx = await rps.createGame(opponent, c, { value: ethers.parseEther(stakeEth) });
    const rc = await tx.wait();
    const next = await rps.nextGameId();
    const gameId = BigInt(next) - 1n;
    alert(`Game ${gameId} created. SAVE YOUR SALT: ${salt}`);
  } catch (e) {
    console.error(e);
    alert(e.shortMessage || e.message);
  }
});

$("joinCommit").addEventListener("click", async () => {
  try {
    requireRps();
    const gameId = $("gameIdJoin").value.trim();
    const move = $("moveJoin").value;
    const salt = hex32($("saltJoin").value.trim());

    // Need the stake amount equal to creator's stake. Fetch it.
    const g = await rps.games(gameId);
    const stake = g.stake;
    const c = commitHash(move, salt);
    const tx = await rps.joinAndCommit(gameId, c, { value: stake });
    await tx.wait();
    alert(`Joined game ${gameId}. SAVE YOUR SALT: ${salt}`);
  } catch (e) {
    console.error(e);
    alert(e.shortMessage || e.message);
  }
});

$("reveal").addEventListener("click", async () => {
  try {
    requireRps();
    const gameId = $("gameIdReveal").value.trim();
    const move = $("moveReveal").value;
    const salt = hex32($("saltReveal").value.trim());
    const tx = await rps.reveal(gameId, Number(move), salt);
    await tx.wait();
    alert(`Reveal sent for game ${gameId}`);
  } catch (e) {
    console.error(e);
    alert(e.shortMessage || e.message);
  }
});

$("claimTimeout").addEventListener("click", async () => {
  try {
    requireRps();
    const gameId = $("gameIdReveal").value.trim();
    const tx = await rps.claimTimeout(gameId);
    await tx.wait();
    alert(`Timeout claimed for game ${gameId}`);
  } catch (e) {
    console.error(e);
    alert(e.shortMessage || e.message);
  }
});

$("fetchInfo").addEventListener("click", async () => {
  try {
    requireRps();
    const gameId = $("gameIdInfo").value.trim();
    const g = await rps.games(gameId);
    const data = {
      player1: g.player1,
      player2: g.player2,
      stake: ethers.formatEther(g.stake),
      commit1: g.commit1,
      commit2: g.commit2,
      move1: Number(g.move1),
      move2: Number(g.move2),
      stage: Number(g.stage),
      deadline: Number(g.deadline),
      now: Math.floor(Date.now() / 1000)
    };
    $("infoOut").textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    console.error(e);
    alert(e.shortMessage || e.message);
  }
});
