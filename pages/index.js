import React from "react";
import Layout from "../components/Layout";
import {
  Grid,
  GridRow,
  GridColumn,
  Header,
  Segment,
  Image,
  Button,
} from "semantic-ui-react";
import Tiket from "../ethereum/tiket";
import Link from "next/link";

const Home = (props) => {
  return (
    <Layout>
      <div style={{ marginTop: "60px" }}>
        <Grid stackable>
          <GridRow>
            <GridColumn width={10}>
              <Image src="/concerts.webp" alt="Artist" fluid />
            </GridColumn>
            <GridColumn
              width={6}
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexDirection: "column",
              }}
            >
              <Header style={{ fontSize: "40px" }} as="h1">
                CONCERT IN JAKARTA
              </Header>
              <div style={{ fontSize: "16px" }}>
                <p style={{ marginBottom: "10px" }}>
                  <strong>Lokasi:</strong> Stadion Gelora Bung Karno
                </p>
                <p style={{ marginBottom: "10px" }}>
                  <strong>Tanggal:</strong> 17 Agustus 2025
                </p>
                <p style={{ marginBottom: "10px" }}>
                  <strong>Jam:</strong> 19.00 WIB
                </p>
                <p style={{ marginBottom: "10px" }}>
                  <strong>Harga Tiket:</strong> Rp{props.ticketPrice}
                </p>
                <p style={{ marginBottom: "30px" }}>
                  <strong>Tiket Tersedia:</strong> {props.availableTickets}
                </p>
                <p style={{ marginBottom: "30px" }}>
                  <strong>Total Tiket:</strong> {props.totalTicket}
                </p>
              </div>

              <Link href="/buy-ticket" passHref>
                <Button primary>Beli Tiket</Button>
              </Link>
            </GridColumn>
          </GridRow>
        </Grid>
      </div>

      <Segment style={{ padding: "5em 0" }} vertical>
        <h1
          style={{
            textAlign: "center",
            marginBottom: "20px",
            fontSize: "40px",
          }}
        >
          Venue
        </h1>
        <div style={{ textAlign: "center" }}>
          <Image src="venue.jpg" alt="Venue" centered size="big" />
        </div>
      </Segment>
    </Layout>
  );
};

export async function getServerSideProps() {
  const totalTicket = await Tiket.methods.totalTiket().call();
  const ticketPrice = await Tiket.methods.hargaTiket().call();
  const availableTickets = await Tiket.methods.tiketTersedia().call();

  return {
    props: {
      totalTicket: totalTicket.toString(),
      ticketPrice: ticketPrice.toString(),
      availableTickets: availableTickets.toString(),
    },
  };
}

export default Home;
