# ⚠️ 参照専用 (Reference Only)

このフォルダは **参照専用** です。実行・起動する必要はありません。

## 背景

もともと FastAPI ベースのバックエンドサーバーとして使用されていましたが、
現在はすべての処理がフロントエンド (`frontend/`) 内で完結しています。

- plist 解析 → `frontend/src/utils/parser.ts`
- エクスポート → `frontend/src/utils/parser.ts`
- プロジェクト管理 → `frontend/src/api.ts` (LocalStorage)
- 背景画像管理 → `frontend/src/api.ts` (LocalStorage)

## 用途

フロントエンドの `parser.ts` 実装時のリファレンス（参照元）として保持しています。
特に `parser.py` の NSKeyedArchiver 生成ロジックが参考になります。
