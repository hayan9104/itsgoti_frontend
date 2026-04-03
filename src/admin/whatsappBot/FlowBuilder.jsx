import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { whatsappFlowsAPI, uploadAPI } from '../../services/api';

// Node type configurations
const nodeTypes = {
  message: {
    label: 'Message',
    icon: '💬',
    color: '#3b82f6',
    bgColor: '#eff6ff',
  },
  question: {
    label: 'Question',
    icon: '❓',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
  },
  media: {
    label: 'Media',
    icon: '📷',
    color: '#ec4899',
    bgColor: '#fdf2f8',
  },
  action: {
    label: 'Action',
    icon: '⚡',
    color: '#f59e0b',
    bgColor: '#fffbeb',
  },
  condition: {
    label: 'Condition',
    icon: '🔀',
    color: '#10b981',
    bgColor: '#ecfdf5',
  },
  delay: {
    label: 'Delay',
    icon: '⏱️',
    color: '#6b7280',
    bgColor: '#f9fafb',
  },
};

const triggerOptions = [
  { value: 'new_booking', label: 'New Booking' },
  { value: 'booking_confirmed', label: 'Booking Confirmed' },
  { value: 'booking_denied', label: 'Booking Denied' },
  { value: 'reschedule_request', label: 'Reschedule Request' },
  { value: 'user_message', label: 'User Message' },
  { value: 'button_click', label: 'Button Click' },
  { value: 'keyword', label: 'Keyword Match' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'manual', label: 'Manual Trigger' },
];

const actionTypes = [
  { value: 'send_template', label: 'Send Template' },
  { value: 'send_media', label: 'Send Media' },
  { value: 'send_change_link', label: 'Send Change Link' },
  { value: 'notify_admin', label: 'Notify Admin' },
  { value: 'confirm_booking', label: 'Confirm Booking' },
  { value: 'deny_booking', label: 'Deny Booking' },
  { value: 'approve_reschedule', label: 'Approve Reschedule' },
  { value: 'deny_reschedule', label: 'Deny Reschedule' },
  { value: 'save_response', label: 'Save Response' },
  { value: 'set_variable', label: 'Set Variable' },
  { value: 'webhook', label: 'Call Webhook' },
];

// Available MSG91 templates
const templateOptions = [
  { value: 'booking_received', label: 'Booking Received (to User)' },
  { value: 'booking_admin_notify', label: 'Booking Admin Notify (to Admin)' },
  { value: 'booking_confirmed', label: 'Booking Confirmed (to User)' },
  { value: 'booking_denied', label: 'Booking Denied (to User)' },
  { value: 'quick_question', label: 'Quick Question (to User)' },
  { value: 'share_media_ask', label: 'Share Media Ask (to User)' },
  { value: 'reschedule_approved', label: 'Reschedule Approved (to User)' },
  { value: 'reschedule_denied', label: 'Reschedule Denied (to User)' },
  { value: 'meeting_reminder', label: 'Meeting Reminder (to User)' },
];

// Generate unique ID
const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const FlowBuilder = ({ basePath }) => {
  const navigate = useNavigate();
  const { flowId } = useParams();
  const canvasRef = useRef(null);

  const [flow, setFlow] = useState({
    name: '',
    description: '',
    trigger: { type: 'new_booking', config: {} },
    nodes: [],
    startNodeId: null,
    isActive: false,
  });

  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(!!flowId);
  const [saving, setSaving] = useState(false);
  const [showNodePanel, setShowNodePanel] = useState(false);
  const [draggedNodeType, setDraggedNodeType] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Load existing flow
  useEffect(() => {
    if (flowId) {
      loadFlow();
    }
  }, [flowId]);

  const loadFlow = async () => {
    try {
      const res = await whatsappFlowsAPI.getOne(flowId);
      setFlow(res.data.data);
    } catch (error) {
      console.error('Error loading flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!flow.name.trim()) {
      alert('Please enter a flow name');
      return;
    }

    setSaving(true);
    try {
      if (flowId) {
        await whatsappFlowsAPI.update(flowId, flow);
      } else {
        const res = await whatsappFlowsAPI.create(flow);
        navigate(`${basePath}/${res.data.data._id}/edit`, { replace: true });
      }
    } catch (error) {
      console.error('Error saving flow:', error);
      alert('Error saving flow');
    } finally {
      setSaving(false);
    }
  };

  const addNode = (type, position = { x: 250, y: 100 }) => {
    const id = generateId();
    const newNode = {
      id,
      type,
      position,
      data: {
        label: `New ${nodeTypes[type].label}`,
        ...(type === 'message' && { messageText: '' }),
        ...(type === 'question' && { questionText: '', questionType: 'buttons', options: [] }),
        ...(type === 'media' && { mediaType: 'image', mediaUrl: '', mediaCaption: '' }),
        ...(type === 'action' && { actionType: 'confirm_booking', actionConfig: {} }),
        ...(type === 'condition' && { conditionField: '', conditionOperator: 'equals', conditionValue: '' }),
        ...(type === 'delay' && { delayMinutes: 0, delayHours: 1 }),
      },
    };

    const updatedNodes = [...flow.nodes, newNode];
    const updatedFlow = {
      ...flow,
      nodes: updatedNodes,
      startNodeId: flow.startNodeId || id,
    };

    setFlow(updatedFlow);
    setSelectedNode(newNode);
    setShowNodePanel(true);
  };

  const updateNode = (nodeId, updates) => {
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    }));

    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => ({ ...prev, ...updates }));
    }
  };

  const deleteNode = (nodeId) => {
    // Remove node and update connections
    const updatedNodes = flow.nodes
      .filter(node => node.id !== nodeId)
      .map(node => {
        // Remove references to deleted node
        if (node.data.nextNodeId === nodeId) {
          return { ...node, data: { ...node.data, nextNodeId: null } };
        }
        if (node.data.trueNodeId === nodeId) {
          return { ...node, data: { ...node.data, trueNodeId: null } };
        }
        if (node.data.falseNodeId === nodeId) {
          return { ...node, data: { ...node.data, falseNodeId: null } };
        }
        if (node.data.options) {
          return {
            ...node,
            data: {
              ...node.data,
              options: node.data.options.map(opt =>
                opt.nextNodeId === nodeId ? { ...opt, nextNodeId: null } : opt
              ),
            },
          };
        }
        return node;
      });

    setFlow(prev => ({
      ...prev,
      nodes: updatedNodes,
      startNodeId: prev.startNodeId === nodeId ? updatedNodes[0]?.id || null : prev.startNodeId,
    }));

    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
      setShowNodePanel(false);
    }
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    if (!draggedNodeType) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    addNode(draggedNodeType, { x, y });
    setDraggedNodeType(null);
  };

  const handleNodeDrag = (nodeId, e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const node = flow.nodes.find(n => n.id === nodeId);
    const startPos = { ...node.position };

    const handleMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      updateNode(nodeId, {
        position: {
          x: startPos.x + dx,
          y: startPos.y + dy,
        },
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-bg')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  // Draw connections between nodes
  const renderConnections = () => {
    const connections = [];
    const nodeWidth = 280;
    const nodeHeight = 80;

    flow.nodes.forEach(node => {
      const sourceNode = node;
      // Source: bottom-center of node
      const sourceX = sourceNode.position.x + nodeWidth / 2;
      const sourceY = sourceNode.position.y + nodeHeight;

      // Simple next node connection
      if (node.data.nextNodeId) {
        const targetNode = flow.nodes.find(n => n.id === node.data.nextNodeId);
        if (targetNode) {
          connections.push({
            key: `${node.id}-next`,
            from: { x: sourceX, y: sourceY },
            to: { x: targetNode.position.x + nodeWidth / 2, y: targetNode.position.y },
            color: '#94a3b8',
          });
        }
      }

      // Condition branches
      if (node.type === 'condition') {
        if (node.data.trueNodeId) {
          const trueNode = flow.nodes.find(n => n.id === node.data.trueNodeId);
          if (trueNode) {
            connections.push({
              key: `${node.id}-true`,
              from: { x: sourceX - 40, y: sourceY },
              to: { x: trueNode.position.x + nodeWidth / 2, y: trueNode.position.y },
              color: '#22c55e',
              label: 'Yes',
            });
          }
        }
        if (node.data.falseNodeId) {
          const falseNode = flow.nodes.find(n => n.id === node.data.falseNodeId);
          if (falseNode) {
            connections.push({
              key: `${node.id}-false`,
              from: { x: sourceX + 40, y: sourceY },
              to: { x: falseNode.position.x + nodeWidth / 2, y: falseNode.position.y },
              color: '#ef4444',
              label: 'No',
            });
          }
        }
      }

      // Question options - spread from bottom of node
      if (node.data.options) {
        const optCount = node.data.options.length;
        node.data.options.forEach((opt, idx) => {
          if (opt.nextNodeId) {
            const targetNode = flow.nodes.find(n => n.id === opt.nextNodeId);
            if (targetNode) {
              // Spread options across bottom of node
              const offsetX = optCount > 1 ? (idx - (optCount - 1) / 2) * 60 : 0;
              connections.push({
                key: `${node.id}-opt-${idx}`,
                from: { x: sourceX + offsetX, y: sourceY },
                to: { x: targetNode.position.x + nodeWidth / 2, y: targetNode.position.y },
                color: '#8b5cf6',
                label: opt.label,
              });
            }
          }
        });
      }
    });

    return connections.map(conn => {
      // Calculate orthogonal (right-angle) path like tree diagram
      const fromX = conn.from.x;
      const fromY = conn.from.y;
      const toX = conn.to.x;
      const toY = conn.to.y;

      // Determine path based on relative positions
      let pathD;
      const midY = fromY + (toY - fromY) / 2;

      if (Math.abs(fromX - toX) < 20) {
        // Nodes are vertically aligned - straight line down
        pathD = `M ${fromX} ${fromY} L ${fromX} ${toY}`;
      } else if (toY > fromY) {
        // Target is below - go down, then horizontal, then down
        pathD = `M ${fromX} ${fromY} L ${fromX} ${midY} L ${toX} ${midY} L ${toX} ${toY}`;
      } else {
        // Target is above or same level - go horizontal then vertical
        const midX = fromX + (toX - fromX) / 2;
        pathD = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
      }

      return (
        <g key={conn.key}>
          <path
            d={pathD}
            stroke={conn.color}
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
            strokeLinejoin="round"
          />
          {conn.label && (
            <text
              x={(fromX + toX) / 2}
              y={midY - 5}
              fontSize="10"
              fill={conn.color}
              textAnchor="middle"
            >
              {conn.label}
            </text>
          )}
        </g>
      );
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ color: '#6b7280' }}>Loading flow...</div>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate(basePath)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div>
            <input
              type="text"
              value={flow.name}
              onChange={(e) => setFlow(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Flow name..."
              style={{
                fontSize: 20,
                fontWeight: 600,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                color: '#111827',
                width: 300,
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Trigger Select */}
          <select
            value={flow.trigger.type}
            onChange={(e) => setFlow(prev => ({
              ...prev,
              trigger: { ...prev.trigger, type: e.target.value },
            }))}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              fontSize: 14,
              backgroundColor: '#fff',
            }}
          >
            {triggerOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Active Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, color: '#6b7280' }}>Active</span>
            <button
              onClick={() => setFlow(prev => ({ ...prev, isActive: !prev.isActive }))}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                backgroundColor: flow.isActive ? '#25D366' : '#e5e7eb',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: '#fff',
                position: 'absolute',
                top: 3,
                left: flow.isActive ? 23 : 3,
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 20px',
              backgroundColor: '#25D366',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 500,
              cursor: saving ? 'wait' : 'pointer',
              fontSize: 14,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Flow'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, gap: 16, overflow: 'hidden', width: '100%', minWidth: 0 }}>
        {/* Node Palette - Fixed Left Sidebar */}
        <div style={{
          width: 200,
          minWidth: 200,
          maxWidth: 200,
          flexShrink: 0,
          flexGrow: 0,
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflowY: 'auto',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
            Add Nodes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(nodeTypes).map(([type, config]) => (
              <div
                key={type}
                draggable
                onDragStart={() => setDraggedNodeType(type)}
                onDragEnd={() => setDraggedNodeType(null)}
                onClick={() => addNode(type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  backgroundColor: config.bgColor,
                  border: `1px solid ${config.color}20`,
                  borderRadius: 8,
                  cursor: 'grab',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: 18 }}>{config.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: config.color }}>
                  {config.label}
                </span>
              </div>
            ))}
          </div>

          {/* Variables Info */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Variables
            </h3>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
              <div><code>{'{{customer_name}}'}</code></div>
              <div><code>{'{{date}}'}</code></div>
              <div><code>{'{{time}}'}</code></div>
              <div><code>{'{{phone}}'}</code></div>
              <div><code>{'{{email}}'}</code></div>
            </div>
          </div>
        </div>

        {/* Canvas - with scroll */}
        <div
          style={{
            flex: '1 1 0',
            minWidth: 0,
            width: 0,
            overflow: 'hidden',
            borderRadius: 12,
            position: 'relative',
          }}
        >
          <div
            ref={canvasRef}
            className="canvas-bg"
            onDrop={handleCanvasDrop}
            onDragOver={(e) => e.preventDefault()}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f9fafb',
              overflow: 'auto',
              position: 'relative',
              backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              cursor: isPanning ? 'grabbing' : 'default',
            }}
          >
            {/* Inner container with large size for scrolling */}
            <div
              style={{
                position: 'relative',
                width: 2000,
                height: 1500,
                transform: `scale(${zoom})`,
                transformOrigin: '0 0',
              }}
            >
          {/* SVG for connections */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
              </marker>
            </defs>
            {renderConnections()}
          </svg>

          {/* Nodes */}
          <div>
            {flow.nodes.map(node => {
              const config = nodeTypes[node.type];
              const isStart = node.id === flow.startNodeId;
              const isSelected = selectedNode?.id === node.id;

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleNodeDrag(node.id, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                    setShowNodePanel(true);
                  }}
                  style={{
                    position: 'absolute',
                    left: node.position.x,
                    top: node.position.y,
                    width: 280,
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    boxShadow: isSelected
                      ? `0 0 0 2px ${config.color}, 0 4px 12px rgba(0,0,0,0.15)`
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    cursor: 'move',
                    transition: 'box-shadow 0.2s ease',
                  }}
                >
                  {/* Node Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    backgroundColor: config.bgColor,
                    borderRadius: '12px 12px 0 0',
                    borderBottom: `1px solid ${config.color}20`,
                  }}>
                    <span style={{ fontSize: 16 }}>{config.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: config.color, flex: 1 }}>
                      {node.data.label || config.label}
                    </span>
                    {isStart && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: '#22c55e',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}>
                        START
                      </span>
                    )}
                  </div>

                  {/* Node Content Preview */}
                  <div style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>
                    {node.type === 'message' && (
                      <div style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 250,
                      }}>
                        {node.data.messageText || 'No message set'}
                      </div>
                    )}
                    {node.type === 'question' && (
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          {node.data.questionText || 'No question set'}
                        </div>
                        {node.data.options?.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {node.data.options.slice(0, 3).map((opt, i) => (
                              <span key={i} style={{
                                fontSize: 10,
                                padding: '2px 6px',
                                backgroundColor: '#ede9fe',
                                borderRadius: 4,
                                color: '#7c3aed',
                              }}>
                                {opt.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {node.type === 'media' && (
                      <div>
                        {node.data.mediaType}: {node.data.mediaUrl ? 'Set' : 'Not set'}
                      </div>
                    )}
                    {node.type === 'action' && (
                      <div>{actionTypes.find(a => a.value === node.data.actionType)?.label}</div>
                    )}
                    {node.type === 'condition' && (
                      <div>
                        If {node.data.conditionField || '...'} {node.data.conditionOperator} {node.data.conditionValue || '...'}
                      </div>
                    )}
                    {node.type === 'delay' && (
                      <div>
                        Wait {node.data.delayHours}h {node.data.delayMinutes}m
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>{/* Close inner scrollable container */}
          </div>{/* Close canvas scrollable */}

          {/* Empty State - positioned in wrapper */}
          {flow.nodes.length === 0 && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#9ca3af',
              pointerEvents: 'none',
            }}>
              <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <p style={{ fontSize: 14 }}>Drag a node here or click to add</p>
            </div>
          )}

          {/* Zoom Controls - positioned in wrapper */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            display: 'flex',
            gap: 8,
            backgroundColor: '#fff',
            borderRadius: 8,
            padding: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 10,
          }}>
            <button
              onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
              style={{
                width: 32,
                height: 32,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" fill="none" stroke="#6b7280" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#6b7280', minWidth: 40, justifyContent: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.25))}
              style={{
                width: 32,
                height: 32,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" fill="none" stroke="#6b7280" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>{/* Close canvas wrapper */}

        {/* Node Editor Panel */}
        {showNodePanel && selectedNode && (
          <NodeEditorPanel
            node={selectedNode}
            nodes={flow.nodes}
            isStartNode={selectedNode.id === flow.startNodeId}
            onUpdate={(updates) => updateNode(selectedNode.id, updates)}
            onDelete={() => deleteNode(selectedNode.id)}
            onSetStart={() => setFlow(prev => ({ ...prev, startNodeId: selectedNode.id }))}
            onClose={() => {
              setShowNodePanel(false);
              setSelectedNode(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Node Editor Panel Component
const NodeEditorPanel = ({ node, nodes, isStartNode, onUpdate, onDelete, onSetStart, onClose }) => {
  const config = nodeTypes[node.type];
  const [uploading, setUploading] = useState(false);

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await uploadAPI.uploadImage(formData);
      onUpdate({ data: { ...node.data, mediaUrl: res.data.url } });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const addOption = () => {
    const newOption = {
      id: `opt_${Date.now()}`,
      label: `Option ${(node.data.options?.length || 0) + 1}`,
      description: '',
      nextNodeId: null,
    };
    onUpdate({
      data: {
        ...node.data,
        options: [...(node.data.options || []), newOption],
      },
    });
  };

  const updateOption = (index, updates) => {
    const options = [...node.data.options];
    options[index] = { ...options[index], ...updates };
    onUpdate({ data: { ...node.data, options } });
  };

  const removeOption = (index) => {
    const options = node.data.options.filter((_, i) => i !== index);
    onUpdate({ data: { ...node.data, options } });
  };

  return (
    <div style={{
      width: 320,
      minWidth: 320,
      maxWidth: 320,
      flexShrink: 0,
      flexGrow: 0,
      backgroundColor: '#fff',
      borderRadius: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      maxHeight: '100%',
    }}>
      {/* Panel Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: config.bgColor,
        borderBottom: `1px solid ${config.color}20`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{config.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: config.color }}>
            Edit {config.label}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" fill="none" stroke="#6b7280" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Panel Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* Label */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
            Node Label
          </label>
          <input
            type="text"
            value={node.data.label || ''}
            onChange={(e) => onUpdate({ data: { ...node.data, label: e.target.value } })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
            }}
          />
        </div>

        {/* Message Fields */}
        {node.type === 'message' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Message Text
            </label>
            <textarea
              value={node.data.messageText || ''}
              onChange={(e) => onUpdate({ data: { ...node.data, messageText: e.target.value } })}
              placeholder="Enter message... Use {{customer_name}}, {{date}}, {{time}} for variables"
              rows={4}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          </div>
        )}

        {/* Question Fields */}
        {node.type === 'question' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Question Text
              </label>
              <textarea
                value={node.data.questionText || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, questionText: e.target.value } })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Response Type
              </label>
              <select
                value={node.data.questionType || 'buttons'}
                onChange={(e) => onUpdate({ data: { ...node.data, questionType: e.target.value } })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              >
                <option value="buttons">Buttons (max 3)</option>
                <option value="list">List (up to 10)</option>
                <option value="text_input">Text Input</option>
              </select>
            </div>

            {/* Optional: Use MSG91 Template instead of interactive buttons */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Use MSG91 Template (optional)
              </label>
              <select
                value={node.data.templateName || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, templateName: e.target.value } })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              >
                <option value="">None (use interactive buttons)</option>
                {templateOptions.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                If selected, sends MSG91 template instead of interactive buttons. Option labels must match template button text.
              </p>
            </div>

            {(node.data.questionType === 'buttons' || node.data.questionType === 'list') && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>
                    Options
                  </label>
                  <button
                    onClick={addOption}
                    disabled={node.data.questionType === 'buttons' && (node.data.options?.length || 0) >= 3}
                    style={{
                      fontSize: 12,
                      color: '#2563eb',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    + Add Option
                  </button>
                </div>

                {node.data.options?.map((opt, idx) => (
                  <div key={opt.id} style={{
                    padding: 12,
                    backgroundColor: '#f9fafb',
                    borderRadius: 8,
                    marginBottom: 8,
                  }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        type="text"
                        value={opt.label}
                        onChange={(e) => updateOption(idx, { label: e.target.value })}
                        placeholder="Button text"
                        maxLength={20}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          border: '1px solid #d1d5db',
                          borderRadius: 4,
                          fontSize: 13,
                        }}
                      />
                      <button
                        onClick={() => removeOption(idx)}
                        style={{
                          padding: '6px 8px',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <select
                      value={opt.nextNodeId || ''}
                      onChange={(e) => updateOption(idx, { nextNodeId: e.target.value || null })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: 4,
                        fontSize: 12,
                        backgroundColor: '#fff',
                      }}
                    >
                      <option value="">→ Select next node...</option>
                      {nodes.filter(n => n.id !== node.id).map(n => (
                        <option key={n.id} value={n.id}>
                          {n.data.label || nodeTypes[n.type].label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Media Fields */}
        {node.type === 'media' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Media Type
              </label>
              <select
                value={node.data.mediaType || 'image'}
                onChange={(e) => onUpdate({ data: { ...node.data, mediaType: e.target.value } })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="audio">Audio</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Media File
              </label>
              <input
                type="file"
                onChange={handleMediaUpload}
                accept={
                  node.data.mediaType === 'image' ? 'image/*' :
                  node.data.mediaType === 'video' ? 'video/*' :
                  node.data.mediaType === 'audio' ? 'audio/*' :
                  '.pdf,.doc,.docx'
                }
                style={{ marginBottom: 8 }}
              />
              {uploading && <div style={{ fontSize: 12, color: '#6b7280' }}>Uploading...</div>}
              {node.data.mediaUrl && (
                <div style={{ fontSize: 12, color: '#22c55e' }}>
                  File uploaded: {node.data.mediaUrl}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Caption
              </label>
              <textarea
                value={node.data.mediaCaption || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, mediaCaption: e.target.value } })}
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
            </div>
          </>
        )}

        {/* Action Fields */}
        {node.type === 'action' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Action Type
              </label>
              <select
                value={node.data.actionType || 'send_template'}
                onChange={(e) => onUpdate({ data: { ...node.data, actionType: e.target.value } })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              >
                {actionTypes.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            {/* Template Name field for send_template action */}
            {node.data.actionType === 'send_template' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  Template Name
                </label>
                <select
                  value={node.data.templateName || ''}
                  onChange={(e) => onUpdate({ data: { ...node.data, templateName: e.target.value } })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                >
                  <option value="">Select Template</option>
                  {templateOptions.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Await Response checkbox for send_template */}
            {node.data.actionType === 'send_template' && (
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="awaitResponse"
                  checked={node.data.awaitResponse || false}
                  onChange={(e) => onUpdate({ data: { ...node.data, awaitResponse: e.target.checked } })}
                />
                <label htmlFor="awaitResponse" style={{ fontSize: 12, color: '#374151' }}>
                  Wait for user response (pauses flow until button click)
                </label>
              </div>
            )}
          </>
        )}

        {/* Delay Fields */}
        {node.type === 'delay' && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 70 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Hours
              </label>
              <input
                type="number"
                min="0"
                value={node.data.delayHours || 0}
                onChange={(e) => onUpdate({ data: { ...node.data, delayHours: parseInt(e.target.value) || 0 } })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 70 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Minutes
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={node.data.delayMinutes || 0}
                onChange={(e) => onUpdate({ data: { ...node.data, delayMinutes: parseInt(e.target.value) || 0 } })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 70 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Seconds
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={node.data.delaySeconds || 0}
                onChange={(e) => onUpdate({ data: { ...node.data, delaySeconds: parseInt(e.target.value) || 0 } })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>
          </div>
        )}

        {/* Next Node (for non-question types) */}
        {node.type !== 'question' && node.type !== 'condition' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Next Node
            </label>
            <select
              value={node.data.nextNodeId || ''}
              onChange={(e) => onUpdate({ data: { ...node.data, nextNodeId: e.target.value || null } })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
              }}
            >
              <option value="">None (End flow)</option>
              {nodes.filter(n => n.id !== node.id).map(n => (
                <option key={n.id} value={n.id}>
                  {n.data.label || nodeTypes[n.type].label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Condition Fields */}
        {node.type === 'condition' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                If True → Go to
              </label>
              <select
                value={node.data.trueNodeId || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, trueNodeId: e.target.value || null } })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              >
                <option value="">Select node...</option>
                {nodes.filter(n => n.id !== node.id).map(n => (
                  <option key={n.id} value={n.id}>
                    {n.data.label || nodeTypes[n.type].label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                If False → Go to
              </label>
              <select
                value={node.data.falseNodeId || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, falseNodeId: e.target.value || null } })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              >
                <option value="">Select node...</option>
                {nodes.filter(n => n.id !== node.id).map(n => (
                  <option key={n.id} value={n.id}>
                    {n.data.label || nodeTypes[n.type].label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Panel Footer */}
      <div style={{
        padding: 12,
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: 8,
      }}>
        {!isStartNode && (
          <button
            onClick={onSetStart}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Set as Start
          </button>
        )}
        <button
          onClick={onDelete}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Delete Node
        </button>
      </div>
    </div>
  );
};

export default FlowBuilder;
