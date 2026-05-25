# TaktScore

ドラム譜入力・保存・再生アプリ．monorepo 構成: `frontend/` (Next.js) + `backend/` (Go + chi + sqlc + PostgreSQL)．

## ドメイン定義

型・定数は `frontend/src/lib/constants.ts` (TypeScript) と `backend/internal/domain/score.go` (Go) にミラーされる．両者の値を変える際は両方を同期させる．

### コアモデル

- **PartId** — ドラムパーツを表す文字列リテラル型（CRASH / HH / SNARE / BD など9種）
- **Beat** — 1拍．`subdivision` (3/4/6) + パートごとの `steps`（値は OFF/NORMAL/ACCENT/GHOST）と任意の `ornaments`（NONE/FLAM/DRAG/RUFF）
- **Measure** — 1小節 = `Beat[BEATS_PER_MEASURE]`（= 4拍）
- **Score** — 保存単位．`Measure[]` にメタ情報（title, bpm, id, timestamps）を付加したもの．ID は UUID v7

### アーキテクチャ概要

#### フロントエンド (`frontend/`)

- `frontend/src/app/` — Next.js App Router のページ
  - `frontend/src/app/api/` — Next.js Route Handler（現状は AI 生成用のみ）
  - `frontend/src/app/**/_components` — コロケーションされたコンポーネント
  - `frontend/src/app/**/_hooks` — コロケーションされたフック
- `frontend/src/components/` — UI コンポーネント
- `frontend/src/components/ui/` — shadcn/ui のコンポーネント（コマンドで追加されたものは編集しない）
- `frontend/src/hooks/` — Web Audio API を使った再生ロジック
- `frontend/src/lib/` — ドメイン定義・音声合成・ユーティリティ
- `frontend/src/services/score/` — バックエンド `/scores` への CRUD クライアントとレスポンスパーサ

#### バックエンド (`backend/`)

- `backend/cmd/server/main.go` — HTTP サーバのエントリポイント．chi router, CORS, DB pool
- `backend/cmd/seed/main.go` — `seeds/scores.json` を冪等に投入する CLI
- `backend/internal/api/score/` — `/scores` のハンドラ・DTO・バリデーション・サービス層（mapper, transactions）
- `backend/internal/domain/` — PartId / Subdivision / Step / Ornament の Go 定数（`constants.ts` のミラー）
- `backend/internal/store/` — sqlc が生成した型付きクエリ実装と SQL ソース（`queries/`）
- `backend/internal/config/` — 環境変数読み込み（DATABASE_URL, CORS_ORIGINS, HTTP_ADDR）
- `backend/internal/db/` — pgxpool 初期化
- `backend/migrations/` — goose マイグレーション

## UI の方針

- UI コンポーネントが必要になったら，まず `frontend/src/components/ui/` から該当するものを探す．
- なければ [shadcn/ui](https://ui.shadcn.com/docs/components) から該当するものを探し，pnpm 用のインストールコマンドを実行して `frontend/src/components/ui/` に追加する．
- 静的スタイルは Tailwind クラスで書く．

## データ保存方針

スコアは PostgreSQL に正規化して保存する: `scores` / `measures` / `beats` / `hits` の4テーブル．`part_id` / `velocity` / `ornament` は Postgres の enum 型で DB レベルにドメインを刻み込む．`hits` は **on のステップだけを行として持つスパース表現**（OFF は行が無い状態）．バリデーションは `backend/internal/api/score/validate.go` の `ValidateInput` で行い，フロントエンドからは `frontend/src/services/score/` 経由でアクセスする．書き込みは「該当 score の measures を `ON DELETE CASCADE` で消して再 INSERT」をトランザクションで実行する．DB スキーマの変更は `backend/migrations/` 配下の goose マイグレーションで管理し，SQL から型付き Go コードは `sqlc generate` で再生成する．

## コーディング規約

### クラス

- **className の長さ** — 80文字を超える場合は `cn()` (`@/lib/utils.ts`) を使って複数引数に分割する．80文字以下なら文字列リテラルのままでよい．
- **任意値（`[...]`）は原則禁止** — 任意値より組み込みスケールを優先する．組み込みに対応するものがない場合のみ任意値を使う．

### その他

- **アイコン** — 一般的なアイコンは `lucide-react` を使用し，アプリ固有のアイコンは `frontend/src/components/Icon.tsx` に SVG で定義する．

## ブランチ命名規則

`<prefix>/<description>` 形式．小文字・英数字・ハイフンのみ（連続・末尾ハイフン禁止）．

- `feature/` — 新機能（例: `feature/login-system`）
- `fix/` — バグ修正（例: `fix/header-styling`）
- `hotfix/` — 本番緊急修正（例: `hotfix/security-patch`）
- `release/` — リリース準備（例: `release/v1.0.1`）
- `docs/` — ドキュメント更新（例: `docs/api-endpoints`）
