import React, { useRef, useEffect } from 'react';

interface Device {
    id: string;
    name: string;
    width: number;
    height: number;
}

interface ControlPanelProps {
    offsetX: number;
    offsetY: number;
    onOffsetXChange: (value: number) => void;
    onOffsetYChange: (value: number) => void;
    onExport: () => void;
    devices: Device[];
    selectedDeviceId: string;
    onSelectDevice: (id: string) => void;
    onBackgroundImageUpload: (file: File) => void;
    onClearBackgroundImage: () => void;
    showGrid: boolean;
    onToggleGrid: (show: boolean) => void;
    onEnterFullscreen: () => void;
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
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    offsetX,
    offsetY,
    onOffsetXChange,
    onOffsetYChange,
    onExport,
    devices,
    selectedDeviceId,
    onSelectDevice,
    onBackgroundImageUpload,
    onClearBackgroundImage,
    showGrid,
    onToggleGrid,
    onEnterFullscreen,
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
}) => {
    // Refs for long press
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestOffsets = useRef({ x: offsetX, y: offsetY });

    useEffect(() => {
        latestOffsets.current = { x: offsetX, y: offsetY };
    }, [offsetX, offsetY]);

    const startAdjusting = (type: 'x' | 'y', delta: number) => {
        // Immediate update
        if (type === 'x') onOffsetXChange(latestOffsets.current.x + delta);
        else onOffsetYChange(latestOffsets.current.y + delta);

        // Clear any existing timers
        stopAdjusting();

        // Start delay before rapid fire
        timeoutRef.current = setTimeout(() => {
            intervalRef.current = setInterval(() => {
                if (type === 'x') onOffsetXChange(latestOffsets.current.x + delta);
                else onOffsetYChange(latestOffsets.current.y + delta);
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
        <div className="bg-white rounded-lg shadow-md h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">デバイス</label>
                    <select
                        value={selectedDeviceId}
                        onChange={(e) => onSelectDevice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {devices.map(device => (
                            <option key={device.id} value={device.id}>
                                {device.name} ({device.width}x{device.height})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">背景画像</label>
                    <div className="flex space-x-2">
                        <label className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                            読み込む
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                        <button
                            onClick={onClearBackgroundImage}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50"
                        >
                            クリア
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">表示設定</label>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="showGrid"
                                checked={showGrid}
                                onChange={(e) => onToggleGrid(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="showGrid" className="ml-2 block text-sm text-gray-900">
                                グリッド
                            </label>
                        </div>
                        <button
                            onClick={onEnterFullscreen}
                            className="text-sm text-gray-600 hover:text-gray-900 underline"
                        >
                            全画面表示
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">時間 (s)</label>
                        <input
                            type="number"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={duration}
                            onChange={(e) => onDurationChange(Number(e.target.value))}
                            className="w-20 px-2 py-1 text-right border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="5.0"
                        step="0.1"
                        value={duration}
                        onChange={(e) => onDurationChange(Number(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                        <button
                            onClick={() => onDurationChange(0.4)}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                        >
                            ゲージを決める (0.4s)
                        </button>
                        <button
                            onClick={() => onDurationChange(0.2)}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                        >
                            ゲージ無し (0.2s)
                        </button>
                        <button
                            onClick={onCurve}
                            className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 rounded text-purple-700 border border-purple-200"
                        >
                            曲げる
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">角度 (0-1023)</label>
                        <input
                            type="number"
                            min="0"
                            max="1023"
                            step="1"
                            value={Math.round(angle)}
                            onChange={(e) => onAngleChange(Number(e.target.value))}
                            className="w-20 px-2 py-1 text-right border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1023"
                        step="1"
                        value={angle}
                        onChange={(e) => onAngleChange(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="grid grid-cols-4 gap-2 mt-2">
                        <button
                            onClick={() => onAngleChange(256)}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                        >
                            上 (256)
                        </button>
                        <button
                            onClick={() => onAngleChange(768)}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                        >
                            下 (768)
                        </button>
                        <button
                            onClick={() => onAngleChange(0)}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                        >
                            左 (0)
                        </button>
                        <button
                            onClick={() => onAngleChange(512)}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                        >
                            右 (512)
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">長さ (px)</label>
                        <input
                            type="number"
                            min="1"
                            max="1000"
                            step="1"
                            value={Math.round(length)}
                            onChange={(e) => onLengthChange(Number(e.target.value))}
                            className="w-20 px-2 py-1 text-right border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="1000"
                        step="10"
                        value={length}
                        onChange={(e) => onLengthChange(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Adjust Coordinates Section */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">座標調整 (1px単位)</h3>
                    <div className="flex flex-col items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="mb-3 text-sm font-mono text-gray-600">
                            X: {absoluteX !== undefined ? Math.round(absoluteX) : offsetX} / Y: {absoluteY !== undefined ? Math.round(absoluteY) : offsetY}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div></div>
                            <button
                                onMouseDown={() => startAdjusting('y', -1)}
                                onMouseUp={stopAdjusting}
                                onMouseLeave={stopAdjusting}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100 active:bg-gray-200 shadow-sm select-none"
                                title="上へ (Y-1)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            <div></div>

                            <button
                                onMouseDown={() => startAdjusting('x', -1)}
                                onMouseUp={stopAdjusting}
                                onMouseLeave={stopAdjusting}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100 active:bg-gray-200 shadow-sm select-none"
                                title="左へ (X-1)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="w-10 h-10 flex items-center justify-center">
                                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            </div>
                            <button
                                onMouseDown={() => startAdjusting('x', 1)}
                                onMouseUp={stopAdjusting}
                                onMouseLeave={stopAdjusting}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100 active:bg-gray-200 shadow-sm select-none"
                                title="右へ (X+1)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <div></div>
                            <button
                                onMouseDown={() => startAdjusting('y', 1)}
                                onMouseUp={stopAdjusting}
                                onMouseLeave={stopAdjusting}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100 active:bg-gray-200 shadow-sm select-none"
                                title="下へ (Y+1)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="mb-4">
                    <button
                        onClick={onTogglePlay}
                        className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                    >
                        {isPlaying ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                </svg>
                                停止
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                再生
                            </>
                        )}
                    </button>
                </div>

                <button
                    onClick={onExport}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    エクスポート
                </button>
            </div>
        </div>
    );
};

export default ControlPanel;
