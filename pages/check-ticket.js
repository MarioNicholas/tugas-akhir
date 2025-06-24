import React, { useState } from "react";
import Layout from "../components/Layout";
import {
  Button,
  Form,
  Message,
  Header,
  Segment,
  FormField,
  Grid,
  GridColumn,
} from "semantic-ui-react";
import Tiket from "../ethereum/tiket";

const CheckTicket = () => {
  const [ticketCode, setTicketCode] = useState("");
  const [nik, setNik] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);

  const handleTicketCodeChange = (e) => {
    setTicketCode(e.target.value);
  };

  const handleNikChange = (e) => {
    setNik(e.target.value);
  };

  const handleCheckTicket = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResultMessage("");
    setValid(false);
    try {
      const result = await Tiket.methods.cekTiket(ticketCode, nik).call();

      const isValid = result[0];
      const message = result[1];

      setResultMessage(message);

      if (isValid) {
        setValid(true);
      } else {
        setValid(false);
      }
    } catch (error) {
      console.error(error);
      setResultMessage("Terjadi kesalahan saat memeriksa tiket.");
      setValid(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ marginTop: "60px" }}>
        <Header as="h1" textAlign="center">
          Cek Tiket
        </Header>

        <Grid centered>
          <GridColumn width={10}>
            <Segment>
              <Form onSubmit={handleCheckTicket} error={!!resultMessage}>
                <Form.Field>
                  <label>Kode Tiket</label>
                  <input
                    type="text"
                    value={ticketCode}
                    onChange={handleTicketCodeChange}
                    required
                  />
                </Form.Field>

                <Form.Field>
                  <label>NIK</label>
                  <input
                    type="text"
                    value={nik}
                    onChange={handleNikChange}
                    maxLength="16"
                    required
                  />
                </Form.Field>

                <Button primary type="submit" loading={loading}>
                  Cek
                </Button>
              </Form>
              {resultMessage && !valid && (
                <Message
                  error
                  header="Hasil Cek Tiket"
                  content={resultMessage}
                />
              )}

              {resultMessage && valid && !loading && (
                <Message
                  success
                  header="Hasil Cek Tiket"
                  content={resultMessage}
                />
              )}
            </Segment>
          </GridColumn>
        </Grid>
      </div>
    </Layout>
  );
};

export default CheckTicket;
