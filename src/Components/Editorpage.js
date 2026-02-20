import React, { useEffect, useState, useRef } from "react";
import Editor from "./Editor";
import { Navigate, useParams } from "react-router-dom";
import Client from "./Client";
import Logo from "./logo.png";
import { initsocket } from "../socket";
import Actions from "../Actions";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Editorpage = () => {
  const isRemoteUpdate = useRef(false);
  const { roomId } = useParams();
  const location = useLocation();
  const { username } = location.state || { username: "Anonymous" };
const lastToastTimeRef = useRef(0);
const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const codeRef = useRef(null); // ⭐ For latest code reference
  const reactNavigator = useNavigate();
  const languageRef = useRef(null); // ⭐ For latest language reference
  const [clients, setClients] = useState([]);
  const [language, setLanguage] = useState("javascript");
    const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const extensionMap = {
   javascript: "js",
  typescript: "ts",
  python: "py",
  java: "java",
  cpp: "cpp",
  html: "html",
  css: "css",
  json: "json",
  xml: "xml",
  sql: "sql",
  php: "php",
  };

  const [code, setCode] = useState(`// Welcome to the collaborative code editor!
// Start writing your code here.

function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("World"));
`);


    // Scroll to bottom when messages change
     useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  // ⭐ Always store latest code
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  //
    useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    const init = async () => {
      if (socketRef.current) return;

      socketRef.current = await initsocket();

      socketRef.current.on("connect_error", handleErrors);
      socketRef.current.on("connect_failed", handleErrors);

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(Actions.JOIN, { roomId, username });

      // that is initial join event 
      socketRef.current.on(
        Actions.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state.username) {
            toast.success(`${username} joined the room.`);
          }

          setClients(clients);

          // if new user come then the current code sent to them
          socketRef.current.emit(Actions.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
             // Sync Language
        socketRef.current.emit(Actions.SYNC_LANGUAGE, {
          socketId,
          language: languageRef.current,
        });



        }
      );

      // if any user closes the room 
      socketRef.current.on(
        Actions.DISCONNECTED,
        ({ socketId, username }) => {
          toast.success(`${username} left the room.`);
          setClients((prev) =>
            prev.filter((client) => client.socketId !== socketId)
          );
        }
      );

      // other user changes the code that is received here
      socketRef.current.on(Actions.CODE_CHANGE, ({ code ,username}) => {
        if (code !== null) {
           isRemoteUpdate.current = true;
          setCode(code);
        }
        const now = Date.now();

  // Show toast only once every 3 seconds
  if (now - lastToastTimeRef.current > 3000) {
    toast.success(`Code updated by ${username}`);
    lastToastTimeRef.current = now;
  }
      });

      // initiallly when user join the room then the code is sent to them and received here
      socketRef.current.on(Actions.SYNC_CODE, ({ code }) => {
        if (code !== null) {
          setCode(code);
        }
      });
      // RECEIVE LANGUAGE CHANGE
      socketRef.current.on(Actions.LANGUAGE_CHANGE, ({ language ,username}) => {
        setLanguage(language);
        toast.success(`${username} changed language to ${language}`);
      });

      // RECEIVE LANGUAGE SYNC
      socketRef.current.on(Actions.SYNC_LANGUAGE, ({ language }) => {
        setLanguage(language);
      });

      // RECEIVE CHAT MESSAGE
       socketRef.current.on(Actions.RECEIVE_MESSAGE, (data) => {
        setMessages(prev => [...prev, data]);
         if (data.username !== username) {
    toast.success(`New message from ${data.username}`);
  }
      });

    };

    init();

    return () => {
      socketRef.current?.off(Actions.JOINED);
      socketRef.current?.off(Actions.DISCONNECTED);
      socketRef.current?.off(Actions.CODE_CHANGE);
      socketRef.current?.off(Actions.SYNC_CODE);
        socketRef.current.off(Actions.LANGUAGE_CHANGE);
      socketRef.current.off(Actions.SYNC_LANGUAGE);
      socketRef.current.off(Actions.RECEIVE_MESSAGE);
      socketRef.current?.disconnect();
    };
  }, []);

  // code typing occurs then code updates to new
  const handleCodeChange = (newCode) => {
    setCode(newCode);

      if (isRemoteUpdate.current) {
    isRemoteUpdate.current = false;
    return;
  }
    socketRef.current?.emit(Actions.CODE_CHANGE, {
      roomId,
      code: newCode,
    });
  };

  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    try {
    
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    toast.success("Room ID copied to clipboard!");
  } catch (err) {
    toast.error("Failed to copy Room ID.");}
  };

  const leaveRoom = () => {
    if (window.confirm("Are you sure you want to leave this room?")) {
      window.history.back();
    }
  };


const saveFile = async () => {
    try {
      const ext = extensionMap[language] || "txt";

      const options = {
        suggestedName: `code.${ext}`,
        types: [
          {
            description: `${language} file`,
            accept: {
              "text/plain": [`.${ext}`],
            },
          },
        ],
      };

      const handle = await window.showSaveFilePicker(options);
      const writable = await handle.createWritable();
      await writable.write(code);
      await writable.close();

      toast.success("File saved successfully!");
    } catch (err) {
      console.log(err);
    }
  };

 const handleLanguageChange = (newLang) => {
    setLanguage(newLang);

    socketRef.current.emit(Actions.LANGUAGE_CHANGE, {
      roomId,
      language: newLang,
    });
  };

    //function to send chat message and emit the message to server
    const sendMessage = () => {

    if (!messageInput.trim()) return;

    socketRef.current.emit(Actions.SEND_MESSAGE, {
      roomId,
      message: messageInput,
      username,
    });

    setMessageInput("");
  };





    return (
    <div className="d-flex vh-100 bg-light">

      {/* ---------- SIDEBAR ---------- */}
      <div className="bg-white border-end" style={{ width: 280 }}>

        <div className="p-4 h-100 d-flex flex-column">

          <img src={Logo} alt="logo" style={{ width: 120 }} className="mx-auto mb-3" />

          <h6 className="text-center">Room ID</h6>
          <code className="text-center">{roomId}</code>

          <h6 className="mt-3">Users ({clients.length})</h6>

          <div className="flex-grow-1 overflow-auto">
            {clients.map(client => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>

            <button className="btn btn-outline-primary w-100" onClick={copyRoomId} > 
              {copied ? "✓ Copied!" : "Copy Room ID"} 
              </button> 
              <button className="btn btn-outline-danger w-100 mt-2" onClick={leaveRoom} > 
                Leave Room 
                </button>
          <button className="btn btn-success mt-2" onClick={saveFile}>
            Save File
          </button>

        </div>
      </div>

      {/* ---------- EDITOR + CHAT ---------- */}
      <div className="flex-grow-1 d-flex">

        {/* ---------- EDITOR ---------- */}
        <div className="flex-grow-1 border-end d-flex flex-column">

          <Editor
            code={code}
            setCode={handleCodeChange}
            language={language}
            setLanguage={setLanguage}
            handleLanguageChange={handleLanguageChange}
          />

        </div>

        {/* ---------- CHAT PANEL ---------- */}
        <div style={{ width: 320 }} className="bg-white d-flex flex-column">

          <div className="border-bottom p-2 fw-bold text-center">
            Room Chat 💬
          </div>

          {/* Messages */}
          <div className="flex-grow-1 overflow-auto p-2" style={{ background: "#f8f9fa" }}>

            {messages.map((msg, index) => {

              const isOwn = msg.username === username;

              return (
                <div
                  key={index}
                  className={`d-flex mb-2 ${isOwn ? "justify-content-end" : "justify-content-start"}`}
                >
                  <div style={{ maxWidth: "70%" }}>

                    {!isOwn && (
                      <small className="text-primary fw-bold">
                        {msg.username}
                      </small>
                    )}

                    <div
                      className={`p-2 rounded ${
                        isOwn ? "bg-primary text-white" : "bg-success text-white"
                      }`}
                    >
                      {msg.message}
                    </div>

                    <small className="text-muted">{msg.time}</small>

                  </div>
                </div>
              );
            })}

            <div ref={chatEndRef} />

          </div>

          {/* Input */}
          <div className="border-top p-2 d-flex gap-2">

            <input
              className="form-control form-control-sm"
              placeholder="Type message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            <button className="btn btn-primary btn-sm" onClick={sendMessage}>
              Send
            </button>

          </div>

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