import React from "react";
import { Menu, Container, Button, MenuItem, MenuMenu } from "semantic-ui-react";
import { Link } from "../routes";

const Header = () => {
  return (
    <Menu color="black" inverted>
      <Container>
        <Link route="/">
          <a className="item">
            <h2>Concert</h2>
          </a>
        </Link>

        <MenuMenu position="right" style={{ alignItems: "center" }}>
          <Link href="/buy-ticket">
            <a className="item">Beli Tiket</a>
          </Link>

          <Link href="/check-ticket">
            <a className="item">Cek Tiket</a>
          </Link>
        </MenuMenu>
      </Container>
    </Menu>
  );
};

export default Header;
