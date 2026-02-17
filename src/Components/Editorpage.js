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
  const { roomId } = useParams();
  const location = useLocation();
  const { username } = location.state || { username: "Anonymous" };

  const socketRef = useRef(null);
  const codeRef = useRef(null); // ⭐ For latest code reference
  const reactNavigator = useNavigate();
  const languageRef = useRef(null); // ⭐ For latest language reference
  const [clients, setClients] = useState([]);
  const [language, setLanguage] = useState("javascript");

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
      socketRef.current.on(Actions.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          setCode(code);
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

    };

    init();

    return () => {
      socketRef.current?.off(Actions.JOINED);
      socketRef.current?.off(Actions.DISCONNECTED);
      socketRef.current?.off(Actions.CODE_CHANGE);
      socketRef.current?.off(Actions.SYNC_CODE);
        socketRef.current.off(Actions.LANGUAGE_CHANGE);
      socketRef.current.off(Actions.SYNC_LANGUAGE);
      socketRef.current?.disconnect();
    };
  }, []);

  // code typing occurs then code updates to new
  const handleCodeChange = (newCode) => {
    setCode(newCode);

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






  return (
    <div className="d-flex vh-100 bg-light" style={{ overflow:"inherit" }}>
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
            <button
              className="btn btn-success"
              onClick={saveFile}
            >
              Save File
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
         <Editor
  code={code}
  setCode={handleCodeChange}
  language={language}
  setLanguage={setLanguage}
  handleLanguageChange={handleLanguageChange} // Pass the new handler
/>
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