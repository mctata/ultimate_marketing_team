import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  useTheme, 
  Chip,
  Tooltip,
  Paper,
  Button,
  IconButton
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ReplayIcon from '@mui/icons-material/Replay';

export interface JourneyNode {
  id: string;
  type: 'page' | 'action' | 'decision' | 'exit' | 'entry';
  name: string;
  details?: string;
  count: number;
  conversionRate?: number;
  dropoffRate?: number;
}

export interface JourneyConnection {
  source: string;
  target: string;
  value: number;
  percentage: number;
}

interface UserJourneyFlowProps {
  title: string;
  description?: string;
  nodes: JourneyNode[];
  connections: JourneyConnection[];
  height?: number | string;
  onNodeClick?: (nodeId: string) => void;
}

const UserJourneyFlow: React.FC<UserJourneyFlowProps> = ({
  title,
  description,
  nodes,
  connections,
  height = 500,
  onNodeClick,
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate node positions based on journey flow
  const nodePositions = React.useMemo(() => {
    const calculateNodeLevels = () => {
      // Find entry points (nodes that are not targets of any connection)
      const entryNodes = nodes.filter(node => 
        !connections.some(conn => conn.target === node.id)
      ).map(node => node.id);
      
      const levels: Record<string, number> = {};
      const visited = new Set<string>();
      
      const assignLevel = (nodeId: string, level: number) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        
        levels[nodeId] = Math.max(level, levels[nodeId] || 0);
        
        // Find connections where this node is the source
        const outgoingConnections = connections.filter(conn => conn.source === nodeId);
        
        // Recursively assign levels to target nodes
        outgoingConnections.forEach(conn => {
          assignLevel(conn.target, level + 1);
        });
      };
      
      // Start from entry nodes
      entryNodes.forEach(nodeId => {
        assignLevel(nodeId, 0);
      });
      
      return levels;
    };
    
    const nodeLevels = calculateNodeLevels();
    
    // Get the maximum level
    const maxLevel = Math.max(...Object.values(nodeLevels));
    
    // Count nodes at each level
    const nodesPerLevel: Record<number, string[]> = {};
    Object.entries(nodeLevels).forEach(([nodeId, level]) => {
      if (!nodesPerLevel[level]) {
        nodesPerLevel[level] = [];
      }
      nodesPerLevel[level].push(nodeId);
    });
    
    // Calculate horizontal spacing
    const positions: Record<string, { x: number, y: number }> = {};
    
    Object.entries(nodesPerLevel).forEach(([levelStr, nodeIds]) => {
      const level = parseInt(levelStr);
      const nodeCount = nodeIds.length;
      
      nodeIds.forEach((nodeId, index) => {
        positions[nodeId] = {
          x: (index + 0.5) / nodeCount,
          y: level / (maxLevel > 0 ? maxLevel : 1)
        };
      });
    });
    
    return positions;
  }, [nodes, connections]);

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  // Handle mouse leave to avoid stuck dragging state
  const handleMouseLeave = () => {
    setDragging(false);
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom controls
  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  // Export as SVG
  const exportAsSVG = () => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) return;
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'user-journey-flow.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  // Colors for different node types
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'entry':
        return theme.palette.success.main;
      case 'exit':
        return theme.palette.error.main;
      case 'page':
        return theme.palette.primary.main;
      case 'action':
        return theme.palette.secondary.main;
      case 'decision':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Node styling based on type and metrics
  const getNodeStyle = (node: JourneyNode) => {
    const baseStyle = {
      backgroundColor: getNodeColor(node.type),
      borderRadius: node.type === 'page' ? '4px' : '50%',
      width: node.type === 'page' ? 180 : 120,
      height: node.type === 'page' ? 80 : 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: theme.palette.getContrastText(getNodeColor(node.type)),
      padding: 2,
      cursor: onNodeClick ? 'pointer' : 'default',
      border: `2px solid ${theme.palette.background.paper}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      position: 'absolute',
      transform: 'translate(-50%, -50%)',
      '&:hover': {
        transform: 'translate(-50%, -50%) scale(1.05)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        zIndex: 10
      }
    } as const;
    
    return baseStyle;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div" gutterBottom>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" onClick={zoomIn} title="Zoom In">
              <ZoomInIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={zoomOut} title="Zoom Out">
              <ZoomOutIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={resetView} title="Reset View">
              <ReplayIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={exportAsSVG} title="Download SVG">
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        <Paper 
          ref={containerRef}
          sx={{ 
            flexGrow: 1, 
            width: '100%', 
            height: typeof height === 'string' ? height : `${height}px`,
            overflow: 'hidden',
            position: 'relative',
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <Box sx={{ 
            position: 'absolute', 
            width: '100%', 
            height: '100%',
            top: 0,
            left: 0,
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'center'
          }}>
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 1000 1000" 
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Draw connections */}
              {connections.map((conn, index) => {
                const sourcePos = nodePositions[conn.source];
                const targetPos = nodePositions[conn.target];
                
                if (!sourcePos || !targetPos) return null;
                
                const sourceX = sourcePos.x * 1000;
                const sourceY = sourcePos.y * 1000;
                const targetX = targetPos.x * 1000;
                const targetY = targetPos.y * 1000;
                
                // Calculate control points for the curve
                const controlX1 = sourceX + (targetX - sourceX) * 0.7;
                const controlY1 = sourceY;
                const controlX2 = targetX - (targetX - sourceX) * 0.7;
                const controlY2 = targetY;
                
                // Calculate the width of the path based on the value
                const maxWidth = 10;
                const minWidth = 1;
                const maxValue = Math.max(...connections.map(c => c.value));
                const width = minWidth + (conn.value / maxValue) * (maxWidth - minWidth);
                
                // Calculate position for the percentage label
                const labelX = (sourceX + targetX) / 2;
                const labelY = (sourceY + targetY) / 2 - 10;
                
                return (
                  <React.Fragment key={`connection-${index}`}>
                    <path 
                      d={`M ${sourceX} ${sourceY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${targetX} ${targetY}`}
                      fill="none"
                      stroke={theme.palette.primary.main}
                      strokeWidth={width}
                      strokeOpacity={0.6}
                      markerEnd="url(#arrowhead)"
                    />
                    <text 
                      x={labelX} 
                      y={labelY}
                      fontSize="12"
                      textAnchor="middle"
                      fill={theme.palette.text.secondary}
                      style={{ 
                        fontFamily: theme.typography.fontFamily,
                        pointerEvents: 'none'
                      }}
                    >
                      {conn.percentage.toFixed(1)}%
                    </text>
                  </React.Fragment>
                );
              })}
              
              {/* Add arrow marker for connections */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon 
                    points="0 0, 10 3.5, 0 7" 
                    fill={theme.palette.primary.main}
                  />
                </marker>
              </defs>
            </svg>
            
            {/* Add nodes */}
            {nodes.map(node => {
              const pos = nodePositions[node.id];
              if (!pos) return null;
              
              return (
                <Box
                  key={`node-${node.id}`}
                  sx={{
                    ...getNodeStyle(node),
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                  }}
                  onClick={() => onNodeClick && onNodeClick(node.id)}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                    {node.name}
                  </Typography>
                  <Typography variant="caption" sx={{ textAlign: 'center' }}>
                    {node.count.toLocaleString()} users
                  </Typography>
                  {node.conversionRate !== undefined && (
                    <Chip 
                      label={`${node.conversionRate.toFixed(1)}% conv.`}
                      size="small"
                      color="success"
                      sx={{ fontSize: '0.625rem', mt: 0.5 }}
                    />
                  )}
                  {node.dropoffRate !== undefined && node.dropoffRate > 0 && (
                    <Chip 
                      label={`${node.dropoffRate.toFixed(1)}% drop`}
                      size="small"
                      color="error"
                      sx={{ fontSize: '0.625rem', mt: 0.5 }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>
        
        {/* Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
          {['entry', 'page', 'action', 'decision', 'exit'].map(type => (
            <Box key={type} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: getNodeColor(type),
                  borderRadius: type === 'page' ? '2px' : '50%',
                  mr: 0.5
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserJourneyFlow;