import React, { useState } from "react";
import Logo from "./logo.png";
import Client from "./Client";
import Editor from "./Editor";
function Editorpage() {
  const [clients, setClients] = useState([
    { socketId: 1, username: "user1" },
    { socketId: 2, username: "user2" },
  ]);
  return (
    <div>
      <div className="mainwrap">
        <div className="aside">
          <div className="asideinner">
            <div className="logo">
              {
                <img
                  src={Logo}
                  alt="logo"
                  style={{
                    width: "150px",
                    height: "150px",
                  }}
                />
              }
            </div>
            <h3>connected Users</h3>
            <div className="clientslist">
              {clients.map((client) => (
                <Client key={client.socketId} username={client.username} />
              ))}
            </div>
            <div className="btnwrap">
              <button className="btn copybtn">Copy ROOM ID</button>
              <button className="btn leavebtn">Leave</button>
            </div>

          </div>
        </div>
        <div className="editor">
              <Editor/>

        </div>
      </div>
    </div>
  );
}

export default Editorpage;
