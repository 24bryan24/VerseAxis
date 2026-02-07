import React, { useState, useEffect, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Highlighter, 
  BookOpen, 
  Trash2, 
  RefreshCcw, 
  Move,
  X,
  Settings,
  EyeOff,
  CheckSquare,
  MousePointer2,
  Maximize,
  GitBranch,      
  Activity,       
  CornerDownRight,
  Undo2,
  Redo2,
  Sparkles,
  Loader2,
  FileText, 
  Layout,
  Search,
  Eraser
} from 'lucide-react';

// --- Constants & Config ---

const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Yellow', dot: '#FACC15', bookClass: 'bg-yellow-300/75', canvasClass: 'bg-yellow-200 border-yellow-400' },
  { id: 'orange', label: 'Orange', dot: '#FB923C', bookClass: 'bg-orange-300/75', canvasClass: 'bg-orange-200 border-orange-400' },
  { id: 'red', label: 'Red', dot: '#F87171', bookClass: 'bg-red-300/75', canvasClass: 'bg-red-200 border-red-400' },
  { id: 'green', label: 'Green', dot: '#4ADE80', bookClass: 'bg-green-300/75', canvasClass: 'bg-green-200 border-green-400' },
  { id: 'teal', label: 'Teal', dot: '#2DD4BF', bookClass: 'bg-teal-300/75', canvasClass: 'bg-teal-200 border-teal-400' },
  { id: 'cyan', label: 'Cyan', dot: '#22D3EE', bookClass: 'bg-cyan-300/75', canvasClass: 'bg-cyan-200 border-cyan-400' },
  { id: 'blue', label: 'Blue', dot: '#60A5FA', bookClass: 'bg-blue-300/75', canvasClass: 'bg-blue-200 border-blue-400' },
  { id: 'indigo', label: 'Indigo', dot: '#818CF8', bookClass: 'bg-indigo-300/75', canvasClass: 'bg-indigo-200 border-indigo-400' },
  { id: 'purple', label: 'Purple', dot: '#C084FC', bookClass: 'bg-purple-300/75', canvasClass: 'bg-purple-200 border-purple-400' },
  { id: 'pink', label: 'Pink', dot: '#F472B6', bookClass: 'bg-pink-300/75', canvasClass: 'bg-pink-200 border-pink-400' },
];

const DEFAULT_PASSAGE = "Romans 5:1-10";
const DEFAULT_TEXT = `Therefore, since we have been justified by faith, we have peace with God through our Lord Jesus Christ. Through him we have also obtained access by faith into this grace in which we stand, and we rejoice in hope of the glory of God. Not only that, but we rejoice in our sufferings, knowing that suffering produces endurance, and endurance produces character, and character produces hope, and hope does not put us to shame, because God's love has been poured into our hearts through the Holy Spirit who has been given to us. For while we were still weak, at the right time Christ died for the ungodly. For one will scarcely die for a righteous person—though perhaps for a good person one would dare even to die— but God shows his love for us in that while we were still sinners, Christ died for us. Since, therefore, we have now been justified by his blood, much more shall we be saved by him from the wrath of God. For if while we were enemies we were reconciled to God by the death of his Son, much more, now that we are reconciled, shall we be saved by his life.`;

const SATELLITE_OPTIONS = [
  { id: 'who', label: 'Who', color: '#EF4444', hint: 'Subject, Actor, or Agent?' },
  { id: 'what', label: 'What', color: '#F59E0B', hint: 'Object, Action, or Content?' },
  { id: 'when', label: 'When', color: '#10B981', hint: 'Time, Duration, or Frequency?' },
  { id: 'where', label: 'Where', color: '#3B82F6', hint: 'Location, Source, or Destination?' },
  { id: 'why', label: 'Why', color: '#8B5CF6', hint: 'Reason, Purpose, or Cause?' },
  { id: 'how', label: 'How', color: '#EC4899', hint: 'Method, Manner, or Degree?' },
];

const CONNECTION_MODES = [
  { id: 'hidden', icon: EyeOff, label: 'Hidden' },
  { id: 'tree', icon: GitBranch, label: 'Tree View' },
  { id: 'direct', icon: Activity, label: 'Direct View' },
  { id: 'step', icon: CornerDownRight, label: 'Step View' }
];

// Layout Configurations
const LAYOUT_CONFIG = {
  canvas: {
    lineHeight: 80,
    wordSpacing: 15,
    rowTolerance: 30,
    minGap: 25,
    fontScale: 1
  },
  book: {
    lineHeight: 48, 
    wordSpacing: 6, 
    rowTolerance: 15,
    minGap: 6,
    fontScale: 1.15 
  }
};

// --- Helper Functions ---

const generateId = () => Math.random().toString(36).substr(2, 9);

const estimateWidth = (text, isBookMode) => {
  // Adjusted char width: 10.5px for 22px Serif (Book) to prevent clipping/overlap
  const charWidth = isBookMode ? 10.5 : 9; 
  const padding = isBookMode ? 2 : 24; 
  return (text.length * charWidth) + padding;
};

// Calculates the initial layout for a mode
const calculateLayout = (nodesToLayout, mode) => {
  const config = LAYOUT_CONFIG[mode];
  const isBook = mode === 'book';
  
  const windowWidth = window.innerWidth;
  const containerWidth = isBook 
    ? Math.min(650, windowWidth * 0.55) 
    : (windowWidth > 800 ? 800 : windowWidth - 40); 

  const startX = (windowWidth - containerWidth) / 2;
  const startY = 160;
  
  let currentX = startX;
  let currentY = startY;

  return nodesToLayout.map(node => {
    const w = estimateWidth(node.text, isBook);
    
    if (currentX + w > startX + containerWidth) {
      currentX = startX;
      currentY += config.lineHeight;
    }

    const newNode = {
      ...node,
      x: currentX + w / 2,
      y: currentY,
    };

    currentX += w + config.wordSpacing;
    return newNode;
  });
};

const splitTextToNodes = (text, mode = 'book') => {
  const words = text.split(/\s+/);
  const rawNodes = words.map((word) => ({
    id: generateId(),
    text: word,
    parentId: null,
    relation: null, 
    styles: {
      bold: false,
      italic: false,
      underline: false,
      highlight: false,
      scale: 1,
    },
    collapsed: false,
  }));
  return calculateLayout(rawNodes, mode);
};

const getDescendants = (nodeId, allNodes) => {
  const children = allNodes.filter(n => n.parentId === nodeId);
  let descendants = [...children];
  children.forEach(child => {
    descendants = [...descendants, ...getDescendants(child.id, allNodes)];
  });
  return descendants;
};

// Auto-Layout
const resolveOverlaps = (currentNodes, mode = 'book') => {
  const config = LAYOUT_CONFIG[mode];
  const isBook = mode === 'book';
  
  const windowWidth = window.innerWidth;
  const containerWidth = isBook 
    ? Math.min(650, windowWidth * 0.55) 
    : (windowWidth > 800 ? 800 : windowWidth - 40); 
  const startX = (windowWidth - containerWidth) / 2;
  const maxRightEdge = startX + containerWidth;

  const rows = {};
  const adjustedNodes = currentNodes.map(n => ({...n}));
  const sortedByY = [...adjustedNodes].sort((a, b) => a.y - b.y);
  
  sortedByY.forEach(node => {
    let foundRowKey = Object.keys(rows).find(key => Math.abs(parseFloat(key) - node.y) < config.rowTolerance);
    
    if (!foundRowKey) {
      foundRowKey = node.y.toString();
      rows[foundRowKey] = [];
    }
    rows[foundRowKey].push(node);
  });

  // Convert to array of row objects for sequential processing (allows wrapping)
  let sortedRows = Object.keys(rows)
    .sort((a, b) => parseFloat(a) - parseFloat(b))
    .map(key => ({ y: parseFloat(key), nodes: rows[key] }));

  for (let i = 0; i < sortedRows.length; i++) {
    let row = sortedRows[i];
    
    // 1. Sort by X
    row.nodes.sort((a, b) => a.x - b.x);
    
    // 2. Resolve overlaps / Apply spacing
    for (let j = 0; j < row.nodes.length - 1; j++) {
      const current = row.nodes[j];
      const next = row.nodes[j+1];
      
      const currentScale = current.styles.scale || 1;
      const nextScale = next.styles.scale || 1;
      
      const currentHalfWidth = (estimateWidth(current.text, isBook) * currentScale) / 2;
      const nextHalfWidth = (estimateWidth(next.text, isBook) * nextScale) / 2;
      
      const currentRightEdge = current.x + currentHalfWidth;
      const nextLeftEdge = next.x - nextHalfWidth;
      
      const desiredGap = config.minGap;

      if (isBook) {
         const idealNextX = currentRightEdge + desiredGap + nextHalfWidth;
         next.x = idealNextX;
      } else {
         if (nextLeftEdge < currentRightEdge + desiredGap) {
            const pushDistance = (currentRightEdge + desiredGap) - nextLeftEdge;
            next.x += pushDistance;
         }
      }
    }

    // 3. Check for Overflow (Book Mode only)
    if (isBook && row.nodes.length > 0) {
       const lastNode = row.nodes[row.nodes.length - 1];
       const lastNodeScale = lastNode.styles.scale || 1;
       const lastNodeRight = lastNode.x + (estimateWidth(lastNode.text, isBook) * lastNodeScale) / 2;

       if (lastNodeRight > maxRightEdge) {
          // Find the first node that crosses the boundary (or just move the last one?)
          // We'll move all nodes that extend beyond boundary, or at least the ones starting beyond it?
          // Strategy: Traverse backwards to find the split point.
          // Ideally we want to break at a point where a node is mostly out, or pushes out.
          // Simple approach: Iterate and find first node where rightEdge > maxRightEdge.
          
          let splitIndex = -1;
          for (let k = 0; k < row.nodes.length; k++) {
             const node = row.nodes[k];
             const scale = node.styles.scale || 1;
             const right = node.x + (estimateWidth(node.text, isBook) * scale) / 2;
             if (right > maxRightEdge) {
                splitIndex = k;
                break;
             }
          }

          if (splitIndex !== -1 && splitIndex < row.nodes.length) {
             // If the very first node is overflowing, we might have a problem (single word too long).
             // We'll just force it to wrap anyway if it's not the ONLY node.
             // If it's the only node, we can't wrap it (infinite loop).
             if (splitIndex === 0 && row.nodes.length === 1) {
                // Do nothing, let it overflow
             } else {
                // If splitIndex is 0 but there are other nodes, we move them ALL? 
                // That means this row becomes empty. That's fine, we essentially push everything down.
                
                const overflowNodes = row.nodes.splice(splitIndex); // Remove from current
                
                // Determine target Y for next row
                const nextY = row.y + config.lineHeight;
                
                // Check if next row exists
                if (i + 1 < sortedRows.length) {
                   const nextRow = sortedRows[i + 1];
                   // If next row is close enough to target Y, merge.
                   if (Math.abs(nextRow.y - nextY) < config.rowTolerance) {
                      // Update Y of overflow nodes to match next row
                      overflowNodes.forEach(n => n.y = nextRow.y);
                      // Prepend to next row? Actually we should just add them, and let the sort in next iteration handle it.
                      // But since we want them to be at the *start* of the next line (wrapping), 
                      // we should probably reset their X to startX?
                      // If we don't reset X, they might be sorted to the end if next row nodes are to the left.
                      // But `calculateLayout` sets X.
                      // Here we are resolving overlaps. 
                      // If we move them to next row, we should probably set their X to startX to ensure they are first?
                      // Or just let sort handle it? Existing nodes in next row might be anywhere.
                      
                      // Better strategy: Reset X of overflow nodes to startX (approx) so they sort to the beginning.
                      // We subtract a large value to ensure they are sorted BEFORE any existing nodes on that line.
                      // We maintain their relative order.
                      overflowNodes.forEach(n => { n.y = nextRow.y; n.x = startX - 10000 + n.x; });
                      
                      nextRow.nodes.push(...overflowNodes);
                   } else {
                      // Next row is too far down or we need to insert a new row between i and i+1?
                      // If nextRow.y > nextY + tolerance, we can insert a new row.
                      // If nextRow.y < nextY (shouldn't happen due to sort), logic holds.
                      
                      // Insert new row
                      overflowNodes.forEach(n => { n.y = nextY; n.x = startX; }); // New row, just start at startX
                      sortedRows.splice(i + 1, 0, { y: nextY, nodes: overflowNodes });
                   }
                } else {
                   // No next row, create one
                   overflowNodes.forEach(n => { n.y = nextY; n.x = startX; });
                   sortedRows.push({ y: nextY, nodes: overflowNodes });
                }
             }
          }
       }
    }
  }
  
  return sortedRows.flatMap(r => r.nodes);
};

// Gap Closing
const closeGaps = (currentNodes, movedItems, mode = 'book') => {
  const config = LAYOUT_CONFIG[mode];
  const isBook = mode === 'book';
  let adjustedNodes = [...currentNodes];
  
  movedItems.forEach(item => {
    if (!item.wasRoot) return; 
    
    const gapX = item.oldX;
    const gapY = item.oldY;
    const gapWidth = estimateWidth(item.text, isBook); 
    const GAP_SIZE = gapWidth + config.wordSpacing; 
    
    adjustedNodes.forEach(node => {
      if (node.parentId) return;
      if (Math.abs(node.y - gapY) < config.rowTolerance) {
        if (node.x > gapX) {
          node.x -= GAP_SIZE;
        }
      }
    });
    
    const hasNodesOnLine = adjustedNodes.some(n => !n.parentId && Math.abs(n.y - gapY) < config.rowTolerance);
    
    if (!hasNodesOnLine) {
       adjustedNodes.forEach(node => {
         if (!node.parentId && node.y > gapY) {
           node.y -= config.lineHeight;
         }
       });
    }
  });
  
  return adjustedNodes;
};

// --- Sub-Components ---

const NODE_HEIGHT = 40; 

const Satellites = React.memo(({ nodes, targetId, satelliteHover, viewMode }) => {
  const target = nodes.find(n => n.id === targetId);
  if (!target || !satelliteHover) return null;

  const opt = SATELLITE_OPTIONS.find(o => o.id === satelliteHover);
  if (!opt) return null;

  const isBook = viewMode === 'book';
  const bubbleMinWidth = estimateWidth(target.text, isBook);

  return (
    <div 
      className="absolute pointer-events-none z-40 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
      style={{ left: target.x, top: target.y, minWidth: bubbleMinWidth }}
    >
      <div 
        className={`flex items-center justify-center
          ${isBook 
            ? 'bg-transparent border-0 shadow-none px-2 py-1 font-serif text-[22px] leading-tight' 
            : 'rounded-lg shadow-sm border border-gray-200 bg-white px-3 py-1.5 text-base font-sans'
          }
        `}
        style={{ minWidth: bubbleMinWidth }}
      >
        <span 
          className="font-bold whitespace-nowrap"
          style={{ color: opt.color }}
        >
          {opt.label}
        </span>
      </div>
    </div>
  );
});

const Connections = React.memo(({ nodes, selection, connectionMode, viewMode }) => {
  if (connectionMode === 'hidden') return null; 

  const groups = {};
  nodes.forEach(node => {
    if (!node.parentId) return;
    const key = `${node.parentId}-${node.relation}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(node);
  });

  const Label = ({ x, y, label, color }) => (
    <foreignObject x={x - 20} y={y - 10} width="40" height="20">
       <div className="flex items-center justify-center">
         <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shadow-sm opacity-90" style={{ backgroundColor: color }}>
           {label}
         </span>
       </div>
    </foreignObject>
  );

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
      {Object.entries(groups).map(([key, groupNodes]) => {
        const parent = nodes.find(n => n.id === groupNodes[0].parentId);
        if (!parent) return null;

        const relationId = groupNodes[0].relation;
        const relationObj = SATELLITE_OPTIONS.find(s => s.id === relationId);
        const color = relationObj?.color || '#9CA3AF';
        const isAnySelected = groupNodes.some(n => selection.includes(n.id));
        const strokeWidth = isAnySelected ? "3" : "2";
        const opacity = isAnySelected ? "1" : "0.6";

        const pScale = parent.styles.scale || 1;
        const parentHalfHeight = viewMode === 'book' ? 10 : (NODE_HEIGHT / 2 * pScale);
        
        const startX = parent.x;
        const startY = parent.y + parentHalfHeight;

        if (connectionMode === 'tree') {
          if (groupNodes.length === 1) {
             const child = groupNodes[0];
             const endX = child.x;
             const endY = child.y - (viewMode === 'book' ? 10 : (NODE_HEIGHT / 2 * (child.styles.scale || 1)));
             const cp1Y = startY + (endY - startY) * 0.5;
             const cp2Y = endY - (endY - startY) * 0.5;

             return (
               <g key={key}>
                 <path d={`M ${startX} ${startY} C ${startX} ${cp1Y}, ${endX} ${cp2Y}, ${endX} ${endY}`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" opacity={opacity} />
                 <Label x={startX + (endX - startX) * 0.5} y={startY + (endY - startY) * 0.5} label={relationObj?.label} color={color} />
               </g>
             );
          } else {
             const minChildX = Math.min(...groupNodes.map(n => n.x));
             const maxChildX = Math.max(...groupNodes.map(n => n.x));
             const hubX = (minChildX + maxChildX) / 2;
             
             const sampleChild = groupNodes[0];
             const sampleChildTop = sampleChild.y - (viewMode === 'book' ? 10 : (NODE_HEIGHT / 2 * (sampleChild.styles.scale || 1)));
             const hubY = (startY + sampleChildTop) / 2;

             return (
               <g key={key}>
                 <path d={`M ${startX} ${startY} C ${startX} ${startY + (hubY-startY)*0.5}, ${hubX} ${startY + (hubY-startY)*0.5}, ${hubX} ${hubY}`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" opacity={opacity} />
                 <Label x={hubX} y={hubY} label={relationObj?.label} color={color} />
                 {groupNodes.map(child => {
                    const cH = viewMode === 'book' ? 10 : (NODE_HEIGHT / 2 * (child.styles.scale || 1));
                    const childTopY = child.y - cH;
                    return <path key={`b-${child.id}`} d={`M ${hubX} ${hubY} C ${hubX} ${hubY + (childTopY-hubY)*0.5}, ${child.x} ${childTopY - (childTopY-hubY)*0.5}, ${child.x} ${childTopY}`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" opacity={opacity} />;
                 })}
               </g>
             );
          }
        }

        if (connectionMode === 'direct') {
           const parentCenterY = parent.y;
           return (
             <g key={key}>
                {groupNodes.map(child => {
                   const childCenterY = child.y;
                   const midX = (startX + child.x) / 2;
                   const midY = (parentCenterY + childCenterY) / 2;
                   return (
                     <g key={`d-${child.id}`}>
                       <line x1={startX} y1={parentCenterY} x2={child.x} y2={childCenterY} stroke={color} strokeWidth={strokeWidth} opacity={opacity} />
                       <Label x={midX} y={midY} label={relationObj?.label} color={color} />
                     </g>
                   );
                })}
             </g>
           );
        }

        if (connectionMode === 'step') {
          return (
            <g key={key}>
              {groupNodes.map(child => {
                 const endX = child.x;
                 const endY = child.y - (viewMode === 'book' ? 10 : (NODE_HEIGHT / 2 * (child.styles.scale || 1)));
                 const midY = (startY + endY) / 2;
                 return (
                   <g key={`s-${child.id}`}>
                     <path d={`M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`} fill="none" stroke={color} strokeWidth={strokeWidth} opacity={opacity} />
                     <Label x={endX} y={midY} label={relationObj?.label} color={color} />
                   </g>
                 );
              })}
            </g>
          );
        }

        return null;
      })}
    </svg>
  );
});

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  const [selection, setSelection] = useState([]); 
  const [multiSelectMode, setMultiSelectMode] = useState(false);

  const [dragState, setDragState] = useState(null); 
  const [hoverTarget, setHoverTarget] = useState(null); 
  const [satelliteHover, setSatelliteHover] = useState(null); 
  
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_ESV_API_KEY || '');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentReference, setCurrentReference] = useState(DEFAULT_PASSAGE);
  const [lastHighlightColor, setLastHighlightColor] = useState('yellow');
  const [showHighlighterColors, setShowHighlighterColors] = useState(false);
  const highlighterCloseTimerRef = useRef(null);
  
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  
  const [connectionMode, setConnectionMode] = useState('hidden'); 
  const [viewMode, setViewMode] = useState('book'); 
  
  const positionsCache = useRef({ canvas: {}, book: {} });
  
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef(null);

  // Clear highlighter close timer on unmount (e.g. when toolbar hides)
  useEffect(() => () => {
    if (highlighterCloseTimerRef.current) clearTimeout(highlighterCloseTimerRef.current);
  }, []);

  // Initial Load
  useEffect(() => {
    const initialNodes = splitTextToNodes(DEFAULT_TEXT, 'book');
    const resolvedNodes = resolveOverlaps(initialNodes, 'book');
    setNodes(resolvedNodes);
    saveToHistory(resolvedNodes);
  }, []);

  const saveToHistory = (newNodes) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(newNodes));
    if (newHistory.length > 20) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setNodes(JSON.parse(history[newIndex]));
      setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setNodes(JSON.parse(history[newIndex]));
      setHistoryIndex(newIndex);
    }
  };

  const updateNodes = (newNodes, shouldResolve = false) => {
    let finalNodes = newNodes;
    if (shouldResolve) {
      finalNodes = resolveOverlaps(newNodes, viewMode);
    }
    setNodes(finalNodes);
    saveToHistory(finalNodes);
  };

  const toggleViewMode = () => {
    const nextMode = viewMode === 'canvas' ? 'book' : 'canvas';
    
    const currentPositions = {};
    nodes.forEach(n => {
      currentPositions[n.id] = { x: n.x, y: n.y };
    });
    positionsCache.current[viewMode] = currentPositions;

    let nextNodes = nodes.map(n => ({...n}));
    const cachedPositions = positionsCache.current[nextMode];
    const hasCache = Object.keys(cachedPositions).length > 0;

    if (hasCache) {
      nextNodes = nextNodes.map(n => {
        if (cachedPositions[n.id]) {
          return { ...n, x: cachedPositions[n.id].x, y: cachedPositions[n.id].y };
        }
        return n; 
      });
    } else {
      nextNodes = calculateLayout(nextNodes, nextMode);
    }

    if (hasCache) {
        nextNodes = resolveOverlaps(nextNodes, nextMode);
    }

    setViewMode(nextMode);
    setNodes(nextNodes);
    if (nextMode === 'book') {
        setOffset({ x: 0, y: 0 });
        setScale(1);
    }
  };

  const cycleConnectionMode = () => {
    const currentIndex = CONNECTION_MODES.findIndex(m => m.id === connectionMode);
    const nextIndex = (currentIndex + 1) % CONNECTION_MODES.length;
    setConnectionMode(CONNECTION_MODES[nextIndex].id);
  };

  const callGemini = async (prompt) => {
    const apiKey = ""; 
    setIsAiLoading(true);
    setShowAiModal(true);
    setAiResponse(null);
    const makeRequest = async (retryCount = 0) => {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
        );
        if (!response.ok) {
          if (response.status === 429 && retryCount < 3) {
            await new Promise(r => setTimeout(r, Math.pow(2, retryCount) * 1000));
            return makeRequest(retryCount + 1);
          }
          throw new Error('API request failed');
        }
        const data = await response.json();
        setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis available.");
      } catch (error) {
        setAiResponse("Error generating analysis.");
      } finally {
        setIsAiLoading(false);
      }
    };
    makeRequest();
  };

  const triggerInsights = () => {
    const fullText = nodes.sort((a,b) => a.y - b.y || a.x - b.x).map(n => n.text).join(' ');
    const prompt = `Analyze the following biblical text structurally and theologically... "${fullText}"`;
    callGemini(prompt);
  };

  const triggerWordStudy = () => {
    if (selection.length === 0) return;
    const selectedText = nodes.filter(n => selection.includes(n.id)).sort((a,b) => a.x - b.x).map(n => n.text).join(' ');
    const fullText = nodes.map(n => n.text).join(' ');
    const prompt = `Perform a brief word study on "${selectedText}" in context: "${fullText}"...`;
    callGemini(prompt);
  };

  const getCanvasCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (viewMode === 'book') {
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top + canvasRef.current.scrollTop
        };
    }
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale,
    };
  };

  const handlePointerDown = (e, nodeId = null) => {
    e.target.setPointerCapture(e.pointerId);
    if (nodeId) e.stopPropagation();
    const coords = getCanvasCoordinates(e);

    if (nodeId) {
      let newSelection = [...selection];
      let pendingDeselect = false;
      const isMultiAction = multiSelectMode || e.shiftKey;
      const isAlreadySelected = newSelection.includes(nodeId);

      if (isMultiAction) {
        if (isAlreadySelected) pendingDeselect = true;
        else {
          newSelection.push(nodeId);
          // When we now have 2+ different words, keep only primary (first word) + explicitly added words — drop other matches of the first word
          const norm = (t) => (t || '').toLowerCase().replace(/[^\w\s]/gi, '');
          const primaryId = selection[0];
          const firstWordNorm = primaryId ? norm(nodes.find(n => n.id === primaryId)?.text || '') : '';
          const hasMultipleWords = new Set(newSelection.map(id => norm(nodes.find(n => n.id === id)?.text || ''))).size > 1;
          if (hasMultipleWords && firstWordNorm) {
            newSelection = newSelection.filter(id => id === primaryId || norm(nodes.find(n => n.id === id)?.text || '') !== firstWordNorm);
          }
        }
        setSelection(newSelection);
      } else {
        // Single selection logic:
        // If clicking an already selected node, mark to clear selection on pointer up (closes styling popup).
        // If clicking a new node, select it AND find all matching words.
        if (!isAlreadySelected) {
           const clickedNode = nodes.find(n => n.id === nodeId);
           if (clickedNode) {
             const targetWord = clickedNode.text.toLowerCase().replace(/[^\w\s]/gi, ''); // Normalize
             
             const matchingIds = nodes.filter(n => {
               const nWord = n.text.toLowerCase().replace(/[^\w\s]/gi, '');
               return nWord === targetWord;
             }).map(n => n.id);
             // Put clicked word first so it is always the "primary" (normal styling); matches get yellow
             newSelection = [nodeId, ...matchingIds.filter(id => id !== nodeId)];
           } else {
             newSelection = [nodeId];
           }
           setSelection(newSelection);
        }
      }
      
      const idsToMove = new Set(newSelection);
      const initialPositions = {};
      const gatherDescendants = (pId) => {
        nodes.forEach(n => {
          if (n.parentId === pId && !idsToMove.has(n.id)) {
            idsToMove.add(n.id);
            gatherDescendants(n.id);
          }
        });
      };
      newSelection.forEach(selId => gatherDescendants(selId));
      nodes.forEach(n => { if (idsToMove.has(n.id)) initialPositions[n.id] = { x: n.x, y: n.y }; });

      setDragState({
        type: 'node', mainNodeId: nodeId, startX: coords.x, startY: coords.y,
        idsToMove, initialPositions, hasMoved: false, pendingDeselect, pendingClearSelection: !isMultiAction && isAlreadySelected, pointerId: e.pointerId
      });
    } else {
      if (multiSelectMode || e.shiftKey) {
        setDragState({ type: 'box-select', startX: coords.x, startY: coords.y, currentX: coords.x, currentY: coords.y, pointerId: e.pointerId });
      } else {
        setSelection([]);
        setDragState({ type: 'canvas', startX: e.clientX, startY: e.clientY, initialOffsetX: offset.x, initialOffsetY: offset.y, hasMoved: false, pointerId: e.pointerId });
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!dragState) return;
    if (e.pointerId !== dragState.pointerId) return;
    e.preventDefault(); 
    const coords = getCanvasCoordinates(e);

    if (dragState.type === 'node') {
      if (!dragState.hasMoved) {
         const dx = coords.x - dragState.startX;
         const dy = coords.y - dragState.startY;
         if (Math.hypot(dx, dy) <= 3) return;
         const movingRoots = nodes.filter(n => dragState.idsToMove.has(n.id) && !n.parentId);
         const norm = (t) => (t || '').toLowerCase().replace(/[^\w\s]/gi, '');
         const sameWordDrag = movingRoots.length > 1 && movingRoots.every(n => norm(n.text) === norm(movingRoots[0].text));
         if (sameWordDrag) {
           const narrowedIds = new Set([dragState.mainNodeId, ...getDescendants(dragState.mainNodeId, nodes).map(d => d.id)]);
           const nextNodes = nodes.map(n => {
             if (dragState.idsToMove.has(n.id) && !narrowedIds.has(n.id)) {
               const init = dragState.initialPositions[n.id];
               return init ? { ...n, x: init.x, y: init.y } : n;
             }
             if (narrowedIds.has(n.id)) {
               const init = dragState.initialPositions[n.id];
               return init ? { ...n, x: init.x + dx, y: init.y + dy } : n;
             }
             return n;
           });
           setNodes(nextNodes);
           setSelection([dragState.mainNodeId]);
           setDragState(prev => ({ ...prev, hasMoved: true, idsToMove: narrowedIds }));
           return;
         }
         setDragState(prev => ({ ...prev, hasMoved: true }));
      }

      const rawDx = coords.x - dragState.startX;
      const rawDy = coords.y - dragState.startY;
      const mainInitPos = dragState.initialPositions[dragState.mainNodeId];
      const proposedX = mainInitPos.x + rawDx;
      const proposedY = mainInitPos.y + rawDy;

      let dx = rawDx;
      let dy = rawDy;

      if (viewMode === 'canvas') {
          const viewportLeft = -offset.x / scale;
          const viewportTop = -offset.y / scale;
          const viewportRight = (window.innerWidth - offset.x) / scale;
          const viewportBottom = (window.innerHeight - offset.y) / scale;
          const PADDING = 20;
          const clampedX = Math.max(viewportLeft + PADDING, Math.min(viewportRight - PADDING, proposedX));
          const clampedY = Math.max(viewportTop + PADDING, Math.min(viewportBottom - PADDING, proposedY));
          dx = clampedX - mainInitPos.x;
          dy = clampedY - mainInitPos.y;
      }

      const nextNodes = nodes.map(n => {
        if (dragState.idsToMove.has(n.id)) {
          const init = dragState.initialPositions[n.id];
          return { ...n, x: init.x + dx, y: init.y + dy };
        }
        return n;
      });
      setNodes(nextNodes);

      const mainNode = nextNodes.find(n => n.id === dragState.mainNodeId);
      let foundTarget = null;
      let foundSat = null;
      const potentialTargets = nextNodes.filter(n => {
        if (connectionMode === 'hidden' && n.parentId) return false;
        if (dragState.idsToMove.has(n.id)) return false; 
        const dist = Math.hypot(n.x - mainNode.x, n.y - mainNode.y);
        return dist < 120;
      });
      if (potentialTargets.length > 0) {
        potentialTargets.sort((a, b) => Math.hypot(a.x - mainNode.x, a.y - mainNode.y) - Math.hypot(b.x - mainNode.x, b.y - mainNode.y));
        const target = potentialTargets[0];
        foundTarget = target.id;
        const isBook = viewMode === 'book';
        const wordWidth = estimateWidth(target.text, isBook);
        const leftEdge = target.x - wordWidth / 2;
        const relX = coords.x - leftEdge;
        const zoneIndex = Math.max(0, Math.min(5, Math.floor((relX / wordWidth) * 6)));
        foundSat = SATELLITE_OPTIONS[zoneIndex].id;
      }
      setHoverTarget(foundTarget);
      setSatelliteHover(foundSat);
    
    } else if (dragState.type === 'box-select') {
      setDragState(prev => ({ ...prev, currentX: coords.x, currentY: coords.y }));
    } else if (dragState.type === 'canvas') {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      setOffset({ x: dragState.initialOffsetX + dx, y: dragState.initialOffsetY + dy });
    }
  };

  const handlePointerUp = (e) => {
    if (!dragState) return;
    if (e.pointerId !== dragState.pointerId) return;
    if (e.target.hasPointerCapture(e.pointerId)) e.target.releasePointerCapture(e.pointerId);

    if (dragState.type === 'node') {
      if (!dragState.hasMoved && dragState.pendingClearSelection) {
        setSelection([]);
      } else if (!dragState.hasMoved && dragState.pendingDeselect) {
        setSelection(prev => prev.filter(id => id !== dragState.mainNodeId));
      }
      if (dragState.hasMoved) {
        if (hoverTarget && satelliteHover) {
          const parent = nodes.find(n => n.id === hoverTarget);
          
          const gap = viewMode === 'book' ? 40 : 120;
          const snapY = parent.y + gap; 
          const snapX = parent.x;
          
          const norm = (t) => (t || '').toLowerCase().replace(/[^\w\s]/gi, '');
          const selectedMoving = nodes.filter(n => dragState.idsToMove.has(n.id) && selection.includes(n.id));
          const sameWordDrop = selectedMoving.length > 0 && selectedMoving.every(n => norm(n.text) === norm(selectedMoving[0].text));
          const idsToNest = sameWordDrop ? [dragState.mainNodeId] : selectedMoving.map(n => n.id);

          const movedRoots = [];
          idsToNest.forEach(id => {
             const currentNode = nodes.find(n => n.id === id);
             if (currentNode && !currentNode.parentId && dragState.initialPositions[id]) {
                movedRoots.push({ id, text: currentNode.text, oldX: dragState.initialPositions[id].x, oldY: dragState.initialPositions[id].y, wasRoot: true });
             }
          });

          const nextNodes = nodes.map(n => {
            if (dragState.idsToMove.has(n.id)) {
               if (idsToNest.includes(n.id)) return { ...n, parentId: hoverTarget, relation: satelliteHover, x: snapX, y: snapY };
               const orig = dragState.initialPositions[n.id];
               return orig ? { ...n, x: orig.x, y: orig.y } : { ...n, x: snapX, y: snapY };
            }
            return n;
          });
          
          const filledNodes = closeGaps(nextNodes, movedRoots, viewMode);
          updateNodes(filledNodes, true); 
        } else {
          updateNodes([...nodes], false);
        }
      }
    } 
    else if (dragState.type === 'box-select') {
      const minX = Math.min(dragState.startX, dragState.currentX);
      const maxX = Math.max(dragState.startX, dragState.currentX);
      const minY = Math.min(dragState.startY, dragState.currentY);
      const maxY = Math.max(dragState.startY, dragState.currentY);
      const intersectedIds = nodes.filter(n => {
        const nodeLeft = n.x - 30; const nodeRight = n.x + 30; const nodeTop = n.y - 15; const nodeBottom = n.y + 15;
        return !(nodeLeft > maxX || nodeRight < minX || nodeTop > maxY || nodeBottom < minY);
      }).map(n => n.id);
      setSelection(Array.from(new Set([...selection, ...intersectedIds])));
    }
    setDragState(null);
    setHoverTarget(null);
    setSatelliteHover(null);
  };

  const setHighlight = (colorId) => {
    if (selection.length === 0) return;
    const norm = (t) => (t || '').toLowerCase().replace(/[^\w\s]/gi, '');
    const selectedNodes = nodes.filter(n => selection.includes(n.id));
    const sameWordSelection = selectedNodes.length > 0 && selectedNodes.every(n => norm(n.text) === norm(selectedNodes[0].text));
    const idsToApply = sameWordSelection ? [selection[0]] : selection;

    const alreadyThisColor = idsToApply.every(id => {
      const node = nodes.find(n => n.id === id);
      const current = node?.styles?.highlight;
      return current === colorId || (current === true && colorId === 'yellow');
    });
    const newHighlight = alreadyThisColor ? false : colorId;
    if (!alreadyThisColor) setLastHighlightColor(colorId);

    const newNodes = nodes.map(n =>
      idsToApply.includes(n.id) ? { ...n, styles: { ...n.styles, highlight: newHighlight } } : n
    );
    updateNodes(newNodes, true);
  };

  const clearFormatting = () => {
    if (selection.length === 0) return;
    const newNodes = nodes.map(n => selection.includes(n.id) ? { 
      ...n, 
      styles: { 
        bold: false, 
        italic: false, 
        underline: false, 
        highlight: null,
        scale: 1 
      } 
    } : n);
    updateNodes(newNodes, true);
  };

  const toggleStyle = (styleKey) => {
    if (selection.length === 0) return;
    const newNodes = nodes.map(n => selection.includes(n.id) ? { ...n, styles: { ...n.styles, [styleKey]: !n.styles[styleKey] } } : n);
    updateNodes(newNodes, true);
  };
  const changeFontSize = (delta) => {
    if (selection.length === 0) return;
    const newNodes = nodes.map(n => selection.includes(n.id) ? { ...n, styles: { ...n.styles, scale: Math.max(0.5, (n.styles.scale || 1) + delta) } } : n);
    updateNodes(newNodes, true);
  };
  const detachNode = () => {
    if (selection.length === 0) return;
    const newNodes = nodes.map(n => selection.includes(n.id) ? { ...n, parentId: null, relation: null } : n);
    updateNodes(newNodes, true); 
  };

  const fetchPassage = async (reference) => {
    setLoading(true);
    try {
        let text = "";
        if (!apiKey) {
            if (reference.toLowerCase().includes("romans 5")) text = DEFAULT_TEXT;
            else { 
                alert("Please provide an ESV API Key in settings or .env"); 
                setLoading(false);
                return;
            }
        } else {
            const response = await fetch(`https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(reference)}&include-headings=false&include-footnotes=false&include-verse-numbers=false`, { headers: { Authorization: `Token ${apiKey}` } });
            const data = await response.json();
            if (data.passages && data.passages.length > 0) {
                text = data.passages[0];
                setCurrentReference(reference);
            } else {
                alert("No passage found.");
                setLoading(false);
                return;
            }
        }
        const newNodes = splitTextToNodes(text, viewMode);
        updateNodes(newNodes, true);
        setOffset({ x: 0, y: 0 });
        setScale(1);
        setSelection([]);
    } catch (error) { 
        console.error(error);
        alert("Failed to fetch passage."); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchPassage(searchQuery);
    }
  };

  const ActiveModeIcon = CONNECTION_MODES.find(m => m.id === connectionMode)?.icon || EyeOff;
  const activeModeLabel = CONNECTION_MODES.find(m => m.id === connectionMode)?.label || 'Hidden';
  const isBookMode = viewMode === 'book';

  const maxNodeY = nodes.length > 0 ? Math.max(...nodes.map(n => n.y)) : 0;
  const contentHeight = isBookMode ? Math.max(window.innerHeight, maxNodeY + 200) : '100%';

  return (
    <div 
      className={`w-full h-screen flex flex-col select-none text-gray-900 transition-colors duration-500
        ${isBookMode ? 'bg-[#F9F5EB] overflow-y-auto touch-pan-y' : 'bg-[#F9FAFB] overflow-hidden touch-none'}
      `}
      style={{ touchAction: isBookMode ? 'pan-y' : 'none' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');
      `}</style>
      
      {/* --- Top Toolbar --- */}
      <header className={`h-14 border-b flex items-center justify-between px-4 shadow-sm z-50 transition-colors duration-300 sticky top-0
         ${isBookMode ? 'bg-[#F2EFE5] border-[#E6DCC8]' : 'bg-white border-gray-200'}
      `}>
        <div className="flex items-center space-x-2">
          <BookOpen className={`w-5 h-5 ${isBookMode ? 'text-[#8b5e3c]' : 'text-indigo-600'}`} />
          <h1 className={`text-lg font-semibold hidden sm:block ${isBookMode ? 'text-[#5a4231] font-serif' : 'text-gray-800'}`}>VerseAxis</h1>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search passage (e.g. John 3:16)"
            className={`w-full pl-4 pr-10 py-1.5 rounded-full text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
              ${isBookMode 
                ? 'bg-[#F9F5EB] border-[#D7C9A8] text-[#5a4231] placeholder-[#8b5e3c]/50' 
                : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
              }
            `}
          />
          <button 
            type="submit"
            disabled={loading}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-black/5 transition-colors ${isBookMode ? 'text-[#8b5e3c]' : 'text-gray-400'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </form>

        <div className={`flex items-center gap-1 rounded-full px-2 py-1.5 mr-4 ${isBookMode ? 'bg-[#E6DCC8]/60' : 'bg-gray-100/80'}`}>
          <button onClick={undo} disabled={historyIndex <= 0} className="p-1 rounded-full hover:bg-black/5 text-gray-500 disabled:opacity-30 transition" title="Undo">
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1 rounded-full hover:bg-black/5 text-gray-500 disabled:opacity-30 transition" title="Redo">
             <Redo2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3 bg-gray-300/60 mx-0.5" aria-hidden="true" />
          <button 
            onClick={() => setMultiSelectMode(!multiSelectMode)}
            className={`p-1 rounded-full transition flex items-center gap-1 ${multiSelectMode ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-black/5 text-gray-500'}`}
            title={multiSelectMode ? 'Multi (Box) select' : 'Single select'}
          >
             {multiSelectMode ? <CheckSquare className="w-3.5 h-3.5"/> : <MousePointer2 className="w-3.5 h-3.5"/>}
             <span className="text-[10px] font-medium hidden xs:inline">{multiSelectMode ? 'Multi' : 'Select'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button 
             onClick={toggleViewMode}
             className={`p-2 rounded-full transition flex items-center gap-2 ${isBookMode ? 'bg-[#E6DCC8] text-[#8b5e3c]' : 'text-gray-400 hover:text-gray-600'}`}
             title={`Switch to ${isBookMode ? 'Diagram' : 'Book'} View`}
          >
             {isBookMode ? <Layout className="w-5 h-5"/> : <FileText className="w-5 h-5"/>}
          </button>

          <button 
             onClick={cycleConnectionMode}
             className={`p-2 rounded-full transition flex items-center gap-2 ${connectionMode !== 'hidden' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
             title={`Connections: ${activeModeLabel}`}
          >
             <ActiveModeIcon className="w-5 h-5"/>
          </button>
          
          <button 
             onClick={triggerInsights}
             className="p-2 rounded-full text-indigo-600 hover:bg-indigo-50 transition border border-indigo-100"
             title="Passage Insights (Gemini)"
          >
             <Sparkles className="w-5 h-5"/>
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-500 hover:text-indigo-600 transition"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* --- Context Toolbar --- */}
      {selection.length > 0 && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur rounded-full shadow-xl border border-gray-100 p-2 flex items-center space-x-2 z-50 animate-bounce-in max-w-[95vw] overflow-visible">
           <button onClick={() => toggleStyle('bold')} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><Bold className="w-4 h-4"/></button>
           <button onClick={() => toggleStyle('italic')} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><Italic className="w-4 h-4"/></button>
           <button onClick={() => toggleStyle('underline')} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><Underline className="w-4 h-4"/></button>
           
           <div className="w-px h-4 bg-gray-300 mx-1"></div>
           
           <div
             className="relative overflow-visible"
             onMouseEnter={() => {
               if (highlighterCloseTimerRef.current) {
                 clearTimeout(highlighterCloseTimerRef.current);
                 highlighterCloseTimerRef.current = null;
               }
               setShowHighlighterColors(true);
             }}
             onMouseLeave={() => {
               highlighterCloseTimerRef.current = setTimeout(() => setShowHighlighterColors(false), 300);
             }}
           >
             <button 
               onClick={() => setHighlight(lastHighlightColor)} 
               className="p-2 hover:bg-gray-100 rounded-full text-gray-600 flex items-center justify-center"
               title="Highlight (hover for colors)"
             >
               <Highlighter className="w-4 h-4" style={{ color: HIGHLIGHT_COLORS.find(c => c.id === lastHighlightColor)?.dot }} />
             </button>
             
             {/* Color Popup - above highlighter; delay before closing so user can move to popup and click */}
             {showHighlighterColors && (
               <div
                 className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-full shadow-xl border border-gray-100 p-1.5 flex space-x-1 z-[100]"
                 onMouseEnter={() => {
                   if (highlighterCloseTimerRef.current) {
                     clearTimeout(highlighterCloseTimerRef.current);
                     highlighterCloseTimerRef.current = null;
                   }
                   setShowHighlighterColors(true);
                 }}
                 onMouseLeave={() => {
                   highlighterCloseTimerRef.current = setTimeout(() => setShowHighlighterColors(false), 300);
                 }}
               >
                 {HIGHLIGHT_COLORS.map(c => (
                   <button 
                     key={c.id}
                     onClick={(e) => { e.stopPropagation(); setHighlight(c.id); }} 
                     className="w-5 h-5 rounded-full hover:scale-110 transition-transform ring-1 ring-black/5"
                     style={{ backgroundColor: c.dot }}
                     title={c.label}
                   />
                 ))}
               </div>
             )}
           </div>

           <div className="w-px h-4 bg-gray-300 mx-1"></div>
           
           <button onClick={() => changeFontSize(0.1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 font-bold text-xs">A+</button>
           <button onClick={() => changeFontSize(-0.1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 font-bold text-xs">A-</button>
           
           <div className="w-px h-4 bg-gray-300 mx-1"></div>

           <button onClick={clearFormatting} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="Clear Formatting">
             <Eraser className="w-4 h-4" />
           </button>
           
           <button onClick={undo} disabled={historyIndex <= 0} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 disabled:opacity-30">
             <Undo2 className="w-4 h-4" />
           </button>
           <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 disabled:opacity-30">
             <Redo2 className="w-4 h-4" />
           </button>

           <div className="w-px h-4 bg-gray-300 mx-1"></div>
           
           <button onClick={triggerWordStudy} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-full flex items-center space-x-1">
             <Sparkles className="w-4 h-4" />
             <span className="text-xs font-bold">Study</span>
           </button>
           <div className="w-px h-4 bg-gray-300 mx-1"></div>

           <button onClick={detachNode} className="p-2 hover:bg-red-50 text-red-500 rounded-full">
             <Trash2 className="w-4 h-4" />
           </button>
           <span className="text-xs text-gray-400 font-medium px-2 border-l border-gray-200">
             {selection.length}
           </span>
        </div>
      )}

      {/* --- Main Canvas --- */}
      <div 
        ref={canvasRef}
        className="flex-1 relative"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          // Apply background grid only if NOT in book mode
          backgroundImage: isBookMode ? 'none' : 'radial-gradient(#E5E7EB 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          height: isBookMode ? contentHeight : '100%'
        }}
      >
        <div 
          className="absolute origin-top-left transition-transform duration-75 ease-out"
          style={{ 
            // In book mode, we reset scale/offset visually, but use standard layout flow
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            width: '100%',
            height: '100%'
          }}
        >
          {isBookMode && (
            <div className="absolute top-8 w-full text-center pointer-events-none z-0">
              <h2 className="text-3xl font-bold text-[#5a4231] font-serif mb-8">{currentReference}</h2>
            </div>
          )}

          <Connections nodes={nodes} selection={selection} connectionMode={connectionMode} viewMode={viewMode} />

          {/* Nodes */}
          {(() => {
            const selectedNodes = nodes.filter(n => selection.includes(n.id));
            const norm = (t) => (t || '').toLowerCase().replace(/[^\w\s]/gi, '');
            const sameWordSelection = selectedNodes.length > 0 && selectedNodes.every(n => norm(n.text) === norm(selectedNodes[0].text));
            const primaryNode = selection.length > 0 ? nodes.find(n => n.id === selection[0]) : null;
            const firstWordNorm = primaryNode ? norm(primaryNode.text) : '';
            return nodes.map(node => {
            if (connectionMode === 'hidden' && node.parentId) return null;

            const descendantCount = getDescendants(node.id, nodes).length;
            const userScale = node.styles.scale || 1;
            const finalScale = userScale;

            const isSelected = selection.includes(node.id);
            const isPrimarySelection = selection[0] === node.id;
            // Only use two underline colors when selection is "same word" (clicked word + its matches); otherwise all selected get same underline
            const usePrimarySecondaryUnderline = isSelected && sameWordSelection;
            // When 2+ words selected: don't underline "matches of the first word" (same text as primary but not the primary)
            const isMatchOfFirstWord = isSelected && !sameWordSelection && node.id !== selection[0] && norm(node.text) === firstWordNorm;
            const isMoving = dragState?.idsToMove?.has(node.id);
            const isHoverTarget = hoverTarget === node.id;

            // Resolve Highlight Class: book = letters only (span); canvas = whole bubble (div)
            let highlightClass = '';
            let canvasHighlightClass = '';
            const hColorId = node.styles.highlight === true ? 'yellow' : node.styles.highlight; // Handle legacy boolean
            if (hColorId) {
               const hConfig = HIGHLIGHT_COLORS.find(c => c.id === hColorId) || HIGHLIGHT_COLORS[0];
               highlightClass = isBookMode ? `${hConfig.bookClass} rounded-sm` : '';
               canvasHighlightClass = !isBookMode ? `${hConfig.canvasClass}` : '';
            }

            let underlineClass = '';
            if (isBookMode && isSelected && !isMatchOfFirstWord) {
              if (usePrimarySecondaryUnderline)
                underlineClass = isPrimarySelection ? 'underline decoration-indigo-600 decoration-2' : 'underline decoration-yellow-400 decoration-2';
              else
                underlineClass = 'underline decoration-indigo-600 decoration-2';
            }

            const canvasSelectedClass = !isBookMode && isSelected && usePrimarySecondaryUnderline && !isPrimarySelection
              ? (canvasHighlightClass ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-yellow-400 ring-2 ring-yellow-200 bg-yellow-50')
              : !isBookMode && isSelected
                ? 'border-indigo-500 ring-2 ring-indigo-200'
                : !isBookMode && !canvasHighlightClass ? 'border-gray-200 bg-white' : !isBookMode ? 'border-gray-200' : '';
            return (
              <div
                key={node.id}
                onPointerDown={(e) => { handlePointerDown(e, node.id); }}
                className={`absolute group flex items-center justify-center px-2 py-1 transition-all duration-300 ease-out z-10
                  ${isMoving ? 'cursor-grabbing' : 'cursor-pointer'}
                  ${isBookMode 
                    ? 'bg-transparent border-0 shadow-none p-0' 
                    : `rounded-lg shadow-sm border px-3 py-1.5 ${canvasSelectedClass} ${canvasHighlightClass}`
                  }
                  ${!isBookMode && isHoverTarget && dragState?.type !== 'node' && !usePrimarySecondaryUnderline ? 'ring-4 ring-indigo-100 scale-105 border-indigo-300' : ''}
                  ${!isBookMode && isHoverTarget && dragState?.type !== 'node' && usePrimarySecondaryUnderline && !isPrimarySelection ? 'ring-4 ring-yellow-100 scale-105 border-yellow-300' : ''}
                  ${underlineClass}
                `}
                style={{
                  left: node.x,
                  top: node.y,
                  transform: `translate(-50%, -50%) scale(${finalScale})`,
                  minWidth: 'min-content'
                }}
              >
                <span 
                  className={`whitespace-nowrap pointer-events-none select-none rounded-sm
                    ${isBookMode ? 'text-[#2D2D2D] font-serif leading-tight' : 'text-gray-800 font-sans'}
                    ${node.styles.bold ? 'font-bold' : 'font-normal'}
                    ${node.styles.italic ? 'italic' : ''}
                    ${node.styles.underline ? 'underline' : ''}
                    ${highlightClass}
                  `}
                  style={{ 
                    fontFamily: isBookMode ? '"Crimson Text", serif' : 'inherit',
                    fontSize: isBookMode ? '22px' : '16px',
                    letterSpacing: isBookMode ? '0.01em' : 'normal'
                  }}
                >
                  {node.text}
                </span>

                {!isBookMode && multiSelectMode && isSelected && (
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-indigo-600 text-white rounded flex items-center justify-center text-[10px] shadow border border-white">
                    ✓
                  </div>
                )}

                {descendantCount > 0 && (
                  <span 
                    className={`absolute flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full shadow-sm border-2 border-white pointer-events-none transition-transform
                      ${isBookMode ? '-top-2 -right-3 scale-75 opacity-70' : '-top-2 -right-2'}
                      ${connectionMode === 'hidden' ? 'scale-125 bg-red-500' : ''} 
                    `}
                  >
                    {descendantCount}
                  </span>
                )}
              </div>
            );
          });
          })()}
          
          {/* Marquee Selection Box */}
          {dragState?.type === 'box-select' && (
             <div 
               className="absolute border-2 border-indigo-500 bg-indigo-500/20 pointer-events-none z-50"
               style={{
                 left: Math.min(dragState.startX, dragState.currentX),
                 top: Math.min(dragState.startY, dragState.currentY),
                 width: Math.abs(dragState.currentX - dragState.startX),
                 height: Math.abs(dragState.currentY - dragState.startY),
               }}
             />
          )}

          {hoverTarget && dragState?.type === 'node' && (
            <Satellites 
              nodes={nodes} 
              targetId={hoverTarget} 
              satelliteHover={satelliteHover}
              viewMode={viewMode}
            />
          )}

          {isBookMode && (
            <div 
              className="absolute w-full text-center pointer-events-none pb-20"
              style={{ top: maxNodeY + 100 }}
            >
              <span className="font-serif text-sm text-[#8b5e3c] italic opacity-60">
                &#123; ESV &#125;
              </span>
            </div>
          )}

        </div>
      </div>

      {/* --- Overlay Controls --- */}
      {!isBookMode && (
        <div className="absolute bottom-6 right-6 flex flex-col space-y-2">
           <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="w-10 h-10 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-indigo-600 text-xl font-bold">+</button>
           <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="w-10 h-10 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-indigo-600 text-xl font-bold">-</button>
           <button onClick={() => {setScale(1); setOffset({x:0, y:0})}} className="w-10 h-10 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-indigo-600">
             <RefreshCcw className="w-4 h-4"/>
           </button>
        </div>
      )}

      {/* --- AI Modal --- */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Sparkles className="w-5 h-5"/>
                  <h2 className="text-lg font-bold">Gemini Insights</h2>
                </div>
                <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 text-gray-700 leading-relaxed">
                 {isAiLoading ? (
                   <div className="flex flex-col items-center justify-center h-40 space-y-4">
                     <Loader2 className="w-8 h-8 text-indigo-600 animate-spin"/>
                     <p className="text-sm text-gray-500 font-medium">Analyzing text...</p>
                   </div>
                 ) : (
                   <div className="whitespace-pre-wrap font-sans text-sm">
                     {aiResponse}
                   </div>
                 )}
              </div>
              
              <div className="p-4 border-t border-gray-100 flex justify-end">
                <button onClick={() => setShowAiModal(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">
                  Close
                </button>
              </div>
           </div>
        </div>
      )}

      {/* --- Settings Modal --- */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Settings</h2>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
              </div>
              <div className="space-y-4">
                 <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ESV API Key</label>
                    <input 
                      type="password" 
                      value={apiKey} 
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter ESV API Token"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                 </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg">Close</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
