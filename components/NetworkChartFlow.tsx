"use client"

import React, { useCallback, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    Position,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

interface NetworkNode {
    id: string
    name: string
    revenue: number
    change: number
    isListed: boolean
    group?: string
    isTarget?: boolean
}

interface NetworkLink {
    source: string
    target: string
    relationship?: string
    stkrt?: number
}

interface NetworkData {
    nodes: NetworkNode[]
    links: NetworkLink[]
}

interface NetworkChartFlowProps {
    data: NetworkData
    width?: number // Optional, responsive by default
    height?: number
    targetNodeId?: string
}

const nodeWidth = 180;
const nodeHeight = 60;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const newNode = {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            // We are shifting the dagre node position (anchor=center center) to the top left
            // so it matches the React Flow node anchor point (top left).
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };

        return newNode;
    });

    return { nodes: newNodes, edges };
};

export default function NetworkChartFlow({ data, width, height, targetNodeId }: NetworkChartFlowProps) {
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const nodes: Node[] = data.nodes.map((node) => ({
            id: node.id,
            type: 'default', // Using default for now, can be custom
            data: {
                label: (
                    <div className={`p-2 rounded-md border text-center ${node.isTarget ? 'bg-orange-50 border-orange-400' : 'bg-white border-slate-200'} shadow-sm`}>
                        <div className={`text-sm font-bold ${node.isTarget ? 'text-orange-700' : 'text-slate-800'}`}>{node.name}</div>
                        <div className="text-xs text-slate-500">{node.revenue ? `${node.revenue.toLocaleString()}억` : ''}</div>
                    </div>
                )
            },
            position: { x: 0, y: 0 }, // Initial position, will be layouted
            style: {
                width: nodeWidth,
                // height: nodeHeight, // Let height be auto
                border: 'none',
                background: 'transparent',
            }
        }));

        const edges: Edge[] = data.links.map((link, idx) => ({
            id: `e${link.source}-${link.target}-${idx}`,
            source: link.source,
            target: link.target,
            label: link.stkrt ? `${link.stkrt}%` : '',
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
            labelStyle: { fill: '#64748b', fontWeight: 700, fontSize: 10 },
            labelBgStyle: { fill: '#f1f5f9' },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#94a3b8',
            },
        }));

        return { nodes, edges };
    }, [data]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    useEffect(() => {
        if (data.nodes.length > 0) {
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                initialNodes,
                initialEdges
            );
            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
        }
    }, [data, setNodes, setEdges, initialNodes, initialEdges]);

    return (
        <div style={{ width: '100%', height: height || 600 }} className="border rounded-lg bg-slate-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-right"
            >
                <Controls />
                <Background gap={12} size={1} />
            </ReactFlow>
        </div>
    );
}
