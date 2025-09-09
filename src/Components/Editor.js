import React, { useState } from 'react';

const Editor = () => {
  const [code, setCode] = useState(`// Welcome to the collaborative code editor!
// Start writing your code here.

function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("World"));
`);

  return (
    <textarea
      className="w-100 h-90 p-3 border rounded"
      style={{
        fontFamily: "'Fira Code', monospace",
        fontSize: "14px",
        backgroundColor: "#f9f9f9",
        color: "#2d2d2d",
        resize: "none",
        outline: "none",
        lineHeight: "1.5",
        boxShadow: "inset 0 2px 5px rgba(0,0,0,0.05)",
        borderColor: "#e0e0e0",
      }}
      value={code}
      onChange={(e) => setCode(e.target.value)}
      spellCheck="false"
    />
  );
};

export default Editor;
