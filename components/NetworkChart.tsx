import React, { useEffect, useRef, useState } from 'react'
import { Plus, Minus, Maximize2 } from 'lucide-react'


interface NetworkNode {
    id: string
    name: string
    revenue: number // 억원
    change: number // 주가 변동률
    isListed: boolean
    x?: number
    y?: number
    vx?: number
    vy?: number
    group?: string
    isTarget?: boolean
}

interface NetworkLink {
    source: string
    target: string
    relationship?: string
    stkrt?: number // 지분율 (%)
}

interface NetworkData {
    nodes: NetworkNode[]
    links: NetworkLink[]
}

interface NetworkChartProps {
    data: NetworkData
    width?: number
    height?: number
    targetNodeId?: string
}

export default function NetworkChart({ data, width = 800, height = 600, targetNodeId }: NetworkChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [nodes, setNodes] = useState<NetworkNode[]>([])
    const [stableNodes, setStableNodes] = useState<NetworkNode[]>([])
    const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null)
    const [isStable, setIsStable] = useState(false)
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const animationRef = useRef<number>()
    const stableFrameCount = useRef(0)

    useEffect(() => {
        // Initialize node positions in a circle
        const initializedNodes = data.nodes.map((node, i) => {
            const angle = (i / data.nodes.length) * 2 * Math.PI
            const radius = Math.min(width, height) * 0.35
            return {
                ...node,
                x: width / 2 + Math.cos(angle) * radius,
                y: height / 2 + Math.sin(angle) * radius,
                vx: 0,
                vy: 0,
            }
        })
        setNodes(initializedNodes)
        setStableNodes([])
        setIsStable(false)
        stableFrameCount.current = 0
    }, [data, width, height])

    useEffect(() => {
        if (!canvasRef.current || nodes.length === 0) return

        // const canvas = canvasRef.current
        // const ctx = canvas.getContext('2d')
        // if (!ctx) return

        let frameCount = 0
        const maxFrames = 300

        const animate = () => {
            frameCount++

            // Apply forces
            const updatedNodes = nodes.map((node) => {
                let fx = 0
                let fy = 0

                // Center force (very weak)
                fx += (width / 2 - node.x!) * 0.001
                fy += (height / 2 - node.y!) * 0.001

                // Repulsion between nodes (optimized for 80 nodes)
                nodes.forEach((other) => {
                    if (node.id === other.id) return
                    const dx = node.x! - other.x!
                    const dy = node.y! - other.y!
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1
                    const minDist = 60 // Increased slightly
                    if (dist < minDist * 4) {
                        const force = 2500 / (dist * dist)
                        fx += (dx / dist) * force
                        fy += (dy / dist) * force
                    }
                })

                // Link attraction
                data.links.forEach((link) => {
                    // Check both directions or handle IDs carefully (API returns IDs)
                    if (link.source === node.id) {
                        const target = nodes.find((n) => n.id === link.target)
                        if (target) {
                            const dx = target.x! - node.x!
                            const dy = target.y! - node.y!
                            const dist = Math.sqrt(dx * dx + dy * dy)
                            const idealDist = 150
                            const force = (dist - idealDist) * 0.04 // Stronger attraction
                            fx += (dx / dist) * force
                            fy += (dy / dist) * force
                        }
                    }
                    if (link.target === node.id) {
                        const source = nodes.find((n) => n.id === link.source)
                        if (source) {
                            const dx = source.x! - node.x!
                            const dy = source.y! - node.y!
                            const dist = Math.sqrt(dx * dx + dy * dy)
                            const idealDist = 150
                            const force = (dist - idealDist) * 0.04
                            fx += (dx / dist) * force
                            fy += (dy / dist) * force
                        }
                    }
                })

                const newVx = (node.vx! + fx) * 0.8 // Strong damping
                const newVy = (node.vy! + fy) * 0.8

                return {
                    ...node,
                    vx: newVx,
                    vy: newVy,
                    x: node.x! + newVx,
                    y: node.y! + newVy,
                }
            })

            // Check stability
            const totalVelocity = updatedNodes.reduce(
                (sum, node) => sum + Math.abs(node.vx!) + Math.abs(node.vy!),
                0
            )

            // Require multiple stable frames to prevent jitter
            if (totalVelocity < 0.1) {
                stableFrameCount.current++
                if (stableFrameCount.current > 40 || frameCount >= maxFrames) {
                    // FREEZE positions - no more updates
                    const frozenNodes = updatedNodes.map(node => ({
                        ...node,
                        vx: 0,
                        vy: 0
                    }))
                    setStableNodes(frozenNodes)
                    setIsStable(true)
                    if (animationRef.current) {
                        cancelAnimationFrame(animationRef.current)
                    }
                    return
                }
            } else {
                stableFrameCount.current = 0
            }

            setNodes(updatedNodes)

            if (!isStable && frameCount < maxFrames) {
                animationRef.current = requestAnimationFrame(animate)
            }
        }

        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [nodes.length === 0 ? null : 'animate', data, width, height]) // Depend only on initial load triggers

    // Separate rendering effect - uses stable nodes when available
    useEffect(() => {
        if (!canvasRef.current) return
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const nodesToRender = isStable ? stableNodes : nodes
        if (nodesToRender.length === 0) return

        const render = () => {
            ctx.save()
            ctx.clearRect(0, 0, width, height)

            // Apply zoom and pan transform
            ctx.translate(width / 2 + pan.x, height / 2 + pan.y)
            ctx.scale(zoom, zoom)
            ctx.translate(-width / 2, -height / 2)

            // Calculate link style stats
            const stkrtValues = data.links.map(l => l.stkrt || 0)
            const maxStkrt = Math.max(...stkrtValues, 1)
            const minStkrt = Math.min(...stkrtValues, 0)

            // Draw links
            data.links.forEach((link) => {
                const source = nodesToRender.find((n) => n.id === link.source)
                const target = nodesToRender.find((n) => n.id === link.target)
                if (source && target) {
                    const stkrt = link.stkrt || 0
                    // Normalize stkrt to 0-1 range
                    const normalized = (stkrt - minStkrt) / (maxStkrt - minStkrt || 1)

                    // Width: 1px to 6px
                    const lineWidth = 1 + normalized * 5
                    // Opacity: 0.1 to 0.8
                    const opacity = 0.1 + normalized * 0.7

                    ctx.strokeStyle = `rgba(100, 116, 139, ${opacity})`
                    ctx.lineWidth = lineWidth / zoom

                    ctx.beginPath()
                    ctx.moveTo(source.x!, source.y!)
                    ctx.lineTo(target.x!, target.y!)
                    ctx.stroke()

                    // Optional arrow for direction (Investee -> Investor? or Investor -> Investee?)
                    // Typically arrow indicates flow. If link is "source owns target", arrow points to target?
                    // User query had "from_corp" (investee) and "to_corp" (investor).
                    // If we assume Source=Investor, Target=Investee in API,
                    // Then Arrow Source -> Target.

                    // Draw small arrow at mid-point or near target
                    /*
                    const angle = Math.atan2(target.y! - source.x!, target.x! - source.x!)
                    const arrowSize = 5 / zoom
                    const midX = (source.x! + target.x!) / 2
                    const midY = (source.y! + target.y!) / 2
                    ctx.save()
                    ctx.translate(midX, midY)
                    ctx.rotate(angle)
                    ctx.beginPath()
                    ctx.moveTo(-arrowSize, -arrowSize)
                    ctx.lineTo(arrowSize, 0)
                    ctx.lineTo(-arrowSize, arrowSize)
                    ctx.fillStyle = `rgba(100, 116, 139, ${opacity})`
                    ctx.fill()
                    ctx.restore()
                    */
                }
            })

            // Draw nodes
            nodesToRender.forEach((node) => {
                const size = getNodeSize(node.revenue)

                // Shadow
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
                ctx.shadowBlur = 8 / zoom
                ctx.shadowOffsetX = 0
                ctx.shadowOffsetY = 2 / zoom

                // Node circle with gradient
                const gradient = ctx.createRadialGradient(
                    node.x! - size / 4,
                    node.y! - size / 4,
                    0,
                    node.x!,
                    node.y!,
                    size
                )

                // Highlight target node
                const isTarget = node.id === targetNodeId || node.isTarget

                if (isTarget) {
                    gradient.addColorStop(0, '#ea580c') // Orange-600
                    gradient.addColorStop(1, '#9a3412') // Orange-800
                } else {
                    gradient.addColorStop(0, '#475569')
                    gradient.addColorStop(1, '#1e293b')
                }

                ctx.fillStyle = gradient
                ctx.beginPath()
                ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI)
                ctx.fill()

                // Border for target node
                if (isTarget) {
                    ctx.strokeStyle = '#fdba74' // Orange-300
                    ctx.lineWidth = 3 / zoom
                    ctx.stroke()
                }

                // Reset shadow and border for text
                ctx.shadowColor = 'transparent'
                ctx.shadowBlur = 0
                // ctx.strokeStyle = 'transparent' // Reset stroke

                // Label (auto-adjust based on zoom)
                const shouldShowLabel = size * zoom > 8 || zoom > 1.2 || isTarget
                if (shouldShowLabel) {
                    const fontSize = Math.max(9, Math.min(12, 10 * zoom))
                    ctx.font = `bold ${fontSize}px sans-serif`
                    ctx.textAlign = 'center'
                    const textWidth = ctx.measureText(node.name).width
                    const padding = 4

                    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
                    ctx.beginPath()
                    ctx.roundRect(
                        node.x! - textWidth / 2 - padding,
                        node.y! + size + 5,
                        textWidth + padding * 2,
                        fontSize + 8,
                        3
                    )
                    ctx.fill()

                    ctx.fillStyle = isTarget ? '#fdba74' : '#fff'
                    ctx.fillText(node.name, node.x!, node.y! + size + 5 + fontSize)
                }
            })

            ctx.restore()
        }

        render()
    }, [nodes, stableNodes, isStable, data, width, height, zoom, pan, targetNodeId])

    const getNodeSize = (revenue: number) => {
        // If revenue is 0 or missing, provide default
        if (!revenue) return 10

        const maxRevenue = Math.max(...data.nodes.map((n) => n.revenue || 0), 100)
        // Auto-adjust size based on node count and zoom
        const baseMin = data.nodes.length > 50 ? 5 : 8
        const baseMax = data.nodes.length > 50 ? 20 : 35

        // Log scale might be better for revenue
        // const scale = (Math.log(revenue + 1) / Math.log(maxRevenue + 1)) 
        // Linear for now as implemented before
        const scale = (revenue / maxRevenue)

        const baseSize = baseMin + scale * (baseMax - baseMin)
        // Scale with zoom for better visibility
        return baseSize * Math.max(0.8, Math.min(1.2, 1 / zoom))
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isDragging) {
            const dx = e.clientX - dragStart.x
            const dy = e.clientY - dragStart.y
            setPan({ x: pan.x + dx, y: pan.y + dy })
            setDragStart({ x: e.clientX, y: e.clientY })
            return
        }

        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = (e.clientX - rect.left - width / 2 - pan.x) / zoom + width / 2
        const y = (e.clientY - rect.top - height / 2 - pan.y) / zoom + height / 2

        const nodesToCheck = isStable ? stableNodes : nodes
        const hovered = nodesToCheck.find((node) => {
            const size = getNodeSize(node.revenue)
            const dx = x - node.x!
            const dy = y - node.y!
            return Math.sqrt(dx * dx + dy * dy) < size
        })

        setHoveredNode(hovered || null)
        canvas.style.cursor = hovered ? 'pointer' : isDragging ? 'grabbing' : 'grab'
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setZoom((prev) => Math.max(0.3, Math.min(4, prev + delta)))
    }

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev + 0.2, 4))
    }

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(prev - 0.2, 0.3))
    }

    const handleZoomReset = () => {
        setZoom(1)
        setPan({ x: 0, y: 0 })
    }

    return (
        <div className="relative">
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="border rounded-lg bg-slate-950"
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            />

            {/* Zoom controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                    onClick={handleZoomIn}
                    className="p-2 bg-slate-800/90 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
                    title="확대 (또는 마우스 휠)"
                >
                    <Plus className="w-5 h-5 text-white" />
                </button>
                <button
                    onClick={handleZoomOut}
                    className="p-2 bg-slate-800/90 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
                    title="축소 (또는 마우스 휠)"
                >
                    <Minus className="w-5 h-5 text-white" />
                </button>
                <button
                    onClick={handleZoomReset}
                    className="p-2 bg-slate-800/90 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
                    title="초기화"
                >
                    <Maximize2 className="w-4 h-4 text-white" />
                </button>
                <div className="text-xs text-center text-slate-400 bg-slate-800/90 px-2 py-1 rounded border border-slate-600">
                    {Math.round(zoom * 100)}%
                </div>
            </div>

            {hoveredNode && (
                <div className="absolute top-4 left-4 bg-slate-800/95 backdrop-blur-sm p-4 rounded-lg border border-slate-700 shadow-xl pointer-events-none">
                    <div className="text-sm font-bold text-white">{hoveredNode.name}</div>
                    <div className="text-xs text-slate-300 mt-2">
                        매출액: <span className="font-semibold">{hoveredNode.revenue ? hoveredNode.revenue.toLocaleString() : '-'}억원</span>
                    </div>
                    {hoveredNode.group && (
                        <div className="text-xs text-slate-400 mt-1">그룹: {hoveredNode.group}</div>
                    )}
                </div>
            )}
            {isStable && (
                <div className="absolute bottom-4 right-4 text-xs text-green-500 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-600">
                    ✓ 안정화 완료 ({data.nodes.length}개 노드)
                </div>
            )}
        </div>
    )
}

