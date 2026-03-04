# Voice Control Commander

iOS Voice Control のカスタムジェスチャーコマンドを作成・編集する Web アプリケーションです。

## デモ

🌐 **https://yossyaze.github.io/voice-control-commander/**

## 機能

- `.voicecontrolcommands` ファイルの読み込み・編集・エクスポート
- 複数ストローク（シーケンス）対応
- Canvas 上でカスタムジェスチャーの軌跡を描画・編集
- ストロークの複製・反転・undo/redo
- 背景画像の設定（デバイス画面に合わせた軌跡作成）
- 複数コマンドの一括エクスポート
- プロジェクトの保存・読み込み（ブラウザ LocalStorage）

## 技術スタック

- **フレームワーク**: React + TypeScript + Vite
- **スタイリング**: Tailwind CSS
- **デプロイ**: GitHub Pages（GitHub Actions で自動デプロイ）
- **バックエンド不要**: 全ての処理がブラウザ内で完結

## ローカル開発

```bash
cd frontend
npm install
npm run dev
```

## ライセンス

MIT
