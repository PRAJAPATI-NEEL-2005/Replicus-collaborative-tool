import React, { useEffect, useState,useRef } from "react";
import Editor from "./Editor";
import { Navigate, useParams } from "react-router-dom";
import Client from "./Client";
import Logo from "./logo.png";
import { initsocket } from "../socket";
import Actions from "../Actions";
import { useLocation,useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
// Main Editorpage Component
const Editorpage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const { username } = location.state || { username: "Anonymous" };
  const socketRef = useRef(null);
  const reactNavigator = useNavigate();


  useEffect(() => {
    const init = async () => {
       if (socketRef.current) return;
      socketRef.current = await initsocket();
      socketRef.current.on("connect_error",(err)=>handleErrors(err));
      socketRef.current.on("connect_failed",(err)=>handleErrors(err));

      function handleErrors(e){
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(Actions.JOIN, { roomId, username });

        // Listen for JOINED event from the server
      socketRef.current.on(Actions.JOINED, ({ clients, username, socketId }) => {
        if (username !== location.state.username) {
          toast.success(`${username} joined the room.`);
        }
        setClients(clients);
      
      });
       // Listen for DISCONNECTED event from the server
       socketRef.current.on(Actions.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });






    };



    init();

    return()=>{
      socketRef.current.off(Actions.JOINED);
      socketRef.current.off(Actions.DISCONNECTED);  
      socketRef.current.disconnect();


    }



  },[]);





  const [clients, setClients] = useState([  ]);


  const [code, setCode] = useState(`// Welcome to the collaborative code editor!
// Start writing your code here.

function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("World"));
`);

  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const leaveRoom = () => {
    if (window.confirm("Are you sure you want to leave this room?")) {
      window.history.back();
    }
  };

  return (
    <div className="d-flex vh-100 bg-light">
      {/* Sidebar */}
      <div
        className="d-flex flex-column bg-white border-end shadow-sm"
        style={{ width: "280px" }}
      >
        <div className="p-4 d-flex flex-column h-100">
          {/* Logo */}
          <div className="text-center mb-4">
            <img
              src={Logo}
              alt="logo"
              className="rounded"
              style={{
                width: "150px",
                height: "150px",
                width: "120px",
                height: "120px",
                objectFit: "cover",
              }}
            />
          </div>

          <div className="text-center mb-3">
            <h6 className="text-muted mb-1">Room ID</h6>
            <code
              className="bg-light px-2 py-1 rounded"
              style={{ fontSize: "12px" }}
            >
              {roomId}
            </code>
          </div>

          <h6 className="text-muted mb-3 text-center">
            Connected Users ({clients.length})
          </h6>

          {/* Clients list */}
          <div
            className="flex-grow-1 overflow-auto mb-3"
            style={{ maxHeight: "calc(100vh - 400px)" }}
          >
            <div className="d-flex flex-column gap-2">
              {clients.map((client) => (
                <div key={client.socketId} className="p-2 rounded bg-light">
                  <Client username={client.username} />
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="d-flex flex-column gap-2 mt-auto">
            <button
              className="btn btn-outline-primary w-100"
              onClick={copyRoomId}
            >
              {copied ? "✓ Copied!" : "Copy Room ID"}
            </button>
            <button
              className="btn btn-outline-danger w-100"
              onClick={leaveRoom}
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-grow-1 d-flex flex-column">
        <div className="d-flex gap-3 align-items-center">
          <small className="text-muted">
            Lines: {code.split("\n").length} | Characters: {code.length}
          </small>
        </div>

        <div className="flex-grow-1 position-relative">
          <Editor code={code} setCode={setCode} />
        </div>
      </div>
    </div>
  );
};

// App Component
export default function App() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        crossOrigin="anonymous"
      />
      <Editorpage />
    </>
  );
}
