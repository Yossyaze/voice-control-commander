
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Canvas from './components/Canvas';
import ControlPanel from './components/ControlPanel';
import Sidebar from './components/Sidebar';
import { parseFile, API_BASE_URL } from './api';
import type { Point, Command } from './api';

// Define Device Model Interface
interface DeviceModel {
  id: string;
  name: string;
  width: number;
  height: number;
  category: 'iPhone' | 'iPad';
}

// Comprehensive List of Apple Devices
const DEVICE_MODELS: DeviceModel[] = [
  // iPhone 16 Series
  { id: 'iphone_16_pro_max', name: 'iPhone 16 Pro Max', width: 440, height: 956, category: 'iPhone' },
  { id: 'iphone_16_pro', name: 'iPhone 16 Pro', width: 402, height: 874, category: 'iPhone' },
  { id: 'iphone_16_plus', name: 'iPhone 16 Plus', width: 430, height: 932, category: 'iPhone' },
  { id: 'iphone_16', name: 'iPhone 16', width: 393, height: 852, category: 'iPhone' },

  // iPhone 15 Series
  { id: 'iphone_15_pro_max', name: 'iPhone 15 Pro Max', width: 430, height: 932, category: 'iPhone' },
  { id: 'iphone_15_pro', name: 'iPhone 15 Pro', width: 393, height: 852, category: 'iPhone' },
  { id: 'iphone_15_plus', name: 'iPhone 15 Plus', width: 430, height: 932, category: 'iPhone' },
  { id: 'iphone_15', name: 'iPhone 15', width: 393, height: 852, category: 'iPhone' },

  // iPhone 14 Series
  { id: 'iphone_14_pro_max', name: 'iPhone 14 Pro Max', width: 430, height: 932, category: 'iPhone' },
  { id: 'iphone_14_pro', name: 'iPhone 14 Pro', width: 393, height: 852, category: 'iPhone' },
  { id: 'iphone_14_plus', name: 'iPhone 14 Plus', width: 428, height: 926, category: 'iPhone' },
  { id: 'iphone_14', name: 'iPhone 14', width: 390, height: 844, category: 'iPhone' },

  // iPhone 13 Series
  { id: 'iphone_13_pro_max', name: 'iPhone 13 Pro Max', width: 428, height: 926, category: 'iPhone' },
  { id: 'iphone_13_pro', name: 'iPhone 13 Pro', width: 390, height: 844, category: 'iPhone' },
  { id: 'iphone_13', name: 'iPhone 13', width: 390, height: 844, category: 'iPhone' },
  { id: 'iphone_13_mini', name: 'iPhone 13 mini', width: 375, height: 812, category: 'iPhone' },

  // iPhone 12 Series
  { id: 'iphone_12_pro_max', name: 'iPhone 12 Pro Max', width: 428, height: 926, category: 'iPhone' },
  { id: 'iphone_12_pro', name: 'iPhone 12 Pro', width: 390, height: 844, category: 'iPhone' },
  { id: 'iphone_12', name: 'iPhone 12', width: 390, height: 844, category: 'iPhone' },
  { id: 'iphone_12_mini', name: 'iPhone 12 mini', width: 375, height: 812, category: 'iPhone' },

  // iPhone 11 Series
  { id: 'iphone_11_pro_max', name: 'iPhone 11 Pro Max', width: 414, height: 896, category: 'iPhone' },
  { id: 'iphone_11_pro', name: 'iPhone 11 Pro', width: 375, height: 812, category: 'iPhone' },
  { id: 'iphone_11', name: 'iPhone 11', width: 414, height: 896, category: 'iPhone' },

  // iPhone XS/XR/X
  { id: 'iphone_xs_max', name: 'iPhone XS Max', width: 414, height: 896, category: 'iPhone' },
  { id: 'iphone_xs', name: 'iPhone XS', width: 375, height: 812, category: 'iPhone' },
  { id: 'iphone_xr', name: 'iPhone XR', width: 414, height: 896, category: 'iPhone' },
  { id: 'iphone_x', name: 'iPhone X', width: 375, height: 812, category: 'iPhone' },

  // iPhone 8/7/SE
  { id: 'iphone_8_plus', name: 'iPhone 8 Plus', width: 414, height: 736, category: 'iPhone' },
  { id: 'iphone_8', name: 'iPhone 8', width: 375, height: 667, category: 'iPhone' },
  { id: 'iphone_7_plus', name: 'iPhone 7 Plus', width: 414, height: 736, category: 'iPhone' },
  { id: 'iphone_7', name: 'iPhone 7', width: 375, height: 667, category: 'iPhone' },
  { id: 'iphone_se_3', name: 'iPhone SE (3rd gen)', width: 375, height: 667, category: 'iPhone' },
  { id: 'iphone_se_2', name: 'iPhone SE (2nd gen)', width: 375, height: 667, category: 'iPhone' },
  
  // iPad Pro
  { id: 'ipad_pro_13_m4', name: 'iPad Pro 13" (M4)', width: 1032, height: 1376, category: 'iPad' },
  { id: 'ipad_pro_12_9_6', name: 'iPad Pro 12.9" (3rd-6th gen)', width: 1024, height: 1366, category: 'iPad' },
  { id: 'ipad_pro_12_9_2', name: 'iPad Pro 12.9" (1st-2nd gen)', width: 1024, height: 1366, category: 'iPad' },
  { id: 'ipad_pro_11_m4', name: 'iPad Pro 11" (M4)', width: 834, height: 1210, category: 'iPad' },
  { id: 'ipad_pro_11_4', name: 'iPad Pro 11" (1st-4th gen)', width: 834, height: 1194, category: 'iPad' },
  { id: 'ipad_pro_10_5', name: 'iPad Pro 10.5"', width: 834, height: 1112, category: 'iPad' },
  { id: 'ipad_pro_9_7', name: 'iPad Pro 9.7"', width: 768, height: 1024, category: 'iPad' },

  // iPad Air
  { id: 'ipad_air_13_m2', name: 'iPad Air 13" (M2)', width: 1032, height: 1376, category: 'iPad' },
  { id: 'ipad_air_11_m2', name: 'iPad Air 11" (M2)', width: 820, height: 1180, category: 'iPad' },
  { id: 'ipad_air_5', name: 'iPad Air (5th gen)', width: 820, height: 1180, category: 'iPad' },
  { id: 'ipad_air_4', name: 'iPad Air (4th gen)', width: 820, height: 1180, category: 'iPad' },
  { id: 'ipad_air_3', name: 'iPad Air (3rd gen)', width: 834, height: 1112, category: 'iPad' },

  // iPad
  { id: 'ipad_10', name: 'iPad (10th gen)', width: 820, height: 1180, category: 'iPad' },
  { id: 'ipad_9', name: 'iPad (9th gen)', width: 810, height: 1080, category: 'iPad' },
  { id: 'ipad_8', name: 'iPad (8th gen)', width: 810, height: 1080, category: 'iPad' },
  { id: 'ipad_7', name: 'iPad (7th gen)', width: 810, height: 1080, category: 'iPad' },
  { id: 'ipad_6', name: 'iPad (6th gen)', width: 768, height: 1024, category: 'iPad' },
  { id: 'ipad_5', name: 'iPad (5th gen)', width: 768, height: 1024, category: 'iPad' },

  // iPad mini
  { id: 'ipad_mini_6', name: 'iPad mini (6th gen)', width: 744, height: 1133, category: 'iPad' },
  { id: 'ipad_mini_5', name: 'iPad mini (5th gen)', width: 768, height: 1024, category: 'iPad' },
];

const DEFAULT_COMMAND_POINTS: Point[] = [
  { x: 160, y: 400 }, // Start point
  { x: 160, y: 300 }  // End point (Swipe Up)
];

const COMMAND_COLORS = [
  '#3B82F6', // Blue
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

function App() {
  const [commands, setCommands] = useState<Command[]>([]);

  // Helper to get next color
  const getNextColor = (currentCommands: Command[]) => {
    const usedColors = new Set(currentCommands.map(c => c.color));
    for (const color of COMMAND_COLORS) {
      if (!usedColors.has(color)) return color;
    }
    return COMMAND_COLORS[currentCommands.length % COMMAND_COLORS.length];
  };

  const [selectedCommandId, setSelectedCommandId] = useState<string | null>(null);
  const [selectedStrokeIndex, setSelectedStrokeIndex] = useState<number | null>(null);
  const [selectionType, setSelectionType] = useState<'stroke' | 'wait'>('stroke');
  
  // Refactored Device State
  const [selectedModelId, setSelectedModelId] = useState<string>('iphone_16_pro'); // Default to iPhone 16 Pro
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [scale, setScale] = useState<number>(0.6);

  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Remove unused state
  // const [showSettingsPopup, setShowSettingsPopup] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(1.0); // Display value
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [markerPosition, setMarkerPosition] = useState<Point | null>(null);


  const appRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const selectedCommand = useMemo(() => {
    return commands.find(c => c.id === selectedCommandId);
  }, [commands, selectedCommandId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Animation Loop
  useEffect(() => {
    if (isPlaying && selectedCommand) {
      // Build Timeline based on selection
      const timeline: { type: 'stroke' | 'wait', duration: number, strokeIndex?: number }[] = [];

      if (selectedStrokeIndex !== null && selectedStrokeIndex < selectedCommand.strokes.length) {
        // Play ONLY the selected stroke
        const s = selectedCommand.strokes[selectedStrokeIndex];
        timeline.push({ type: 'stroke', duration: Math.max(0.1, s.length / 60), strokeIndex: selectedStrokeIndex });
      } else {
        // Play ALL strokes in sequence
         const waitTime = selectedCommand.waitDuration !== undefined ? selectedCommand.waitDuration : 0.2;
         selectedCommand.strokes.forEach((s, i) => {
           if (i > 0) {
              // Wait time BEFORE stroke i.
              // Which is "Wait After" stroke i-1.
              const prevStrokeWait = selectedCommand.strokeMetadata?.[i-1]?.waitAfter;
              const actualWait = prevStrokeWait !== undefined ? prevStrokeWait : waitTime;
              timeline.push({ type: 'wait', duration: actualWait });
           }
           timeline.push({ type: 'stroke', duration: Math.max(0.1, s.length / 60), strokeIndex: i });
         });
      }

      const totalDuration = timeline.reduce((acc, item) => acc + item.duration, 0);

      const animate = (time: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = time;
        }

        const elapsed = (time - startTimeRef.current) / 1000; // seconds

        if (elapsed >= totalDuration) {
          setIsPlaying(false);
          setMarkerPosition(null);
          startTimeRef.current = null;
          return;
        }

        // Find current position
        let runTime = 0;
        let activeFound = false;

        for (const item of timeline) {
          if (elapsed >= runTime && elapsed < runTime + item.duration) {
            if (item.type === 'stroke' && item.strokeIndex !== undefined) {
              const stroke = selectedCommand.strokes[item.strokeIndex];
              const localProgress = (elapsed - runTime) / item.duration; // 0 to 1
              if (stroke.length > 0) {
                // Interpolate
                const exactIndex = localProgress * (stroke.length - 1);
                const idx = Math.floor(exactIndex);
                const nextIdx = Math.min(idx + 1, stroke.length - 1);
                const t = exactIndex - idx;
                const p1 = stroke[idx];
                const p2 = stroke[nextIdx];
                setMarkerPosition({
                  x: p1.x + (p2.x - p1.x) * t,
                  y: p1.y + (p2.y - p1.y) * t
                });
                activeFound = true;
              }
            } else {
              // In wait period
              setMarkerPosition(null);
              activeFound = true;
            }
            break;
          }
          runTime += item.duration;
        }

        if (!activeFound) setMarkerPosition(null);

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setMarkerPosition(null);
      startTimeRef.current = null;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, selectedCommand, selectedStrokeIndex]);

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const selectedDevice = useMemo(() => {
    const model = DEVICE_MODELS.find(d => d.id === selectedModelId) || DEVICE_MODELS[0];
    if (orientation === 'landscape') {
      return { ...model, width: model.height, height: model.width };
    }
    return model;
  }, [selectedModelId, orientation]);


  // Helper for path resampling
  const resamplePath = (points: Point[], dur: number): Point[] => {
    if (points.length === 0) return [];
    const targetCount = Math.max(2, Math.round(dur * 60));
    if (points.length === 1) return Array(targetCount).fill(points[0]);
    if (points.length === 2) {
      const start = points[0];
      const end = points[1];
      const newPoints: Point[] = [];
      for (let i = 0; i < targetCount; i++) {
        const t = i / (targetCount - 1);
        newPoints.push({
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t,
        });
      }
      return newPoints;
    }
    // Complex path resampling
    let totalLength = 0;
    const segmentLengths: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      segmentLengths.push(dist);
      totalLength += dist;
    }
    if (totalLength === 0) return Array(targetCount).fill(points[0]);
    const newPoints: Point[] = [points[0]];
    const step = totalLength / (targetCount - 1);
    let currentDist = 0;
    let currentSegmentIndex = 0;
    for (let i = 1; i < targetCount - 1; i++) {
      const targetDist = i * step;
      while (currentSegmentIndex < segmentLengths.length && currentDist + segmentLengths[currentSegmentIndex] < targetDist) {
        currentDist += segmentLengths[currentSegmentIndex];
        currentSegmentIndex++;
      }
      if (currentSegmentIndex >= segmentLengths.length) {
        newPoints.push(points[points.length - 1]);
        continue;
      }
      const segmentStart = points[currentSegmentIndex];
      const segmentEnd = points[currentSegmentIndex + 1];
      const segmentLen = segmentLengths[currentSegmentIndex];
      const distInSegment = targetDist - currentDist;
      const t = distInSegment / segmentLen;
      newPoints.push({
        x: segmentStart.x + (segmentEnd.x - segmentStart.x) * t,
        y: segmentStart.y + (segmentEnd.y - segmentStart.y) * t
      });
    }
    newPoints.push(points[points.length - 1]);
    return newPoints;
  };

  // Command Management
  const handleCreateNewCommand = () => {
    const newId = crypto.randomUUID();
    const initialPoints = resamplePath(DEFAULT_COMMAND_POINTS, 0.4);

    // Create new command with one stroke
    const newCommand: Command = {
      id: newId,
      name: "新規コマンド",
      points: initialPoints, // Legacy support, keeps sync with first stroke
      strokes: [initialPoints],
      isVisible: true,
      duration: 0.4,
      waitDuration: 0.2, // Default wait duration
      color: getNextColor(commands) // Assign color to command
    };

    setCommands(prev => [...prev, newCommand]);
    setSelectedCommandId(newId);
    setSelectedStrokeIndex(0); // Select the first stroke by default for immediate editing
    setSelectionType('stroke');
    setDuration(0.4);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const result = await parseFile(file);

      const newCommands = result.commands.map(c => {
        // Ensure strokes are populated
        const strokes = (c.strokes && c.strokes.length > 0) ? c.strokes : [c.points];

        const newId = crypto.randomUUID();
        return {
          ...c,
          id: newId,
          isVisible: true,
          color: getNextColor(commands), // Assign color to command
          strokes: strokes,
          points: strokes[0] // Main preview points
        };
      });

      setCommands(prev => [...prev, ...newCommands]);
      if (newCommands.length > 0) {
        setSelectedCommandId(newCommands[0].id);
        setSelectedStrokeIndex(null); // Default to whole command selection
        setSelectionType('stroke');
      }

    } catch (error) {
      console.error('Error parsing file:', error);
      alert(`ファイルの解析に失敗しました: ${file.name}`);
    }
  };

  // selectedCommand moved up to fix scoping
  // const selectedCommand = ...

  // Helper functions for geometric transformations
  const getSelectedStrokePoints = (): Point[] | null => {
    if (!selectedCommand) return null;
    if (selectedStrokeIndex !== null) {
      if (selectedStrokeIndex < selectedCommand.strokes.length) {
        return selectedCommand.strokes[selectedStrokeIndex];
      }
    } else if (selectedCommand.strokes.length > 0) {
      return selectedCommand.strokes[0];
    }
    return null;
  };

  const calculateAngle = (points: Point[]): number => {
    if (points.length < 2) return 0;
    const start = points[0];
    const end = points[points.length - 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    let angleRad = Math.atan2(dy, dx);
    if (angleRad < 0) angleRad += 2 * Math.PI;
    return Math.round((angleRad / (2 * Math.PI)) * 1024) % 1024;
  };

  const calculateLength = (points: Point[]): number => {
    if (points.length < 2) return 0;
    const start = points[0];
    const end = points[points.length - 1];
    return Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
  };

  const updateSelectedStroke = (newPoints: Point[]) => {
    if (!selectedCommandId) return;
    setCommands(prev => prev.map(cmd => {
      if (cmd.id !== selectedCommandId) return cmd;
      let newStrokes = [...cmd.strokes];
      if (selectedStrokeIndex !== null) {
        if (selectedStrokeIndex < newStrokes.length) {
          newStrokes[selectedStrokeIndex] = newPoints;
        }
      } else {
        if (newStrokes.length > 0) newStrokes[0] = newPoints;
      }
      const legacyPoints = (newStrokes.length > 0) ? newStrokes[0] : [];
      return { ...cmd, strokes: newStrokes, points: legacyPoints };
    }));
  };

  const handleAngleChange = (newAngleRaw: number) => {
    const points = getSelectedStrokePoints();
    if (!points || points.length < 2) return;

    const currentAngleRaw = calculateAngle(points);
    const diffRaw = newAngleRaw - currentAngleRaw;
    const diffRad = (diffRaw / 1024) * 2 * Math.PI;

    const start = points[0];
    const end = points[points.length - 1];
    const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

    const cos = Math.cos(diffRad);
    const sin = Math.sin(diffRad);

    const newPoints = points.map(p => {
      const dx = p.x - mid.x;
      const dy = p.y - mid.y;
      return {
        x: mid.x + (dx * cos - dy * sin),
        y: mid.y + (dx * sin + dy * cos)
      };
    });

    updateSelectedStroke(newPoints);
  };

  const handleLengthChange = (newLength: number) => {
    const points = getSelectedStrokePoints();
    if (!points || points.length < 2) return;

    const currentLen = calculateLength(points);
    if (currentLen === 0) return;

    const scale = newLength / currentLen;
    const start = points[0];
    const end = points[points.length - 1];
    const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

    const newPoints = points.map(p => ({
      x: mid.x + (p.x - mid.x) * scale,
      y: mid.y + (p.y - mid.y) * scale
    }));

    updateSelectedStroke(newPoints);
  };

  const handleNudge = useCallback((type: 'x' | 'y', delta: number) => {
    if (!selectedCommandId) return;
    setCommands(prev => prev.map(cmd => {
      if (cmd.id !== selectedCommandId) return cmd;
      let strokesToUpdate: number[] = [];
      if (selectedStrokeIndex !== null) {
        const idx = selectedStrokeIndex;
        if (idx < cmd.strokes.length) strokesToUpdate.push(idx);
      } else {
        strokesToUpdate = cmd.strokes.map((_, i) => i);
      }
      const newStrokes = cmd.strokes.map((stroke, i) => {
        if (strokesToUpdate.includes(i)) {
          // Explicitly preserve length/duration by using resample or just map
          // Mapping points 1:1 preserves count, which preserves duration.
          // Just ensure we don't accidentally add/remove points.
          return stroke.map(p => ({
            x: type === 'x' ? p.x + delta : p.x,
            y: type === 'y' ? p.y + delta : p.y
          }));
        }
        return stroke;
      });
      const legacyPoints = (newStrokes.length > 0) ? newStrokes[0] : [];
      return { ...cmd, strokes: newStrokes, points: legacyPoints };
    }));
  }, [selectedCommandId, selectedStrokeIndex]);


  const handleCurve = () => {
    if (!selectedCommandId) return;

    setCommands(prev => prev.map(cmd => {
      if (cmd.id !== selectedCommandId) return cmd;

      // Determine usage: 
      // If selectedStrokeIndex is set, curve only that one.
      // If null, curve ALL strokes.
      const indicesToCurve = selectedStrokeIndex !== null
        ? [selectedStrokeIndex]
        : cmd.strokes.map((_, i) => i);

      const newStrokes = cmd.strokes.map((stroke, index) => {
        if (!indicesToCurve.includes(index) || stroke.length < 2) return stroke;

        const start = stroke[0];
        const end = stroke[stroke.length - 1];
        const pointCount = stroke.length;

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 1) return stroke;

        // Randomize offset direction and magnitude (approx 30% of length)
        const offset = dist * 0.3;
        const angle = Math.atan2(dy, dx);
        const perpAngle = angle + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);

        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        const controlX = midX + Math.cos(perpAngle) * offset;
        const controlY = midY + Math.sin(perpAngle) * offset;

        const newPoints: Point[] = [];
        for (let i = 0; i < pointCount; i++) {
          const t = i / (pointCount - 1);
          const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * controlX + t * t * end.x;
          const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * controlY + t * t * end.y;
          newPoints.push({ x, y });
        }
        return newPoints;
      });

      const legacyPoints = (newStrokes.length > 0) ? newStrokes[0] : [];
      return { ...cmd, strokes: newStrokes, points: legacyPoints };
    }));
  };

  const currentAngle = useMemo(() => {
    const points = getSelectedStrokePoints();
    return points ? calculateAngle(points) : 0;
  }, [selectedCommand, selectedStrokeIndex]);

  const currentLength = useMemo(() => {
    const points = getSelectedStrokePoints();
    return points ? calculateLength(points) : 0;
  }, [selectedCommand, selectedStrokeIndex]);

  const currentHeadX = useMemo(() => {
    const points = getSelectedStrokePoints();
    if (points && points.length > 0) {
      const start = points[0];
      const end = points[points.length - 1];
      return (start.x + end.x) / 2;
    }
    return 0;
  }, [selectedCommand, selectedStrokeIndex]);

  const currentHeadY = useMemo(() => {
    const points = getSelectedStrokePoints();
    if (points && points.length > 0) {
      const start = points[0];
      const end = points[points.length - 1];
      return (start.y + end.y) / 2;
    }
    return 0;
  }, [selectedCommand, selectedStrokeIndex]);


  // Duration Sync:
  // If stroke selected -> Show stroke duration
  // If command selected -> Show total sequential duration (Read only preferably, or editable as global scale?) 
  // User said "No need to set for command". So treating as Read Only or just informational.
  useEffect(() => {
    if (selectedCommand) {
      if (selectedStrokeIndex !== null && selectedStrokeIndex < selectedCommand.strokes.length) {
        // Specific stroke
        const s = selectedCommand.strokes[selectedStrokeIndex];
        // Allow shorter durations like 0.2s. Min 0.1s for safety.
        setDuration(Math.max(0.1, Math.round((s.length / 60) * 10) / 10));
      } else {
        // Total sequential time: Sum(strokes) + Sum(gaps)
        const waitTime = selectedCommand.waitDuration !== undefined ? selectedCommand.waitDuration : 0.2;
        let total = 0;
        selectedCommand.strokes.forEach((s, i) => {
          if (i > 0) total += waitTime;
          total += Math.max(0.1, s.length / 60);
        });
        setDuration(Math.round(total * 10) / 10);
      }
    }
  }, [selectedCommand, selectedStrokeIndex]); // Add selectedStrokeIndex dependency

  const handleDeleteSelectedAction = useCallback(() => {
    if (!selectedCommandId || selectedStrokeIndex === null) return;
    
    setCommands(prev => prev.map(cmd => {
      if (cmd.id !== selectedCommandId) return cmd;
      const newStrokes = [...cmd.strokes];
      if (selectedStrokeIndex < newStrokes.length) {
         newStrokes.splice(selectedStrokeIndex, 1);
      }
      return { ...cmd, strokes: newStrokes };
    }));
    
    // Adjust selection
    if (selectedStrokeIndex > 0) {
        setSelectedStrokeIndex(selectedStrokeIndex - 1);
    } else {
        setSelectedStrokeIndex(null); // Deselect if 0 was deleted, or maybe stay null
        // If there are still strokes, maybe select 0? 
        // Logic: if 0 deleted and others remain -> select new 0?
        // Let's stick to null (command selection) to be safe or index 0 if exists?
        // Let's just go null for now.
    }
  }, [selectedCommandId, selectedStrokeIndex]);


  // Prepare canvas paths: Flatten all strokes of all visible commands
  const canvasPaths = useMemo(() => {
    return commands
      .filter(c => c.isVisible)
      .flatMap(cmd => {
        const isCommandSelected = cmd.id === selectedCommandId;

        // Map each stroke
        return cmd.strokes.map((stroke, index) => {
          // Highlight logic:
          // 1. If Command is NOT selected -> False
          // 2. If Command IS selected:
          //    a. If selectedStrokeIndex is NULL -> Highlights ALL strokes (True)
          //    b. If selectedStrokeIndex matches index -> True
          //    c. Otherwise -> False

          const isSelected = isCommandSelected && (selectedStrokeIndex === null || selectedStrokeIndex === index);

          return {
            id: `${cmd.id}_stroke_${index}`,
            fileId: 'N/A',
            commandId: cmd.id,
            points: stroke,
            color: cmd.color || '#000',
            isSelected: isSelected,
            label: isSelected ? String(index + 1) : undefined
          };
        });
      });
  }, [commands, selectedCommandId, selectedStrokeIndex]);

  const canvasConnections = useMemo(() => {
    if (!selectedCommand || selectedCommand.strokes.length < 2) return [];
    
    const connections: { from: Point, to: Point, duration: number, strokeIndex: number }[] = [];
    const waitTime = selectedCommand.waitDuration !== undefined ? selectedCommand.waitDuration : 0.2;

    for (let i = 0; i < selectedCommand.strokes.length - 1; i++) {
        const strokeA = selectedCommand.strokes[i];
        const strokeB = selectedCommand.strokes[i+1];
        if (strokeA.length === 0 || strokeB.length === 0) continue;

        const endA = strokeA[strokeA.length - 1];
        const startB = strokeB[0];
        
        // Duration logic
        const prevStrokeWait = selectedCommand.strokeMetadata?.[i]?.waitAfter;
        const actualWait = prevStrokeWait !== undefined ? prevStrokeWait : waitTime;

        connections.push({
            from: endA,
            to: startB,
            duration: actualWait,
            strokeIndex: i
        });
    }
    return connections;
  }, [selectedCommand]);

  const handleExport = async () => {
    if (!selectedCommand) return;

    // Use the backend export_merged API to handle multi-stroke export correctly for single command
    const strokeWaits = selectedCommand.strokes.map((_, i) => 
      selectedCommand.strokeMetadata?.[i]?.waitAfter ?? selectedCommand.waitDuration ?? 0.2
    );

    const commandToExport = {
      name: selectedCommand.name,
      points: [], // Not used if strokes is present
      strokes: selectedCommand.strokes,
      stroke_waits: strokeWaits
    };

    try {
      const response = await fetch(`${API_BASE_URL}/export_merged`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: [commandToExport] }),
      });

      if (!response.ok) throw new Error('Export failed');
      const result = await response.json();

      let filename = selectedCommand.name;
      if (!filename.toLowerCase().endsWith('.plist')) {
        // User permitted usage of .plist extension to avoid the 16-char limit of showSaveFilePicker
        filename += '.plist'; 
      }

      // Save file logic
      // @ts-ignore
      if (typeof window.showSaveFilePicker === 'function') {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Apple Property List',
            accept: { 'application/x-plist': ['.plist'] },
          }],
        });
        const writable = await handle.createWritable();
        const binaryContent = Uint8Array.from(atob(result.content), c => c.charCodeAt(0));
        await writable.write(binaryContent);
        await writable.close();
      } else {
        // Fallback for browsers that don't support showSaveFilePicker
        const blob = new Blob([Uint8Array.from(atob(result.content), c => c.charCodeAt(0))], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      console.error('Export Error:', error);
      alert(`エクスポートに失敗しました: ${error.message}`);
    }
  };

  // Handle pinch-to-zoom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Check for pinch gesture (ctrlKey + wheel)
      // Note: On Mac trackpad, pinch sends wheel events with ctrlKey=true
      if (e.ctrlKey) {
        e.preventDefault();
        
        // Adjust scale sensitivity
        const delta = -e.deltaY * 0.01; 
        
        setScale(prevScale => {
          const newScale = Math.min(Math.max(prevScale + delta, 0.2), 3.0);
          return newScale;
        });
      }
    };

    // Need non-passive listener to prevent default browser zoom
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []); // Empty deps as we use setScale callback form

  const handlePathDrag = (id: string, deltaX: number, deltaY: number, type: 'move' | 'start' | 'end') => {
    if (isPlaying) return;

    // Use refined regex parsing to handle IDs like "uuid_stroke_0" safely vs "uuid_stroke_10"
    const match = id.match(/^(.*)_stroke_(\d+)$/);
    if (!match) return;
    const commandId = match[1];
    const targetStrokeIndex = parseInt(match[2], 10);

    setCommands((prev: Command[]) => prev.map((cmd: Command) => {
      if (cmd.id !== commandId) return cmd;

      // If Command is selected (selectedStrokeIndex === null) and type is 'move', move ALL strokes
      const isCommandMove = selectedStrokeIndex === null && type === 'move';

      const newStrokes = cmd.strokes.map((stroke, index) => {
        // Condition to update this specific stroke:
        // 1. It's a "Command Move" (move all)
        // 2. OR it's the specific target stroke (single edit)
        const shouldUpdate = isCommandMove || index === targetStrokeIndex;

        if (!shouldUpdate) return stroke;

        // Apply modification
        let newPoints = [...stroke];

        if (type === 'move') {
          newPoints = newPoints.map(p => ({ x: p.x + deltaX, y: p.y + deltaY }));
        } else if (index === targetStrokeIndex) {
          // Start/End drags only apply to the specific target stroke even in command mode
          // (Can't meaningfully drag 5 start points at once with one mouse cursor)
          if (type === 'start') {
            const newStart = { x: newPoints[0].x + deltaX, y: newPoints[0].y + deltaY };
            const end = newPoints[newPoints.length - 1];

            if (newPoints.length) {
              const currentPointsCount = stroke.length;
              const currentDuration = Math.max(0.4, currentPointsCount / 60);
              newPoints = resamplePath([newStart, end], currentDuration);
            }
          } else if (type === 'end') {
            const start = newPoints[0];
            const newEnd = { x: newPoints[newPoints.length - 1].x + deltaX, y: newPoints[newPoints.length - 1].y + deltaY };
            if (newPoints.length) {
              const currentPointsCount = stroke.length;
              const currentDuration = Math.max(0.4, currentPointsCount / 60);
              newPoints = resamplePath([start, newEnd], currentDuration);
            }
          }
        }
        return newPoints;
      });

      // Update legacy points for preview if first stroke changed
      const newLegacyPoints = (newStrokes.length > 0) ? newStrokes[0] : cmd.points;

      return { ...cmd, strokes: newStrokes, points: newLegacyPoints };
    }));
  };


  const handleBackgroundImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setBackgroundImage(e.target?.result as string);
      // Device detection logic (simplified for brevity)
    };
    reader.readAsDataURL(file);
  };

  const handleClearBackgroundImage = () => setBackgroundImage(null);
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
        // Auto-close both sidebars when entering fullscreen
        setIsLeftSidebarOpen(false);
        setIsRightSidebarOpen(false);
        appRef.current?.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        handleNudge('y', -1);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleNudge('y', 1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleNudge('x', -1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNudge('x', 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleNudge]); // Dependencies ensure fresh closures

  const handleWaitDurationChange = (newDuration: number) => {
      if (!selectedCommandId) return;
      setCommands(prev => prev.map(c => c.id === selectedCommandId ? { ...c, waitDuration: newDuration } : c));
  };

  const handleSelectedStrokeWaitChange = (newDuration: number) => {
      if (!selectedCommandId) return;
      setCommands(prev => prev.map(c => {
          if (c.id !== selectedCommandId) return c;
          
          let newMetadata = c.strokeMetadata ? [...c.strokeMetadata] : [];
          // Ensure metadata exists for all strokes
          while (newMetadata.length < c.strokes.length) {
              newMetadata.push({});
          }
          
          if (selectedStrokeIndex !== null && selectedStrokeIndex < c.strokes.length) {
             // Specific stroke
             newMetadata[selectedStrokeIndex] = { ...newMetadata[selectedStrokeIndex], waitAfter: newDuration };
          } else {
             // If no stroke selected, maybe update global default? Or update ALL?
             // User requested individual editing. "If not selected, global editing".
             // We already separate that in UI. If this is called, it SHOULD correspond to a selected stroke OR explicitly global.
             // But the UI slider calls this handler.
             // If selectedStrokeIndex is null, we shouldn't be calling "SelectedStrokeWaitChange".
             // But let's support "Update All" here if needed? No, use handleWaitDurationChange for that.
             // So this does nothing if index is null.
             return c;
          }
          
          return { ...c, strokeMetadata: newMetadata };
      }));
  };

  const currentStrokeWait = useMemo(() => {
      if (!selectedCommand || selectedStrokeIndex === null) return undefined;
      const meta = selectedCommand.strokeMetadata?.[selectedStrokeIndex];
      return meta?.waitAfter; // Returns undefined if not set, UI shows default
  }, [selectedCommand, selectedStrokeIndex]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900" ref={appRef}>
      
      {/* Left Sidebar */}
      <div 
        className={`
            ${isLeftSidebarOpen ? 'w-64' : 'w-0'} 
            ${isFullscreen ? 'absolute left-0 z-50 h-full shadow-2xl' : 'relative'}
            transition-all duration-300 ease-in-out flex-shrink-0 bg-white border-r border-gray-200 overflow-hidden
        `}
      >
        <Sidebar
          commands={commands}
          selectedCommandId={selectedCommandId}
          onSelectCommand={setSelectedCommandId}
          onDeleteCommand={(id) => setCommands(prev => prev.filter(c => c.id !== id))}
          onToggleVisibility={(id) => setCommands(prev => prev.map(c => c.id === id ? { ...c, isVisible: !c.isVisible } : c))}
          onFileUpload={handleFileUpload}
          onCreateNew={handleCreateNewCommand}
          onRenameCommand={(id, name) => setCommands(prev => prev.map(c => c.id === id ? { ...c, name } : c))}
          onUpdateCommand={(updatedCmd) => setCommands(prev => prev.map(c => c.id === updatedCmd.id ? updatedCmd : c))}
          selectedStrokeIndex={selectedStrokeIndex}
          onSelectStroke={setSelectedStrokeIndex}
          selectionType={selectionType}
          onSelectType={setSelectionType}
        />
        {/* Close button for fullscreen popup mode */}
        {isFullscreen && isLeftSidebarOpen && (
            <button 
                onClick={() => setIsLeftSidebarOpen(false)}
                className="absolute top-2 right-2 p-1 bg-gray-100 rounded-full hover:bg-gray-200"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        )}
      </div>

      {/* Center Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 relative">
        {/* Fullscreen Hover Zones */}
        {isFullscreen && (
            <>
                {/* Left Hover Zone */}
                <div 
                    className="absolute left-0 top-0 bottom-0 w-4 z-40 hover:bg-blue-500/10 transition-colors cursor-pointer flex items-center justify-start group"
                    onClick={() => setIsLeftSidebarOpen(true)}
                    title="サイドバーを開く"
                >
                    <div className="h-12 w-1 bg-blue-500/50 rounded-r opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
                </div>
                {/* Right Hover Zone */}
                <div 
                    className="absolute right-0 top-0 bottom-0 w-4 z-40 hover:bg-blue-500/10 transition-colors cursor-pointer flex items-center justify-end group"
                    onClick={() => setIsRightSidebarOpen(true)}
                    title="設定を開く"
                >
                    <div className="h-12 w-1 bg-blue-500/50 rounded-l opacity-0 group-hover:opacity-100 transition-opacity mr-0.5" />
                </div>
            </>
        )}

        {/* Header (Hidden in fullscreen usually, or kept? Plan said keep functionality but fullscreen usually hides chrome. 
            Let's keep separate header if not fullscreen, or overlays if fullscreen.
            For "Clean Studio", a persistent top bar is good unless maximized.
        */}
        {!isFullscreen && (
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 text-sm select-none">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isLeftSidebarOpen 
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /> // Menu icon (open)
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /> // Menu icon (closed) - keep same or change? Let's use Sidebar icon
                  }
               </svg>
            </button>
            <h1 className="font-semibold text-gray-700 tracking-tight">Voice Control Commander</h1>
          </div>
          <div className="flex items-center space-x-3">
             <button onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
            <div className="h-4 w-px bg-gray-300 mx-2" />
            <button onClick={handleExport} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 shadow-sm transition-colors">
              書き出し
            </button>
          </div>
        </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden relative">
          <div 
            ref={scrollContainerRef}
            className="w-full h-full overflow-auto relative flex items-center justify-center bg-gray-50/50"
          >
            <div className="p-16">
                <Canvas
                width={selectedDevice.width}
                height={selectedDevice.height}
                backgroundImage={backgroundImage}
                paths={canvasPaths}
                showGrid={showGrid}
                onPathDrag={handlePathDrag}
                onSelectCommand={(_, cmdId, pathId) => {
                    let strokeIndex: number | null = null;
                    if (pathId) {
                    const match = pathId.match(/_stroke_(\d+)$/);
                    if (match) {
                        strokeIndex = parseInt(match[1], 10);
                    }
                    }

                    setSelectedCommandId(cmdId);
                    setSelectedStrokeIndex(strokeIndex);
                    // Also open settings if closed?
                    if (!isRightSidebarOpen && !isFullscreen) setIsRightSidebarOpen(true);
                }}
                connections={canvasConnections.map(c => ({
                    ...c,
                    isSelected: selectionType === 'wait' && selectedStrokeIndex === c.strokeIndex
                }))}
                onSelectWait={(index) => {
                    setSelectedStrokeIndex(index);
                    setSelectionType('wait');
                    if (!isRightSidebarOpen && !isFullscreen) setIsRightSidebarOpen(true);
                }}
                markerPosition={markerPosition}
                scale={scale}
                />
            </div>
          </div>

          {/* Overlay Play Controls (Floating) */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
             <button 
                onClick={togglePlay} 
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-full shadow-lg backdrop-blur-md border border-white/20 transition-all transform hover:scale-105 active:scale-95 ${
                    isPlaying 
                    ? 'bg-red-500/90 text-white' 
                    : 'bg-white/90 text-gray-800 hover:bg-white'
                }`}
             >
                {isPlaying ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
                ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                )}
                <span className="font-medium text-sm">{isPlaying ? '停止' : '再生'}</span>
             </button>
             {/* Quick Fullscreen Toggle for center access */}
             <button 
                onClick={handleToggleFullscreen}
                className="p-2.5 bg-white/90 text-gray-600 rounded-full shadow-lg backdrop-blur-md border border-white/20 hover:bg-white transition-all transform hover:scale-105 active:scale-95"
                title="全画面切替"
             >
                 {isFullscreen ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                 )}
             </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar (Control Panel) */}
      <div 
        className={`
            ${isRightSidebarOpen ? 'w-72' : 'w-0'} 
            ${isFullscreen ? 'absolute right-0 z-50 h-full shadow-2xl' : 'relative'}
            transition-all duration-300 ease-in-out flex-shrink-0 bg-white border-l border-gray-200 overflow-hidden
        `}
      >
        <ControlPanel
          models={DEVICE_MODELS}
          selectedModelId={selectedModelId}
          onSelectModel={setSelectedModelId}
          orientation={orientation}
          onSelectOrientation={setOrientation}
          scale={scale}
          onScaleChange={setScale}
          onNudge={(dx, dy) => {
            if (dx !== 0) handleNudge('x', dx);
            if (dy !== 0) handleNudge('y', dy);
          }}
          onExport={handleExport}
          onBackgroundImageUpload={handleBackgroundImageUpload}
          onClearBackgroundImage={handleClearBackgroundImage}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onEnterFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
          duration={duration}
          onDurationChange={(newDur) => {
            if (selectedStrokeIndex !== null) {
              const points = getSelectedStrokePoints();
              if (!points || points.length < 2) return;
              const newPoints = resamplePath(points, newDur);
              updateSelectedStroke(newPoints);
            }
          }}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          angle={currentAngle}
          onAngleChange={handleAngleChange}
          length={currentLength}
          onLengthChange={handleLengthChange}
          onCurve={handleCurve}
          absoluteX={currentHeadX}
          absoluteY={currentHeadY}
          isActionSelected={selectedStrokeIndex !== null}
          waitDuration={selectedCommand?.waitDuration !== undefined ? selectedCommand.waitDuration : 0.2}
          onWaitDurationChange={handleWaitDurationChange}
          selectedStrokeWait={currentStrokeWait}
          onSelectedStrokeWaitChange={handleSelectedStrokeWaitChange}
          selectionType={selectionType}
          onDeleteSelectedAction={handleDeleteSelectedAction}
        />
         {/* Close button for fullscreen popup mode */}
         {isFullscreen && isRightSidebarOpen && (
            <button 
                onClick={() => setIsRightSidebarOpen(false)}
                className="absolute top-2 left-2 p-1 bg-gray-100 rounded-full hover:bg-gray-200"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        )}
      </div>

    </div>
  );
};


export default App;
