import React, { useEffect, useState, useRef } from "react";
import Editor from "./Editor";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Client from "./Client";
import Logo from "./logo.png";
import { initsocket } from "../socket";
import Actions from "../Actions";
import toast from "react-hot-toast";
import { Copy, Share2, Save, LogOut, MessageSquare, Send, Terminal, Activity, Users } from "lucide-react"; // 🔥 Added Lucide Icons
import { Spinner } from "react-bootstrap";
const Editorpage = () => {
  const isRemoteUpdate = useRef(false);
  const { roomId } = useParams();
  const location = useLocation();
  const { username,user } = location.state || { username: "Anonymous" };
  const lastToastTimeRef = useRef(0);
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const codeRef = useRef(null); 
  const reactNavigator = useNavigate();
  const languageRef = useRef(null); 
  const [clients, setClients] = useState([]);
  const [language, setLanguage] = useState("javascript");
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const isRemoteInputUpdate = useRef(false);

  const [output, setOutput] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [remoteCursors, setRemoteCursors] = useState({});

  const inputRef = useRef("");

  useEffect(() => {
    inputRef.current = inputValue;
  }, [inputValue]);

  const runnableLanguages = ["javascript", "typescript", "python", "java", "cpp", "c", "php"];

  const extensionMap = {
    javascript: "js", typescript: "ts", python: "py", java: "java", cpp: "cpp",
    html: "html", css: "css", json: "json", xml: "xml", sql: "sql", php: "php",
  };

  const runCode = async () => {
    if (!runnableLanguages.includes(language)) {
      toast.error(`${language.toUpperCase()} cannot be executed.`);
      return;
    }
    try {
      setIsRunning(true);
      socketRef.current?.emit(Actions.RUN_STATE_CHANGE, { roomId, isRunning: true });
      setOutput("Running...");
      socketRef.current?.emit(Actions.OUTPUT_UPDATE, { roomId, output: "Running..." });

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, input: inputValue }),
      });

      const data = await response.json();

      if (data.error) {
        setOutput(JSON.stringify(data.error));
        socketRef.current?.emit(Actions.OUTPUT_UPDATE, { roomId, output: JSON.stringify(data.error) });
      } else {
        const formattedOutput = `${data.output || "No Output"}\n\n[CPU Time: ${data.cpuTime}s | Memory: ${data.memory} KB]`;
        setOutput(formattedOutput);
        socketRef.current?.emit(Actions.OUTPUT_UPDATE, { roomId, output: formattedOutput });
      }
    } catch (error) {
      setOutput("Error executing code.");
    } finally {
      setIsRunning(false);
      socketRef.current?.emit(Actions.RUN_STATE_CHANGE, { roomId, isRunning: false });
    }
  };

  const [code, setCode] = useState(`// Welcome to the Replicus collaborative terminal!
// Start writing your code here.

function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("Developer"));
`);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => { languageRef.current = language; }, [language]);

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

      socketRef.current.emit(Actions.JOIN, { roomId, username,userId: user._id,  email: user.email });

      socketRef.current.on(Actions.JOINED, ({ clients, username, socketId }) => {
        if (username !== location.state.username) {
          toast.success(`${username} joined the room.`);
        }
        setClients(clients);
        socketRef.current.emit(Actions.SYNC_CODE, { code: codeRef.current, socketId });
        socketRef.current.emit(Actions.SYNC_LANGUAGE, { socketId, language: languageRef.current });
        socketRef.current.emit(Actions.INPUT_SYNC, { socketId, input: inputRef.current });
      });

      socketRef.current.on(Actions.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => prev.filter((client) => client.socketId !== socketId));
        setRemoteCursors(prev => {
          const updated = { ...prev };
          delete updated[socketId];
          return updated;
        });
      });

      socketRef.current.on(Actions.CODE_CHANGE, ({ code, username }) => {
        if (code !== null) {
          isRemoteUpdate.current = true;
          setCode(code);
        }
        const now = Date.now();
        if (now - lastToastTimeRef.current > 3000) {
          toast.success(`Code updated by ${username}`);
          lastToastTimeRef.current = now;
        }
      });

      socketRef.current.on(Actions.SYNC_CODE, ({ code }) => { if (code !== null) setCode(code); });
      socketRef.current.on(Actions.LANGUAGE_CHANGE, ({ language, username }) => {
        setLanguage(language);
        toast.success(`${username} changed language to ${language}`);
      });
      socketRef.current.on(Actions.SYNC_LANGUAGE, ({ language }) => { setLanguage(language); });

      socketRef.current.on(Actions.RUN_STATE_CHANGE, ({ isRunning, username }) => {
        setIsRunning(isRunning);
        if (username !== location.state.username) {
          toast.success(`${username} ${isRunning ? "started" : "finished"} running the code.`);
        }
      });

      socketRef.current.on(Actions.INPUT_CHANGE, ({ input, username }) => {
        isRemoteInputUpdate.current = true; 
        setInputValue(input);
        if (username !== location.state.username) {
          const now = Date.now();
          if (now - lastToastTimeRef.current > 3000) {
            toast.success(`Input updated by ${username}`);
            lastToastTimeRef.current = now;
          }
        }
      });

      socketRef.current.on(Actions.OUTPUT_UPDATE, ({ output }) => { setOutput(output); });
      socketRef.current.on(Actions.INPUT_SYNC, ({ input }) => { setInputValue(input); });

      socketRef.current.on(Actions.RECEIVE_MESSAGE, (data) => {
        setMessages(prev => [...prev, data]);
        if (data.username !== username) {
          toast.success(`New message from ${data.username}`);
        }
      });

      socketRef.current.on(Actions.CURSOR_POSITION, ({ cursor, username, socketId }) => {
        setRemoteCursors(prev => ({ ...prev, [socketId]: { position: cursor, username } }));
      });
    };

    init();

    return () => {
      socketRef.current?.off(Actions.JOINED);
      socketRef.current?.off(Actions.DISCONNECTED);
      socketRef.current?.off(Actions.CODE_CHANGE);
      socketRef.current?.off(Actions.SYNC_CODE);
      socketRef.current?.off(Actions.LANGUAGE_CHANGE);
      socketRef.current?.off(Actions.SYNC_LANGUAGE);
      socketRef.current?.off(Actions.RECEIVE_MESSAGE);
      socketRef.current?.off(Actions.INPUT_CHANGE);
      socketRef.current?.off(Actions.OUTPUT_UPDATE);
      socketRef.current?.off(Actions.RUN_STATE_CHANGE);
      socketRef.current?.off(Actions.INPUT_SYNC);
      socketRef.current?.disconnect();
    };
  }, []);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    socketRef.current?.emit(Actions.CODE_CHANGE, { roomId, code: newCode });
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
      toast.error("Failed to copy Room ID.");
    }
  };

  const leaveRoom = () => {
    if (window.confirm("Are you sure you want to leave this secure session?")) {
      window.history.back();
    }
  };

  const saveFile = async () => {
    try {
      const ext = extensionMap[language] || "txt";
      const options = {
        suggestedName: `replicus_code.${ext}`,
        types: [{ description: `${language} file`, accept: { "text/plain": [`.${ext}`] } }],
      };
      const handle = await window.showSaveFilePicker(options);
      const writable = await handle.createWritable();
      await writable.write(code);
      await writable.close();
      toast.success("File saved securely!");
    } catch (err) {
      console.log(err);
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    socketRef.current.emit(Actions.LANGUAGE_CHANGE, { roomId, language: newLang });
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    socketRef.current.emit(Actions.SEND_MESSAGE, { roomId, message: messageInput, username ,userId: user._id,  email: user.email});
    setMessageInput("");
  };

  const handleInputChange = (e) => {
    const newInput = e.target.value;
    setInputValue(newInput);
    if (isRemoteInputUpdate.current) {
      isRemoteInputUpdate.current = false;
      return;
    }
    socketRef.current.emit(Actions.INPUT_CHANGE, { roomId, input: newInput });
  };

  const shareRoom = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
           title: 'Join Replicus Terminal',
          text: `Join my live collaborative coding workspace on Replicus.\n\nRoom ID: ${roomId}\n\nUse the link below to join:`,
          url: `${process.env.REACT_APP_FRONTEND_URL}`
        });
      } catch (error) { console.log('Error sharing room:', error); }
    } else {
      alert('Sharing is not supported on this browser. Please use "Copy ID" instead.');
    }
  };

  return (
    <div className="d-flex vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ---------- LEFT SIDEBAR: COLLABORATORS & ACTIONS ---------- */}
      <div className="bg-white d-flex flex-column border-end shadow-sm" style={{ width: 260, zIndex: 10 }}>
        <div className="p-4 h-100 d-flex flex-column">
          
          <div className="text-center mb-4">
            <img src={Logo} alt="Replicus Logo" style={{ width: 120 }} />
            <div className="mt-3 bg-light rounded" style={{ height: '2px' }}></div>
          </div>

          <div className="rounded p-3 mb-4 text-center border bg-light">
            <small className="text-uppercase fw-bold text-muted mb-1 d-block" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>
              Secure Session ID
            </small>
            <code className="fw-bold" style={{ fontSize: '0.9rem', color: '#2563eb' }}>
              {roomId}
            </code>
          </div>

          <h6 className="d-flex align-items-center gap-2 mb-3 text-dark fw-bold" style={{ fontSize: '0.85rem' }}>
            <Users size={16} className="text-primary" />
            Active Pilots 
            <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary ms-auto">
              {clients.length}
            </span>
          </h6>

          <div className="flex-grow-1 overflow-auto pe-2 custom-scrollbar-light">
            {[...clients]
              .sort((a, b) => (a.username === username ? -1 : b.username === username ? 1 : 0))
              .map(client => (
                <Client key={client.socketId} username={client.username === username ? `${client.username} (You)` : client.username} />
            ))}
          </div>

          <div className="mt-auto d-flex flex-column gap-2 pt-3 border-top">
            <div className="d-flex gap-2">
              <button className="btn btn-light flex-grow-1 border py-2 fw-semibold text-dark hover-lift d-flex align-items-center justify-content-center gap-2" onClick={copyRoomId} style={{ fontSize: '0.85rem' }}> 
                <Copy size={14} /> {copied ? "Copied" : "Copy"} 
              </button> 
              <button className="btn btn-light flex-grow-1 border py-2 fw-semibold text-primary hover-lift d-flex align-items-center justify-content-center gap-2" onClick={shareRoom} style={{ fontSize: '0.85rem' }}> 
                <Share2 size={14} /> Share
              </button>
            </div>
            
            <button className="btn btn-primary w-100 border-0 shadow-sm py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 hover-lift" onClick={saveFile} style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)', fontSize: '0.9rem' }}>
              <Save size={16} /> Export File
            </button>

            <button className="btn btn-link text-danger w-100 mt-1 py-2 fw-semibold text-decoration-none hover-lift d-flex align-items-center justify-content-center gap-2" onClick={leaveRoom} style={{ fontSize: '0.85rem' }}> 
              <LogOut size={16} /> Disconnect 
            </button>
          </div>
        </div>
      </div>

      {/* ---------- MIDDLE COLUMN: EDITOR & CONSOLE ---------- */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden position-relative">
        
        {/* Editor Area */}
        <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0 }}>
          <Editor
            code={code}
            setCode={handleCodeChange}
            language={language}
            setLanguage={setLanguage}
            handleLanguageChange={handleLanguageChange}
            runCode={runCode}
            isRunning={isRunning}
            isRunnable={runnableLanguages.includes(language)}
            socketRef={socketRef}
            roomId={roomId}
            username={username}
            remoteCursors={remoteCursors}
          />
        </div>

        {/* Integrated Terminal Panel */}
        <div className="border-top shadow-lg d-flex flex-column" style={{ height: "280px", background: "#0f172a" }}>
          
          {/* Terminal Headers */}
          <div className="d-flex align-items-center border-bottom border-secondary border-opacity-25" style={{ background: "#020617" }}>
            <div className="w-50 px-3 py-2 border-end border-secondary border-opacity-25 d-flex align-items-center gap-2">
              <Terminal size={14} className="text-secondary" />
              <small className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Standard Input</small>
            </div>
            <div className="w-50 px-3 py-2 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <Activity size={14} className={isRunning ? "text-info" : "text-success"} />
                <small className="text-uppercase fw-bold text-light" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Terminal Output</small>
              </div>
              {isRunning && <Spinner animation="border" size="sm" variant="info" />}
            </div>
          </div>

          {/* Terminal Bodies */}
          <div className="d-flex flex-grow-1 overflow-hidden">
            
            {/* Input Box */}
            <textarea
              className="w-50 h-100 border-0 shadow-none p-3 border-end border-secondary border-opacity-25"
              placeholder="Enter runtime inputs here..."
              value={inputValue}
              onChange={handleInputChange}
              style={{ 
                background: "#1e293b", 
                color: "#e2e8f0",
                fontSize: '0.85rem', 
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                resize: 'none',
                outline: 'none'
              }}
            />

            {/* Output Box */}
            <div
              className="w-50 h-100 p-3 custom-scrollbar-dark"
              style={{
                color: "#10b981", // Hacker green
                background: "transparent",
                overflowY: "auto",
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: "0.85rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {output ? output : (
                <span className="text-secondary opacity-50 fst-italic">
                  Awaiting execution. Run your code to view results...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- RIGHT SIDEBAR: CHAT ---------- */}
      <div className="bg-white d-flex flex-column border-start shadow-sm" style={{ width: 320, zIndex: 5 }}>
        
        {/* Chat Header */}
        <div className="p-3 d-flex align-items-center gap-3 bg-white border-bottom" style={{ zIndex: 10 }}>
          <div className="d-flex align-items-center justify-content-center shadow-sm rounded-3 text-white" style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            <MessageSquare size={18} />
          </div>
          <div>
            <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.95rem' }}>Team Chat</h6>
            <div className="d-flex align-items-center gap-2 mt-1">
              <div className="position-relative d-flex align-items-center">
                <span className="position-absolute rounded-circle bg-success animate-ping" style={{ width: '8px', height: '8px', opacity: 0.6 }}></span>
                <span className="rounded-circle bg-success position-relative" style={{ width: '8px', height: '8px' }}></span>
              </div>
              <small className="text-muted fw-medium" style={{ fontSize: '0.7rem' }}>Secure Sync Active</small>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-grow-1 overflow-auto p-3 custom-scrollbar-light" style={{ background: "#f8fafc" }}>
          {messages.map((msg, index) => {
            const isOwn = msg.username === username;
            return (
              <div key={index} className={`d-flex mb-3 ${isOwn ? "justify-content-end" : "justify-content-start"}`}>
                <div style={{ maxWidth: "85%" }}>
                  {!isOwn && <small className="fw-bold text-primary ms-1 mb-1 d-block" style={{ fontSize: '0.7rem' }}>{msg.username}</small>}
                  <div
                    className={`px-3 py-2 shadow-sm ${isOwn ? "text-white" : "bg-white text-dark border"}`}
                    style={{ 
                      background: isOwn ? 'linear-gradient(90deg, #2563eb, #4f46e5)' : '#fff',
                      borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      fontSize: '0.85rem'
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
          <div className="input-group bg-light rounded-pill px-2 py-1 align-items-center border focus-ring-custom transition-all">
            <input
              type="text"
              className="form-control border-0 bg-transparent shadow-none py-2"
              placeholder="Type a message..."
              style={{ fontSize: '0.85rem' }}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button 
              className="btn rounded-circle d-flex align-items-center justify-content-center p-0 text-white shadow-sm hover-lift ms-1" 
              style={{ width: 34, height: 34, background: '#2563eb' }}
              onClick={sendMessage}
            >
              <Send size={14} style={{ marginLeft: '-2px', marginTop: '2px' }} />
            </button>
          </div>
        </div>

      </div>

      {/* Global Scoped Styles */}
      <style>{`
        .custom-scrollbar-light::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .custom-scrollbar-dark::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar-dark::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }

        .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important; }

        .focus-ring-custom:focus-within {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        @keyframes ping {
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }
        .animate-ping { animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
      `}</style>

    </div>
  );
};

export default function App() {
  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
      <Editorpage />
    </>
  );
}