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
      event.preventDefault();
      event.returnValue =
        "Are you sure you want to leave this page? Changes may not be saved.";
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && router.query.holdId) {
        releaseHold();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
      console.log("Trying to buy ticket with:", { holdId, nik, account });

      const receipt = await Tiket.methods
        .beliTiket(holdId, nik)
        .send({ from: account, gas: "9000000" });

      const ticketId = receipt.events.TiketDibeli.returnValues.idTiket;
      const ticketCode = receipt.events.TiketDibeli.returnValues.kodeUnik;
      const transactionHash = receipt.transactionHash;
      web3.currentProvider.engine.stop();

      setTicketCode(ticketCode);
      setTranscationHash(transactionHash);
      setPaymentSuccess(true);

      router.push(
        `/ticket-code?ticketCode=${ticketCode}&transactionHash=${transactionHash}`
      );
    } catch (error) {
      setErrorMessage(error.message);
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div style={{ marginTop: "60px" }}>
        <Header as="h1" textAlign="center">
          Payment for Ticket(s)
        </Header>

        <Grid centered>
          <GridColumn width={10}>
            <Segment>
              <p>Your tickets are being held with Hold ID: {holdId}</p>

              <Form error={!!errorMessage}>
                <FormField>
                  <label>Enter Your NIK</label>
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
                  Pay
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
