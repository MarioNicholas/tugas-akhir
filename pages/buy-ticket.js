import React, { useState } from "react";
import Layout from "../components/Layout";
import {
  Button,
  Form,
  Header,
  Segment,
  Message,
  FormField,
  Grid,
  GridColumn,
} from "semantic-ui-react";
import web3 from "../ethereum/web3";
import Tiket from "../ethereum/tiket";
import { useRouter } from "next/router";

const BuyTicket = ({ ticketData }) => {
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handleTicketChange = (event) => {
    setTicketQuantity(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    if (
      ticketQuantity < 1 ||
      ticketQuantity > ticketData.maxTiketPerIdentitas
    ) {
      setErrorMessage(
        `Please choose between 1 and ${ticketData.maxTiketPerIdentitas} tickets.`
      );
      setLoading(false);
      return;
    }

    try {
      const accounts = await web3.eth.getAccounts();

      const holdReceipt = await Tiket.methods
        .holdTiketSementara(ticketQuantity)
        .send({ from: accounts[0], gas: "1000000" });

      const holdId = holdReceipt.events.TiketDiHold.returnValues.holdId;
      web3.currentProvider.engine.stop();

      router.push(`/payment?holdId=${holdId}`);
    } catch (error) {
      console.log(error)
      setErrorMessage(
        error.message
      );
    }

    setLoading(false);
  };

  return (
    <Layout>
      <div style={{ marginTop: "60px" }}>
        <Header as="h1" textAlign="center">
          Beli Tiket untuk Concert In Jakarta
        </Header>

        <Grid centered>
          <GridColumn width={10}>
            <Segment>
              <Header as="h3">Harga Tiket: Rp{ticketData.ticketPrice}</Header>
              <Header as="h3">
                Tiket Tersedia: {ticketData.availableTickets}
              </Header>
              <Header as="h4">
                Maksimal membeli {ticketData.maxTiketPerIdentitas} tiket
              </Header>

              <Form onSubmit={handleSubmit} error={!!errorMessage}>
                <FormField>
                  <label>Jumlah Tiket</label>
                  <input
                    type="number"
                    value={ticketQuantity}
                    onChange={handleTicketChange}
                    min="1"
                    max={ticketData.maxTiketPerIdentitas}
                    required
                  />
                </FormField>

                {errorMessage && (
                  <Message error header="Error" content={errorMessage} />
                )}

                <Button primary type="submit" loading={loading}>
                  Beli
                </Button>
                <Message info>
                  <Message.Header>Perhatian</Message.Header>
                  <p>
                    Setelah menekan tombol <strong>Proceed</strong>, Anda
                    memiliki waktu <strong>5 menit</strong> untuk menyelesaikan
                    pembayaran. Jika tidak dibayar dalam waktu tersebut, tiket
                    akan otomatis dilepas dan tidak dapat dibeli.
                  </p>
                </Message>
              </Form>
            </Segment>
          </GridColumn>
        </Grid>
      </div>
    </Layout>
  );
};

export async function getServerSideProps() {
  const totalTicket = await Tiket.methods.totalTiket().call();
  const ticketPrice = await Tiket.methods.hargaTiket().call();
  const availableTickets = await Tiket.methods.tiketTersedia().call();
  const maxTiketPerIdentitas = await Tiket.methods
    .maxTiketPerIdentitas()
    .call();

  return {
    props: {
      ticketData: {
        title: "Concert Title",
        ticketPrice: ticketPrice.toString(),
        availableTickets: availableTickets.toString(),
        maxTiketPerIdentitas: maxTiketPerIdentitas.toString(),
      },
    },
  };
}

export default BuyTicket;
