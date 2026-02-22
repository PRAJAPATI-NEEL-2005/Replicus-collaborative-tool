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


const [output, setOutput] = useState("");
const [inputValue, setInputValue] = useState("");
const [isRunning, setIsRunning] = useState(false);
const pistonLanguageMap = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  cpp: "cpp",
  html: "html",
  css: "css",
  json: "json",
  xml: "xml",
  sql: "sql",
  php: "php",
};



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

//run code function here
const runCode = async () => {
  try {
    setIsRunning(true);
    setOutput("Running...");

    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/run`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: pistonLanguageMap[language],
          code,
          input: inputValue,
        }),
      }
    );

    const data = await response.json();

    if (data.compile?.stderr) {
      setOutput(data.compile.stderr);
    } else if (data.run?.stderr) {
      setOutput(data.run.stderr);
    } else {
      setOutput(data.run?.stdout || "No output");
    }

  } catch (error) {
    setOutput("Error executing code.");
  } finally {
    setIsRunning(false);
  }
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
    <div className="d-flex vh-100" style={{ backgroundColor: "#f8fafc" }}>

      {/* ---------- SIDEBAR: Deep Slate Theme ---------- */}
    <div 
  className="bg-white d-flex flex-column border-end shadow-sm" 
  style={{ width: 280, zIndex: 10 }}
>
  <div className="p-4 h-100 d-flex flex-column">
    
    {/* Logo Area */}
    <div className="text-center mb-4">
      <img src={Logo} alt="logo" style={{ width: 140 }} />
      <div className="mt-3" style={{ height: '2px', background: '#f1f5f9', borderRadius: '2px' }}></div>
    </div>

    {/* Room ID Box: Soft Pastel Style */}
    <div 
      className="rounded p-3 mb-4 text-center border" 
      style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}
    >
      <small 
        className="text-uppercase fw-bold text-muted mb-1 d-block" 
        style={{ fontSize: '0.65rem', letterSpacing: '1px' }}
      >
        Room Workspace
      </small>
      <code className="text-primary fw-bold" style={{ fontSize: '0.95rem' }}>
        {roomId}
      </code>
    </div>

    {/* Users Header */}
    <h6 
      className="d-flex align-items-center gap-2 mb-3 text-dark fw-bold" 
      style={{ fontSize: '0.85rem' }}
    >
      <span 
        className="bg-success rounded-circle shadow-sm" 
        style={{ width: 10, height: 10, border: '2px solid #fff' }}
      ></span>
      Collaborators 
      <span className="badge rounded-pill bg-light text-primary border ms-auto">
        {clients.length}
      </span>
    </h6>

    {/* User List */}
    <div className="flex-grow-1 overflow-auto pe-2 custom-scrollbar-light">
      {clients.map(client => (
        <Client key={client.socketId} username={client.username} />
      ))}
    </div>

    {/* Action Buttons: Clean & Vibrant */}
    <div className="mt-auto d-flex flex-column gap-2 pt-3 border-top">
      <button 
        className="btn btn-light w-100 border py-2 fw-semibold text-dark shadow-sm hover-lift" 
        onClick={copyRoomId}
        style={{ background: '#ffffff' }}
      > 
        {copied ? "✓ Copied!" : "Copy Room ID"} 
      </button> 
      
      <button 
        className="btn btn-link text-danger w-100 border shadow-sm mt-1 py-2 fw-semibold text-decoration-none hover-lift" 
        onClick={leaveRoom} 
        style={{ fontSize: '0.9rem' }}
      > 
        Leave Room 
      </button>
      <button 
        className="btn btn-primary w-100 border-0 shadow-sm py-2 fw-semibold" 
        onClick={saveFile} 
        style={{ background: '#6366f1' }}
      >
        Save File
      </button>

    </div>
  </div>

  {/* In-component CSS for the Scrollbar */}
  <style>{`
    .custom-scrollbar-light::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar-light::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar-light::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 10px;
    }
    .custom-scrollbar-light::-webkit-scrollbar-thumb:hover {
      background: #cbd5e1;
    }
    .hover-lift:hover {
      background: #fdfdfd !important;
      transform: translateY(-1px);
      transition: all 0.2s;
    }
  `}</style>
</div>

      {/* ---------- MAIN CONTENT AREA ---------- */}
      <div className="flex-grow-1 d-flex overflow-hidden">

        {/* ---------- EDITOR ---------- */}
        <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
          <Editor
            code={code}
            setCode={handleCodeChange}
            language={language}
            setLanguage={setLanguage}
            handleLanguageChange={handleLanguageChange}
            runCode={runCode}
            isRunning={isRunning}
          />
        </div>
          {/* INPUT BOX */}
  <div className="p-2 border-top bg-light">
    <textarea
      className="form-control"
      placeholder="Custom Input (optional)"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      rows={2}
    />
  </div>

  {/* OUTPUT PANEL */}
  <div
    className="p-3 bg-dark text-success"
    style={{
      height: "180px",
      overflowY: "auto",
      fontFamily: "monospace",
      whiteSpace: "pre-wrap",
    }}
  >
    {output}
  </div>
        {/* ---------- CHAT PANEL: Modern Floating Style ---------- */}
        <div 
          className="bg-white d-flex flex-column border-start shadow-sm"
          style={{ width: 350, zIndex: 5 }}
        >
          {/* Header */}
          <div 
  className="p-3 d-flex align-items-center justify-content-between bg-white bg-opacity-75"
  style={{ 
    backdropFilter: 'blur(10px)', 
    borderBottom: '1px solid rgba(0,0,0,0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 10
  }}
>
  <div className="d-flex align-items-center gap-3">
    {/* Modern Gradient Icon */}
    <div 
      className="d-flex align-items-center justify-content-center shadow-sm"
      style={{ 
        width: '42px', 
        height: '42px', 
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        color: 'white'
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
      </svg>
    </div>

    {/* Title and Animated Status */}
    <div>
      <h6 className="mb-0 fw-bold text-dark" style={{ letterSpacing: '-0.3px', fontSize: '1rem' }}>
        Room Chat
      </h6>
      <div className="d-flex align-items-center gap-2">
        <div className="position-relative d-flex align-items-center">
          <span 
            className="position-absolute rounded-circle bg-success animate-ping" 
            style={{ width: '8px', height: '8px', opacity: 0.6 }}
          ></span>
          <span 
            className="rounded-circle bg-success" 
            style={{ width: '8px', height: '8px', position: 'relative' }}
          ></span>
        </div>
        <small className="text-muted fw-medium" style={{ fontSize: '0.75rem' }}>
          Live Sync Active
        </small>
      </div>
    </div>
  </div>
  <style>{`
    @keyframes ping {
      75%, 100% {
        transform: scale(2.5);
        opacity: 0;
      }
    }
    .animate-ping {
      animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
  `}</style>
</div>

          {/* Messages */}
          <div className="flex-grow-1 overflow-auto p-3 bg-light bg-opacity-50">
            {messages.map((msg, index) => {
              const isOwn = msg.username === username;
              return (
                <div key={index} className={`d-flex mb-3 ${isOwn ? "justify-content-end" : "justify-content-start"}`}>
                  <div style={{ maxWidth: "85%" }}>
                    {!isOwn && (
                      <small className="fw-bold text-primary ms-1 mb-1 d-block" style={{ fontSize: '0.7rem' }}>
                        {msg.username}
                      </small>
                    )}
                    <div
                      className={`px-3 py-2 ${isOwn ? "bg-primary text-white shadow" : "bg-white text-dark border shadow-sm"}`}
                      style={{ 
                        borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        fontSize: '0.9rem'
                      }}
                    >
                      {msg.message}
                    </div>
                    <div className={`mt-1 ${isOwn ? "text-end" : "text-start"}`}>
                      <small className="text-muted" style={{ fontSize: '0.65rem' }}>{msg.time}</small>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 bg-white border-top">
            <div className="input-group bg-light rounded-pill px-2 py-1 align-items-center shadow-inner border">
              <input
                type="text"
                className="form-control border-0 bg-transparent shadow-none py-1"
                placeholder="Message collaborators..."
                style={{ fontSize: '0.85rem' }}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button 
                className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm" 
                style={{ width: 32, height: 32, background: '#6366f1' }}
                onClick={sendMessage}
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.001.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
                </svg>
              </button>
            </div>
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