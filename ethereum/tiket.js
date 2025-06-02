import web3 from "./web3";
import Tiket from "./build/Tiket.json";

const instance = new web3.eth.Contract(
  Tiket.abi,
  "0x11Dc79A97f7F3139589Aec35fce3bcb68e570122"
);

export default instance;
//0xa735FB559A2D9D1272Cb3e2Ea3E5051E70A763Eb
//0xf7091629760dd5373cffe871b742FCA99C9B5C88
//