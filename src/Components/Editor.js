import React, { useEffect, useRef } from "react";
import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";

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

const Editor = ({ code, setCode, language, setLanguage ,handleLanguageChange}) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const languageCompartment = useRef(new Compartment());

  // ---------- Language Extension Mapper ----------
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

  // ---------- Initialize Editor ----------
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const startState = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,

        languageCompartment.current.of(
          getLanguageExtension(language)
        ),

        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setCode(update.state.doc.toString());
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

  // ---------- Update Language Dynamically ----------
  useEffect(() => {
    if (!viewRef.current) return;

    viewRef.current.dispatch({
      effects: languageCompartment.current.reconfigure(
        getLanguageExtension(language)
      ),
    });
  }, [language]);

  // ---------- Sync Code ----------
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

  // ---------- File Extension ----------
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

return (
    <div className="d-flex flex-column w-100 h-100" style={{ background: "#ffffff" }}>

      {/* Modern ToolBar */}
      <div className="bg-white border-bottom px-4 py-2 d-flex justify-content-between align-items-center flex-shrink-0 shadow-sm" style={{ zIndex: 5 }}>
        
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-1">
             <div className="bg-danger rounded-circle" style={{ width: 10, height: 10 }}></div>
             <div className="bg-warning rounded-circle" style={{ width: 10, height: 10 }}></div>
             <div className="bg-success rounded-circle" style={{ width: 10, height: 10 }}></div>
          </div>
          
          <div className="ms-2 d-flex gap-2">
            <span className="badge rounded-pill border text-dark fw-normal px-3 py-2 bg-light">
              <span className="text-muted">File:</span> editor.{getFileExtension(language)}
            </span>
            <span className="badge rounded-pill bg-dark bg-opacity-10 text-dark fw-bold px-3 py-2 border">
              {language.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <small className="text-muted fw-semibold d-none d-md-block" style={{ fontSize: '0.75rem' }}>LANGUAGE</small>
          <select
            className="form-select form-select-sm border-0 bg-light rounded-pill px-3 shadow-sm"
            style={{ width: "160px", fontSize: '0.85rem', cursor: 'pointer' }}
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
      </div>

      {/* Editor Surface */}
      <div className="flex-grow-1" style={{ overflow: "hidden", background: '#f8fafc' }}>
        <div
          ref={editorRef}
          className="h-100 w-100 modern-cm-wrapper"
          style={{
            fontSize: "15px",
            fontFamily: "'Fira Code', 'Courier New', monospace"
          }}
        />
      </div>

      <style>{`
        .modern-cm-wrapper .cm-editor {
          height: 100%;
          outline: none !important;
        }
        .modern-cm-wrapper .cm-scroller {
          font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default Editor;