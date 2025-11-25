const { expect } = require("chai");
const { ethers } = require("hardhat");

function commit(move, salt) {
  // Match Solidity's keccak256(abi.encodePacked(move, salt))
  return ethers.solidityPackedKeccak256(["uint8", "bytes32"], [move, salt]);
}

describe("RockPaperScissors", function () {
  it("plays a full game where P1 wins", async () => {
    const [p1, p2] = await ethers.getSigners();

    const RPS = await ethers.getContractFactory("RockPaperScissors");
    const rps = await RPS.deploy();
    await rps.waitForDeployment();

    const salt1 = ethers.randomBytes(32);
    const salt2 = ethers.randomBytes(32);

    const c1 = commit(0, salt1); // Rock
    const txCreate = await rps.connect(p1).createGame(p2.address, c1, { value: ethers.parseEther("1") });
    const rc1 = await txCreate.wait();
    const gameId = (await rps.nextGameId()) - 1n;

    const c2 = commit(2, salt2); // Scissors
    await rps.connect(p2).joinAndCommit(gameId, c2, { value: ethers.parseEther("1") });

    // reveal both
  await rps.connect(p1).reveal(gameId, 0, salt1);
  await rps.connect(p2).reveal(gameId, 2, salt2);

    // After win, contract should have 0 balance (paid to winner)
    expect(await ethers.provider.getBalance(await rps.getAddress())).to.equal(0n);
  });
});
