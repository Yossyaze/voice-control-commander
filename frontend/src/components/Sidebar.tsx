
import React from 'react';
import type { Command, Point } from '../api';

interface SidebarProps {
    commands: Command[];
    selectedCommandId: string | null;
    onSelectCommand: (id: string) => void;
    onDeleteCommand: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onFileUpload: (file: File) => void;
    onCreateNew: () => void;
    onRenameCommand: (id: string, newName: string) => void;
    onUpdateCommand: (cmd: Command) => void;
    selectedStrokeIndex: number | null;
    onSelectStroke: (index: number | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    commands,
    selectedCommandId,
    onSelectCommand,
    onDeleteCommand,
    onToggleVisibility,
    onFileUpload,
    onCreateNew,
    onRenameCommand,
    onUpdateCommand,
    selectedStrokeIndex,
    onSelectStroke
}) => {
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editingName, setEditingName] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.select();
        }
    }, [editingId]);

    const handleStartEditing = (id: string, name: string) => {
        setEditingId(id);
        setEditingName(name);
    };

    const handleFinishEditing = () => {
        if (editingId && editingName.trim()) {
            onRenameCommand(editingId, editingName.trim());
        }
        setEditingId(null);
        setEditingName('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleFinishEditing();
        else if (e.key === 'Escape') {
            setEditingId(null);
            setEditingName('');
        }
    };

    const isTap = (points: Point[]): boolean => {
        // Define heuristic for tap
        return points.length <= 1;
    };

    return (
        <div className="w-64 bg-white shadow-lg flex flex-col h-full border-r border-gray-200">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-2">
                <label className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="text-sm font-medium">Import File</span>
                    <input type="file" className="hidden" accept=".voicecontrolcommands,.plist"
                        onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                onFileUpload(e.target.files[0]);
                                e.target.value = '';
                            }
                        }} />
                </label>
                <button onClick={onCreateNew} className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm font-medium">New Command</span>
                </button>
            </div>

            {/* Command List */}
            <div className="flex-1 overflow-y-auto p-2">
                {commands.length === 0 ? (
                    <p className="text-gray-500 text-center mt-4 text-sm">No commands loaded.</p>
                ) : (
                    <ul className="space-y-3">
                        {commands.map((cmd) => {
                            const isSelected = cmd.id === selectedCommandId;

                            return (
                                <li key={cmd.id} className={`border rounded-md overflow-hidden bg-white shadow-sm transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                                    {/* Command Header */}
                                    <div
                                        className={`flex items-center justify-between p-2 cursor-pointer ${isSelected && selectedStrokeIndex === null ? 'bg-blue-100 ring-1 ring-blue-500 inset-0' : isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                        onClick={() => {
                                            onSelectCommand(cmd.id);
                                            onSelectStroke(null); // Select the whole command context
                                        }}
                                    >
                                        <div className="flex items-center flex-1 min-w-0">
                                            {/* Visibility Toggle */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onToggleVisibility(cmd.id); }}
                                                className={`mr-2 focus:outline-none ${cmd.isVisible ? 'text-blue-500' : 'text-gray-300'}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>

                                            {/* Color Indicator */}
                                            <div className="w-3 h-3 rounded-full mr-2 border border-gray-300 flex-shrink-0" style={{ backgroundColor: cmd.color }} />

                                            {/* Name */}
                                            {editingId === cmd.id ? (
                                                <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onBlur={handleFinishEditing}
                                                    onKeyDown={handleKeyDown}
                                                    className="text-sm font-medium w-full border border-blue-300 rounded px-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span
                                                    className="text-sm font-medium text-gray-700 truncate"
                                                    onDoubleClick={(e) => { e.stopPropagation(); handleStartEditing(cmd.id, cmd.name); }}
                                                >
                                                    {cmd.name}
                                                </span>
                                            )}
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteCommand(cmd.id); }}
                                            className="text-gray-400 hover:text-red-500 ml-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Ladder View (Details) - Only show if selected? Or always? Let's show when selected. */}
                                    {isSelected && (
                                        <div className="bg-gray-50 border-t border-gray-100 p-2 space-y-1">
                                            {/* Ladder Header */}
                                            <div className="text-xs text-gray-400 font-semibold mb-2 pl-2">Action Sequence</div>

                                            {cmd.strokes.map((stroke, index) => (
                                                <React.Fragment key={index}>
                                                    {/* Start Wait / Gap */}
                                                    {index > 0 && (
                                                        <div className="flex items-center justify-center py-1 group/gap">
                                                            <div 
                                                                className={`h-6 w-1 rounded transition-colors cursor-pointer relative flex items-center justify-center
                                                                    ${selectedStrokeIndex === index - 1 
                                                                        ? 'bg-blue-500 ring-2 ring-blue-300 scale-x-125' 
                                                                        : 'bg-gray-300 hover:bg-blue-400'}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onSelectStroke(index - 1);
                                                                }}
                                                                title={`Wait time after Action ${index}`}
                                                            >
                                                                {/* Helper hit area */}
                                                                <div className="absolute -inset-x-4 inset-y-0" />
                                                                
                                                                {/* Time Label (Visible on Hover or Selected) */}
                                                                <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-[10px] font-medium bg-white border rounded px-1 shadow-sm whitespace-nowrap z-10 pointer-events-none
                                                                    ${selectedStrokeIndex === index - 1 ? 'border-blue-500 text-blue-600 block' : 'border-gray-200 text-gray-600 hidden group-hover/gap:block'}`}>
                                                                    {(cmd.strokeMetadata?.[index - 1]?.waitAfter ?? cmd.waitDuration ?? 0.2)}s
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Action Item */}
                                                    <div
                                                        className={`flex items-center justify-between text-xs border rounded p-1.5 shadow-sm group cursor-pointer transition-colors ${selectedStrokeIndex === index ? 'bg-blue-100 border-blue-400 ring-1 ring-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSelectStroke(index);
                                                        }}
                                                    >
                                                        <div className="flex items-center">
                                                            <span className="bg-gray-100 text-gray-700 px-1 rounded text-[10px] font-bold mr-2">Action {index + 1}</span>
                                                            <span className="text-gray-500 text-[10px] mr-1">
                                                                {isTap(stroke) ? '(Tap)' : '(Line)'}
                                                            </span>
                                                            <span className="text-gray-600 truncate ml-auto">
                                                                Points: {stroke.length}
                                                            </span>
                                                        </div>
                                                        {/* Delete Stroke Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newStrokes = [...cmd.strokes];
                                                                newStrokes.splice(index, 1);
                                                                // If removing the last stroke, maybe keep at least one empty state? No, empty commands are allowed locally but effectively invisible.
                                                                onUpdateCommand({ ...cmd, strokes: newStrokes });
                                                                // If we deleted the selected index, reset selection?
                                                                if (selectedStrokeIndex === index) {
                                                                    onSelectStroke(null);
                                                                } else if (selectedStrokeIndex !== null && index < selectedStrokeIndex) {
                                                                    // Shift index if deleting above
                                                                    onSelectStroke(selectedStrokeIndex - 1);
                                                                }
                                                            }}
                                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </React.Fragment>
                                            ))}

                                            {/* Add Action Buttons */}
                                            <div className="flex justify-center mt-3 space-x-2 pt-2 border-t border-gray-100">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Default horizontal stroke
                                                        // 0.4s approx 24 frames/points at 60Hz.
                                                        const newStroke: Point[] = Array(24).fill(0).map((_, i) => ({ x: 100 + i * 5, y: 400 }));
                                                        onUpdateCommand({ ...cmd, strokes: [...cmd.strokes, newStroke] });
                                                    }}
                                                    className="px-2 py-1 text-[10px] border border-green-200 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors flex items-center"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                                    </svg>
                                                    + Action (Line)
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Tap point
                                                        const newTap: Point[] = [{ x: 160, y: 400 }];
                                                        onUpdateCommand({ ...cmd, strokes: [...cmd.strokes, newTap] });
                                                    }}
                                                    className="px-2 py-1 text-[10px] border border-indigo-200 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors flex items-center"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                                    </svg>
                                                    + Action (Tap)
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
