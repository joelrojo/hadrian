import React, { useMemo, useState } from "react";
import ReactFlow, {
  MarkerType,
  useEdgesState,
  useNodesState,
  addEdge,
  Handle,
  Position,
  MiniMap,
  Controls,
  Background,
} from "reactflow";

import "reactflow/dist/style.css";
import { FiX } from "react-icons/fi";

const initialNodes = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    data: { label: "1" },
    type: "customNode",
  },
  {
    id: "2",
    position: { x: 0, y: 100 },
    data: { label: "2" },
    type: "customNode",
  },
  {
    id: "3",
    position: { x: 0, y: 200 },
    data: { label: "3" },
    type: "customNode",
  },
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

const CustomNode = ({ id, data, selected, removeNode, updateNodeLabel }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const handleDoubleClick = () => setIsEditing(true);
  const inputSubmit = () => {
    setIsEditing(false);
    if (!label) return; // handle empty label case
    updateNodeLabel(id, label);
  };
  const handleChange = (e) => setLabel(e.target.value);

  return (
    <div className="p-2 bg-white border rounded shadow-lg relative w-40">
      {isEditing ? (
        <input
          className="w-full bg-white p-1 text-lg font-bold text-gray-900 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none mr-3"
          value={label}
          onChange={handleChange}
          onBlur={inputSubmit}
          onKeyDown={(e) => e.key === "Enter" && inputSubmit()}
          autoFocus
        />
      ) : (
        <div
          className="text-lg font-bold text-gray-900 cursor-pointer"
          onDoubleClick={handleDoubleClick}
        >
          {data.label}
        </div>
      )}
      <div
        onClick={() => removeNode(id)}
        className="group hover:border-red-500 cursor-pointer absolute -top-2 -right-2 rounded-full bg-white border border-gray-500 w-4 h-4 flex items-center justify-center"
      >
        <FiX className="text-gray-500 cursor-pointer text-xs group-hover:text-red-500" />
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export const Chart = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const addNode = () => {
    const newNode = {
      id: (nodes.length + 1).toString(),
      position: { x: 0, y: nodes.length * 100 },
      data: { label: (nodes.length + 1).toString() },
      type: "customNode",
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const updateNodeLabel = (id, newLabel) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      )
    );
  };

  const onConnect = (params) => setEdges((eds) => addEdge(params, eds));

  const removeNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
  };

  const nodeTypes = useMemo(
    () => ({
      customNode: (props) => (
        <CustomNode
          {...props}
          removeNode={removeNode}
          updateNodeLabel={updateNodeLabel}
        />
      ),
    }),
    []
  );

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
          onConnect={onConnect}
          nodeTypes={nodeTypes}
        >
          <MiniMap />
          <Controls />
          <Background gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
};
