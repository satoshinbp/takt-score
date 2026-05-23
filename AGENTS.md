# TaktScore

ドラム譜入力・保存・再生アプリ．monorepo 構成: `frontend/` (Next.js) + `backend/` (FastAPI + PostgreSQL)．

## ドメイン定義

型・定数・ファクトリ関数は `frontend/src/lib/constants.ts` (TypeScript) と `backend/app/constants.py` / `backend/app/schemas/` (Python) にミラーされる．両者の値を変える際は両方を同期させる．

### コアモデル

- **PartId** — ドラムパーツを表す文字列リテラル型（CRASH / HH / SNARE / BD など9種）
- **Measure** — 1小節．PartId をキーに，16ステップの on/off 配列を持つ `Record`
- **Score** — 保存単位．`Measure[]` の配列にメタ情報（title, bpm, id, timestamps）を付加したもの

### アーキテクチャ概要

#### フロントエンド (`frontend/`)

- `frontend/src/app/` — Next.js App Router のページ
  - `frontend/src/app/api/` — Next.js Route Handler（現状は AI 生成用のみ）
  - `frontend/src/app/**/_components` — コロケーションされたコンポーネント
  - `frontend/src/app/**/_hooks` — コロケーションされたフック
- `frontend/src/components/` — UI コンポーネント
- `frontend/src/components/ui/` — shadcn/ui のコンポーネント（コマンドで追加されたものは編集しない）
- `frontend/src/hooks/` — Web Audio API を使った再生ロジック
- `frontend/src/lib/` — ドメイン定義・音声合成・ストレージクライアント・ユーティリティ
- `frontend/src/lib/storage.ts` — バックエンド `/scores` への CRUD クライアント

#### バックエンド (`backend/`)

- `backend/app/main.py` — FastAPI エントリポイント．CORS とルータの登録
- `backend/app/routers/scores.py` — `/scores` の CRUD エンドポイント
- `backend/app/models/score.py` — SQLAlchemy ORM (`scores` テーブル，`measures` は JSONB)
- `backend/app/schemas/` — Pydantic v2 スキーマ（Beat / Measure / ScoreCreate / ScoreUpdate / ScoreRead）
- `backend/app/db.py` — SQLAlchemy エンジン・セッション・`Base`
- `backend/app/config.py` — pydantic-settings (DATABASE_URL, CORS_ORIGINS)
- `backend/app/seed.py` — `seeds/scores.json` を冪等に投入する CLI
- `backend/alembic/` — マイグレーション

## UI の方針

- UI コンポーネントが必要になったら，まず `frontend/src/components/ui/` から該当するものを探す．
- なければ [shadcn/ui](https://ui.shadcn.com/docs/components) から該当するものを探し，pnpm 用のインストールコマンドを実行して `frontend/src/components/ui/` に追加する．
- 静的スタイルは Tailwind クラスで書く．

## データ保存方針

スコアは PostgreSQL の `scores` テーブルに保存し，`measures` は JSONB に格納する．バリデーションは Pydantic で行い，フロントエンドからは `frontend/src/lib/storage.ts` の CRUD クライアント経由でアクセスする．DB スキーマの変更は Alembic マイグレーションで管理する．

## コーディング規約

### クラス

- **className の長さ** — 80文字を超える場合は `cn()` (`@/lib/utils.ts`) を使って複数引数に分割する．80文字以下なら文字列リテラルのままでよい．
- **任意値（`[...]`）は原則禁止** — 任意値より組み込みスケールを優先する．組み込みに対応するものがない場合のみ任意値を使う．

### その他

- **アイコン** — 一般的なアイコンは `lucide-react` を使用し，アプリ固有のアイコンは `frontend/src/components/Icon.tsx` に SVG で定義する．
