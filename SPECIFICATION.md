# Voice Control Commander - Specification

## Overview
アプリケーション仕様書: Voice Control Commander

1. 概要 (Overview)

1.1 アプリの目的

iOS/iPadOSの「音声コントロール」機能で使用するカスタムコマンドファイル（.voicecontrolcommands）を、Webブラウザ上で直感的に作成・編集・可視化するツール。
特に、Base64エンコードされた内部ジェスチャデータの解析と、座標の微調整（平行移動など）を容易にすることを目的とする。

1.2 ターゲットユーザー

スマホゲームの周回操作を自動化したいユーザー

アクセシビリティ機能を活用して複雑な操作を簡略化したいユーザー

2. 機能要件 (Functional Requirements)

2.1 ファイル処理 (Backend - Python)

インポート:

.voicecontrolcommands (XML Plist) を受け取り、Pythonの plistlib で解析する。

内部の CustomGesture (Base64 -> Binary Plist) をデコードし、座標データ "{x, y}" を抽出してJSON形式でフロントエンドに渡す。

エクスポート:

フロントエンドから受け取った修正済み座標データを元に、元のバイナリ構造を維持したまま座標部分のみを置換する。

重要: 書き出し時に Custom.xxxx キー（コマンドID）を、現在時刻ベースのユニークなID（例: Custom.1732950000.123456）に生成し直すこと。（iPad側での重複インポートエラーを防ぐため必須）

2.2 フロントエンド機能 (Frontend - React)

可視化 (Canvas):

iPad Air 4 (横持ち) の解像度 1180 x 820 ポイントを基準としたキャンバスを表示。

抽出された座標データを線で描画する（開始点：緑、終了点：赤）。

編集操作:

平行移動: スライダーまたは数値入力で、全座標を一括でX/Y方向にずらす機能。

コマンド選択: ファイル内に複数のコマンドがある場合、リストから編集対象を選択する機能。

3. 非機能要件 (Non-Functional Requirements)

実行環境: ローカル環境（Localhost）で動作するWebアプリケーション。

レスポンス: ファイルアップロードから描画までは1秒以内を目指す。

セキュリティ: ユーザーのローカルファイルを扱うため、外部サーバーへのデータ送信は行わない（ローカル完結）。

4. データ構造 (Data Definition)

4.1 .voicecontrolcommands 構造メモ

形式: XML Property List

ジェスチャデータ格納場所: /CommandsTable/Custom.ID/CustomGesture (Base64 string)

内部データ: NSKeyedArchiver形式のBinary Plist。$objects 配列内に "{590.5, 410.0}" のような文字列として座標が格納されている。

5. 技術スタック (Tech Stack)

Google Antigravity エージェントによる実装を前提とする。

Backend: Python 3.12+ (FastAPI または Flask)

理由: plistlib 標準ライブラリが最も信頼性が高いため。

Frontend: React + Vite + Tailwind CSS

理由: コンポーネント指向でUIを構築しやすいため。

Dev Tool: Google Antigravity

6. プロジェクト構成案 (Project Structure)

/backend
  main.py       # FastAPI app
  parser.py     # Plist parsing & generating logic
/frontend
  src/
    components/
      Canvas.tsx      # Drawing logic
      ControlPanel.tsx # Sliders & Buttons
    App.tsx


7. Antigravity エージェントへの指示 (Agent Instructions)

7.1 実装ステップ (Implementation Plan)

Backend Setup: FastAPIプロジェクトを作成し、.voicecontrolcommands を受け取ってJSON（座標リスト）を返す /api/parse エンドポイントを実装せよ。まずは plistlib で読み込めるかテストすること。

Frontend Setup: Vite + React + Tailwind CSS のプロジェクトを作成せよ。

Canvas Integration: フロントエンドからバックエンドAPIを呼び出し、返ってきた座標をCanvasに描画する機能を実装せよ。

Edit & Export: 座標をずらしてサーバーに送り返し、修正済みファイルをダウンロードする /api/export エンドポイントを実装せよ。この際、必ずコマンドIDをリフレッシュする処理を入れること。

7.2 検証手順 (Verification Plan)

アプリが完成したら、Antigravityのブラウザ操作機能を使って以下を検証せよ：

backend サーバーと frontend サーバーを起動する。

ブラウザで localhost を開く。

テストファイル（test.voicecontrolcommands）をアップロードする。

画面に線画（軌跡）が表示されることを確認する（スクリーンショットを取得）。

X座標を +100 移動させて「Export」し、ダウンロードされたファイルを再度読み込んで、位置がずれているか確認する。

## Features
- ...

## Technical Requirements
- ...
