import React, { useEffect, useRef, useState } from "react";
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

const Editor = ({ code, setCode, language: initialLanguage = "javascript" }) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const [language, setLanguage] = useState(initialLanguage);

  // ⭐ Compartment for dynamic language switching
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
      ruby: python(), // fallback
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

        // ⭐ Language compartment
        languageCompartment.current.of(
          getLanguageExtension(language)
        ),

        // Listen to code changes
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

  // ---------- Update Language (Without Resetting Code) ----------
  useEffect(() => {
    if (!viewRef.current) return;

    viewRef.current.dispatch({
      effects: languageCompartment.current.reconfigure(
        getLanguageExtension(language)
      ),
    });
  }, [language]);

  // ---------- Update Code Externally ----------
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

  // ---------- Language Change Handler ----------
  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  // ---------- File Extension Helper ----------
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
      ruby: "rb",
      typescript: "ts",
    };

    return extensions[lang] || "txt";
  };

  return (
    <div className="d-flex flex-column w-100 h-100">
      {/* ---------- Toolbar ---------- */}
      <div className="bg-light border-bottom px-3 py-2 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <span className="badge bg-primary">
            editor.{getFileExtension(language)}
          </span>

          <span className="badge bg-secondary">
            {language.toUpperCase()}
          </span>
        </div>

        <select
          className="form-select form-select-sm"
          style={{ width: "150px" }}
          value={language}
          onChange={handleLanguageChange}
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

      {/* ---------- CodeMirror Editor ---------- */}
      <div
        ref={editorRef}
        className="flex-grow-1 overflow-auto"
        style={{ fontSize: "14px" }}
      />
    </div>
  );
};

export default Editor;