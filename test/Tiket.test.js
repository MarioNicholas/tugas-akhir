const assert = require("assert");
const ganache = require("ganache");
const { Web3 } = require("web3");

const web3 = new Web3(ganache.provider());

const compiledTiket = require("../ethereum/build/Tiket.json");

let accounts;
let tiket;
let totalGas = 0;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  const estimatedGas = await new web3.eth.Contract(compiledTiket.abi)
    .deploy({
      data: compiledTiket.evm.bytecode.object,
      arguments: [10, 2, 50000],
    })
    .estimateGas({ from: accounts[0] });

  tiket = await new web3.eth.Contract(compiledTiket.abi)
    .deploy({
      data: compiledTiket.evm.bytecode.object,
      arguments: [10, 2, 50000],
    })
    .send({ from: accounts[0], gas: "5000000" });

  totalGas = estimatedGas;
});

//INISIASI SMART CONTRACT TIKET
describe("Tiket Inisiasi", () => {
  it("Deploys a ticket to use", () => {
    assert.ok(tiket.options.address);
  });

  it("Tiket data is match", async () => {
    const hargaTiket = await tiket.methods.hargaTiket().call();
    const totalTiket = await tiket.methods.totalTiket().call();
    const maxTiketPerIdentitas = await tiket.methods
      .maxTiketPerIdentitas()
      .call();
    assert.equal(hargaTiket, 50000);
    assert.equal(totalTiket, 10);
    assert.equal(maxTiketPerIdentitas, 2);
  });

  it("memastikan owner adalah address yang mendeploy smart contract", async () => {
    const owner = await tiket.methods.owner().call();
    assert.equal(owner, accounts[0]);
  });
});

//FUNGSI HOLD TIKET
describe("Hold Tiket Sementara", () => {
  it("Memastikan tiket tidak bisa dihold dari address lain", async () => {
    try {
      await tiket.methods.holdTiketSementara(2).send({ from: accounts[1] });
    } catch (err) {
      assert.ok(true);
    }
  });
  it("Memastikan tiket yang dihold tidak melebihi batas maksimum", async () => {
    try {
      await tiket.methods.holdTiketSementara(3).send({ from: accounts[0] });
      assert.fail("Expected error not received");
    } catch (err) {
      assert.ok(true);
    }
  });
  it("Berhasil hold tiket", async () => {
    console.time("Hold Tiket");
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });
    console.timeEnd("Hold Tiket"); // ⬅️ ini akan log berapa lama waktu eksekusi `send`

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;
    const holdData = await tiket.methods.holdTiketData(holdId).call();

    const holdFee = receipt.gasUsed;
    const holdDataFee = receipt.gasUsed;

    const gas = holdFee + holdDataFee;

    assert.strictEqual(holdData.jumlahTiket.toString(), "2");
    assert.strictEqual(holdData.aktif, true);
  });

  it("Memastikan tiket yang dihold tidak melebihi batas totalTiket", async () => {
    await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });
    await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });
    await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });
    await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });
    await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    try {
      await tiket.methods
        .holdTiketSementara(2)
        .send({ from: accounts[0], gas: "1000000" });
      assert.fail("Error");
    } catch (err) {
      assert.ok(true);
    }
  });
});

//FUNGSI RELEASE TIKET
describe("Release Hold Tiket", () => {
  it("Menjalankan fungsi release hold tiket", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    await tiket.methods.releaseHoldTiket(holdId).send({ from: accounts[0] });

    const holdData = await tiket.methods.holdTiketData(holdId).call();

    assert.strictEqual(holdData.aktif, false);
  });
  it("Memastikan bahwa fungsi release tiket tidak bisa dijalankan oleh user yang bukan owner", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    try {
      await tiket.methods.releaseHoldTiket(holdId).send({ from: accounts[1] });
      assert.fail("ERrorrrrr");
    } catch (e) {
      assert.ok(true);
    }
  });
  it("Tidak bisa release tiket yang holdId nya tidak tersedia", async () => {
    try {
      await tiket.methods.releaseHoldTiket(999).send({ from: accounts[0] });
      assert.fail("HARUSNYA GAGAL");
    } catch (err) {
      assert.ok(true);
    }
  });
  it("Tidak bisa release tiket yang holdId sudah direlease sebelumnya", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    await tiket.methods.releaseHoldTiket(holdId).send({ from: accounts[0] });

    try {
      await tiket.methods.releaseHoldTiket(holdId).send({ from: accounts[0] });
      assert.fail("HARUSNYA GAGAL");
    } catch (err) {
      assert.ok(true);
    }
  });
  it("Memastikan bahwa tiket berhasil dilepas (masuk event tiketDilepas)", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    const releaseReceipt = await tiket.methods
      .releaseHoldTiket(holdId)
      .send({ from: accounts[0] });
    const event = releaseReceipt.events.TiketDilepas;
    assert.ok(event);
    assert.strictEqual(event.returnValues.holdId, holdId);
  });
});

//FUNGSI BELI TIKET
describe("Beli Tiket", () => {
  it("Memastikan bahwa NIK tidak lebih dari 16 digit", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    try {
      await tiket.methods.beliTiket(holdId, "1234567890098765432123");
      assert.fail("HARUSNYA GAKESINI");
    } catch (err) {
      assert.ok(true);
    }
  });
  it("Memastikan bahwa NIK tidak lurang dari 16 digit", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    try {
      await tiket.methods.beliTiket(holdId, "1234567123");
      assert.fail("HARUSNYA GAKESINI");
    } catch (err) {
      assert.ok(true);
    }
  });
  it("Memastikan fungsi gagal ketika diakses dengan address lain", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;
    try {
      await tiket.methods
        .beliTiket(holdId, "1234567890")
        .send({ from: accounts[1] });
      assert.fail("GAGAL");
    } catch (error) {
      assert.ok(true);
    }
  });
  it("Memastikan fungsi gagal ketika holdId sudah di release", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;
    // await tiket.methods.releaseHoldTiket(holdId).send({ from: accounts[0] });
    await tiket.methods
      .beliTiket(holdId, "1234567890123456")
      .send({ from: accounts[0], gas: "1000000" });
    try {
      await tiket.methods
        .beliTiket(holdId, "1234567890123459")
        .send({ from: accounts[0], gas: "1000000" });
      assert.fail("GAGAL");
    } catch (error) {
      assert.ok(true);
    }
  });
  it("Memastikan fungsi gagal ketika holdId invalid", async () => {
    try {
      await tiket.methods
        .beliTiket(999, "1234567890123456")
        .send({ from: accounts[0], gas: "1000000" });
      assert.fail("GAGAL");
    } catch (error) {
      assert.ok(true);
    }
  });
  it("Memastikan fungsi gagal ketika waktu hold habis", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    await web3.eth.sendTransaction({
      from: accounts[0],
      to: accounts[0],
      value: "0",
    });

    try {
      await tiket.methods
        .beliTiket(holdId, "1234567890123456")
        .send({ from: accounts[0], gas: "1000000" });
      assert.fail("GAGAL");
    } catch (error) {
      assert.ok(true);
    }
  });
  it("Memastikan bahwa tiket tidak dapat dibeli dengan NIK yang sudah pernah beli", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    await tiket.methods
      .beliTiket(holdId, "1234567890123456")
      .send({ from: accounts[0], gas: "1000000" });

    const receipt2 = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId2 = receipt2.events.TiketDiHold.returnValues.holdId;

    try {
      await tiket.methods
        .beliTiket(holdId2, "1234567890123456")
        .send({ from: accounts[0], gas: "1000000" });
      assert.fail("GAGAL");
    } catch (error) {
      assert.ok(true);
    }
  });
  it("Memastikan tiket dapat dibeli dan release holdnya ketika sukses", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    console.time("Beli Tiket");
    await tiket.methods
      .beliTiket(holdId, "1234567890123456")
      .send({ from: accounts[0], gas: "1000000" });
    console.timeEnd("Beli Tiket");

    const ticketData = await tiket.methods.holdTiketData(holdId).call();
    assert.strictEqual(ticketData.aktif, false);
  });
  it("Memastikan bahwa tiket yang dibeli dapat dicek NIK nya", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    const buyReceipt = await tiket.methods
      .beliTiket(holdId, "1234567890123456")
      .send({ from: accounts[0], gas: "1000000" });

    const event = buyReceipt.events.TiketDibeli;
    assert.ok(event);
    assert.strictEqual(event.returnValues.nik, "1234567890123456");
    assert.strictEqual(event.returnValues.kodeUnik, "1234567890123456-2");
  });
});

//GUNAKAN TIKET
describe("Gunakan Tiket", () => {
  it("Memastikkan bahwa pembeli dapat menggunakan tiketnya", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    const buyReceipt = await tiket.methods
      .beliTiket(holdId, "1234567890123456")
      .send({ from: accounts[0], gas: "1000000" });

    const kodeUnik = buyReceipt.events.TiketDibeli.returnValues.kodeUnik;
    console.time("Gunakan Tiket");
    await tiket.methods
      .gunakanTiket(kodeUnik, "1234567890123456")
      .send({ from: accounts[0] });
    console.timeEnd("Gunakan Tiket");
    const ticketDetail = await tiket.methods
      .daftarTiket(buyReceipt.events.TiketDibeli.returnValues.idTiket)
      .call();
    assert.strictEqual(ticketDetail.digunakan, true);
  });
  it("Memastikan tiket yang invalid tidak dapat digunakan", async () => {
    try {
      await tiket.methods
        .gunakanTiket("djjfeem", "1234567890123456")
        .send({ from: accounts[0] });
      assert.fail("GAGAL");
    } catch (error) {
      assert.ok(true);
    }
  });
  it("Memastikan tiket hanya bisa digunakan sekali", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    const buyReceipt = await tiket.methods
      .beliTiket(holdId, "1234567890123456")
      .send({ from: accounts[0], gas: "1000000" });

    const kodeUnik = buyReceipt.events.TiketDibeli.returnValues.kodeUnik;

    await tiket.methods
      .gunakanTiket(kodeUnik, "1234567890123456")
      .send({ from: accounts[0] });

    try {
      await tiket.methods
        .gunakanTiket(kodeUnik, "1234567890123456")
        .send({ from: accounts[0] });
      assert.fail("GAGAL");
    } catch (error) {
      assert.ok(true);
    }
  });
  it("Memastikan bahwa tiket harus digunakan oleh orang yang NIKnya cocok", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    const buyReceipt = await tiket.methods
      .beliTiket(holdId, "1234567890123456")
      .send({ from: accounts[0], gas: "1000000" });

    const kodeUnik = buyReceipt.events.TiketDibeli.returnValues.kodeUnik;

    try {
      await tiket.methods
        .gunakanTiket(kodeUnik, "12333331232132")
        .send({ from: accounts[0] });
      assert.fail("GAGAL");
    } catch (error) {
      assert.ok(true);
    }
  });
  it("Tiket masuk ke list tiket yang sudah digunakan setelah berhasil digunakan", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    const buyReceipt = await tiket.methods
      .beliTiket(holdId, "1234567890123456")
      .send({ from: accounts[0], gas: "1000000" });

    const kodeUnik = buyReceipt.events.TiketDibeli.returnValues.kodeUnik;

    const useReceipt = await tiket.methods
      .gunakanTiket(kodeUnik, "1234567890123456")
      .send({ from: accounts[0] });

    const event = useReceipt.events.TiketDigunakan;
    assert.ok(event);
    assert.strictEqual(
      event.returnValues.idTiket,
      buyReceipt.events.TiketDibeli.returnValues.idTiket
    );
    assert.strictEqual(event.returnValues.nik, "1234567890123456");
  });
});

//CEK TIKET
describe("Cek Tiket", () => {
  it("Tiket dapat dicek ketika valid dan belum digunakan", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    const buyReceipt = await tiket.methods
      .beliTiket(holdId, "1234567890123456")
      .send({ from: accounts[0], gas: "1000000" });

    const kodeUnik = buyReceipt.events.TiketDibeli.returnValues.kodeUnik;
    console.time("cek Tiket");
    const result = await tiket.methods
      .cekTiket(kodeUnik, "1234567890123456")
      .call();
    console.timeEnd("cek Tiket");

    const isValid = result[0];
    const message = result[1];

    assert.strictEqual(isValid, true);
    assert.strictEqual(message, "Tiket valid dan belum digunakan");
  });
  it("Tiket valid yang  sudah digunakan", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    const buyReceipt = await tiket.methods
      .beliTiket(holdId, "1234567890123456")
      .send({ from: accounts[0], gas: "1000000" });

    const kodeUnik = buyReceipt.events.TiketDibeli.returnValues.kodeUnik;

    await tiket.methods
      .gunakanTiket(kodeUnik, "1234567890123456")
      .send({ from: accounts[0] });

    const result = await tiket.methods
      .cekTiket(kodeUnik, "1234567890123456")
      .call();
    const isValid = result[0];
    const message = result[1];

    assert.strictEqual(isValid, false);
    assert.strictEqual(message, "Tiket valid dan sudah digunakan");
  });
  it("Tiket tidak valid untuk tiket yang tidak ada", async () => {
    const result = await tiket.methods
      .cekTiket("dfefeifj", "1234567890123456")
      .call();

    const isValid = result[0];
    const message = result[1];

    assert.strictEqual(isValid, false);
    assert.strictEqual(message, "Tiket tidak ditemukan");
  });
  it("Tiket tidak valid ketika kode dan NIK tidak cocok", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });

    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    const buyReceipt = await tiket.methods
      .beliTiket(holdId, "1234567890123456")
      .send({ from: accounts[0], gas: "1000000" });

    const kodeUnik = buyReceipt.events.TiketDibeli.returnValues.kodeUnik;

    await tiket.methods
      .gunakanTiket(kodeUnik, "1234567890123456")
      .send({ from: accounts[0] });

    const result = await tiket.methods
      .cekTiket(kodeUnik, "12da34567890123456")
      .call();
    const isValid = result[0];
    const message = result[1];

    assert.strictEqual(isValid, false);
    assert.strictEqual(message, "Tiket tidak valid");
  });
});

//TIKET TERSEDIA
describe("Tiket Tersedia", () => {
  it.only("Mengembalikan total tiket tersedia ketika ada yang di hold", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(1)
      .send({ from: accounts[0], gas: "1000000" });
    console.time("Tiket Tersedia");
    const availableTickets = await tiket.methods.tiketTersedia().call();
    console.timeEnd("Tiket Tersedia");

    assert.strictEqual(availableTickets.toString(), "9");
  });

  it("Mengembalikan total tiket tersedia ketika ada yang beli", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });
    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    const buyReceipt = await tiket.methods
      .beliTiket(holdId, "1234567890123456")
      .send({ from: accounts[0], gas: "1000000" });
    const availableTickets = await tiket.methods.tiketTersedia().call();
    assert.strictEqual(availableTickets.toString(), "8");
  });
  it("Mengembalikan total tiket sebelum dibeli apa-apa", async () => {
    const availableTickets = await tiket.methods.tiketTersedia().call();
    assert.strictEqual(availableTickets.toString(), "10");
  });
  it("Mengembalikan total tiket baik ada yang sudah dibeli maupun di hold", async () => {
    const receipt = await tiket.methods
      .holdTiketSementara(2)
      .send({ from: accounts[0], gas: "1000000" });
    const holdId = receipt.events.TiketDiHold.returnValues.holdId;

    const buyReceipt = await tiket.methods
      .beliTiket(holdId, "1234567890123456")
      .send({ from: accounts[0], gas: "1000000" });

    const receipt2 = await tiket.methods
      .holdTiketSementara(1)
      .send({ from: accounts[0], gas: "1000000" });

    const availableTickets = await tiket.methods.tiketTersedia().call();

    const tiketTerjual = await tiket.methods.tiketTerjual().call();
    const tiketDiHold = await tiket.methods.getTiketDiHold().call();
    const totalTiket = await tiket.methods.totalTiket().call();

    const sisaTiket = totalTiket - tiketTerjual - tiketDiHold;

    assert.strictEqual(availableTickets.toString(), sisaTiket.toString());
  });
});
