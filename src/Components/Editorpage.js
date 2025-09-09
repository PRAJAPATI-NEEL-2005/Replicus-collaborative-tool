import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, ListGroup } from "react-bootstrap";
import Logo from "./logo.png";
import Client from "./Client";
import Editor from "./Editor";




const Editorpage = () => {
  const [clients, setClients] = useState([
    { socketId: 1, username: "Alice" },
    { socketId: 2, username: "Bob" },
    { socketId: 3, username: "Charlie" },
      { socketId: 1, username: "Alice" },
    { socketId: 2, username: "Bob" },
    { socketId: 3, username: "Charlie" },
      { socketId: 1, username: "Alice" },
    { socketId: 2, username: "Bob" },
    { socketId: 3, username: "Charlie" },
      { socketId: 1, username: "Alice" },
    { socketId: 2, username: "Bob" },
    { socketId: 3, username: "Charlie" },
  ]);


  const roomId = "YOUR_ROOM_ID";

  const copyRoomId = () => {
    
  };

  const leaveRoom = () => {
    // Implement leave room functionality
  };



  return (
    <Container fluid className="p-0 bg-white text-dark vh-100">
     
      <Row className="g-0 h-100">
        {/* Sidebar */}
        <Col md={3} className="d-flex flex-column bg-light border-end p-3 h-100 shadow-sm">
          <Card className="shadow-sm flex-grow-1 bg-white border-0 h-100">
            <Card.Body className="d-flex flex-column h-100">
              {/* Logo */}
              <div className="text-center mb-4">
                <img
                  src={Logo}
                  alt="logo"
                  className="rounded"
                  style={{
                    width: "120px",
                    height: "120px",
                    objectFit: "cover",
                  }}
                />
              </div>

              <h5 className="text-center text-secondary mb-3">
                Connected Users
              </h5>

              {/* Clients list */}
              <ListGroup className="mb-3 flex-grow-1 overflow-auto">
                {clients.map((client) => (
                  <ListGroup.Item
                    key={client.socketId}
                    className="border-0 bg-light"
                  >
                    <Client username={client.username} />
                  </ListGroup.Item>
                ))}
              </ListGroup>

              {/* Buttons */}
              <div className="d-flex flex-column gap-2 mt-auto">
                <Button
                  variant="outline-primary"
                  className="w-100 py-2"
                  onClick={copyRoomId}
                >
                  Copy ROOM ID
                </Button>
                <Button
                  variant="outline-danger"
                  className="w-100 py-2"
                  onClick={leaveRoom}
                >
                  Leave
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Editor */}
        <Col md={9} className="d-flex flex-column h-100">
          <Card className="shadow-sm h-100 bg-white border-0 rounded-0">
            <Card.Body className="p-0 h-100 d-flex">
              <Editor />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default function App() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        crossOrigin="anonymous"
      />
      <React.StrictMode>
        <Editorpage />
      </React.StrictMode>
    </>
  );
}
