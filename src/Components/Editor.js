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

import Actions from "../Actions";


// 🔥 Remote Cursor Setup

const setRemoteCursorsEffect = StateEffect.define();

const remoteCursorField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes);

    for (let effect of tr.effects) {
      if (effect.is(setRemoteCursorsEffect)) {
        return effect.value;
      }
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
    label.style.padding = "2px 4px";
    label.style.borderRadius = "4px";
    label.style.whiteSpace = "nowrap";

    wrapper.appendChild(caret);
    wrapper.appendChild(label);

    return wrapper;
  }
}


// 🎨 Color Generator

const getColor = (id) => {
  const colors = ["#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#f59e0b"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash += id.charCodeAt(i);
  }
  return colors[hash % colors.length];
};


// 🧠 Editor Component

const Editor = ({
  code,
  setCode,
  language,
  handleLanguageChange,
  runCode,
  isRunning,
  socketRef,
  roomId,
  remoteCursors,
}) => {

  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const languageCompartment = useRef(new Compartment());

  // Language Extension Mapper

  const getLanguageExtension = (lang) => {
    const extensions = {
      javascript: javascript(),
      typescript: javascript({ typescript: true }),
      python: python(),
      java: java(),
      cpp: cpp(),
      html: html(),
      css: css(),
      json: json(),
      xml: xml(),
      sql: sql(),
      php: php(),
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
        remoteCursorField,

        languageCompartment.current.of(
          getLanguageExtension(language)
        ),

        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setCode(update.state.doc.toString());
          }

          if (update.selectionSet) {
            const pos = update.state.selection.main.head;

            socketRef?.current?.emit(Actions.CURSOR_POSITION, {
              roomId,
              cursor: pos,
            });
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


  //  Update Language

  useEffect(() => {
    if (!viewRef.current) return;

    viewRef.current.dispatch({
      effects: languageCompartment.current.reconfigure(
        getLanguageExtension(language)
      ),
    });
  }, [language]);


  // 🔄 Sync Code

  useEffect(() => {
    if (!viewRef.current) return;

    const currentDoc = viewRef.current.state.doc.toString();

    if (currentDoc !== code) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: code,
        },
      });
    }
  }, [code]);


  // 👥 Render Remote Cursors

  useEffect(() => {
    if (!viewRef.current) return;

    const decorations = [];

    Object.entries(remoteCursors || {}).forEach(([socketId, data]) => {
      const color = getColor(socketId);

      decorations.push(
        Decoration.widget({
          widget: new RemoteCursorWidget(data.username, color),
          side: 1,
        }).range(data.position)
      );
    });

    const decoSet = Decoration.set(decorations);

    viewRef.current.dispatch({
      effects: setRemoteCursorsEffect.of(decoSet),
    });

  }, [remoteCursors]);


  // 📁 File Extension Helper

  const getFileExtension = (lang) => {
    const extensions = {
      javascript: "js",
      python: "py",
      java: "java",
      cpp: "cpp",
      html: "html",
      css: "css",
      json: "json",
      xml: "xml",
      sql: "sql",
      php: "php",
      typescript: "ts",
    };

    return extensions[lang] || "txt";
  };


  // 🖥 UI

  return (
    <div className="d-flex flex-column w-100 h-100" style={{ background: "#ffffff" }}>

      {/* Toolbar */}
      <div className="bg-white border-bottom px-4 py-2 d-flex justify-content-between align-items-center flex-shrink-0 shadow-sm">

        <div className="d-flex align-items-center gap-3">
          <span className="badge bg-light text-dark border">
            editor.{getFileExtension(language)}
          </span>
          <span className="badge bg-dark bg-opacity-10 text-dark border">
            {language.toUpperCase()}
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: "150px" }}
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

          <button
            className="btn btn-success btn-sm"
            onClick={runCode}
            disabled={isRunning}
          >
            {isRunning ? "Running..." : "▶ Run"}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-grow-1" style={{ overflow: "hidden" }}>
        <div
          ref={editorRef}
          className="h-100 w-100"
          style={{
            fontSize: "15px",
            fontFamily: "'Fira Code', monospace"
          }}
        />
      </div>

    </div>
  );
};

export default Editor;