import React, { useState, useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";

type DialogResult = boolean | string | null;

interface DialogState {
  id: string;
  type: "confirm" | "prompt" | "alert";
  message: string;
  defaultValue?: string;
  resolve: (value: DialogResult) => void;
}

export const DialogContext = React.createContext<{
  confirm: (msg: string) => Promise<boolean>;
  prompt: (msg: string, defaultVal?: string) => Promise<string | null>;
  alert: (msg: string) => Promise<void>;
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

  const closeDialog = (id: string) => {
    setDialogs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <DialogContext.Provider value={{ confirm, prompt, alert }}>
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
    else dialog.resolve(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
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
