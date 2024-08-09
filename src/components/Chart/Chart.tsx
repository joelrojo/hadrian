import React from "react";
import ReactFlow, { MarkerType, useEdgesState, useNodesState } from "reactflow";

import "reactflow/dist/style.css";

const initialNodes = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "1" } },
  { id: "2", position: { x: 0, y: 100 }, data: { label: "2" } },
  { id: "3", position: { x: 0, y: 200 }, data: { label: "3" } },
];

const initialEdges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    markerEnd: { type: MarkerType.ArrowClosed },
  },
];

export const Chart = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const addNode = () => {
    const newNode = {
      id: (nodes.length + 1).toString(),
      position: { x: 0, y: nodes.length * 100 },
      data: { label: (nodes.length + 1).toString() },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-[80vw] h-[80vh] border border-gray-300">
        <button
          onClick={addNode}
          className="absolute top-4 left-4 px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
        >
          Add Node
        </button>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
        />
      </div>
    </div>
  );
};
