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

const Editor = ({ code, setCode, language, setLanguage }) => {
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
  <div className="d-flex flex-column w-100 h-100" style={{ overflow: "hidden" }}>

    {/* Toolbar */}
    <div className="bg-light border-bottom px-3 py-2 d-flex justify-content-between flex-shrink-0">

      <div className="d-flex gap-2">
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
        onChange={(e) => setLanguage(e.target.value)}
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

    {/* ⭐ Scrollable Editor ONLY */}
    <div
      className="flex-grow-1"
      style={{
        overflow: "auto",
        minHeight: 0,   // ⭐ VERY IMPORTANT FIX
      }}
    >
      <div
        ref={editorRef}
        style={{
          height: "100%",
          fontSize: "14px",
        }}
      />
    </div>
  </div>
);
};

export default Editor;