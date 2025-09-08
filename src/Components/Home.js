import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import {v4 as uuidV4} from "uuid";
import toast from "react-hot-toast";
function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const handleJoin = () => {
    console.log(`Joining room: ${roomId} as ${username}`);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    console.log(`Created room: ${id}`);
    toast.success("Created a new room");
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
        crossOrigin="anonymous"
      />
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #fdfbfb, #ebedee)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} sm={10} md={8} lg={6} xl={5}>
              <Card
                className="text-center shadow-lg border-0"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(12px)",
                  color: "#333",
                  borderRadius: "20px",
                  transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow =
                    "0px 0px 25px rgba(66, 165, 245, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Card.Body className="p-4 p-md-5">
                 <h2 className="fw-bold mb-2" style={{ color: "#42a5f5", fontSize: "2.5rem" }}>
                    🚀 Replicus
                  </h2>
                  <p className="text-muted mb-4" style={{ fontSize: "1.1rem" }}>
                    A real-time collaborative code editor
                  </p>

                  <Form className="mt-4">
                    <Form.Group className="mb-3">
                      <Form.Control
                        type="text"
                        placeholder="🔑 Enter Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="text-center"
                        style={{
                          background: "#fff",
                          border: "1px solid #ddd",
                          color: "#333",
                          borderRadius: "10px",
                          padding: "15px",
                          transition:
                            "border 0.3s ease-in-out, box-shadow 0.3s ease",
                        }}
                        onFocus={(e) => {
                          e.target.style.border = "1px solid #1976d2";
                          e.target.style.boxShadow =
                            "0 0 10px rgba(25,118,210,0.3)";
                        }}
                        onBlur={(e) => {
                          e.target.style.border = "1px solid #ddd";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Control
                        type="text"
                        placeholder="👤 Enter Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="text-center"
                        style={{
                          background: "#fff",
                          border: "1px solid #ddd",
                          color: "#333",
                          borderRadius: "10px",
                          padding: "15px",
                          transition:
                            "border 0.3s ease-in-out, box-shadow 0.3s ease",
                        }}
                        onFocus={(e) => {
                          e.target.style.border = "1px solid #1976d2";
                          e.target.style.boxShadow =
                            "0 0 10px rgba(25,118,210,0.3)";
                        }}
                        onBlur={(e) => {
                          e.target.style.border = "1px solid #ddd";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </Form.Group>

                    <div className="d-grid gap-3">
                      <Button
                        variant="primary"
                        onClick={handleJoin}
                        disabled={!roomId || !username}
                        className="w-100 rounded-pill fw-bold"
                        style={{
                          background: "linear-gradient(90deg, #1976d2, #42a5f5)",
                          border: "none",
                          padding: "12px",
                          transition: "transform 0.2s ease-in-out, box-shadow 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";
                          e.currentTarget.style.boxShadow =
                            "0 0 15px rgba(25,118,210,0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        Join Room
                      </Button>
                      <div className="text-muted my-2">OR</div>
                      <Button
                        variant="outline-primary"
                        onClick={handleCreate}
                        className="w-100 rounded-pill fw-bold"
                        style={{
                          color: "#1976d2",
                          border: "1px solid #1976d2",
                          padding: "12px",
                          background: "transparent",
                          transition: "transform 0.2s ease-in-out, box-shadow 0.2s, background 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";
                          e.currentTarget.style.boxShadow =
                            "0 0 15px rgba(25,118,210,0.3)";
                          e.currentTarget.style.background =
                            "rgba(25,118,210,0.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        Create Room
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
}

export default Home;
