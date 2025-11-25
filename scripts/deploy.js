const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const RPS = await ethers.getContractFactory("RockPaperScissors");
  const rps = await RPS.deploy();
  await rps.waitForDeployment();
  console.log("RockPaperScissors:", await rps.getAddress());

  const Token = await ethers.getContractFactory("GameToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();
  console.log("GameToken:", await token.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
