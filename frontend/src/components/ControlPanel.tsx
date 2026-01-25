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
    onDeleteSelectedAction?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  orientation,
  onSelectOrientation,
  scale,
  onScaleChange,
  onNudge,
  onExport,
  onBackgroundImageUpload,
  onClearBackgroundImage,
  showGrid,
  onToggleGrid,
  onEnterFullscreen,
  isFullscreen,
  duration,
  onDurationChange,
  isPlaying,
  onTogglePlay,
  angle,
  onAngleChange,
  length,
  onLengthChange,
  onCurve,
  absoluteX,
  absoluteY,
  isActionSelected,
  waitDuration,
  onWaitDurationChange,
  selectedStrokeWait,
  onSelectedStrokeWaitChange,
  selectionType = 'stroke',
  onDeleteSelectedAction
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCoord = (n: number) => Math.round(n);

    return (
    <div className="w-72 bg-white flex flex-col h-full border-l border-gray-200 font-sans shadow-xl z-20 overflow-hidden">
      
      {/* Header */}
      <div className="h-12 px-4 border-b border-gray-200 bg-white flex justify-between items-center flex-shrink-0">
        <h2 className="text-xs font-bold text-gray-500 tracking-wider uppercase">プロパティ</h2>
        {!isFullscreen && (
          <button onClick={onEnterFullscreen} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="最大化">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Device Settings */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">環境設定</label>
          
          <div className="space-y-2">
             <div className="relative">
                <select 
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 appearance-none py-2 pl-3 pr-8 bg-white"
                    value={selectedModelId} 
                    onChange={e => onSelectModel(e.target.value)}
                >
                    <optgroup label="iPhone">
                    {models.filter(m => m.category === 'iPhone').map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                    </optgroup>
                    <optgroup label="iPad">
                    {models.filter(m => m.category === 'iPad').map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                    </optgroup>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                   <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
             </div>

             <div className="flex space-x-2">
                <div className="flex-1 flex bg-gray-100 rounded-md p-0.5">
                    <button 
                        className={`flex-1 text-xs py-1.5 rounded transition-all ${orientation === 'portrait' ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => onSelectOrientation('portrait')}
                    >
                        縦
                    </button>
                    <button 
                         className={`flex-1 text-xs py-1.5 rounded transition-all ${orientation === 'landscape' ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => onSelectOrientation('landscape')}
                    >
                        横
                    </button>
                </div>
                <button 
                    onClick={() => onToggleGrid(!showGrid)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${showGrid ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-600'}`}
                >
                    グリッド
                </button>
             </div>

             {/* Zoom Control */}
             <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-md border border-gray-200">
                <button 
                    onClick={() => onScaleChange(Math.max(scale - 0.1, 0.2))}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded transition-colors"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                </button>
                <div className="flex-1 flex items-center justify-center text-xs font-mono text-gray-500">
                    ズーム: {Math.round(scale * 100)}%
                </div>
                <button 
                    onClick={() => onScaleChange(Math.min(scale + 0.1, 3.0))}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded transition-colors"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
             </div>

             <div>
                  <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 rounded-md text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors group"
                  >
                      <svg className="h-4 w-4 mr-1.5 text-gray-400 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      背景画像を設定
                  </button>
                  <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={e => {
                          if (e.target.files?.[0]) {
                              onBackgroundImageUpload(e.target.files[0]);
                              e.target.value = '';
                          }
                      }}
                  />
                  <button onClick={onClearBackgroundImage} className="text-[10px] text-gray-400 hover:text-red-500 hover:underline w-full text-center mt-1">背景画像をクリア</button>
             </div>
          </div>
        </div>

        {/* Selected Item Properties (Contextual) */}
        {!selectionType || selectionType === 'stroke' ? (
             <div className={`space-y-4 pt-4 border-t border-gray-100 ${!isActionSelected ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                 <div className="flex items-center justify-between">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">アクション設定</label>
                     {isActionSelected && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                 </div>
                 
                 <div className="space-y-4">
                     {/* Position Info (Read Only) */}
                     <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                         <div>
                             <span className="text-[10px] text-gray-400 block uppercase">開始 X</span>
                             <span className="font-mono text-gray-700 text-sm">{absoluteX !== undefined ? formatCoord(absoluteX) : '--'}</span>
                         </div>
                         <div>
                             <span className="text-[10px] text-gray-400 block uppercase">開始 Y</span>
                             <span className="font-mono text-gray-700 text-sm">{absoluteY !== undefined ? formatCoord(absoluteY) : '--'}</span>
                         </div>
                     </div>

                     {/* Nudge Controls */}
                     <div className="flex flex-col items-center space-y-2">
                         <span className="text-[10px] text-gray-500">位置の微調整</span>
                         <div className="grid grid-cols-3 gap-1">
                            <div />
                            <button onClick={() => onNudge(0, -1)} className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 active:bg-gray-100"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                            <div />
                            <button onClick={() => onNudge(-1, 0)} className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 active:bg-gray-100"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                            <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-[10px] text-gray-500">1px</div>
                            <button onClick={() => onNudge(1, 0)} className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 active:bg-gray-100"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                            <div />
                            <button onClick={() => onNudge(0, 1)} className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 active:bg-gray-100"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                            <div />
                         </div>
                     </div>

                     {/* Duration */}
                     <div>
                         <div className="flex justify-between mb-1">
                             <label className="text-xs font-medium text-gray-600">所要時間</label>
                             <span className="text-xs font-mono bg-gray-100 px-1.5 rounded text-gray-600">{duration.toFixed(1)}秒</span>
                         </div>
                         <input 
                             type="range" 
                             min="0.1" 
                             max="5.0" 
                             step="0.1" 
                             value={duration} 
                             onChange={e => onDurationChange(parseFloat(e.target.value))}
                             className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                         />
                     </div>

                     {/* Angle */}
                     <div>
                        <div className="flex justify-between mb-1">
                             <label className="text-xs font-medium text-gray-600">回転</label>
                             <span className="text-xs font-mono bg-gray-100 px-1.5 rounded text-gray-600">{((angle / 1024) * 360).toFixed(0)}°</span>
                         </div>
                         <input 
                             type="range" 
                             min="0" 
                             max="1024" 
                             step="16" 
                             value={angle} 
                             onChange={e => onAngleChange(parseFloat(e.target.value))}
                             className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                         />
                     </div>

                     {/* Length (Scale) */}
                     <div>
                        <div className="flex justify-between mb-1">
                             <label className="text-xs font-medium text-gray-600">スケール / 長さ</label>
                             <span className="text-xs font-mono bg-gray-100 px-1.5 rounded text-gray-600">{Math.round(length)}px</span>
                         </div>
                         <input 
                             type="range" 
                             min="10" 
                             max="1000" 
                             step="10" 
                             value={length || 100} 
                             onChange={e => onLengthChange(parseFloat(e.target.value))}
                             className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                         />
                     </div>

                     {/* Operations */}
                     <div className="pt-2">
                        <button 
                            onClick={onCurve}
                            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                            ランダムカーブを適用
                        </button>

                        <button 
                            onClick={onDeleteSelectedAction}
                            className="w-full flex items-center justify-center px-4 py-2 mt-2 border border-red-200 shadow-sm text-xs font-medium rounded-md text-red-600 bg-white hover:bg-red-50 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            アクションを削除
                        </button>
                     </div>
                 </div>
             </div>
        ) : (
            // Wait Properties
            <div className="space-y-4 pt-4 border-t border-gray-100">
                 <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">待機設定</label>
                    <span className="text-[10px] text-white bg-blue-500 px-2 py-0.5 rounded-full font-bold">選択中</span>
                 </div>
                 <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                    <label className="block text-xs font-semibold text-blue-900 mb-2">待機時間</label>
                    <div className="flex items-center space-x-2">
                        <input 
                             type="number" 
                             min="0.1" 
                             step="0.1" 
                             value={selectedStrokeWait ?? waitDuration} 
                             onChange={e => {
                                // If override is handled by selectedStrokeWait, we use onSelectedStrokeWaitChange
                                // If no stroke selected (wait type global), we use onWaitDurationChange
                                if (selectionType === 'wait') {
                                     onSelectedStrokeWaitChange?.(parseFloat(e.target.value));
                                } else {
                                     onWaitDurationChange?.(parseFloat(e.target.value));
                                }
                             }}
                             className="w-full text-sm border-blue-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-xs text-blue-700 font-medium whitespace-nowrap">秒</span>
                    </div>
                     <div className="flex justify-end space-x-1 mt-2">
                        <button
                             onClick={() => {
                                 const val = 0.2;
                                 if (selectionType === 'wait') onSelectedStrokeWaitChange?.(val);
                                 else onWaitDurationChange?.(val);
                             }}
                            className="px-2 py-1 text-[10px] bg-white hover:bg-blue-100 rounded text-blue-600 border border-blue-200"
                        >
                            デフォルト (0.2秒)
                        </button>
                     </div>
                 </div>
            </div>
        )}

      </div>

        {/* Bottom Static Section: Playback & Export */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0 space-y-2">
            <button
                onClick={onTogglePlay}
                className={`w-full flex items-center justify-center px-3 py-2 border border-transparent rounded shadow-sm text-xs font-medium text-white transition-colors ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            >
                {isPlaying ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                        </svg>
                        再生停止
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        {isActionSelected ? 'アクション再生' : '全再生'}
                    </>
                )}
            </button>

            <button
                onClick={onExport}
                className="w-full flex items-center justify-center px-3 py-2 border border-transparent rounded shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                コマンド書き出し
            </button>
        </div>
    </div>
  );
};

export default ControlPanel;
