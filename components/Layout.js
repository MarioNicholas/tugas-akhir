import React from "react";
import Header from "./Header";
import { Container } from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";
import Footer from "./Footer";

const Layout = (props) => {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Header />
      <Container style={{ flex: "1", marginBottom: "60px" }}>
        {props.children}
      </Container>
      <Footer />
    </div>
  );
};

export default Layout;
