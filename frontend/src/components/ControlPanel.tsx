import React, { useRef } from 'react';

interface DeviceModel {
    id: string;
    name: string;
    width: number;
    height: number;
    category: 'iPhone' | 'iPad';
}

interface ControlPanelProps {
    onNudge: (x: number, y: number) => void;
    // offsetX/Y are unused for nudging now, but we might keep them if we want to support absolute input later?
    // For now, let's remove the broken offset usage.
    onExport: () => void;
    models: DeviceModel[];
    selectedModelId: string;
    onSelectModel: (id: string) => void;
    orientation: 'portrait' | 'landscape';
    onSelectOrientation: (orientation: 'portrait' | 'landscape') => void;
    onBackgroundImageUpload: (file: File) => void;
    onClearBackgroundImage: () => void;
    showGrid: boolean;
    onToggleGrid: (show: boolean) => void;
    onEnterFullscreen: () => void;
    isFullscreen?: boolean;
    duration: number;
    onDurationChange: (duration: number) => void;
    isPlaying: boolean;
    onTogglePlay: () => void;
    angle: number;
    onAngleChange: (angle: number) => void;
    length: number;
    onLengthChange: (length: number) => void;
    absoluteX?: number;
    absoluteY?: number;
    onCurve: () => void;
    isActionSelected?: boolean;
    waitDuration?: number;
    onWaitDurationChange?: (duration: number) => void;
    scale: number;
    onScaleChange: (scale: number) => void;
    selectedStrokeWait?: number;
    onSelectedStrokeWaitChange?: (duration: number) => void;
    selectionType?: 'stroke' | 'wait';
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    onNudge,
    onExport,
    models,
    selectedModelId,
    onSelectModel,
    orientation,
    onSelectOrientation,
    onBackgroundImageUpload,
    onClearBackgroundImage,
    showGrid,
    onToggleGrid,
    onEnterFullscreen,
    isFullscreen = false,
    duration,
    onDurationChange,
    isPlaying,
    onTogglePlay,
    angle,
    onAngleChange,
    length,
    onLengthChange,
    absoluteX,
    absoluteY,
    onCurve,
    isActionSelected = true,
    waitDuration = 0.2,
    onWaitDurationChange,
    scale = 1.0,
    onScaleChange,
    selectedStrokeWait,
    onSelectedStrokeWaitChange,
    selectionType = 'stroke'
}) => {
    // Refs for long press
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startAdjusting = (dx: number, dy: number) => {
        // Immediate update
        onNudge(dx, dy);

        // Clear any existing timers
        stopAdjusting();

        // Start delay before rapid fire
        timeoutRef.current = setTimeout(() => {
            intervalRef.current = setInterval(() => {
                onNudge(dx, dy);
            }, 50); // 50ms interval
        }, 500); // 500ms delay
    };

    const stopAdjusting = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        timeoutRef.current = null;
        intervalRef.current = null;
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onBackgroundImageUpload(e.target.files[0]);
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="w-72 flex-shrink-0 bg-white rounded-lg shadow-md h-full flex flex-col overflow-hidden border-l border-gray-200">
            {/* Top Static Section: Device, BG, View Options - Compacted */}
            <div className="flex-none p-3 border-b border-gray-100 bg-gray-50 space-y-3">

                {/* Device & Grid Row */}
                <div className="flex items-center space-x-2">
                    <div className="flex-1 flex space-x-2">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">モデル</label>
                            <select
                                value={selectedModelId}
                                onChange={(e) => onSelectModel(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <optgroup label="iPhone">
                                    {models.filter(m => m.category === 'iPhone').map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="iPad">
                                    {models.filter(m => m.category === 'iPad').map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-medium text-gray-500 mb-1">向き</label>
                            <select
                                value={orientation}
                                onChange={(e) => onSelectOrientation(e.target.value as 'portrait' | 'landscape')}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="portrait">縦 (Portrait)</option>
                                <option value="landscape">横 (Landscape)</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-end pb-1">
                        <div className="flex items-center h-full">
                            <input
                                type="checkbox"
                                id="showGrid"
                                checked={showGrid}
                                onChange={(e) => onToggleGrid(e.target.checked)}
                                className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="showGrid" className="ml-1 text-xs text-gray-600 cursor-pointer">
                                グリッド
                            </label>
                        </div>
                    </div>
                </div>

                {/* Background Image Row */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">背景画像</label>
                    <div className="flex space-x-2">
                        <label className="flex-1 flex items-center justify-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            読み込む
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                        <button
                            onClick={onClearBackgroundImage}
                            className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-red-600 bg-white hover:bg-red-50 flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                        <button
                            onClick={onEnterFullscreen}
                            className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 underline ml-auto flex items-center"
                        >
                            {isFullscreen ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    解除
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                    全画面
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Zoom Controls (Sticky to bottom of top section) */}
            <div className="flex-none px-3 pb-2 border-b border-gray-100 bg-gray-50 flex items-center space-x-2">
                 <span className="text-xs font-medium text-gray-500 w-8">Zoom</span>
                 
                 <button 
                    onClick={() => onScaleChange(Math.max(scale - 0.1, 0.2))}
                    className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                    title="Zoom Out"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                 </button>

                 <input
                     type="range"
                     min="0.2"
                     max="3.0"
                     step="0.1"
                     value={scale}
                     onChange={(e) => onScaleChange(Number(e.target.value))}
                     className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                 />

                 <button 
                    onClick={() => onScaleChange(Math.min(scale + 0.1, 3.0))}
                    className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                    title="Zoom In"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                 </button>

                 <button 
                    onClick={() => onScaleChange(1.0)}
                    className="text-xs px-1 py-0.5 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 min-w-[3.5em]"
                 >
                    {Math.round(scale * 100)}%
                 </button>
            </div>

            {/* Scrollable Middle Section: Properties (Conditional) */}
            <div className="flex-1 overflow-y-auto p-4">
                
                {/* Action Properties - Hide if selectionType is 'wait' */}
                {selectionType === 'stroke' && (
                <div className="space-y-4 border-b border-gray-200 pb-4">
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action Properties</span>
                    </div>

                    {isActionSelected ? (
                        <>
                            {/* Duration / Time */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-medium text-gray-600">時間 (s)</label>
                                    <input
                                        type="number"
                                        min="0.1"
                                        max="10"
                                        step="0.1"
                                        value={duration}
                                        onChange={(e) => onDurationChange(Number(e.target.value))}
                                        className="w-16 px-1 py-0.5 text-right border border-gray-300 rounded text-xs"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="5.0"
                                    step="0.1"
                                    value={duration}
                                    onChange={(e) => onDurationChange(Number(e.target.value))}
                                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-end space-x-1 mt-1">
                                    <button
                                        onClick={() => onDurationChange(0.4)}
                                        className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 rounded text-gray-600 border border-gray-200"
                                    >
                                        ゲージあり (0.4s)
                                    </button>
                                    <button
                                        onClick={() => onDurationChange(0.2)}
                                        className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 rounded text-gray-600 border border-gray-200"
                                    >
                                        ゲージなし (0.2s)
                                    </button>
                                </div>
                            </div>

                            {/* Angle */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Angle</span>
                                    <span>{Math.round(angle / 1024 * 360)}°</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1024"
                                    value={angle}
                                    onChange={(e) => onAngleChange(Number(e.target.value))}
                                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>

                             {/* Cardinal Direction Buttons (Added back) */}
                            <div className="flex justify-center space-x-2 mt-2">
                                <button
                                    onClick={() => onAngleChange(256)}
                                    className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 shadow-sm text-gray-600"
                                    title="Up (sets Down 90°)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => onAngleChange(768)}
                                    className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 shadow-sm text-gray-600"
                                    title="Down (sets Up 270°)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => onAngleChange(0)}
                                    className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 shadow-sm text-gray-600"
                                    title="Left (sets Right 0°)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => onAngleChange(512)}
                                    className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 shadow-sm text-gray-600"
                                    title="Right (sets Left 180°)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>

                            {/* Length */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Length</span>
                                    <span>{Math.round(length)}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="800"
                                    value={length}
                                    onChange={(e) => onLengthChange(Number(e.target.value))}
                                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>

                            {/* Curve */}
                            <div className="pt-2">
                                <button
                                    onClick={onCurve}
                                    className="w-full py-1.5 px-3 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                    </svg>
                                    Add Curve / Randomize
                                </button>
                            </div>

                            {/* Nudge Controls */}
                            <div className="pt-2 space-y-2">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-xs font-medium text-gray-500">
                                        {isActionSelected ? '座標調整' : '一括座標調整'}
                                    </h3>
                                    <div className="text-[10px] font-mono text-gray-400">
                                        {absoluteX !== undefined ? Math.round(absoluteX) : '--'}, {absoluteY !== undefined ? Math.round(absoluteY) : '--'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {/* X Axis */}
                                    <div className="flex items-center space-x-1">
                                        <span className="text-[10px] text-gray-400 font-mono">X</span>
                                        <button
                                            onMouseDown={() => startAdjusting(-1, 0)}
                                            onMouseUp={stopAdjusting}
                                            onMouseLeave={stopAdjusting}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 text-xs text-gray-600 font-mono active:bg-gray-300"
                                        >-</button>
                                        <button
                                            onMouseDown={() => startAdjusting(1, 0)}
                                            onMouseUp={stopAdjusting}
                                            onMouseLeave={stopAdjusting}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 text-xs text-gray-600 font-mono active:bg-gray-300"
                                        >+</button>
                                    </div>
                                    {/* Y Axis */}
                                    <div className="flex items-center space-x-1">
                                        <span className="text-[10px] text-gray-400 font-mono">Y</span>
                                        <button
                                            onMouseDown={() => startAdjusting(0, -1)}
                                            onMouseUp={stopAdjusting}
                                            onMouseLeave={stopAdjusting}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 text-xs text-gray-600 font-mono active:bg-gray-300"
                                        >-</button>
                                        <button
                                            onMouseDown={() => startAdjusting(0, 1)}
                                            onMouseUp={stopAdjusting}
                                            onMouseLeave={stopAdjusting}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 text-xs text-gray-600 font-mono active:bg-gray-300"
                                        >+</button>
                                    </div>
                                </div>
                                <div className="text-[10px] text-gray-400 text-center pt-1">
                                    Long press to repeat
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-xs text-gray-400 italic text-center py-4">
                            Select an action on canvas or sidebar to edit properties
                        </div>
                    )}
                </div>
                )}

                {/* Wait Duration Information */}
                {(selectionType === 'wait' || (selectionType === 'stroke' && !isActionSelected)) && (
                <div className="space-y-4 border-b border-gray-200 pb-4">
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Wait Duration</span>
                    </div>

                    <div className="space-y-1">
                         {/* Global/Default */}
                        {selectionType === 'stroke' && !isActionSelected && (
                        <>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-medium text-gray-600">一括待機時間 (s)</label>
                                <input
                                    type="number"
                                    min="0.1"
                                    max="5.0"
                                    step="0.1"
                                    value={waitDuration}
                                    onChange={(e) => onWaitDurationChange && onWaitDurationChange(Number(e.target.value))}
                                    className="w-16 px-1 py-0.5 text-right border border-gray-300 rounded text-xs"
                                />
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="2.0"
                                step="0.1"
                                value={waitDuration}
                                onChange={(e) => onWaitDurationChange && onWaitDurationChange(Number(e.target.value))}
                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                             <div className="flex justify-end space-x-1 mt-1">
                                <button
                                    onClick={() => onWaitDurationChange && onWaitDurationChange(0.2)}
                                    className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 rounded text-gray-600 border border-gray-200"
                                >
                                    標準 (0.2s)
                                </button>
                                <button
                                    onClick={() => onWaitDurationChange && onWaitDurationChange(0.5)}
                                    className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 rounded text-gray-600 border border-gray-200"
                                >
                                    長め (0.5s)
                                </button>
                            </div>
                        </>
                        )}
                        
                         {/* Individual Override (Only when 'wait' selected) */}
                        {selectionType === 'wait' && (
                             <div className="p-2 bg-blue-50 rounded border border-blue-100 mt-2">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span className={selectedStrokeWait !== undefined ? "text-blue-700 font-medium" : "text-gray-500"}>
                                        {selectedStrokeWait !== undefined ? "個別設定 (Override)" : "全体設定を使用"}
                                    </span>
                                    <span className="text-blue-700 font-medium">
                                        {selectedStrokeWait !== undefined ? selectedStrokeWait : (waitDuration || 0.2)}s
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0.0"
                                    max="5.0"
                                    step="0.05"
                                    value={selectedStrokeWait !== undefined ? selectedStrokeWait : (waitDuration || 0.2)}
                                    onChange={(e) => onSelectedStrokeWaitChange?.(Number(e.target.value))}
                                    className="w-full h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <p className="text-[10px] text-blue-400 mt-1">このアクション直後の待機時間</p>
                            </div>
                        )}
                    </div>
                </div>
                )}
            </div>

            {/* Bottom Static Section: Playback & Export - Compacted */}
            <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0 space-y-2">
                <button
                    onClick={onTogglePlay}
                    className={`w-full flex items-center justify-center px-3 py-1.5 border border-transparent rounded shadow-sm text-xs font-medium text-white ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                >
                    {isPlaying ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                            </svg>
                            停止
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            {isActionSelected ? '再生' : '再生 (Action順)'}
                        </>
                    )}
                </button>

                <button
                    onClick={onExport}
                    className="w-full flex items-center justify-center px-3 py-1.5 border border-transparent rounded shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    エクスポート
                </button>
            </div>
        </div>
    );
};

export default ControlPanel;
