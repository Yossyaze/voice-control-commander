import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Cloud, LogIn, LogOut, User } from "lucide-react";

const AuthStatus: React.FC = () => {
  const { currentUser, loginWithGoogle, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニュー外クリックで閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* メインのクラウドアイコンボタン */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`p-2 rounded-full transition-all duration-200 border ${
          currentUser
            ? isMenuOpen
              ? "bg-blue-100 text-blue-600 border-blue-200 shadow-inner"
              : "bg-blue-50 text-blue-500 border-blue-100 hover:bg-blue-100 hover:shadow-sm"
            : isMenuOpen
              ? "bg-gray-200 text-gray-700 border-gray-300 shadow-inner"
              : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
        }`}
        title="クラウド設定"
      >
        <Cloud className="w-5 h-5" />
      </button>

      {/* ポップオーバーメニュー */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
          <div className="p-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-full ${currentUser ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"}`}>
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Account Status</span>
                <span className="text-xs font-semibold text-gray-700 truncate">
                  {currentUser ? (currentUser.displayName || currentUser.email) : "未ログイン"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-2">
            {currentUser ? (
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>ログアウト</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  loginWithGoogle();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100 shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Google ログイン</span>
              </button>
            )}
          </div>

          {currentUser && (
            <div className="px-3 py-2 bg-blue-50/30 border-t border-blue-50">
               <p className="text-[9px] text-blue-400 text-center leading-tight">
                プロジェクトは自動的に<br />クラウドへ同期されます
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthStatus;
