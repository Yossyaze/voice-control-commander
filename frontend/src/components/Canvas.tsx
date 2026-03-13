import React, { useEffect, useRef, useState } from "react";
import type { Point } from "../api";

interface PathData {
  id: string; // This is actually commandId in current usage, but we will clarify
  fileId: string;
  commandId: string;
  points: Point[];
  color: string;
  isSelected: boolean;
  label?: string;
  showPoints?: boolean;
}

interface CanvasProps {
  paths: PathData[];
  width?: number;
  height?: number;
  backgroundImage?: string | null;
  showGrid?: boolean;
  showPoints?: boolean;
  style?: React.CSSProperties;
  onPathDrag?: (
    id: string,
    deltaX: number,
    deltaY: number,
    type: "move" | "start" | "end",
  ) => void;
  onSelectCommand?: (
    fileId: string,
    commandId: string,
    pathId?: string,
  ) => void;
  onPan?: (dx: number, dy: number) => void;

  markerPosition?: { x: number; y: number } | null;
  scale?: number;
  connections?: {
    from: Point;
    to: Point;
    duration: number;
    strokeIndex: number; // Index of the stroke that *precedes* this gap (the one holding the wait-after)
    isSelected?: boolean;
  }[];
  onSelectWait?: (strokeIndex: number) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  paths,
  width = 1180,
  height = 820,
  backgroundImage,
  showGrid = false,
  showPoints = true,
  style,
  onPathDrag,
  onSelectCommand,
  markerPosition = null,
  scale = 1.0,
  connections = [],
  onSelectWait,
  onPan,
}) => {
  // Badges hit regions for click handling
  const badgesRef = useRef<
    {
      rect: { x: number; y: number; w: number; h: number };
      strokeIndex: number;
    }[]
  >([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    targetId: string | null;
    dragType: "move" | "start" | "end" | "pan" | null;
    lastX: number; // Logical X For Path Drag
    lastY: number; // Logical Y For Path Drag
    lastClientX: number; // Physical X for Pan
    lastClientY: number; // Physical Y for Pan
    startX: number;
    startY: number;
  }>({
    isDragging: false,
    targetId: null,
    dragType: null,
    lastX: 0,
    lastY: 0,
    lastClientX: 0,
    lastClientY: 0,
    startX: 0,
    startY: 0,
  });
  const [cursor, setCursor] = useState<string>("default");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle High DPI (Retina) displays
    const dpr = window.devicePixelRatio || 1;

    // Set actual size in memory (scaled to account for extra pixel density AND zoom scale)
    canvas.width = width * dpr * scale;
    canvas.height = height * dpr * scale;

    // Normalize coordinate system to use css pixels, scaled by zoom scale
    ctx.resetTransform(); // clear previous
    ctx.scale(dpr * scale, dpr * scale);

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

        // onloadとonerrorのハンドラを先に設定する（キャッシュされた画像でも安全に発火させるため）
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          drawGridAndPaths();
        };

        img.onerror = () => {
          // 画像読み込みエラー時はグレー背景を描画してストロークを描画
          console.warn(
            "Background image failed to load, falling back to default background.",
          );
          ctx.fillStyle = "#f3f4f6";
          ctx.fillRect(0, 0, width, height);
          ctx.strokeStyle = "#9ca3af";
          ctx.lineWidth = 1;
          ctx.strokeRect(0, 0, width, height);
          drawGridAndPaths();
        };

        img.src = backgroundImage;

        if (img.complete && img.naturalHeight !== 0) {
          // すでに完全に読み込まれている場合 (キャッシュヒット等)
          // onloadが呼ばれない可能性があるため手動で描画
          ctx.drawImage(img, 0, 0, width, height);
          drawGridAndPaths();
          // 再度onloadが呼ばれるのを防ぐ
          img.onload = null;
          img.onerror = null;
        }
      } else {
        ctx.fillStyle = "#f3f4f6"; // gray-100
        ctx.fillRect(0, 0, width, height);

        // 背景画像がない場合、枠線を描画する
        ctx.strokeStyle = "#9ca3af"; // gray-400
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, width, height);

        drawGridAndPaths();
      }
    };

    const drawGridAndPaths = () => {
      // Draw background grid (optional, for better visualization)
      if (showGrid) {
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 1;
        const gridSize = 20;

        ctx.beginPath();
        for (let x = 0; x <= width; x += gridSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();
      }

      // Draw paths
      paths.forEach((path) => {
        if (path.points.length === 0) return;

        ctx.strokeStyle = path.color;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = path.isSelected ? 1.0 : 0.6; // Slightly transparent for non-selected

        // Check if it's a Tap (single point OR multiple points at same location)
        const isTap =
          path.points.length === 1 ||
          path.points.every(
            (p) =>
              Math.abs(p.x - path.points[0].x) < 0.1 &&
              Math.abs(p.y - path.points[0].y) < 0.1,
          );

        if (isTap) {
          // Draw Tap (Dot)
          const point = path.points[0];
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = path.color + "40"; // Transparent fill
          ctx.fill();
          ctx.lineWidth = path.isSelected ? 2 : 1;
          ctx.strokeStyle = path.color;
          ctx.stroke();

          // Dot
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = path.color;
          ctx.fill();

          // Draw Label
          if (path.label) {
            ctx.fillStyle = "white";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.beginPath();
            ctx.arc(point.x + 15, point.y - 15, 8, 0, Math.PI * 2);
            ctx.fillStyle = path.color;
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.fillText(path.label, point.x + 15, point.y - 15);
          }
        } else {
          // Draw Path (Line)
          ctx.beginPath();
          ctx.moveTo(path.points[0].x, path.points[0].y);
          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
          }
          ctx.strokeStyle = path.color;
          ctx.lineWidth = path.isSelected ? 2 : 1;
          ctx.stroke();

          // Draw Start/End Points (Override per path if defined, otherwise use global)
          const shouldShowPoints =
            path.showPoints !== undefined ? path.showPoints : showPoints;
          if (shouldShowPoints) {
            const pointRadius = path.isSelected ? 4 : 2.5; // Smaller for non-selected

            // Start Point (Green)
            ctx.fillStyle = "#10B981";
            ctx.beginPath();
            ctx.arc(
              path.points[0].x,
              path.points[0].y,
              pointRadius,
              0,
              Math.PI * 2,
            );
            ctx.fill();

            // End Point (Red)
            ctx.fillStyle = "#EF4444";
            ctx.beginPath();
            ctx.arc(
              path.points[path.points.length - 1].x,
              path.points[path.points.length - 1].y,
              pointRadius,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }

          // Draw Label at Start Point (offset opposite to direction)
          if (path.label) {
            const p0 = path.points[0];
            let labelX = p0.x;
            let labelY = p0.y - 25; // Default offset (up)

            if (path.points.length > 1) {
              const p1 = path.points[1];
              const dx = p1.x - p0.x;
              const dy = p1.y - p0.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len > 0) {
                // Normalize and negate to get "backward" direction
                const dirX = -(dx / len);
                const dirY = -(dy / len);
                // Offset by 25px
                labelX = p0.x + dirX * 25;
                labelY = p0.y + dirY * 25;
              }
            }

            ctx.fillStyle = "white"; // Text color
            ctx.font = "bold 14px sans-serif"; // Larger font
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            // Draw background circle for label
            ctx.beginPath();
            ctx.arc(labelX, labelY, 10, 0, Math.PI * 2);
            ctx.fillStyle = path.color;
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.fillText(path.label, labelX, labelY);
          }
        }
        ctx.globalAlpha = 1.0; // Reset alpha
      });

      // Draw playback marker if present
      if (markerPosition) {
        ctx.beginPath();
        ctx.arc(markerPosition.x, markerPosition.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(59, 130, 246, 0.8)"; // blue-500
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw Connections (Wait Gaps)
      badgesRef.current = []; // Clear previous badges
      if (connections.length > 0) {
        connections.forEach((conn) => {
          // Draw dashed line
          ctx.beginPath();
          ctx.moveTo(conn.from.x, conn.from.y);
          ctx.lineTo(conn.to.x, conn.to.y);
          ctx.strokeStyle = conn.isSelected ? "#10B981" : "#9ca3af";
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = conn.isSelected ? 2 : 1;
          ctx.stroke();
          ctx.setLineDash([]); // Reset

          const midX = (conn.from.x + conn.to.x) / 2;
          const midY = (conn.from.y + conn.to.y) / 2;

          // 秒数の表示は削除し、中点付近のクリック判定(hit region)のみ残す
          const hitSize = 30;
          badgesRef.current.push({
            rect: {
              x: midX - hitSize / 2,
              y: midY - hitSize / 2,
              w: hitSize,
              h: hitSize,
            },
            strokeIndex: conn.strokeIndex,
          });
        });
      }
    };

    render();
  }, [
    paths,
    width,
    height,
    backgroundImage,
    showGrid,
    showPoints,
    markerPosition,
    connections,
    scale, // Added scale to dependencies
  ]);

  const getLogicalPosition = (
    e:
      | React.PointerEvent
      | React.MouseEvent<HTMLDivElement>
      | React.TouchEvent<HTMLDivElement>,
  ) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0, clientX: 0, clientY: 0 };

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // `rect.left` and `rect.width` now reflect the fully scaled size explicitly
    // Coordinate within the element, scaled back down to the 1.0 (unscaled) logical coordinate size
    const x = ((clientX - rect.left) / rect.width) * width;
    const y = ((clientY - rect.top) / rect.height) * height;

    // clientX, clientY が undefinend にならないようにする（フォールバック）
    return {
      x,
      y,
      clientX: clientX || 0,
      clientY: clientY || 0,
    };
  };

  const isPointNear = (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    dist: number,
  ) => {
    return (
      Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) <= dist
    );
  };

  const isPointOnPath = (
    p: { x: number; y: number },
    pathPoints: Point[],
    tolerance: number,
  ) => {
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
      if (len_sq !== 0)
        // in case of 0 length line
        param = dot / len_sq;

      let xx, yy;

      if (param < 0) {
        xx = p1.x;
        yy = p1.y;
      } else if (param > 1) {
        xx = p2.x;
        yy = p2.y;
      } else {
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

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ) => {
    if ("touches" in e && e.touches.length !== 1) return;
    if (!onPathDrag && !onPan) return;
    const pos = getLogicalPosition(e);

    // Check selected path first
    const selectedPath = paths.find((p) => p.isSelected);
    if (selectedPath && onPathDrag) {
      const isTap =
        selectedPath.points.length === 1 ||
        selectedPath.points.every(
          (p) =>
            Math.abs(p.x - selectedPath.points[0].x) < 0.1 &&
            Math.abs(p.y - selectedPath.points[0].y) < 0.1,
        );

      let type: "move" | "start" | "end" | null = null;
      if (isTap) {
        if (isPointNear(pos, selectedPath.points[0], 15)) type = "move";
      } else {
        if (isPointNear(pos, selectedPath.points[0], 10)) type = "start";
        else if (
          isPointNear(
            pos,
            selectedPath.points[selectedPath.points.length - 1],
            10,
          )
        )
          type = "end";
        else if (isPointOnPath(pos, selectedPath.points, 10)) type = "move";
      }

      if (type) {
        setDragState({
          isDragging: false, // Wait for movement
          targetId: selectedPath.id,
          dragType: type,
          lastX: pos.x,
          lastY: pos.y,
          lastClientX: pos.clientX,
          lastClientY: pos.clientY,
          startX: pos.x,
          startY: pos.y,
        });
        return;
      }
    }

    // Hit nothing, try pan
    if (onPan) {
      setDragState({
        isDragging: false,
        targetId: null,
        dragType: "pan",
        lastX: pos.x,
        lastY: pos.y,
        lastClientX: pos.clientX,
        lastClientY: pos.clientY,
        startX: pos.x,
        startY: pos.y,
      });
    }
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ) => {
    if ("touches" in e && e.touches.length !== 1) return;
    const pos = getLogicalPosition(e);

    if (dragState.dragType) {
      // Check if we should start dragging
      if (!dragState.isDragging) {
        const dist = Math.sqrt(
          Math.pow(pos.x - dragState.startX, 2) +
            Math.pow(pos.y - dragState.startY, 2),
        );
        if (dist > 3) {
          setDragState((prev) => ({ ...prev, isDragging: true }));
          // Don't move yet, just change state.
        }
        return;
      }

      // dragging
      if (dragState.dragType === "pan" && onPan) {
        // パン移動は物理的なピクセル(clientX)の差分を使う
        const deltaClientX = pos.clientX - dragState.lastClientX;
        const deltaClientY = pos.clientY - dragState.lastClientY;
        onPan(deltaClientX, deltaClientY);
      } else if (
        dragState.targetId &&
        onPathDrag &&
        dragState.dragType !== "pan"
      ) {
        // パスのドラッグは論理座標(x)の差分を使う
        const deltaX = pos.x - dragState.lastX;
        const deltaY = pos.y - dragState.lastY;
        onPathDrag(dragState.targetId, deltaX, deltaY, dragState.dragType);
      }

      setDragState((prev) => ({
        ...prev,
        lastX: pos.x,
        lastY: pos.y,
        lastClientX: pos.clientX,
        lastClientY: pos.clientY,
      }));
      return;
    }

    // Update cursor based on hover
    const selectedPath = paths.find((p) => p.isSelected);
    if (selectedPath) {
      const isTap =
        selectedPath.points.length === 1 ||
        selectedPath.points.every(
          (p) =>
            Math.abs(p.x - selectedPath.points[0].x) < 0.1 &&
            Math.abs(p.y - selectedPath.points[0].y) < 0.1,
        );

      if (isTap) {
        if (isPointNear(pos, selectedPath.points[0], 15)) {
          setCursor("move");
        } else {
          setCursor("default");
        }
      } else {
        if (
          isPointNear(pos, selectedPath.points[0], 10) ||
          isPointNear(
            pos,
            selectedPath.points[selectedPath.points.length - 1],
            10,
          )
        ) {
          setCursor("crosshair");
        } else if (isPointOnPath(pos, selectedPath.points, 10)) {
          setCursor("move");
        } else {
          setCursor("default");
        }
      }
    } else {
      setCursor("default");
    }
  };

  const wasDraggingRef = useRef<boolean>(false);

  const handleMouseUp = () => {
    // Capture drag state before reset to block click
    wasDraggingRef.current = dragState.isDragging;

    setDragState({
      isDragging: false,
      targetId: null,
      dragType: null,
      lastX: 0,
      lastY: 0,
      lastClientX: 0,
      lastClientY: 0,
      startX: 0,
      startY: 0,
    });
  };

  const handleCanvasClick = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ) => {
    // Ignore click if we were dragging
    if (dragState.isDragging || wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return;
    }
    wasDraggingRef.current = false;

    if (paths.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getLogicalPosition(e);
    const x = pos.x;
    const y = pos.y;

    // Check badge clicks first (High priority)
    if (onSelectWait) {
      for (const badge of badgesRef.current) {
        if (
          x >= badge.rect.x &&
          x <= badge.rect.x + badge.rect.w &&
          y >= badge.rect.y &&
          y <= badge.rect.y + badge.rect.h
        ) {
          onSelectWait(badge.strokeIndex);
          return; // Stop propagation
        }
      }
    }

    // Check for hit on paths (reverse order to select top-most)
    for (let i = paths.length - 1; i >= 0; i--) {
      const path = paths[i];
      if (path.points.length === 0) continue;

      const isTap =
        path.points.length === 1 ||
        path.points.every(
          (p) =>
            Math.abs(p.x - path.points[0].x) < 0.1 &&
            Math.abs(p.y - path.points[0].y) < 0.1,
        );

      if (isTap) {
        // Check hit on Tap (Dot)
        const point = path.points[0];
        const dx = x - point.x;
        const dy = y - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 15) {
          // Slightly larger hit area for taps
          onSelectCommand?.(path.fileId, path.commandId, path.id);
          return;
        }
      } else {
        // Simple distance check to line segments
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
          if (len_sq !== 0)
            // in case of 0 length line
            param = dot / len_sq;

          let xx, yy;

          if (param < 0) {
            xx = p1.x;
            yy = p1.y;
          } else if (param > 1) {
            xx = p2.x;
            yy = p2.y;
          } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
          }

          const dx = x - xx;
          const dy = y - yy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 10) {
            // Hit threshold
            onSelectCommand?.(path.fileId, path.commandId, path.id);
            return;
          }
        }
      }
    }
  };

  const handlers = {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp,
    onClick: handleCanvasClick,
    onTouchStart: handleMouseDown,
    onTouchMove: handleMouseMove,
    onTouchEnd: handleMouseUp,
    onTouchCancel: handleMouseUp,
  };

  return (
    <div
      {...handlers}
      className={`touch-none ${
        dragState.dragType === "pan"
          ? "cursor-grabbing"
          : dragState.dragType
            ? "cursor-grabbing"
            : cursor === "default" && onPan
              ? "cursor-grab"
              : `cursor-${cursor}`
      } relative bg-gray-50 shadow-inner`}
      style={{
        ...style,
        width: `${width * scale}px`,
        height: `${height * scale}px`,
        transformOrigin: "center center",
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default Canvas;
