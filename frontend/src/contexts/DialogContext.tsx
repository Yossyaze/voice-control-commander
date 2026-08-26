/* eslint-disable react-refresh/only-export-components */
import React, { useState, useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";

export type DialogResult = boolean | string | "save" | "discard" | "cancel" | null;

export interface UnsavedConfirmOptions {
  title?: string;
  message: string;
  saveLabel?: string;
  discardLabel?: string;
  cancelLabel?: string;
}

interface DialogState {
  id: string;
  type: "confirm" | "prompt" | "alert" | "unsaved_confirm";
  title?: string;
  message: string;
  defaultValue?: string;
  saveLabel?: string;
  discardLabel?: string;
  cancelLabel?: string;
  resolve: (value: DialogResult) => void;
}

export const DialogContext = React.createContext<{
  confirm: (msg: string) => Promise<boolean>;
  prompt: (msg: string, defaultVal?: string) => Promise<string | null>;
  alert: (msg: string) => Promise<void>;
  confirmUnsaved: (options: UnsavedConfirmOptions) => Promise<"save" | "discard" | "cancel">;
} | null>(null);

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialogs, setDialogs] = useState<DialogState[]>([]);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setDialogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          type: "confirm",
          message,
          resolve: (val) => resolve(val as boolean),
        },
      ]);
    });
  }, []);

  const prompt = useCallback((message: string, defaultValue = "") => {
    return new Promise<string | null>((resolve) => {
      setDialogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          type: "prompt",
          message,
          defaultValue,
          resolve: (val) => resolve(val as string | null),
        },
      ]);
    });
  }, []);

  const alert = useCallback((message: string) => {
    return new Promise<void>((resolve) => {
      setDialogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          type: "alert",
          message,
          resolve: () => resolve(),
        },
      ]);
    });
  }, []);

  const confirmUnsaved = useCallback((options: UnsavedConfirmOptions) => {
    return new Promise<"save" | "discard" | "cancel">((resolve) => {
      setDialogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          type: "unsaved_confirm",
          title: options.title || "未保存の変更があります",
          message: options.message,
          saveLabel: options.saveLabel || "保存して続行",
          discardLabel: options.discardLabel || "保存せずに続行",
          cancelLabel: options.cancelLabel || "キャンセル",
          resolve: (val) => resolve(val as "save" | "discard" | "cancel"),
        },
      ]);
    });
  }, []);

  const closeDialog = (id: string) => {
    setDialogs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <DialogContext.Provider value={{ confirm, prompt, alert, confirmUnsaved }}>
      {children}
      {dialogs.map((dialog) => (
        <DialogModal
          key={dialog.id}
          dialog={dialog}
          onClose={() => closeDialog(dialog.id)}
        />
      ))}
    </DialogContext.Provider>
  );
};

const DialogModal = ({
  dialog,
  onClose,
}: {
  dialog: DialogState;
  onClose: () => void;
}) => {
  const [val, setVal] = useState(dialog.defaultValue || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef<boolean>(false);

  useEffect(() => {
    if (dialog.type === "prompt" && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [dialog.type]);

  const handleOk = () => {
    if (dialog.type === "prompt") dialog.resolve(val);
    else if (dialog.type === "confirm") dialog.resolve(true);
    else dialog.resolve(null);
    onClose();
  };

  const handleCancel = () => {
    if (dialog.type === "prompt") dialog.resolve(null);
    else if (dialog.type === "confirm") dialog.resolve(false);
    else if (dialog.type === "unsaved_confirm") dialog.resolve("cancel");
    else dialog.resolve(null);
    onClose();
  };

  const handleUnsavedSave = () => {
    dialog.resolve("save");
    onClose();
  };

  const handleUnsavedDiscard = () => {
    dialog.resolve("discard");
    onClose();
  };

  // 未保存確認ダイアログ用のレイアウト
  if (dialog.type === "unsaved_confirm") {
    return (
      <div
        className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={handleCancel}
      >
        <div
          className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 outline-none border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {dialog.title || "未保存の変更があります"}
              </h3>
              <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                {dialog.message}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-gray-100 mt-5">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors order-3 sm:order-1 text-center"
            >
              {dialog.cancelLabel || "キャンセル"}
            </button>
            <button
              type="button"
              onClick={handleUnsavedDiscard}
              className="px-3.5 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors order-2 text-center"
            >
              {dialog.discardLabel || "保存せずに続行"}
            </button>
            <button
              type="button"
              onClick={handleUnsavedSave}
              autoFocus
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-sm order-1 sm:order-3 text-center"
            >
              {dialog.saveLabel || "保存して続行"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 outline-none border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-gray-800 font-medium mb-5 whitespace-pre-wrap text-[15px] leading-relaxed">
          {dialog.message}
        </p>

        {dialog.type === "prompt" && (
          <input
            ref={inputRef}
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2.5 mb-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            value={val}
            onChange={(e) => setVal(e.target.value)}
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
                e.preventDefault();
                handleOk();
              }
              if (e.key === "Escape") handleCancel();
            }}
          />
        )}

        <div className="flex justify-end space-x-2.5">
          {dialog.type !== "alert" && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              キャンセル
            </button>
          )}
          <button
            autoFocus={dialog.type !== "prompt"}
            onClick={handleOk}
            className="px-4 py-2 text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 rounded-md transition-colors shadow-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export const useDialog = () => {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used within DialogProvider");
  return context;
};
