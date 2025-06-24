const HDWalletProvider = require("@truffle/hdwallet-provider");
const { Web3 } = require("web3");
const compiledTiket = require("./build/Tiket.json");
require("dotenv").config()

const provider = new HDWalletProvider(
  process.env.MNEMONIC,
  process.env.INFURA_URL
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
