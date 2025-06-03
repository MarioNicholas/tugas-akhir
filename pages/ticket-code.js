import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  Header,
  Segment,
  Grid,
  Image,
  Message,
  GridColumn,
  List,
} from "semantic-ui-react";
import { useRouter } from "next/router";

const TicketCode = () => {
  const [ticketCode, setTicketCode] = useState([]);
  const [transactionHash, setTransactionHash] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (router.query.ticketCode) {
      const codes = router.query.ticketCode.split(",");
      setTicketCode(codes);
    }
    if (router.query.transactionHash) {
      setTransactionHash(router.query.transactionHash);
    }
  }, [router.query]);

  return (
    <Layout>
      <div style={{ marginTop: "60px" }}>
        <Segment>
          <Header as="h1" textAlign="center">
            Pembayaran Berhasil!
          </Header>
          <p style={{ textAlign: "center" }}>
            <strong>Kode Tiket Anda: </strong>
          </p>
          <List relaxed style={{ textAlign: "center" }}>
            {ticketCode.map((code, index) => (
              <List.Item key={index}>
                <List.Content>
                  <List.Header as="code">{code.trim()}</List.Header>
                </List.Content>
              </List.Item>
            ))}
          </List>
          <Message warning content="Simpan kode tiket ini dengan baik." />
        </Segment>

        {transactionHash && (
          <Segment>
            <Message info>
              <p>
                Anda dapat melihat transaksi pada{" "}
                <a
                  href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Etherscan
                </a>
              </p>
            </Message>
          </Segment>
        )}

        <Grid stackable>
          <Grid.Row>
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
              <Header style={{ fontSize: "32px" }} as="h1">
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
              </div>
              <h3 style={{ margin: "0" }}>Sampai Jumpa di GBK!</h3>
            </GridColumn>
          </Grid.Row>
        </Grid>
      </div>
    </Layout>
  );
};

export default TicketCode;
