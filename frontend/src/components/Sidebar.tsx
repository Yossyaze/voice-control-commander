import React from 'react';
import type { VoiceControlFile } from '../api';

interface SidebarProps {
    files: VoiceControlFile[];
    selectedFileId: string | null;
    onSelectFile: (id: string) => void;
    onSelectCommand: (fileId: string, commandId: string) => void;
    onDeleteFile: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onFileUpload: (file: File) => void;
    onCreateNew: () => void;
    onExportVisible: () => void;
    onToggleCommandVisibility: (fileId: string, commandId: string) => void;
    onToggleAllVisibility: () => void;
    onRenameFile: (id: string, newName: string) => void;
    onRenameCommand: (fileId: string, commandId: string, newName: string) => void;
    onDeleteCommand: (fileId: string, commandId: string) => void;
    onAddCommandToFile: (fileId: string) => void;
    onAddTapCommand: (fileId: string) => void;
    onExportFile: (fileId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    files,
    selectedFileId,
    onSelectFile,
    onSelectCommand,
    onDeleteFile,
    onToggleVisibility,
    onFileUpload,
    onCreateNew,
    onExportVisible,
    onToggleCommandVisibility,
    onToggleAllVisibility,
    onRenameFile,
    onRenameCommand,
    onDeleteCommand,
    onAddCommandToFile,
    onAddTapCommand,
    onExportFile,
}) => {
    const [editingTarget, setEditingTarget] = React.useState<{ type: 'file' | 'command', id: string, parentId?: string } | null>(null);
    const [editingName, setEditingName] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (editingTarget && inputRef.current) {
            inputRef.current.select();
        }
    }, [editingTarget]);

    const handleStartEditing = (type: 'file' | 'command', id: string, name: string, parentId?: string) => {
        setEditingTarget({ type, id, parentId });
        setEditingName(name);
    };

    const handleFinishEditing = () => {
        if (editingTarget && editingName.trim()) {
            if (editingTarget.type === 'file') {
                onRenameFile(editingTarget.id, editingName.trim());
            } else if (editingTarget.type === 'command' && editingTarget.parentId) {
                onRenameCommand(editingTarget.parentId, editingTarget.id, editingName.trim());
            }
        }
        setEditingTarget(null);
        setEditingName('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleFinishEditing();
        } else if (e.key === 'Escape') {
            setEditingTarget(null);
            setEditingName('');
        }
    };
    return (
        <div className="w-64 bg-white shadow-lg flex flex-col h-full border-r border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Files</h2>
                <div className="space-y-2">
                    <label className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition duration-200 shadow-sm">
                        <span className="text-sm font-medium">ファイルを読み込む</span>
                        <input type="file" className="hidden" accept=".voicecontrolcommands,.plist" onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                onFileUpload(e.target.files[0]);
                                e.target.value = '';
                            }
                        }} />
                    </label>
                </div>
                <button
                    onClick={onCreateNew}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 mb-4 mt-4"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    新規ファイル
                </button>
                <div className="space-y-2">
                    <button
                        onClick={onExportVisible}
                        className="flex items-center justify-center w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-200 shadow-sm"
                    >
                        <span className="text-sm font-medium">表示中をエクスポート</span>
                    </button>
                    <button
                        onClick={onToggleAllVisibility}
                        className="flex items-center justify-center w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200 shadow-sm"
                    >
                        <span className="text-sm font-medium">全て表示/非表示</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {files.length === 0 ? (
                    <p className="text-gray-500 text-center mt-4 text-sm">ファイルが読み込まれていません。</p>
                ) : (
                    <ul className="space-y-2">
                        {files.map((file) => (
                            <li key={file.id} className="border rounded-md overflow-hidden bg-white shadow-sm">
                                <div className={`flex items-center justify-between p-2 ${file.id === selectedFileId ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                                    <div
                                        className="flex items-center flex-1 cursor-pointer min-w-0"
                                        onClick={() => onSelectFile(file.id)}
                                    >
                                        <div className="flex items-center mr-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleVisibility(file.id);
                                                }}
                                                className={`focus:outline-none ${file.isVisible ? 'text-blue-500' : 'text-gray-300'}`}
                                                title={file.isVisible ? "Hide" : "Show"}
                                            >
                                                {file.isVisible ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        <div
                                            className="w-3 h-3 rounded-full mr-2 flex-shrink-0 border border-gray-300"
                                            style={{ backgroundColor: file.color }}
                                        />
                                        {editingTarget?.type === 'file' && editingTarget.id === file.id ? (
                                            <div className="relative w-full">
                                                <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onBlur={handleFinishEditing}
                                                    onKeyDown={handleKeyDown}
                                                    autoFocus
                                                    className="text-sm font-medium text-gray-700 truncate w-full border border-blue-300 rounded px-1 pr-6"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <button
                                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingName('');
                                                        inputRef.current?.focus();
                                                    }}
                                                    onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <span
                                                className="text-sm font-medium text-gray-700 truncate w-full"
                                                title={file.name}
                                                onDoubleClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStartEditing('file', file.id, file.name);
                                                }}
                                            >
                                                {file.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddTapCommand(file.id);
                                            }}
                                            className="mr-1 text-gray-400 hover:text-green-600 focus:outline-none"
                                            title="Add Tap Command"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddCommandToFile(file.id);
                                            }}
                                            className="mr-1 text-gray-400 hover:text-green-600 focus:outline-none"
                                            title="Add Path Command"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onExportFile(file.id);
                                            }}
                                            className="mr-1 text-gray-400 hover:text-purple-600 focus:outline-none"
                                            title="Export File"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Are you sure you want to delete this file?')) {
                                                    onDeleteFile(file.id);
                                                }
                                            }}
                                            className="ml-1 text-gray-400 hover:text-red-500 focus:outline-none"
                                            title="Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Command List */}
                                {file.commands.length > 0 && (
                                    <ul className="bg-gray-50 border-t border-gray-100">
                                        {file.commands.map((cmd, index) => {
                                            const isSelected = file.id === selectedFileId && cmd.id === file.selectedCommandId;
                                            return (
                                                <li
                                                    key={cmd.id}
                                                    className={`
                                                px-4 py-2 text-xs flex items-center transition-colors duration-150
                                                ${isSelected
                                                            ? 'bg-blue-600 text-white'
                                                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                                                        }
                                            `}
                                                >
                                                    <div className="flex items-center flex-1 min-w-0">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onToggleCommandVisibility(file.id, cmd.id);
                                                            }}
                                                            className={`mr-2 focus:outline-none ${cmd.isVisible !== false ? (isSelected ? 'text-blue-200' : 'text-blue-500') : 'text-gray-400'}`}
                                                            title={cmd.isVisible !== false ? "Hide" : "Show"}
                                                        >
                                                            {cmd.isVisible !== false ? (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                                </svg>
                                                            ) : (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                                                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                                                </svg>
                                                            )}
                                                        </button>

                                                        <span className={`mr-2 font-mono ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                                                            {index + 1}
                                                        </span>
                                                        {editingTarget?.type === 'command' && editingTarget.id === cmd.id ? (
                                                            <div className="relative w-full">
                                                                <input
                                                                    ref={inputRef}
                                                                    type="text"
                                                                    value={editingName}
                                                                    onChange={(e) => setEditingName(e.target.value)}
                                                                    onBlur={handleFinishEditing}
                                                                    onKeyDown={handleKeyDown}
                                                                    autoFocus
                                                                    className="text-sm font-medium text-gray-700 truncate w-full border border-blue-300 rounded px-1 pr-6"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                                <button
                                                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingName('');
                                                                        inputRef.current?.focus();
                                                                    }}
                                                                    onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span
                                                                className="truncate w-full cursor-pointer"
                                                                onClick={() => onSelectCommand(file.id, cmd.id)}
                                                                title={cmd.name}
                                                                onDoubleClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleStartEditing('command', cmd.id, cmd.name, file.id);
                                                                }}
                                                            >
                                                                {cmd.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Are you sure you want to delete this command?')) {
                                                                onDeleteCommand(file.id, cmd.id);
                                                            }
                                                        }}
                                                        className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
                                                        title="Delete Command"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
