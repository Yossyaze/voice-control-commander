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
    selectionType?: 'stroke' | 'wait';
    onSelectType?: (type: 'stroke' | 'wait') => void;
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
    onSelectStroke,
    selectionType = 'stroke',
    onSelectType
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
        <div className="w-64 bg-white flex flex-col h-full border-r border-gray-200 font-sans">
            {/* Header / Toolbar */}
            <div className="h-12 px-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
                 <h2 className="text-xs font-bold text-gray-500 tracking-wider uppercase">Commands</h2>
                 <div className="flex items-center space-x-1">
                    <label className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition-colors" title="Import">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <input type="file" className="hidden" accept=".voicecontrolcommands,.plist"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    onFileUpload(e.target.files[0]);
                                    e.target.value = '';
                                }
                            }} />
                    </label>
                    <button onClick={onCreateNew} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="New Command">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                 </div>
            </div>

            {/* Command List */}
            <div className="flex-1 overflow-y-auto">
                {commands.length === 0 ? (
                    <p className="text-gray-400 text-center mt-8 text-xs">No commands yet.</p>
                ) : (
                    <ul>
                        {commands.map((cmd) => {
                            const isSelected = cmd.id === selectedCommandId;

                            return (
                                <li key={cmd.id} className="border-b border-gray-100 last:border-0">
                                    {/* Command Header */}
                                    <div
                                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group/item ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                                        onClick={() => {
                                            onSelectCommand(cmd.id);
                                            onSelectStroke(null); // Select the whole command context
                                            onSelectType?.('stroke');
                                        }}
                                    >
                                        <div className="flex items-center flex-1 min-w-0 mr-3">
                                            {/* Visibility Toggle (Hover only unless hidden) */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onToggleVisibility(cmd.id); }}
                                                className={`mr-3 focus:outline-none transition-colors ${cmd.isVisible ? 'text-gray-300 group-hover/item:text-blue-500' : 'text-gray-400'}`}
                                                title={cmd.isVisible ? "Hide" : "Show"}
                                            >
                                                {cmd.isVisible ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
                                                )}
                                            </button>

                                            {/* Color Indicator */}
                                            <div className="w-2.5 h-2.5 rounded-full mr-3 ring-1 ring-gray-200 flex-shrink-0" style={{ backgroundColor: cmd.color }} />

                                            {/* Name */}
                                            {editingId === cmd.id ? (
                                                <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onBlur={handleFinishEditing}
                                                    onKeyDown={handleKeyDown}
                                                    className="text-sm font-medium w-full border border-blue-300 rounded px-1.5 py-0.5 -ml-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span
                                                    className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}
                                                    onDoubleClick={(e) => { e.stopPropagation(); handleStartEditing(cmd.id, cmd.name); }}
                                                >
                                                    {cmd.name}
                                                </span>
                                            )}
                                        </div>

                                        {/* Action info / Delete */}
                                        <div className="flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <span className="text-[10px] text-gray-400 mr-2">{cmd.strokes.length} actions</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteCommand(cmd.id); }}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                title="Delete"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Detailed Stroke List (Only if selected) */}
                                    {isSelected && (
                                        <div className="bg-gray-50/50 border-t border-gray-100 pl-10 pr-4 py-2 space-y-1">
                                            {cmd.strokes.map((stroke, index) => (
                                                <React.Fragment key={index}>
                                                    {/* Gap / Wait */}
                                                    {index > 0 && (
                                                        <div 
                                                            className={`flex items-center justify-center py-0.5 cursor-pointer group/wait relative
                                                                ${selectedStrokeIndex === index - 1 && selectionType === 'wait' ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                                                            onClick={(e) => { e.stopPropagation(); onSelectStroke(index - 1); onSelectType?.('wait'); }}
                                                        >
                                                            <div className={`h-4 w-[1px] ${selectedStrokeIndex === index - 1 && selectionType === 'wait' ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
                                                            <span className={`text-[9px] ml-2 ${selectedStrokeIndex === index - 1 && selectionType === 'wait' ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                                                                {(cmd.strokeMetadata?.[index - 1]?.waitAfter ?? cmd.waitDuration ?? 0.2)}s wait
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Stroke Item */}
                                                    <div
                                                        className={`flex items-center justify-between text-xs px-2 py-1.5 rounded cursor-pointer transition-colors border
                                                            ${selectedStrokeIndex === index && selectionType === 'stroke' 
                                                                ? 'bg-white border-blue-300 shadow-sm text-blue-900' 
                                                                : 'border-transparent text-gray-600 hover:bg-gray-100'}`}
                                                        onClick={(e) => { e.stopPropagation(); onSelectStroke(index); onSelectType?.('stroke'); }}
                                                    >
                                                        <div className="flex items-center">
                                                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${selectedStrokeIndex === index && selectionType === 'stroke' ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                                                            <span className="font-medium">Action {index + 1}</span>
                                                            <span className="ml-2 text-[10px] opacity-60">({isTap(stroke) ? 'Tap' : 'Path'})</span>
                                                        </div>
                                                        {/* Delete Stroke Button */}
                                                        {cmd.strokes.length > 1 && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const newStrokes = [...cmd.strokes];
                                                                    newStrokes.splice(index, 1);
                                                                    onUpdateCommand({ ...cmd, strokes: newStrokes });
                                                                    if (selectedStrokeIndex === index) onSelectStroke(null);
                                                                    else if (selectedStrokeIndex !== null && index < selectedStrokeIndex) onSelectStroke(selectedStrokeIndex - 1);
                                                                }}
                                                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 px-1"
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                </React.Fragment>
                                            ))}
                                            
                                            {/* Add Action Buttons */}
                                            <div className="pt-2 flex justify-start space-x-2">
                                                 <button
                                                     onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Default horizontal stroke
                                                        const newStroke: Point[] = Array(24).fill(0).map((_, i) => ({ x: 100 + i * 5, y: 400 }));
                                                        onUpdateCommand({ ...cmd, strokes: [...cmd.strokes, newStroke] });
                                                    }}
                                                    className="px-2 py-1 text-[10px] text-blue-600 hover:text-blue-800 flex items-center px-1 py-0.5 rounded hover:bg-blue-50 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                                    </svg>
                                                    Action (Line)
                                                </button>
                                                <button
                                                     onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Tap point
                                                        const newTap: Point[] = [{ x: 160, y: 400 }];
                                                        onUpdateCommand({ ...cmd, strokes: [...cmd.strokes, newTap] });
                                                    }}
                                                    className="px-2 py-1 text-[10px] text-blue-600 hover:text-blue-800 flex items-center px-1 py-0.5 rounded hover:bg-blue-50 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                                    </svg>
                                                    Action (Tap)
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
