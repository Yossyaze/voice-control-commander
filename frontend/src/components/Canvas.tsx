
import React, { useEffect, useRef, useState } from 'react';
import type { Point } from '../api';

interface PathData {
    id: string; // This is actually commandId in current usage, but we will clarify
    fileId: string;
    commandId: string;
    points: Point[];
    color: string;
    isSelected: boolean;
    label?: string;
}

interface CanvasProps {
    paths: PathData[];
    width?: number;
    height?: number;
    backgroundImage?: string | null;
    showGrid?: boolean;
    style?: React.CSSProperties;
    onPathDrag?: (id: string, deltaX: number, deltaY: number, type: 'move' | 'start' | 'end') => void;
    onSelectCommand?: (fileId: string, commandId: string) => void;
    simulationProgress?: number | null;
}

const Canvas: React.FC<CanvasProps> = ({ paths, width = 1180, height = 820, backgroundImage, showGrid = true, style, onPathDrag, onSelectCommand, simulationProgress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dragState, setDragState] = useState<{
        isDragging: boolean;
        targetId: string | null;
        dragType: 'move' | 'start' | 'end' | null;
        lastX: number;
        lastY: number;
    }>({
        isDragging: false,
        targetId: null,
        dragType: null,
        lastX: 0,
        lastY: 0,
    });
    const [cursor, setCursor] = useState<string>('default');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle High DPI (Retina) displays
        const dpr = window.devicePixelRatio || 1;

        // Set actual size in memory (scaled to account for extra pixel density)
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        // Normalize coordinate system to use css pixels
        ctx.scale(dpr, dpr);

        const render = () => {
            // Clear canvas (using logical coordinates, but we need to clear the whole scaled buffer)
            // Since we scaled the context, clearing (0,0,width,height) clears the logical area.
            // But to be safe and clear everything (including potential artifacts if dpr changed),
            // we can reset transform to clear, or just clear logical area which covers everything.
            // Let's stick to logical area which maps to full physical area.
            ctx.clearRect(0, 0, width, height);

            // Draw background image if available
            if (backgroundImage) {
                const img = new Image();
                img.src = backgroundImage;
                // We need to ensure image is loaded before drawing, but since we are using data URL, it might be fast.
                // However, to be safe and avoid flickering or missing image on first render if not cached:
                if (img.complete) {
                    // Draw image to fit logical dimensions
                    ctx.drawImage(img, 0, 0, width, height);
                    drawGridAndPaths();
                } else {
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0, width, height);
                        drawGridAndPaths();
                    };
                }
            } else {
                drawGridAndPaths();
            }
        };

        const drawGridAndPaths = () => {
            // Draw background grid (optional, for better visualization)
            if (showGrid) {
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let x = 0; x <= width; x += 100) {
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, height);
                }
                for (let y = 0; y <= height; y += 100) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                }
                ctx.stroke();
            }

            // Draw paths
            paths.forEach(path => {
                if (path.points.length === 0) return;

                ctx.strokeStyle = path.color;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.globalAlpha = path.isSelected ? 1.0 : 0.6; // Slightly transparent for non-selected

                // Check if it's a Tap (single point OR multiple points at same location)
                const isTap = path.points.length === 1 || path.points.every(p => Math.abs(p.x - path.points[0].x) < 0.1 && Math.abs(p.y - path.points[0].y) < 0.1);

                if (isTap) {
                    // Draw Tap (Dot)
                    const point = path.points[0];
                    ctx.fillStyle = path.color;
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, path.isSelected ? 10 : 8, 0, Math.PI * 2);
                    ctx.fill();

                    if (path.isSelected) {
                        ctx.strokeStyle = '#3B82F6'; // Blue-500
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }

                    // Draw Label
                    if (path.label) {
                        ctx.fillStyle = 'white';
                        ctx.font = 'bold 12px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(path.label, point.x, point.y);
                    }
                } else {
                    // Draw Path (Line)
                    ctx.beginPath();
                    ctx.moveTo(path.points[0].x, path.points[0].y);
                    for (let i = 1; i < path.points.length; i++) {
                        ctx.lineTo(path.points[i].x, path.points[i].y);
                    }
                    ctx.strokeStyle = path.color;
                    ctx.lineWidth = path.isSelected ? 4 : 2;
                    ctx.stroke();

                    // Draw Start/End Points for selected path
                    if (path.isSelected) {
                        // Start Point (Green)
                        ctx.fillStyle = '#10B981';
                        ctx.beginPath();
                        ctx.arc(path.points[0].x, path.points[0].y, 6, 0, Math.PI * 2);
                        ctx.fill();

                        // End Point (Red)
                        ctx.fillStyle = '#EF4444';
                        ctx.beginPath();
                        ctx.arc(path.points[path.points.length - 1].x, path.points[path.points.length - 1].y, 6, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // Draw Label at Start Point
                    if (path.label) {
                        ctx.fillStyle = 'white'; // Text color
                        ctx.font = 'bold 14px sans-serif'; // Larger font
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        // Draw background circle for label
                        ctx.beginPath();
                        ctx.arc(path.points[0].x, path.points[0].y - 20, 10, 0, Math.PI * 2); // Position above start point
                        ctx.fillStyle = path.color;
                        ctx.fill();
                        ctx.fillStyle = 'white';
                        ctx.fillText(path.label, path.points[0].x, path.points[0].y - 20);
                    }
                }
                ctx.globalAlpha = 1.0; // Reset alpha

                // Draw Simulation Marker
                if (path.isSelected && simulationProgress !== undefined && simulationProgress !== null) {
                    const totalPoints = path.points.length;
                    if (totalPoints > 1) {
                        // Calculate index based on progress (0.0 - 1.0)
                        const exactIndex = simulationProgress * (totalPoints - 1);
                        const index = Math.floor(exactIndex);
                        const nextIndex = Math.min(index + 1, totalPoints - 1);
                        const t = exactIndex - index;

                        const p1 = path.points[index];
                        const p2 = path.points[nextIndex];

                        const x = p1.x + (p2.x - p1.x) * t;
                        const y = p1.y + (p2.y - p1.y) * t;

                        // Draw Marker (Blue circle with white border)
                        ctx.fillStyle = '#3b82f6';
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(x, y, 8, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                }
            });
        };


        render();

    }, [paths, width, height, backgroundImage, showGrid, simulationProgress]);

    const getMousePos = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        // Calculate scale in case canvas is displayed at different size than its logical size
        // (though we try to keep them same via CSS max-width/height, aspect ratio might differ)
        // Actually, rect.width/height are the display size. width/height props are logical size.
        const scaleX = width / rect.width;
        const scaleY = height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const isPointNear = (p1: { x: number, y: number }, p2: { x: number, y: number }, dist: number) => {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) <= dist;
    };

    const isPointOnPath = (p: { x: number, y: number }, pathPoints: Point[], tolerance: number) => {
        for (let i = 0; i < pathPoints.length - 1; i++) {
            const p1 = pathPoints[i];
            const p2 = pathPoints[i + 1];

            // Distance from point p to line segment p1-p2
            const A = p.x - p1.x;
            const B = p.y - p1.y;
            const C = p2.x - p1.x;
            const D = p2.y - p1.y;

            const dot = A * C + B * D;
            const len_sq = C * C + D * D;
            let param = -1;
            if (len_sq !== 0) // in case of 0 length line
                param = dot / len_sq;

            let xx, yy;

            if (param < 0) {
                xx = p1.x;
                yy = p1.y;
            }
            else if (param > 1) {
                xx = p2.x;
                yy = p2.y;
            }
            else {
                xx = p1.x + param * C;
                yy = p1.y + param * D;
            }

            const dx = p.x - xx;
            const dy = p.y - yy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= tolerance) return true;
        }
        return false;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!onPathDrag) return;
        const pos = getMousePos(e);

        // Check selected path first (priority)
        const selectedPath = paths.find(p => p.isSelected);
        if (selectedPath) {
            // Special handling for Tap (single point OR multiple points at same location)
            const isTap = selectedPath.points.length === 1 || selectedPath.points.every(p => Math.abs(p.x - selectedPath.points[0].x) < 0.1 && Math.abs(p.y - selectedPath.points[0].y) < 0.1);

            if (isTap) {
                if (isPointNear(pos, selectedPath.points[0], 15)) { // Match hit threshold
                    setDragState({
                        isDragging: true,
                        targetId: selectedPath.id,
                        dragType: 'move',
                        lastX: pos.x,
                        lastY: pos.y,
                    });
                    return;
                }
            } else {
                // Check Start Point
                if (isPointNear(pos, selectedPath.points[0], 10)) {
                    setDragState({
                        isDragging: true,
                        targetId: selectedPath.id,
                        dragType: 'start',
                        lastX: pos.x,
                        lastY: pos.y,
                    });
                    return;
                }
                // Check End Point
                if (isPointNear(pos, selectedPath.points[selectedPath.points.length - 1], 10)) {
                    setDragState({
                        isDragging: true,
                        targetId: selectedPath.id,
                        dragType: 'end',
                        lastX: pos.x,
                        lastY: pos.y,
                    });
                    return;
                }
                // Check Path Body
                if (isPointOnPath(pos, selectedPath.points, 10)) {
                    setDragState({
                        isDragging: true,
                        targetId: selectedPath.id,
                        dragType: 'move',
                        lastX: pos.x,
                        lastY: pos.y,
                    });
                    return;
                }
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const pos = getMousePos(e);

        if (dragState.isDragging && dragState.targetId && dragState.dragType && onPathDrag) {
            const deltaX = pos.x - dragState.lastX;
            const deltaY = pos.y - dragState.lastY;

            onPathDrag(dragState.targetId, deltaX, deltaY, dragState.dragType);

            setDragState(prev => ({
                ...prev,
                lastX: pos.x,
                lastY: pos.y,
            }));
            return;
        }

        // Update cursor based on hover
        const selectedPath = paths.find(p => p.isSelected);
        if (selectedPath) {
            const isTap = selectedPath.points.length === 1 || selectedPath.points.every(p => Math.abs(p.x - selectedPath.points[0].x) < 0.1 && Math.abs(p.y - selectedPath.points[0].y) < 0.1);

            if (isTap) {
                if (isPointNear(pos, selectedPath.points[0], 15)) {
                    setCursor('move');
                } else {
                    setCursor('default');
                }
            } else {
                if (isPointNear(pos, selectedPath.points[0], 10) || isPointNear(pos, selectedPath.points[selectedPath.points.length - 1], 10)) {
                    setCursor('crosshair');
                } else if (isPointOnPath(pos, selectedPath.points, 10)) {
                    setCursor('move');
                } else {
                    setCursor('default');
                }
            }
        } else {
            setCursor('default');
        }
    };

    const handleMouseUp = () => {
        setDragState({
            isDragging: false,
            targetId: null,
            dragType: null,
            lastX: 0,
            lastY: 0,
        });
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        // If we were dragging, don't treat as click
        if (dragState.isDragging) return;

        if (!onSelectCommand) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();

        // Handle High DPI
        const dpr = window.devicePixelRatio || 1;
        const x = (e.clientX - rect.left) * (canvas.width / rect.width) / dpr;
        const y = (e.clientY - rect.top) * (canvas.height / rect.height) / dpr;

        // Check for hit on paths (reverse order to select top-most)
        for (let i = paths.length - 1; i >= 0; i--) {
            const path = paths[i];
            if (path.points.length === 0) continue;

            const isTap = path.points.length === 1 || path.points.every(p => Math.abs(p.x - path.points[0].x) < 0.1 && Math.abs(p.y - path.points[0].y) < 0.1);

            if (isTap) {
                // Check hit on Tap (Dot)
                const point = path.points[0];
                const dx = x - point.x;
                const dy = y - point.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 15) { // Slightly larger hit area for taps
                    onSelectCommand(path.fileId, path.commandId);
                    return;
                }
            } else {
                // Simple distance check to line segments
                let hit = false;
                for (let j = 0; j < path.points.length - 1; j++) {
                    const p1 = path.points[j];
                    const p2 = path.points[j + 1];

                    // Distance from point (x,y) to line segment p1-p2
                    const A = x - p1.x;
                    const B = y - p1.y;
                    const C = p2.x - p1.x;
                    const D = p2.y - p1.y;

                    const dot = A * C + B * D;
                    const len_sq = C * C + D * D;
                    let param = -1;
                    if (len_sq !== 0) // in case of 0 length line
                        param = dot / len_sq;

                    let xx, yy;

                    if (param < 0) {
                        xx = p1.x;
                        yy = p1.y;
                    }
                    else if (param > 1) {
                        xx = p2.x;
                        yy = p2.y;
                    }
                    else {
                        xx = p1.x + param * C;
                        yy = p1.y + param * D;
                    }

                    const dx = x - xx;
                    const dy = y - yy;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 10) { // Hit threshold
                        onSelectCommand(path.fileId, path.commandId);
                        return;
                    }
                }
            }
        }
    };

    return (
        <div className="flex justify-center items-center bg-gray-50 p-4 rounded-lg h-full w-full">
            <canvas
                ref={canvasRef}
                // Do not set width/height attributes here as they are handled in useEffect for DPR
                // But React might override them if we don't pass them or pass them.
                // It's safer to pass undefined or let useEffect manage it.
                // However, for initial render (SSR/hydration), it's good to have them.
                // Let's keep them but know useEffect will update them.
                // Actually, if we pass width={width} here, React will set the attribute to logical width.
                // Then useEffect sets it to width * dpr.
                // If React re-renders, it might reset it to width.
                // To avoid fighting with React, we should probably not pass width/height props to canvas element
                // OR update the state to hold the physical dimensions.
                // But simpler is to just let useEffect handle it and remove props from JSX.
                className="border border-gray-300 rounded-lg shadow-sm bg-white"
                style={{ maxWidth: '100%', maxHeight: '75vh', width: 'auto', height: 'auto', cursor, ...style }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleCanvasClick}
            />
        </div>
    );
};

export default Canvas;
