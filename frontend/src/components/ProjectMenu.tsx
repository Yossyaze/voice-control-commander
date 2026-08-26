import React, { useState, useRef, useEffect } from "react";
import {
  Folder,
  Save,
  FilePen,
  Plus,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  X,
  FileText,
} from "lucide-react";
import type { ProjectSummary } from "../api";

interface ProjectMenuProps {
  currentProjectId: string | null;
  currentProjectName: string;
  projectsList: ProjectSummary[];
  hasUnsavedChanges: boolean;
  onSaveProject: () => void;
  onSaveAsProject: () => void;
  onNewProject: () => void;
  onLoadProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string) => void;
  onRenameCurrentProject?: () => void;
}

export const ProjectMenu: React.FC<ProjectMenuProps> = ({
  currentProjectId,
  currentProjectName,
  projectsList,
  hasUnsavedChanges,
  onSaveProject,
  onSaveAsProject,
  onNewProject,
  onLoadProject,
  onDeleteProject,
  onRenameProject,
  onRenameCurrentProject,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 外側クリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const displayName = currentProjectId
    ? projectsList.find((p) => p.id === currentProjectId)?.name || currentProjectName || "プロジェクト"
    : currentProjectName || "名称未設定";

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* トリガーボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm border ${
          isOpen
            ? "bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-100"
            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
        }`}
        title="プロジェクトの保存・一覧（ファイルメニュー）"
      >
        <Folder className="w-4 h-4 text-blue-600" />
        <span className="max-w-[130px] sm:max-w-[180px] truncate font-semibold">
          {displayName}
        </span>
        {hasUnsavedChanges && (
          <span
            className="w-2 h-2 rounded-full bg-amber-500 shrink-0 ring-2 ring-amber-200"
            title="未保存の変更があります"
          />
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {/* ドロップダウンパネル */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-lg bg-white shadow-2xl ring-1 ring-black/10 border border-gray-200 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 font-sans text-gray-800">
          {/* ヘッダーエリア */}
          <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <Folder className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  プロジェクト管理
                </div>
                <div
                  className="text-sm font-bold text-gray-900 truncate flex items-center gap-1.5 cursor-pointer hover:text-blue-600 group"
                  onClick={() => {
                    if (currentProjectId) {
                      onRenameProject(currentProjectId);
                    } else if (onRenameCurrentProject) {
                      onRenameCurrentProject();
                    }
                  }}
                  title="クリックして名前を変更"
                >
                  <span className="truncate">{displayName}</span>
                  <Edit2 className="w-3 h-3 text-gray-400 group-hover:text-blue-600 opacity-60 group-hover:opacity-100 shrink-0" />
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors"
              title="閉じる"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* クイックアクションエリア */}
          <div className="p-3 bg-white border-b border-gray-100 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {/* 上書き保存 */}
              <button
                type="button"
                onClick={() => {
                  onSaveProject();
                  // 保存処理後にメニューを閉じない（状態がわかりやすいため）
                }}
                className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all shadow-sm ${
                  hasUnsavedChanges || !currentProjectId
                    ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
                title={
                  hasUnsavedChanges || !currentProjectId
                    ? "現在の編集内容を保存"
                    : "すでに最新の状態です"
                }
              >
                {hasUnsavedChanges || !currentProjectId ? (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>上書き保存</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">保存済み</span>
                  </>
                )}
              </button>

              {/* 別名で保存 */}
              <button
                type="button"
                onClick={() => {
                  onSaveAsProject();
                }}
                className="px-3 py-2 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors shadow-sm"
                title="新しい名前を付けて別プロジェクトとして保存"
              >
                <FilePen className="w-3.5 h-3.5 text-emerald-600" />
                <span>別名で保存</span>
              </button>
            </div>

            {/* 新規プロジェクト */}
            <button
              type="button"
              onClick={() => {
                onNewProject();
                setIsOpen(false);
              }}
              className="w-full px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-center space-x-1.5 bg-gray-50 border border-dashed border-gray-300 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
              title="新規の空プロジェクトを作成"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新規プロジェクトを作成</span>
            </button>
          </div>

          {/* 保存済みプロジェクト一覧 */}
          <div className="p-3 bg-gray-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3" />
                保存済みプロジェクト ({projectsList.length})
              </span>
            </div>

            {projectsList.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 bg-white rounded-md border border-dashed border-gray-200">
                保存されたプロジェクトはありません
              </div>
            ) : (
              <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                {projectsList.map((p) => {
                  const isCurrent = p.id === currentProjectId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (!isCurrent) {
                          onLoadProject(p.id);
                          setIsOpen(false);
                        }
                      }}
                      className={`flex items-center justify-between rounded-md px-2.5 py-2 transition-all cursor-pointer border ${
                        isCurrent
                          ? "bg-blue-50/80 border-blue-300 text-blue-900 shadow-sm font-semibold"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        {isCurrent ? (
                          <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                        )}
                        <span className="text-xs truncate">{p.name}</span>
                      </div>

                      {/* プロジェクト操作ボタン */}
                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRenameProject(p.id);
                          }}
                          className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          title="名前を変更"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(p.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMenu;
