import React, { useState } from "react";

function TasteSelector({ label, selections, setSelections }) {
  const [input, setInput] = useState("");

  const addSelection = () => {
    if (input.trim() === "") return;

    setSelections([...selections, input.trim()]);
    setInput("");
  };

  const removeSelection = (item) => {
    setSelections(selections.filter((x) => x !== item));
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">{label}</h2>

      <div className="flex gap-3">
        <input
          className="flex-1 px-3 py-2 bg-gray-700 text-white rounded"
          placeholder="Type and add…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button
          onClick={addSelection}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {selections.map((item, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-blue-700 rounded-full text-sm flex items-center gap-2"
          >
            {item}
            <button
              onClick={() => removeSelection(item)}
              className="text-red-400 hover:text-red-600 ml-1"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default TasteSelector;
