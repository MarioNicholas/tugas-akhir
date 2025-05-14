import React, { useState } from "react";
import Layout from "../../components/Layout";
import { Button, Form, Message, Header, Segment } from "semantic-ui-react";
import web3 from "../../ethereum/web3";
import Tiket from "../../ethereum/tiket";

const UseTicket = () => {
  const [ticketCode, setTicketCode] = useState("");
  const [nik, setNik] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleTicketCodeChange = (e) => {
    setTicketCode(e.target.value);
  };

  const handleNikChange = (e) => {
    setNik(e.target.value);
  };

  const handleUseTicket = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResultMessage("");
    setSuccess(false);

    try {
      const accounts = await web3.eth.getAccounts();
  
      const receipt = await Tiket.methods
        .gunakanTiket(ticketCode, nik)
        .send({ from: accounts[0], gas: "3000000" });

      setSuccess(true);
      setResultMessage("Tiket berhasil digunakan!");

      setTicketCode("");
      setNik("");
    } catch (error) {
      console.error(error);
      setSuccess(false);
      setResultMessage("Terjadi kesalahan saat memvalidasi tiket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ marginTop: "60px" }}>
        <Header as="h1" textAlign="center">
          Gunakan Tiket
        </Header>

        <Segment>
          <Form
            onSubmit={handleUseTicket}
            error={!!resultMessage}
          >
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
              Gunakan Tiket
            </Button>
          </Form>
          {resultMessage && !success && (
            <Message error content={resultMessage} />
          )}

          {resultMessage && success && !loading && (
            <Message
              success
              header="Tiket Berhasil Digunakan"
              content={resultMessage}
            />
          )}
        </Segment>
      </div>
    </Layout>
  );
};

export default UseTicket;
