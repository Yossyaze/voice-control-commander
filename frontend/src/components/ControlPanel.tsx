import React from 'react';

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
}) => {
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onBackgroundImageUpload(e.target.files[0]);
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <div className="mb-4 p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                        <span>始点 (Start)</span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span>
                        <span>終点 (End)</span>
                    </div>
                </div>
            </div>
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

            {/* Adjust Coordinates Section */}
            <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">座標調整</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Xオフセット</label>
                        <input
                            type="number"
                            value={offsetX}
                            onChange={(e) => onOffsetXChange(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Yオフセット</label>
                        <input
                            type="number"
                            value={offsetY}
                            onChange={(e) => onOffsetYChange(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
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

            <div className="mb-6">
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
    );
};

export default ControlPanel;
