import React, { useMemo, useState, useLayoutEffect, useRef } from "react";
import ReactFlow, {
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

const CustomNode = ({ id, data, removeNode, updateNodeLabel }) => {
  const [isEditing, setIsEditing] = useState(data.isEditing || false);
  const [label, setLabel] = useState(data.label);
  const inputRef = useRef(null);

  useLayoutEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50); // QUICK HACK: Wait for the node to render before focusing, would dig deeper with more time
    }
  }, [isEditing]);

  const handleDoubleClick = () => setIsEditing(true);

  const inputSubmit = () => {
    setIsEditing(false);
    if (!label.trim()) {
      setLabel("Double click to edit this text");
    }
    updateNodeLabel(id, label.trim() || "Double click to edit");
  };

  const handleChange = (e) => setLabel(e.target.value);

  return (
    <div className="p-2 bg-white border rounded shadow-lg relative w-40">
      {isEditing ? (
        <input
          ref={inputRef}
          className="w-full bg-white p-1 text-lg font-bold text-gray-900 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none mr-3"
          value={label}
          onChange={handleChange}
          onBlur={inputSubmit}
          onKeyDown={(e) => e.key === "Enter" && inputSubmit()}
        />
      ) : (
        <div
          className="text-lg font-bold text-gray-900 cursor-pointer"
          onDoubleClick={handleDoubleClick}
        >
          {label}
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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const addNode = () => {
    const newNode = {
      id: (nodes.length + 1).toString(),
      position: { x: 20, y: nodes.length * 100 + 20 },
      data: { label: "", isEditing: true }, // Start with an empty label and editing mode enabled
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
