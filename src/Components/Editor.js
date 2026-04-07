import React, { useEffect, useRef } from "react";
import { basicSetup } from "codemirror";
import { EditorView, Decoration, WidgetType } from "@codemirror/view";
import { EditorState, Compartment, StateField, StateEffect } from "@codemirror/state";

import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { sql } from "@codemirror/lang-sql";
import { php } from "@codemirror/lang-php";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";

import { Play, FileCode2, Code2, Loader2 } from "lucide-react"; // 🔥 Added Icons
import Actions from "../Actions";

// 🔥 Remote Cursor Setup
const setRemoteCursorsEffect = StateEffect.define();

const remoteCursorField = StateField.define({
  create() { return Decoration.none; },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes);
    for (let effect of tr.effects) {
      if (effect.is(setRemoteCursorsEffect)) return effect.value;
    }
    return decorations;
  },
  provide: f => EditorView.decorations.from(f),
});

class RemoteCursorWidget extends WidgetType {
  constructor(username, color) {
    super();
    this.username = username;
    this.color = color;
  }
  toDOM() {
    const wrapper = document.createElement("span");
    wrapper.style.position = "relative";

    const caret = document.createElement("span");
    caret.style.borderLeft = `2px solid ${this.color}`;
    caret.style.marginLeft = "-1px";
    caret.style.height = "1.2em";

    const label = document.createElement("div");
    label.textContent = this.username;
    label.style.position = "absolute";
    label.style.top = "-18px";
    label.style.background = this.color;
    label.style.color = "white";
    label.style.fontSize = "10px";
    label.style.padding = "2px 6px";
    label.style.borderRadius = "4px";
    label.style.whiteSpace = "nowrap";
    label.style.fontWeight = "bold";
    label.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

    wrapper.appendChild(caret);
    wrapper.appendChild(label);
    return wrapper;
  }
}

// 🎨 Color Generator
const getColor = (id) => {
  const colors = ["#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ec4899", "#14b8a6"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
  return colors[hash % colors.length];
};

// 🌟 CodeMirror Layout Fixes (Crucial for Scrolling)
const editorLayoutTheme = EditorView.theme({
  "&": { 
    height: "100%", // Force editor to take container height
    width: "100%"
  },
  ".cm-scroller": { 
    overflow: "auto", // Make it scrollable
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  ".cm-content": {
    paddingBottom: "100px", // Give space at the bottom so code isn't hugging the terminal
    paddingTop: "10px"
  },
  ".cm-gutters": {
    backgroundColor: "#f8fafc",
    color: "#94a3b8",
    borderRight: "1px solid #e2e8f0"
  },
  "&.cm-focused": {
    outline: "none" // Remove default focus ring for a cleaner look
  }
});


// 🧠 Editor Component
const Editor = ({
  code, setCode, language, handleLanguageChange, runCode, isRunning, socketRef, roomId, remoteCursors,
}) => {

  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const languageCompartment = useRef(new Compartment());

  const getLanguageExtension = (lang) => {
    const extensions = {
      javascript: javascript(), typescript: javascript({ typescript: true }),
      python: python(), java: java(), cpp: cpp(), html: html(), css: css(),
      json: json(), xml: xml(), sql: sql(), php: php(),
    };
    return extensions[lang] || javascript();
  };

  // 🚀 Initialize Editor
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const startState = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
        editorLayoutTheme, // 🔥 Inject the layout fixes here
        remoteCursorField,
        languageCompartment.current.of(getLanguageExtension(language)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) setCode(update.state.doc.toString());
          if (update.selectionSet) {
            const pos = update.state.selection.main.head;
            socketRef?.current?.emit(Actions.CURSOR_POSITION, { roomId, cursor: pos });
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // 🔄 Update Language
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: languageCompartment.current.reconfigure(getLanguageExtension(language)),
    });
  }, [language]);

  // 🔄 Sync Code
  useEffect(() => {
    if (!viewRef.current) return;
    const currentDoc = viewRef.current.state.doc.toString();
    if (currentDoc !== code) {
      viewRef.current.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: code },
      });
    }
  }, [code]);

  // 👥 Render Remote Cursors
  useEffect(() => {
    if (!viewRef.current) return;
    const docLength = viewRef.current.state.doc.length;
    const decorations = [];

    Object.entries(remoteCursors || {}).forEach(([socketId, data]) => {
      if (!data || typeof data.position !== "number") return;
      const pos = Math.max(0, Math.min(data.position, docLength));
      const color = getColor(socketId);
      decorations.push({
        from: pos,
        deco: Decoration.widget({
          widget: new RemoteCursorWidget(data.username, color),
          side: 1,
        }),
      });
    });

    decorations.sort((a, b) => a.from - b.from);
    const ranges = decorations.map(d => d.deco.range(d.from));
    const decoSet = Decoration.set(ranges, true);

    viewRef.current.dispatch({
      effects: setRemoteCursorsEffect.of(decoSet),
    });
  }, [remoteCursors]);

  const getFileExtension = (lang) => {
    const extensions = {
      javascript: "js", python: "py", java: "java", cpp: "cpp", html: "html",
      css: "css", json: "json", xml: "xml", sql: "sql", php: "php", typescript: "ts",
    };
    return extensions[lang] || "txt";
  };

  return (
    <div className="d-flex flex-column w-100 h-100 bg-white">
      
      {/* ---------- EDITOR TOOLBAR ---------- */}
      <div 
        className="px-4 py-2 d-flex justify-content-between align-items-center flex-shrink-0" 
        style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
      >
        {/* Left Side: File Info */}
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded p-1">
            <FileCode2 size={16} />
          </div>
          <span className="fw-semibold text-dark" style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>
            main.{getFileExtension(language)}
          </span>
        </div>

        {/* Right Side: Controls */}
        <div className="d-flex align-items-center gap-3">
          
          {/* Language Selector */}
          <div className="d-flex align-items-center gap-2 bg-white border rounded px-2 py-1 shadow-sm">
            <Code2 size={14} className="text-muted" />
            <select
              className="form-select form-select-sm border-0 shadow-none p-0 pe-3 bg-transparent cursor-pointer"
              style={{ width: "110px", fontSize: '0.85rem', fontWeight: "500", color: "#475569" }}
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="sql">SQL</option>
              <option value="php">PHP</option>
            </select>
          </div>

          {/* Run Button */}
          <button
            className="btn btn-success btn-sm d-flex align-items-center gap-2 px-3 fw-bold shadow-sm custom-run-btn"
            onClick={runCode}
            disabled={isRunning}
            style={{ 
              borderRadius: "8px", 
              background: isRunning ? "#9ca3af" : "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              transition: "all 0.2s ease"
            }}
          >
            {isRunning ? (
              <><Loader2 size={14} className="spin-animation" /> Executing...</>
            ) : (
              <><Play size={14} fill="currentColor" /> Run Code</>
            )}
          </button>
        </div>
      </div>

      {/* ---------- EDITOR CORE ---------- */}
      {/* The parent must have flex-grow-1 AND minHeight: 0 so it doesn't push the terminal down.
        CodeMirror's internal styling (editorLayoutTheme) handles the actual scrolling.
      */}
      <div className="flex-grow-1 position-relative" style={{ minHeight: 0, background: "#ffffff" }}>
        <div
          ref={editorRef}
          className="h-100 w-100"
          style={{ fontSize: "14px" }}
        />
      </div>

      {/* Custom Styles for Spinners and Buttons */}
      <style>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        .custom-run-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
        }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </div>
  );
};

export default Editor;