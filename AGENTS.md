# TaktScore

ドラム譜入力・保存・再生アプリ．

## ドメイン定義

型・定数・ファクトリ関数は `src/lib/constants.ts` にまとめる．

### コアモデル

- **PartId** — ドラムパーツを表す文字列リテラル型（CRASH / HH / SNARE / BD など9種）
- **Measure** — 1小節．PartId をキーに，16ステップの on/off 配列を持つ `Record`
- **Score** — 保存単位．`Measure[]` の配列にメタ情報（title, bpm, id, timestamps）を付加したもの

### アーキテクチャ概要

- `src/app/` — Next.js App Router のページ
  - `src/app/api` — API Route（データの読み書きは `/api/scores` を経由）
  - `src/app/**/_components` — コロケーションされたコンポーネント
  - `src/app/**/_hooks` — コロケーションされたフック
- `src/components/` — UI コンポーネント
- `src/components/ui/` — shadcn/ui のコンポーネント（コマンドで追加されたものは編集しない）
- `src/hooks/` — Web Audio API を使った再生ロジック
- `src/lib/` — ドメイン定義・音声合成・ストレージ・ユーティリティ
- `data/scores.json` — スコアデータの永続化先

## UI の方針

- UI コンポーネントが必要になったら，まず `@/components/ui/` から該当するものを探す．
- なければ [shadcn/ui](https://ui.shadcn.com/docs/components) から該当するものを探し，pnpm 用のインストールコマンドを実行して `@/components/ui/` に追加する．
- 静的スタイルは Tailwind クラスで書く．

## データ保存方針

個人用のアプリなので，DB は不要．`/data` に JSON で保存する．

## コーディング規約

### クラス

- **className の長さ** — 80文字を超える場合は `cn()` (`@/lib/utils.ts`) を使って複数引数に分割する．80文字以下なら文字列リテラルのままでよい．
- **任意値（`[...]`）は原則禁止** — 任意値より組み込みスケールを優先する．組み込みに対応するものがない場合のみ任意値を使う．

### その他

- **アイコン** — 一般的なアイコンは `lucide-react` を使用し，アプリ固有のアイコンは `@/components/Icon.tsx` に SVG で定義する．
