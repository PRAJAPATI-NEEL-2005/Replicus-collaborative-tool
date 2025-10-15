import React, { useEffect, useRef, useState } from 'react';
import { basicSetup } from 'codemirror';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { sql } from '@codemirror/lang-sql';
import { php } from '@codemirror/lang-php';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';

const Editor = ({ code, setCode, language: initialLanguage = 'javascript' }) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const [language, setLanguage] = useState(initialLanguage);

  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const startState = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
        getLanguageExtension(language),
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
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  // Update language
  useEffect(() => {
    if (viewRef.current) {
      const currentDoc = viewRef.current.state.doc.toString();
      const newState = EditorState.create({
        doc: currentDoc,
        extensions: [
          basicSetup,
          getLanguageExtension(language),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              setCode(update.state.doc.toString());
            }
          }),
        ],
      });
      viewRef.current.setState(newState);
    }
  }, [language]);

  // Update code externally
  useEffect(() => {
    if (viewRef.current) {
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
    }
  }, [code]);

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
      ruby: python(), // Use python as fallback
    };
    return extensions[lang] || javascript();
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const languageExamples = {
    javascript: `// JavaScript Example
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`,
    python: `# Python Example
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(10))`,
    java: `// Java Example
public class Main {
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    public static void main(String[] args) {
        System.out.println(fibonacci(10));
    }
}`,
    cpp: `// C++ Example
#include <iostream>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    cout << fibonacci(10) << endl;
    return 0;
}`,
    html: `<!-- HTML Example -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Page</title>
</head>
<body>
    <h1>Hello World!</h1>
    <p class="intro">Welcome to my page.</p>
</body>
</html>`,
    css: `/* CSS Example */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    color: #333;
    font-size: 2rem;
    font-weight: bold;
}`,
    typescript: `// TypeScript Example
interface Person {
    name: string;
    age: number;
}

function greet(person: Person): string {
    return \`Hello, \${person.name}!\`;
}

const user: Person = { name: "Alice", age: 30 };
console.log(greet(user));`,
    json: `{
  "name": "My Project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "codemirror": "^6.0.0"
  },
  "author": "Developer"
}`,
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<note>
  <to>User</to>
  <from>Developer</from>
  <heading>Example</heading>
  <body>This is an XML example</body>
</note>`,
    sql: `-- SQL Example
SELECT users.name, orders.total
FROM users
INNER JOIN orders ON users.id = orders.user_id
WHERE orders.total > 100
ORDER BY orders.total DESC;`,
    php: `<?php
// PHP Example
function fibonacci($n) {
    if ($n <= 1) return $n;
    return fibonacci($n - 1) + fibonacci($n - 2);
}

echo fibonacci(10);
?>`,
  };

  const loadExample = () => {
    if (languageExamples[language]) {
      setCode(languageExamples[language]);
    }
  };

  const getFileExtension = (lang) => {
    const extensions = {
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      sql: 'sql',
      php: 'php',
      ruby: 'rb',
      typescript: 'ts',
    };
    return extensions[lang] || 'txt';
  };

  return (
    <div className="d-flex flex-column w-100 h-100">
      {/* Language Toolbar */}
      <div className="bg-light border-bottom px-3 py-2 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <span className="fw-medium small">editor.{getFileExtension(language)}</span>
          <span className="badge bg-primary">{language.toUpperCase()}</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <select 
            className="form-select form-select-sm"
            style={{ width: '150px' }}
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
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={loadExample}
          >
            Load Example
          </button>
        </div>
      </div>

      {/* CodeMirror Editor */}
      <div 
        ref={editorRef} 
        className="flex-grow-1 overflow-auto"
        style={{ fontSize: '14px' }}
      />
    </div>
  );
};

export default Editor;