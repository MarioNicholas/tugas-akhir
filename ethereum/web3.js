const HDWalletProvider = require("@truffle/hdwallet-provider");
const { Web3 } = require("web3");

let web3;

const provider = new HDWalletProvider(
  "govern flame december shadow forget fee cup novel health bird retire retreat",
  "https://sepolia.infura.io/v3/c2626bdf912548cfbd83fa810c6b2b68"
);
web3 = new Web3(provider);

export default web3;
