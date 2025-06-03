const HDWalletProvider = require("@truffle/hdwallet-provider");
const { Web3 } = require("web3");
const compiledTiket = require("./build/Tiket.json");

const provider = new HDWalletProvider(
  "govern flame december shadow forget fee cup novel health bird retire retreat",
  "https://sepolia.infura.io/v3/c2626bdf912548cfbd83fa810c6b2b68"
);
const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  console.log("Attempting to deploy from account", accounts[0]);

  const result = await new web3.eth.Contract(compiledTiket.abi)
    .deploy({ data: compiledTiket.evm.bytecode.object, arguments: [30, 3, 500000], })
    .send({ gas: "5000000", from: accounts[0] });

  console.log("Contract deployed to", result.options.address);
  provider.engine.stop();
};
deploy();
