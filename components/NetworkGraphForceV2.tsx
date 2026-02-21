"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import * as d3 from 'd3';

// Dynamically import ForceGraph2D with no SSR
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
});

interface NetworkNode {
    id: string
    name: string
    revenue: number
    change: number
    isListed: boolean
    group?: string
    isTarget?: boolean
    x?: number
    y?: number
    vx?: number
    vy?: number
}

interface NetworkLink {
    source: string | NetworkNode
    target: string | NetworkNode
    relationship?: string
    stkrt?: number
}

interface NetworkData {
    nodes: NetworkNode[]
    links: NetworkLink[]
}

interface NetworkGraphForceProps {
    data: NetworkData
    width?: number
    height?: number
    targetNodeId?: string
}

const getNodeSize = (revenue: number) => {
    if (!revenue) return 30; // 20 -> 30
    if (revenue >= 500000) return 60; // 50T: 45 -> 60
    if (revenue >= 100000) return 50; // 10T: 40 -> 50
    if (revenue >= 10000) return 40;  // 1T: 30 -> 40
    if (revenue >= 1000) return 35;   // 100B: 25 -> 35
    return 30;                        // < 100B: 20 -> 30
};

// Restored V8 Link Widths
const getLinkWidth = (stake?: number) => {
    if (!stake) return 2;
    if (stake >= 50) return 10;
    if (stake >= 30) return 8;
    if (stake >= 10) return 6;
    if (stake >= 5) return 4;
    return 2;
};

export default function NetworkGraphForce({ data, width, height, targetNodeId }: NetworkGraphForceProps) {
    const fgRef = useRef<any>(null);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };

        updateDimensions();
        const observer = new ResizeObserver(updateDimensions);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    const [graphData, setGraphData] = useState<NetworkData>({ nodes: [], links: [] });

    useEffect(() => {
        const nodes = data.nodes.map(node => ({ ...node }));
        const links = data.links.map(link => ({ ...link }));
        setGraphData({ nodes, links });
    }, [data]);

    useEffect(() => {
        const configureSimulation = () => {
            if (fgRef.current) {
                // 1. Collision (충돌 방지)
                fgRef.current.d3Force('collide', d3.forceCollide()
                    .radius((node: any) => (getNodeSize(node.revenue) * 1.2) + 30)
                    .strength(0.8)
                    .iterations(3)
                );

                // 2. Charge (반발력)
                fgRef.current.d3Force('charge').strength(-2500);

                // 3. Radial (중앙 인력) - Gentle pull to center
                fgRef.current.d3Force('radial', d3.forceRadial(0, 0, 0).strength(0.08));

                // 4. Link (연결선)
                fgRef.current.d3Force('link')
                    .distance((link: any) => {
                        const sourceRadius = getNodeSize(link.source.revenue);
                        const targetRadius = getNodeSize(link.target.revenue);
                        return sourceRadius + targetRadius + 120; // Increased buffer significantly (User Request)
                    })
                    .strength(1.0);

                // Reheat simulation
                fgRef.current.d3ReheatSimulation();

                setTimeout(() => {
                    fgRef.current.zoomToFit(400, 50);
                }, 500);

                return true;
            }
            return false;
        };

        // Try immediately
        if (!configureSimulation()) {
            // Poll for ref
            const interval = setInterval(() => {
                if (configureSimulation()) {
                    clearInterval(interval);
                }
            }, 100);

            // Cleanup
            return () => clearInterval(interval);
        }
    }, [graphData, dimensions]);


    const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.name;
        // Adjust font size based on node size to fit
        const radius = getNodeSize(node.revenue);
        // Reduced font size mapping (User Request)
        const fontSize = Math.min(9, radius / (label.length * 0.4));

        ctx.font = `${fontSize}px Sans-Serif`;

        const isTarget = node.isTarget;
        const isExternal = node.group === 'External';
        const isUnlisted = node.isListed === false;

        // Color Logic
        // Fill: 
        // - Unlisted: Gray
        // - Listed: White/Slate (Theme based)
        let fill = isDark ? '#1e293b' : '#ffffff';
        if (isUnlisted) {
            fill = isDark ? '#334155' : '#e2e8f0'; // Grayish
        }

        // Stroke (Border):
        // - Target: Orange
        // - External: Yellow
        // - Normal Group Member: Slate
        let stroke = isDark ? '#475569' : '#cbd5e1';
        if (isTarget) {
            stroke = '#f97316'; // Orange
        } else if (isExternal) {
            stroke = '#eab308'; // Yellow-500
        }

        // Stroke Width
        // - Target: 3
        // - External: 2
        // - Normal: 1
        let lineWidth = 1 / globalScale;
        if (isTarget) lineWidth = 3 / globalScale;
        else if (isExternal) lineWidth = 2 / globalScale;

        // Text Color
        let textColor = isDark ? '#e2e8f0' : '#1e293b';
        if (isTarget) textColor = '#ea580c';
        else if (isExternal) textColor = '#ca8a04'; // Darker yellow for text

        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;

        // Draw Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.stroke();

        node.__bckgDimensions = [radius];
        node.__shape = 'circle';

        // Draw Text INSIDE
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textColor;

        // Split text if too long? For now keep single line.
        ctx.fillText(label, node.x, node.y);

        // Draw Revenue below name
        if (node.revenue && radius > 35) {
            const subLabel = `${Math.round(node.revenue / 100).toLocaleString()}억`; // Simplified
            const subFontSize = fontSize * 0.7;
            ctx.font = `${subFontSize}px Sans-Serif`;
            ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
            // Position below center
            ctx.fillText(subLabel, node.x, node.y + fontSize);
        }

        // Draw Fluctuation Arrow (Left of Node)
        if (node.change !== undefined && node.change !== 0) {
            const arrowSize = radius * 0.4; // Size relative to node
            const arrowX = node.x - radius - arrowSize - 5; // Left of node with padding
            const arrowY = node.y;

            ctx.beginPath();
            if (node.change > 0) {
                // Up Arrow (Red)
                ctx.fillStyle = '#ef4444'; // Red-500
                ctx.moveTo(arrowX, arrowY - arrowSize / 2);
                ctx.lineTo(arrowX + arrowSize / 2, arrowY + arrowSize / 2);
                ctx.lineTo(arrowX - arrowSize / 2, arrowY + arrowSize / 2);
            } else {
                // Down Arrow (Blue)
                ctx.fillStyle = '#3b82f6'; // Blue-500
                ctx.moveTo(arrowX, arrowY + arrowSize / 2);
                ctx.lineTo(arrowX + arrowSize / 2, arrowY - arrowSize / 2);
                ctx.lineTo(arrowX - arrowSize / 2, arrowY - arrowSize / 2);
            }
            ctx.fill();

            // Draw change rate text below arrow? Or just icon?
            // User asked for "icon", so keeping it simple for now. 
        }

    }, [isDark]);

    const nodePointerAreaPaint = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = color;
        const dims = node.__bckgDimensions;
        if (!dims) return;

        ctx.beginPath();
        ctx.arc(node.x, node.y, dims[0], 0, 2 * Math.PI, false);
        ctx.fill();
    }, []);

    // Edges
    const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const start = link.source;
        const end = link.target;

        if (typeof start !== 'object' || typeof end !== 'object') return;

        const strokeWidth = getLinkWidth(link.stkrt);

        // Start/End points should be at the perimeter of the circle, not center
        // This makes arrows look better.
        const startR = getNodeSize(start.revenue || 0);
        const endR = getNodeSize(end.revenue || 0);

        const angle = Math.atan2(end.y - start.y, end.x - start.x);

        // Calculate perimeter points
        const startX = start.x + Math.cos(angle) * startR;
        const startY = start.y + Math.sin(angle) * startR;
        const endX = end.x - Math.cos(angle) * endR;
        const endY = end.y - Math.sin(angle) * endR;

        // Draw line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
        ctx.lineWidth = strokeWidth / globalScale;
        ctx.stroke();

        // Draw Arrow at end perimeter
        // Increased arrow size significantly relative to stroke width
        const arrowLength = (12 + strokeWidth * 1.5) / globalScale;
        const arrowWidth = arrowLength * 0.6;

        ctx.save();
        ctx.translate(endX, endY);
        ctx.rotate(angle);

        ctx.beginPath();
        // Arrowhead pointing to end node
        ctx.moveTo(-arrowLength, -arrowWidth);
        ctx.lineTo(0, 0);
        ctx.lineTo(-arrowLength, arrowWidth);
        ctx.fillStyle = isDark ? '#475569' : '#94a3b8';
        ctx.fill();
        ctx.restore();


        // Draw Label (Percentage) at midpoint
        if (link.stkrt && globalScale > 0.5) {
            const label = `${link.stkrt}%`;
            const fontSize = 10 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;

            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            const bckgW = textWidth + 8 / globalScale; // slightly wider clear area
            const bckgH = fontSize + 4 / globalScale;

            ctx.save();
            ctx.translate(midX, midY);
            // Keep text upright
            if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
                ctx.rotate(angle + Math.PI);
            } else {
                ctx.rotate(angle);
            }

            // Offset text BELOW the arrow/line.
            // Canvas Y grows downwards. So positive Y offset relative to rotated context.
            const offset = 10 / globalScale;

            // BACKGROUND BOX
            // Reverting to clearRect to let the container background show through, 
            // ensuring it perfectly matches whatever the actual background is (including transparency).
            // The User complained it looked "white" (because I used opaque fillRect).
            ctx.clearRect(-bckgW / 2, offset - bckgH / 2, bckgW, bckgH);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff'; // White text requested
            ctx.fillText(label, 0, offset);

            ctx.restore();
        }

    }, [isDark]);


    return (
        // Adjusted background color for better blend
        <div ref={containerRef} className="border rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 w-full h-[600px] relative">
            <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeCanvasObject={nodeCanvasObject}
                nodePointerAreaPaint={nodePointerAreaPaint}
                linkCanvasObject={linkCanvasObject}
                backgroundColor="rgba(0,0,0,0)" // Transparent to let container bg show
                warmupTicks={300} // Ensure layout resolves before rendering
                d3VelocityDecay={0.3} // Less friction to move faster
                d3AlphaDecay={0.01} // Standard cooling
                onNodeDragEnd={node => {
                    node.fx = node.x;
                    node.fy = node.y;
                }}
                onNodeClick={(node) => {
                    console.log('Node Clicked:', node);
                    if (node && node.id) {
                        console.log('Redirecting to:', `/dashboard/stock/${node.id}`);
                        window.location.href = `/dashboard/stock/${node.id}`;
                    } else {
                        console.warn('Node has no ID', node);
                    }
                }}
            />
            <div className="absolute top-4 right-4 bg-white/80 dark:bg-black/40 p-3 rounded-md text-xs text-muted-foreground backdrop-blur-sm border shadow-sm">
                <div className="font-semibold mb-2 text-foreground">범례</div>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 rounded-full border border-slate-400 bg-white dark:bg-slate-800"></div>
                    <span>관계사 (매출액 비례)</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 rounded-full border-2 border-orange-500 bg-white dark:bg-slate-800"></div>
                    <span>선택된 종목</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-[2px] bg-slate-400"></div>
                    <span>지분율 (굵기 비례)</span>
                </div>
            </div>
        </div>
    );
}
