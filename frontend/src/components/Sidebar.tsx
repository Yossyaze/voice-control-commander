import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Command, Point, ProjectSummary } from "../api";

interface SidebarProps {
  commands: Command[];
  activeCommandId: string | null;
  onSelectCommand: (id: string) => void;
  onDeleteCommand: (id: string) => void;
  onDuplicateCommand: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onFileUpload: (file: File) => void;
  onCreateNew: () => void;
  onRenameCommand: (id: string, newName: string) => void;
  onUpdateCommand: (cmd: Command) => void;
  selectedStrokeIndex: number | null;
  onSelectStroke: (index: number | null) => void;
  selectionType?: "stroke" | "wait";
  onSelectType?: (type: "stroke" | "wait") => void;
  onReorderCommands: (oldIndex: number, newIndex: number) => void;
  onReorderStrokes: (
    commandId: string,
    oldIndex: number,
    newIndex: number,
  ) => void;

  // Multi-selection
  checkedCommandIds: Set<string>;
  onToggleSelectCommand: (id: string, multi: boolean) => void;
  onBatchExport: () => void;
  onBatchDelete: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onToggleAllVisibility: (visible: boolean) => void;

  // Stroke Grouping / Multi-selection
  checkedStrokeIndices?: Set<number>;
  onToggleSelectStroke?: (index: number) => void;
  onGroupStrokes?: () => void;
  onUngroupStrokes?: () => void;

  // Project Management
  currentProjectId: string | null;
  projectsList: ProjectSummary[];
  onLoadProject: (id: string) => void;
  onSaveProject: () => void;
  onSaveAsProject: () => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string) => void;
  hasUnsavedChanges: boolean;
}

// ----------------------------------------------------------------------------
// Sortable Stroke Item
// ----------------------------------------------------------------------------
interface SortableStrokeItemProps {
  id: string; // Unique ID for dnd-kit (e.g., cmdId-stroke-index)
  index: number;
  stroke: Point[];

  isSelected: boolean;
  isMultiSelected?: boolean;
  onSelect: () => void;
  onToggleMultiSelect?: (e: React.MouseEvent) => void;
  onDelete: () => void;
  isWait?: boolean; // Wait is technically gaps between strokes, confusing to sort?
  groupId?: string;
  isGroupedWithPrev?: boolean;
  isGroupedWithNext?: boolean;
  tapDuration?: number;
}

// Helper to determine if tap
const isTap = (points: Point[]): boolean => points.length <= 1;

const SortableStrokeItem = React.memo(
  ({
    id,
    index,
    stroke,
    isSelected,
    isMultiSelected,
    onSelect,
    onToggleMultiSelect,
    onDelete,
    groupId,
    isGroupedWithPrev,
    isGroupedWithNext,
    tapDuration,
  }: SortableStrokeItemProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style = {
      transform: CSS.Translate.toString(transform),
      transition,
      zIndex: isDragging ? 999 : "auto",
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center justify-between text-xs px-2 py-2 cursor-pointer transition-colors border
                ${
                  isSelected
                    ? "bg-blue-50 border-blue-300 text-blue-900 shadow-sm font-semibold"
                    : groupId
                      ? "bg-indigo-50/50 border-indigo-200 text-gray-800 hover:bg-indigo-100"
                      : "bg-gray-50 border-transparent text-gray-700 hover:bg-gray-100 hover:border-gray-200"
                }
                ${groupId ? "border-l-4 border-l-indigo-400" : "rounded-md mb-1"}
                ${isGroupedWithPrev ? "rounded-t-none border-t-0 mt-0" : groupId ? "rounded-t-md mt-1" : ""}
                ${isGroupedWithNext ? "rounded-b-none border-b-0 mb-0" : groupId ? "rounded-b-md mb-1" : ""}
                `}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="mr-2 cursor-move text-gray-300 hover:text-gray-500 touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>

          <div
            className="mr-2 shrink-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMultiSelect?.(e);
            }}
          >
            <div
              className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${isMultiSelected ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300 hover:border-blue-400"}`}
            >
              {isMultiSelected && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-2.5 w-2.5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>

          <div
            className={`w-2 h-2 rounded-full mr-2.5 shrink-0 ${isSelected ? "bg-blue-500 ring-2 ring-blue-200" : "bg-gray-400"}`}
          ></div>
          <span>アクション {index + 1}</span>
          <span className="ml-2 text-[9px] uppercase tracking-wider text-gray-400 bg-white px-1 rounded border border-gray-100 shrink-0">
            {isTap(stroke) ? `タップ (${(tapDuration || 0.05).toFixed(2)}s)` : "パス"}
          </span>
        </div>
        {/* Delete Stroke Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={`p-1 hover:text-red-500 hover:bg-red-100 rounded transition-colors ml-2 ${isSelected ? "text-blue-400" : "text-gray-400"}`}
          title="アクションを削除"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.index === nextProps.index &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isMultiSelected === nextProps.isMultiSelected &&
      prevProps.groupId === nextProps.groupId &&
      prevProps.isGroupedWithPrev === nextProps.isGroupedWithPrev &&
      prevProps.isGroupedWithNext === nextProps.isGroupedWithNext &&
      prevProps.tapDuration === nextProps.tapDuration &&
      prevProps.stroke.length === nextProps.stroke.length &&
      prevProps.stroke === nextProps.stroke
    );
  },
);

// ----------------------------------------------------------------------------
// Inline Edit Input Component
// ----------------------------------------------------------------------------
interface InlineEditInputProps {
  initialValue: string;
  onCommit: (newValue: string) => void;
}

const InlineEditInput: React.FC<InlineEditInputProps> = ({
  initialValue,
  onCommit,
}) => {
  const [localValue, setLocalValue] = React.useState(initialValue);
  const isComposingRef = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  }, []);

  const handleCommit = () => {
    onCommit(localValue);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleCommit}
      onCompositionStart={() => {
        isComposingRef.current = true;
      }}
      onCompositionEnd={() => {
        // コンポジション終了のタイミングと onKeyDown(Enter) のタイミングが同じになることがあるため
        // 少し遅らせてフラグを解除する
        setTimeout(() => {
          isComposingRef.current = false;
        }, 100);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          // IME変換中のEnter（確定）かどうかを徹底的に判定する
          if (
            isComposingRef.current ||
            e.nativeEvent.isComposing ||
            e.keyCode === 229
          ) {
            return;
          }
          handleCommit();
        }
      }}
      className="text-sm font-bold w-full border border-blue-500 rounded px-1.5 py-0.5 -ml-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
      onClick={(e) => e.stopPropagation()}
    />
  );
};

// ----------------------------------------------------------------------------
// Sortable Command Item
// ----------------------------------------------------------------------------
interface SortableCommandItemProps {
  command: Command;
  isSelected: boolean;
  editingId: string | null;
  onStartEditing: (id: string, name: string) => void;
  onFinishEditing: (id: string, newName: string) => void;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdateCommand: (cmd: Command) => void;

  // Props for Stroke Selection/Sorting inside
  selectedStrokeIndex: number | null;
  selectionType: "stroke" | "wait";
  onSelectStroke: (index: number | null) => void;
  onSelectType?: (type: "stroke" | "wait") => void;
  onReorderStrokes: (oldIndex: number, newIndex: number) => void;

  // Multi-selection
  isMultiSelected: boolean;
  onToggleMultiSelect: (e: React.MouseEvent) => void;
  checkedStrokeIndices?: Set<number>;
  onToggleSelectStroke?: (index: number) => void;
  onGroupStrokes?: () => void;
  onUngroupStrokes?: () => void;
}

const SortableCommandItem = React.memo(
  ({
    command,
    isSelected,
    editingId,
    onStartEditing,
    onFinishEditing,
    onSelect,
    onToggleVisibility,
    onDelete,
    onDuplicate,
    onUpdateCommand,
    selectedStrokeIndex,
    selectionType,
    onSelectStroke,
    onSelectType,
    onReorderStrokes,
    isMultiSelected,
    onToggleMultiSelect,
    checkedStrokeIndices,
    onToggleSelectStroke,
    onGroupStrokes,
    onUngroupStrokes,
  }: SortableCommandItemProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: command.id });

    const style = {
      transform: CSS.Translate.toString(transform),
      transition,
      zIndex: isDragging ? 999 : "auto",
      opacity: isDragging ? 0.7 : 1,
    };

    // Stroke Reordering Logic
    const strokeSensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 5,
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );

    const handleStrokeDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        // IDs are formatted as "cmdID-strokeID-INDEX" or just "cmdID-INDEX"?
        // We used "cmdID-stroke-index"
        // Let's parse index
        const oldIndex = parseInt(
          String(active.id).split("-").pop() || "0",
          10,
        );
        const newIndex = parseInt(String(over.id).split("-").pop() || "0", 10);
        onReorderStrokes(oldIndex, newIndex);
      }
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`rounded-md border shadow-sm transition-colors overflow-hidden mb-2 ${isSelected ? "border-blue-400 bg-white ring-1 ring-blue-100" : "border-gray-300 bg-white hover:border-gray-300"}`}
      >
        {/* Command Header */}
        <div
          className={`flex flex-col px-3 py-2 cursor-pointer transition-colors group/item ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
          onClick={onSelect}
        >
          {/* Row 1: Name and Color */}
          <div className="flex items-center mb-1.5 min-w-0">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="mr-2 cursor-move text-gray-300 hover:text-gray-500 touch-none shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8h16M4 16h16"
                />
              </svg>
            </div>

            {/* Checkbox for Multi-select */}
            <div
              className="mr-2 shrink-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMultiSelect(e);
              }}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isMultiSelected ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300 hover:border-blue-400"}`}
              >
                {isMultiSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Color Indicator */}
            <div
              className="w-2.5 h-2.5 rounded-full mr-2.5 ring-1 ring-black/10 shrink-0 shadow-sm"
              style={{ backgroundColor: command.color }}
            />

            {/* Name */}
            {editingId === command.id ? (
              <InlineEditInput
                initialValue={command.name}
                onCommit={(newName) => onFinishEditing(command.id, newName)}
              />
            ) : (
              <span
                className={`text-sm font-bold truncate flex-1 ${isSelected ? "text-blue-900" : "text-gray-800"}`}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onStartEditing(command.id, command.name);
                }}
                title={command.name}
              >
                {command.name}
              </span>
            )}
          </div>

          {/* Row 2: Controls and Info */}
          <div className="flex items-center justify-between pl-8">
            <div className="flex items-center space-x-3">
              {/* Visibility Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility();
                }}
                className={`focus:outline-none transition-colors flex items-center space-x-1 ${command.isVisible ? "text-gray-500 hover:text-blue-600" : "text-gray-300"}`}
                title={command.isVisible ? "非表示" : "表示"}
              >
                {command.isVisible ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                      clipRule="evenodd"
                    />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
                <span className="text-[10px]">表示中</span>
              </button>

              <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                {command.strokes.length} ステップ
              </span>
            </div>

            <div className="flex items-center space-x-1">
              {/* Duplicate Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded p-1 transition-colors"
                title="コマンドを複製"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                  />
                </svg>
              </button>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors"
                title="コマンドを削除"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Stroke List (Only if selected) */}
        {isSelected && (
          <div className="bg-white border-t border-blue-100 pl-4 pr-3 py-2">
            {/* Nested Dnd Context for Strokes */}
            <DndContext
              sensors={strokeSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleStrokeDragEnd}
            >
              <SortableContext
                items={command.strokes.map(
                  (_, i) => `${command.id}-stroke-${i}`,
                )}
                strategy={verticalListSortingStrategy}
              >
                {command.strokes.map((stroke, index) => {
                  const currentGroupId = command.strokeMetadata?.[index]?.groupId;
                  const prevGroupId = index > 0 ? command.strokeMetadata?.[index - 1]?.groupId : undefined;
                  const nextGroupId = index < command.strokes.length - 1 ? command.strokeMetadata?.[index + 1]?.groupId : undefined;

                  const isGroupedWithPrev = !!(currentGroupId && prevGroupId && currentGroupId === prevGroupId);
                  const isGroupedWithNext = !!(currentGroupId && nextGroupId && currentGroupId === nextGroupId);

                  return (
                    <React.Fragment key={`${command.id}-stroke-${index}`}>
                      {/* グループ化されているストローク間は待機時間を表示しない */}
                      {index > 0 && !isGroupedWithPrev && (
                        <div
                          className={`flex items-center justify-center py-1 cursor-pointer group/wait relative my-1 rounded
                                                  ${selectedStrokeIndex === index - 1 && selectionType === "wait" ? "bg-blue-50 opacity-100 ring-1 ring-blue-200" : "opacity-60 hover:opacity-100 hover:bg-gray-50"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStroke(index - 1);
                            onSelectType?.("wait");
                          }}
                        >
                          <div
                            className={`h-3 w-0.5 rounded-full ${selectedStrokeIndex === index - 1 && selectionType === "wait" ? "bg-blue-500" : "bg-gray-300"}`}
                          ></div>
                          <span
                            className={`text-[10px] ml-2 ${selectedStrokeIndex === index - 1 && selectionType === "wait" ? "text-blue-700 font-bold" : "text-gray-500"}`}
                          >
                            待機{" "}
                            {command.strokeMetadata?.[index - 1]?.waitAfter ??
                              command.waitDuration ??
                              0.1}
                            秒
                          </span>
                        </div>
                      )}

                      <SortableStrokeItem
                        id={`${command.id}-stroke-${index}`}
                        index={index}
                        stroke={stroke}
                        isSelected={
                          selectedStrokeIndex === index &&
                          selectionType === "stroke"
                        }
                        isMultiSelected={checkedStrokeIndices?.has(index)}
                        groupId={currentGroupId}
                        isGroupedWithPrev={isGroupedWithPrev}
                        isGroupedWithNext={isGroupedWithNext}
                        tapDuration={
                          command.strokeMetadata?.[index]?.tapDuration ?? 
                          command.tapDuration ?? 
                          0.05
                        }
                        onSelect={() => {
                        onSelectStroke(index);
                        onSelectType?.("stroke");
                      }}
                      onToggleMultiSelect={() => {
                        onToggleSelectStroke?.(index);
                      }}
                      onDelete={() => {
                        const newStrokes = [...command.strokes];
                        newStrokes.splice(index, 1);
                        onUpdateCommand({ ...command, strokes: newStrokes });
                        if (selectedStrokeIndex === index) onSelectStroke(null);
                        else if (
                          selectedStrokeIndex !== null &&
                          index < selectedStrokeIndex
                        )
                          onSelectStroke(selectedStrokeIndex - 1);
                      }}
                    />
                  </React.Fragment>
                );
              })}
              </SortableContext>
            </DndContext>

            {/* Stroke Grouping Buttons */}
            {checkedStrokeIndices && checkedStrokeIndices.size > 0 && (
              <div className="flex space-x-2 my-2 w-full">
                <button
                  onClick={onGroupStrokes}
                  disabled={checkedStrokeIndices.size < 2}
                  className={`flex-1 p-1.5 border rounded text-xs transition-colors shadow-sm ${
                    checkedStrokeIndices.size >= 2
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                      : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                  title="選択したアクションを同時に実行するようにグループ化"
                >
                  グループ化
                </button>
                <button
                  onClick={onUngroupStrokes}
                  className={`flex-1 p-1.5 border rounded text-xs transition-colors shadow-sm bg-white border-gray-200 text-gray-600 hover:bg-gray-50`}
                  title="選択したアクションのグループを解除"
                >
                  グループ解除
                </button>
              </div>
            )}

            {/* Add Action Buttons */}
            <div className="pt-3 pb-1 flex justify-center space-x-2 border-t border-dashed border-gray-200 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Default horizontal stroke
                  const newStroke: Point[] = Array(24)
                    .fill(0)
                    .map((_, i) => ({ x: 100, y: 400 + i * 5 }));
                  onUpdateCommand({
                    ...command,
                    strokes: [...command.strokes, newStroke],
                  });
                }}
                className="flex-1 px-2 py-1.5 text-[10px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded flex items-center justify-center transition-colors shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
                + 線を描く
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Tap point
                  const newTap: Point[] = [{ x: 160, y: 400 }];
                  onUpdateCommand({
                    ...command,
                    strokes: [...command.strokes, newTap],
                  });
                }}
                className="flex-1 px-2 py-1.5 text-[10px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded flex items-center justify-center transition-colors shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
                + タップ
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.command === nextProps.command &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isMultiSelected === nextProps.isMultiSelected &&
      prevProps.editingId === nextProps.editingId &&
      prevProps.selectedStrokeIndex === nextProps.selectedStrokeIndex &&
      prevProps.selectionType === nextProps.selectionType &&
      prevProps.checkedStrokeIndices === nextProps.checkedStrokeIndices
    );
  },
);

// ----------------------------------------------------------------------------
// Main Sidebar Component
// ----------------------------------------------------------------------------
const Sidebar: React.FC<SidebarProps> = (props) => {
  const {
    commands,
    activeCommandId,
    onSelectCommand,
    onDeleteCommand,
    onDuplicateCommand,
    onToggleVisibility,
    onFileUpload,
    onCreateNew,
    onRenameCommand,
    onUpdateCommand,
    selectedStrokeIndex,
    onSelectStroke,
    selectionType = "stroke",
    onSelectType,
    onReorderCommands,
    onReorderStrokes,
    checkedCommandIds,
    onToggleSelectCommand,
    onBatchExport,
    onBatchDelete,
    onSelectAll,
    onClearSelection,
    onToggleAllVisibility,
    checkedStrokeIndices,
    onToggleSelectStroke,
    onGroupStrokes,
    onUngroupStrokes,
    currentProjectId,
    projectsList,
    onLoadProject,
    onSaveProject,
    onSaveAsProject,
    onDeleteProject,
    onRenameProject,
    hasUnsavedChanges,
  } = props;

  const [editingId, setEditingId] = React.useState<string | null>(null);

  const handleStartEditing = (id: string) => {
    setEditingId(id);
  };

  const handleFinishEditing = (id: string, newName: string) => {
    if (newName.trim()) {
      onRenameCommand(id, newName.trim());
    }
    setEditingId(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = commands.findIndex((c) => c.id === active.id);
      const newIndex = commands.findIndex((c) => c.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderCommands(oldIndex, newIndex);
      }
    }
  };

  return (
    <div className="w-64 bg-white flex flex-col h-full border-r border-gray-300 font-sans shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10">
      {/* プロジェクトヘッダー */}
      <div className="px-4 py-3 border-b border-gray-300 bg-gray-50 flex flex-col space-y-2 shrink-0">
        {/* 現在のプロジェクト名 + 保存ボタン */}
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <span className="text-[9px] text-gray-400 uppercase tracking-wider mr-1.5 shrink-0">
              PRJ
            </span>
            <span
              className="text-sm font-bold text-gray-800 truncate cursor-pointer hover:text-blue-600"
              onClick={() => {
                if (currentProjectId) onRenameProject(currentProjectId);
              }}
              title={currentProjectId ? "クリックして名前を変更" : ""}
            >
              {currentProjectId
                ? projectsList.find((p) => p.id === currentProjectId)?.name ||
                  "不明"
                : "未保存"}
            </span>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={
                hasUnsavedChanges || !currentProjectId
                  ? onSaveProject
                  : undefined
              }
              className={`text-[10px] font-medium px-2 py-1 rounded transition-colors border ${
                hasUnsavedChanges || !currentProjectId
                  ? "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200"
                  : "text-gray-500 bg-gray-50 border-gray-200 opacity-70 cursor-default"
              }`}
              title={
                hasUnsavedChanges || !currentProjectId
                  ? "現在の状態を上書き保存"
                  : "変更はありません"
              }
            >
              {hasUnsavedChanges || !currentProjectId ? "💾 保存" : "✔️ 保存済"}
            </button>
            <button
              onClick={onSaveAsProject}
              className="text-[10px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded transition-colors"
              title="名前を付けて新しいプロジェクトとして保存"
            >
              📋 別名保存
            </button>
          </div>
        </div>

        {/* 保存済みプロジェクト一覧 */}
        {projectsList.length > 0 && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {projectsList.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between rounded px-2 py-1.5 group transition-colors cursor-pointer ${
                  p.id === currentProjectId
                    ? "bg-blue-100 border border-blue-300"
                    : "bg-white border border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => {
                  if (p.id !== currentProjectId) onLoadProject(p.id);
                }}
              >
                <span
                  className={`text-xs truncate flex-1 ${
                    p.id === currentProjectId
                      ? "font-bold text-blue-800"
                      : "text-gray-700"
                  }`}
                >
                  {p.name}
                </span>
                {/* 操作ボタン（ホバーで表示） */}
                <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenameProject(p.id);
                    }}
                    className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                    title="名前を変更"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(p.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="削除"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="h-12 px-4 border-b border-gray-300 bg-gray-50 flex items-center justify-between shrink-0">
        <h2 className="text-xs font-bold text-gray-600 tracking-wider uppercase">
          コマンド
        </h2>
        <div className="flex items-center space-x-1">
          <label
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded cursor-pointer transition-colors"
            title="インポート"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <input
              type="file"
              className="hidden"
              accept=".voicecontrolcommands,.plist,.voicecontrolcom"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onFileUpload(e.target.files[0]);
                  e.target.value = "";
                }
              }}
            />
          </label>
          <button
            onClick={onCreateNew}
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
            title="新規コマンド"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>
      {/* Batch Actions Toolbar */}
      {(() => {
        const isAllSelected =
          commands.length > 0 && checkedCommandIds.size === commands.length;
        return (
          <div
            className={`px-3 py-2 border-b flex flex-col space-y-2 transition-colors duration-200 ${
              checkedCommandIds.size > 0
                ? "bg-blue-50 border-blue-100"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            {/* 1行目: 選択状況と全選択/表示トグルボタン */}
            <div className="flex items-center justify-between w-full">
              <span
                className={`text-xs font-semibold ${checkedCommandIds.size > 0 ? "text-blue-800" : "text-gray-500"}`}
              >
                {checkedCommandIds.size} 件選択中
              </span>
              <div className="flex text-[10px] space-x-1 items-center">
                {commands.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        const isAllVisible = commands.every((c) => c.isVisible !== false);
                        onToggleAllVisibility(!isAllVisible);
                      }}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        commands.every((c) => c.isVisible !== false)
                          ? "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                          : "text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                      }`}
                      title={
                        commands.every((c) => c.isVisible !== false)
                          ? "すべてのコマンドを非表示"
                          : "すべてのコマンドを表示"
                      }
                    >
                      {commands.every((c) => c.isVisible !== false)
                        ? "全て非表示"
                        : "全て表示"}
                    </button>
                    <div className="w-px h-3 bg-gray-300"></div>
                  </>
                )}
                <button
                  onClick={isAllSelected ? onClearSelection : onSelectAll}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    isAllSelected
                      ? "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                      : "text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                  }`}
                >
                  {isAllSelected ? "選択解除" : "全て選択"}
                </button>
              </div>
            </div>

            {/* 2行目: バッチアクションボタン */}
            <div className="flex space-x-2 w-full">
              <button
                onClick={onBatchDelete}
                disabled={checkedCommandIds.size === 0}
                className={`flex-1 p-1.5 border rounded text-xs transition-colors shadow-sm ${
                  checkedCommandIds.size > 0
                    ? "bg-white border-red-200 text-red-600 hover:bg-red-50"
                    : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                title="選択した項目を削除"
              >
                削除
              </button>
              <button
                onClick={onBatchExport}
                disabled={checkedCommandIds.size === 0}
                className={`flex-1 p-1.5 border rounded text-xs transition-colors shadow-sm ${
                  checkedCommandIds.size > 0
                    ? "bg-white border-blue-200 text-blue-600 hover:bg-blue-100"
                    : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                title="選択した項目を書き出し"
              >
                書き出し
              </button>
            </div>
          </div>
        );
      })()}{" "}
      {/* Command List */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-2 space-y-2">
        {commands.length === 0 ? (
          <p className="text-gray-400 text-center mt-8 text-xs">
            コマンドがありません
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={commands.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-0">
                {commands.map((cmd) => (
                  <SortableCommandItem
                    key={cmd.id}
                    command={cmd}
                    isSelected={cmd.id === activeCommandId}
                    editingId={editingId}
                    onStartEditing={() => handleStartEditing(cmd.id)}
                    onFinishEditing={handleFinishEditing}
                    onSelect={() => {
                      onSelectCommand(cmd.id);
                      onSelectStroke(
                        cmd.strokes && cmd.strokes.length > 0 ? 0 : null,
                      );
                      onSelectType?.("stroke");
                    }}
                    onToggleVisibility={() => onToggleVisibility(cmd.id)}
                    onDelete={() => onDeleteCommand(cmd.id)}
                    onDuplicate={() => onDuplicateCommand(cmd.id)}
                    onUpdateCommand={onUpdateCommand}
                    selectedStrokeIndex={selectedStrokeIndex}
                    selectionType={selectionType}
                    onSelectStroke={onSelectStroke}
                    onSelectType={onSelectType}
                    onReorderStrokes={(oldIndex, newIndex) =>
                      onReorderStrokes(cmd.id, oldIndex, newIndex)
                    }
                    isMultiSelected={checkedCommandIds.has(cmd.id)}
                    onToggleMultiSelect={() => {
                      onToggleSelectCommand(cmd.id, false); // Just toggle
                    }}
                    checkedStrokeIndices={checkedStrokeIndices}
                    onToggleSelectStroke={onToggleSelectStroke}
                    onGroupStrokes={onGroupStrokes}
                    onUngroupStrokes={onUngroupStrokes}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
