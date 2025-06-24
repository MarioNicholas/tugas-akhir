const path = require("path");
const solc = require("solc");
const fs = require("fs-extra");

const buildPath = path.resolve(__dirname, "build");
fs.removeSync(buildPath);

const tiketPath = path.resolve(__dirname, "contracts", "Tiket.sol");
const source = fs.readFileSync(tiketPath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "Tiket.sol": {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["*"],
      },
    },
  },
};

function findImports(importPath) {
  try {
    const fullPath = path.resolve(__dirname,"..", "node_modules", importPath);
    console.log(fullPath);
    const content = fs.readFileSync(fullPath, "utf8");
    return { contents: content };
  } catch (e) {
    return { error: "File not found" };
  }
}

const result = solc.compile(JSON.stringify(input), { import: findImports });
const compiledResult = JSON.parse(result);

if (compiledResult.errors) {
  console.log(compiledResult.errors);
}

const output = compiledResult.contracts["Tiket.sol"];

fs.ensureDirSync(buildPath);

for (let contract in output) {
  fs.outputJsonSync(
    path.resolve(buildPath, contract.replace(":", "") + ".json"),
    output[contract]
  );
}
