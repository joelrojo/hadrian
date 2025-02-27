import React, {
  useMemo,
  useState,
  useLayoutEffect,
  useRef,
  useCallback,
  useEffect,
} from "react";
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
import { FiTrash, FiCheck } from "react-icons/fi";

// Key for localStorage
const LOCAL_STORAGE_KEY = "reactflow-workflow";

const CustomNode = ({
  id,
  data,
  removeNode,
  updateNodeLabel,
  toggleNodeComplete,
  makeNodesUneditable,
}) => {
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
    makeNodesUneditable();
    if (!label.trim()) {
      setLabel("Double click to edit text");
    }
    updateNodeLabel(id, label.trim() || "Double click to edit text");
  };

  const handleChange = (e) => setLabel(e.target.value);

  const handleToggleComplete = () => {
    if (data.active || data.completed) {
      toggleNodeComplete(id);
    }
  };

  return (
    <div
      className={`p-2 border rounded shadow-lg relative w-40 ${
        data.completed
          ? "bg-green-300"
          : data.active
          ? "bg-yellow-300"
          : "bg-white"
      }`}
    >
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
        onClick={handleToggleComplete}
        className={`group cursor-pointer absolute -top-3.5 -right-3.5 rounded-full bg-white border w-6 h-6 flex items-center justify-center
          ${
            data.completed
              ? "hover:border-green-500 border-green-500"
              : "hover:border-gray-500 border-gray-500"
          }`}
      >
        <FiCheck
          className={`text-xs ${
            data.completed
              ? "text-green-500 group-hover:text-green-500"
              : "text-gray-500 group-hover:text-gray-900"
          }`}
        />
      </div>
      <div
        onClick={() => removeNode(id)}
        className="group hover:border-red-500 cursor-pointer absolute -bottom-3.5 -right-3.5 rounded-full bg-white border border-gray-500 w-6 h-6 flex items-center justify-center"
      >
        <FiTrash className="text-gray-500 cursor-pointer text-xs group-hover:text-red-500" />
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export const Chart = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load from localStorage when the component mounts
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    if (savedData) {
      const loadedNodes = (savedData.nodes || []).map((node) => ({
        ...node,
        data: {
          ...node.data,
          isEditing: false, // Ensure no nodes are in editing mode when loaded
        },
      }));
      setNodes(loadedNodes);
      setEdges(savedData.edges || []);
    }
    setInitialLoadComplete(true); // Mark the initial load as complete
  }, []);

  // Save nodes and edges to localStorage whenever they change, but only after the initial load
  useEffect(() => {
    if (initialLoadComplete) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ nodes, edges }));
    }
  }, [nodes, edges, initialLoadComplete]);

  const addNode = () => {
    const newNode = {
      id: (nodes.length + 1).toString(),
      position: { x: 20, y: nodes.length * 100 + 20 },
      data: {
        label: "",
        isEditing: true,
        completed: false,
        active: nodes.length === 0,
      }, // The first node is active
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
  const makeNodesUneditable = () => {
    setNodes((nds) =>
      nds.map((node) => ({ ...node, data: { ...node.data, isEditing: false } }))
    );
  };

  const toggleNodeComplete = useCallback(
    (id) => {
      setNodes((nds) => {
        let updatedNodes = nds.map((node) => {
          if (node.id === id) {
            const isCompleted = node.data.completed;

            // Toggle the completion state
            return {
              ...node,
              data: {
                ...node.data,
                completed: !isCompleted,
                active: isCompleted, // Re-activate if toggled off
              },
            };
          }
          return node;
        });

        // Handle nodes activation and deactivation
        const toggleDependencies = (sourceId, updatedNodes) => {
          const connectedNodes = edges
            .filter((edge) => edge.source === sourceId)
            .map((edge) => edge.target);

          return updatedNodes.map((node) => {
            if (connectedNodes.includes(node.id)) {
              // Check if all source nodes are completed before activating this node
              const allSourcesCompleted = edges
                .filter((edge) => edge.target === node.id)
                .every((edge) =>
                  updatedNodes.find(
                    (n) => n.id === edge.source && n.data.completed
                  )
                );

              return {
                ...node,
                data: {
                  ...node.data,
                  active: allSourcesCompleted && !node.data.completed,
                },
              };
            }
            return node;
          });
        };

        // Toggle the dependencies starting from the changed node
        updatedNodes = toggleDependencies(id, updatedNodes);

        // If the node is being toggled off, deactivate dependent nodes recursively
        if (!updatedNodes.find((node) => node.id === id).data.completed) {
          const deactivateDependencies = (sourceId) => {
            const connectedNodes = edges
              .filter((edge) => edge.source === sourceId)
              .map((edge) => edge.target);

            updatedNodes = updatedNodes.map((node) => {
              if (connectedNodes.includes(node.id)) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    active: false,
                    completed: false,
                  },
                };
              }
              return node;
            });

            connectedNodes.forEach((connectedNodeId) =>
              deactivateDependencies(connectedNodeId)
            );
          };

          deactivateDependencies(id);
        }

        // Activate dependencies again based on the new state
        edges.forEach((edge) => {
          updatedNodes = toggleDependencies(edge.source, updatedNodes);
        });

        return updatedNodes;
      });
    },
    [edges]
  );

  const onConnect = (params) => setEdges((eds) => addEdge(params, eds));

  const removeNode = (nodeId) => {
    setNodes((nds) => {
      // Remove the node and its edges
      let updatedNodes = nds.filter((node) => node.id !== nodeId);
      const remainingEdges = edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );

      // Identify the first node in the workflow (no incoming edges)
      const firstNodeId = updatedNodes.find((node) => {
        return !remainingEdges.some((edge) => edge.target === node.id);
      })?.id;

      // Set the first node to active and the rest to inactive
      updatedNodes = updatedNodes.map((node) => {
        return {
          ...node,
          data: {
            ...node.data,
            active: node.id === firstNodeId,
            completed: false,
          },
        };
      });

      return updatedNodes;
    });

    // Remove the edges connected to the removed node
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
  };

  const resetWorkflow = () => {
    setNodes([]);
    setEdges([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const nodeTypes = useMemo(
    () => ({
      customNode: (props) => (
        <CustomNode
          {...props}
          removeNode={removeNode}
          updateNodeLabel={updateNodeLabel}
          toggleNodeComplete={toggleNodeComplete}
          makeNodesUneditable={makeNodesUneditable}
        />
      ),
    }),
    [toggleNodeComplete]
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
        <button
          onClick={resetWorkflow}
          className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600"
        >
          Reset Workflow
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
