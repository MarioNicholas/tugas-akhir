import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  Header,
  Segment,
  Button,
  Message,
  Form,
  FormField,
  Grid,
  GridColumn,
} from "semantic-ui-react";
import { useRouter } from "next/router";
import web3 from "../ethereum/web3";
import Tiket from "../ethereum/tiket";

const Payment = () => {
  const [holdId, setHoldId] = useState(null);
  const [nik, setNik] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [ticketCode, setTicketCode] = useState("");
  const [transactionHash, setTranscationHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [jumlahTiket, setJumlahTiket] = useState(0);
  const [hargaTiket, setHargaTiket] = useState("0");

  useEffect(() => {
    if (router.query.holdId) {
      setHoldId(router.query.holdId);
    }

    const releaseHold = async () => {
      try {
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        await Tiket.methods
          .releaseHoldTiket(router.query.holdId)
          .send({ from: account, gas: "9000000" });
        console.log("Ticket hold released due to page leave/visibility");
      } catch (error) {
        console.error("Error releasing hold ticket:", error);
      }
    };

    const handleBeforeUnload = (event) => {
      releaseHold();
      event.preventDefault();
      event.returnValue =
        "Are you sure you want to leave this page? Changes may not be saved.";
    };

    const fetchTiketData = async () => {
      try {
        const holdData = await Tiket.methods
          .holdTiketData(router.query.holdId)
          .call();
        setJumlahTiket(holdData.jumlahTiket);

        const harga = await Tiket.methods.hargaTiket().call();
        setHargaTiket(harga);
      } catch (err) {
        console.error("Gagal mengambil data tiket:", err);
      }
    };
    fetchTiketData();

    window.addEventListener("beforeunload", handleBeforeUnload);

    const timeout = setTimeout(async () => {
      await releaseHold();
      alert("Waktu hold tiket habis. Anda akan diarahkan ke halaman awal.");
      router.push("/");
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearTimeout(timeout);
    };
  }, [router.query.holdId]);

  // useEffect(() => {
  //   if (!router.query.holdId) return;

  //   const timeout = setTimeout(async () => {
  //     try {
  //       const accounts = await web3.eth.getAccounts();
  //       const account = accounts[0];

  //       await Tiket.methods
  //         .releaseHoldTiket(router.query.holdId)
  //         .send({ from: account, gas: "9000000" });

  //       alert(
  //         "Waktu hold tiket habis. Anda akan diarahkan kembali ke halaman awal."
  //       );
  //       router.push("/");
  //     } catch (error) {
  //       console.error("Gagal melepaskan hold tiket:", error);
  //       alert(
  //         "Waktu hold tiket habis. Anda akan diarahkan kembali ke halaman awal."
  //       );
  //       router.push("/");
  //     }
  //   }, 5 * 60 * 1000);

  //   return () => clearTimeout(timeout);
  // }, [router.query.holdId]);

  const handleNikChange = (event) => {
    setNik(event.target.value);
  };

  const handlePayment = async () => {
    if (!nik || nik.length !== 16) {
      setErrorMessage("Please enter a valid NIK.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setPaymentSuccess(false);
    setTicketCode("");

    try {
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];

      const receipt = await Tiket.methods
        .beliTiket(holdId, nik)
        .send({ from: account, gas: "9000000" });

      const nikHash = web3.utils.keccak256(nik);

      const events = await Tiket.getPastEvents("TiketDibeli", {
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
        filter: { nikHash: nikHash },
      });
      const ticketCodes = events.map((event) => event.returnValues.kodeUnik);

      const transactionHash = receipt.transactionHash;
      web3.currentProvider.engine.stop();

      setTicketCode(ticketCodes.join(", "));
      setTranscationHash(transactionHash);
      setPaymentSuccess(true);

      router.push(
        `/ticket-code?ticketCode=${ticketCodes.join(
          ","
        )}&transactionHash=${transactionHash}`
      );
    } catch (error) {
      setErrorMessage("Tiket tidak dapat dibeli");
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div style={{ marginTop: "60px" }}>
        <Header as="h1" textAlign="center">
          Pembayaran
        </Header>

        <Grid centered>
          <GridColumn width={10}>
            <Segment>
              <p>Tiket anda telah di hold dengan ID: {holdId}</p>
              <p>
                Jumlah tiket: <strong>{jumlahTiket.toString()}</strong>
              </p>
              <p>
                Harga per tiket: <strong>Rp.{hargaTiket.toString()}</strong>
              </p>
              <p>
                Total harga:{" "}
                <strong>
                  Rp.{(BigInt(jumlahTiket) * BigInt(hargaTiket)).toString()}
                </strong>
              </p>
              <Form error={!!errorMessage}>
                <FormField>
                  <label>NIK</label>
                  <input
                    type="text"
                    value={nik}
                    onChange={handleNikChange}
                    maxLength="16"
                    required
                  />
                </FormField>

                {errorMessage && (
                  <Message error header="Error" content={errorMessage} />
                )}

                <Button primary onClick={handlePayment} loading={loading}>
                  Bayar
                </Button>
              </Form>
            </Segment>
          </GridColumn>
        </Grid>
      </div>
    </Layout>
  );
};

export default Payment;
