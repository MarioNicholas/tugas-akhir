import React from "react";
import { Container, Segment } from "semantic-ui-react";

const Footer = () => {
  return (
    <Segment inverted vertical style={{ padding: "10px 0", backgroundColor: "#000" }}>
      <Container textAlign="center" style={{ color: "#fff" }}>
        <p>Created with ❤️ by</p>
        <p>18221061 - Mario Nicholas Reyhan</p>
        <p>Desain dan Implementasi Blockchain dan Smart Contract untuk Sistem Penjualan Tiket Konser di Indonesia</p>
      </Container>
    </Segment>
  );
};

export default Footer;
