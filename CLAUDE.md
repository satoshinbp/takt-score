# DrumMaster

耳コピしたドラムパターンを手軽に入力・保存・再生できる個人用 Web アプリ。
手書き譜面の手間をなくすことが開発動機。

## 技術スタック

| レイヤー       | 採用技術             |
| -------------- | -------------------- |
| フレームワーク | Next.js (App Router) |
| UI ライブラリ  | Radix UI Primitives  |
| スタイリング   | Tailwind CSS v4      |
| 言語           | TypeScript           |

## UI の方針

- **Radix UI ファースト** — ボタン・スライダー・トグル・ツールチップ等は Radix UI Primitives を使い、テーマに合わせてスタイルを上書きする。素の `<input type="range">` や自前の toggle 実装は作らない。
  参考: https://www.radix-ui.com/primitives/docs
- **`src/components/ui/` 経由** — `@radix-ui/*` はフィーチャーコンポーネントから直接 import しない。`src/components/ui/` 配下のラッパーコンポーネントを介して使う。新しいプリミティブが必要になったら `ui/` に追加する。
- **インラインスタイルは動的色のみ** — `accentColor` や `theme` など実行時に変わる値は `style={}` で渡す。静的な構造・余白・サイズは Tailwind クラスで書く。
- テーマは `THEMES` (`dark` / `light`) で切り替え、アクセントカラーは `accentColor` プロパティで各コンポーネントに伝播させる。

## データモデル

`src/lib/constants.ts` に型・定数・デフォルトパターンをまとめる。

```ts
type PartId =
  | "CRASH"
  | "HH"
  | "HH_OPEN"
  | "RIDE"
  | "HI_TOM"
  | "MID_TOM"
  | "SNARE"
  | "LO_TOM"
  | "BD";
type Measure = Record<PartId, number[]>; // number[] の長さ = SUBDIVISIONS (16)
```

- 1 小節 = 16 分割（16分音符単位）
- 拍子は固定 4/4

## 保存方針

DB は不要（個人用）。`localStorage` に JSON で保存する。`indexedDB` は将来的な複数パターン管理の際に検討する。

## コンポーネント構成

```
DrumApp          トップレベル。テーマ・アクセントカラーの状態管理
└── EditorScreen 編集画面全体
    ├── WaveformView  シークバー兼 A/B マーカー
    ├── PartMixer     パートごとの Mute / Solo
    ├── DrumStaff     SVG 譜面グリッド（クリックでノート編集）
    └── TransportBar  再生・BPM・ループ・A/B コントロール
```

## コーディング規約

- **関数定義** — React コンポーネント以外はアロー関数で書く。ユーティリティ・フック・ヘルパー等はすべて `const foo = () => {}` 形式にする。
- **className の長さ** — 80文字を超える場合は `cn()` (`src/lib/utils.ts`) を使って複数引数に分割する。80文字以下なら文字列リテラルのままでよい。
- **CSS 変数の参照** — Tailwind v4 の短縮構文 `(--var)` を使う（`[var(--var)]` は書かない）。
- **任意値（`[...]`）は原則禁止** — `text-[10px]` や `tracking-[-0.02em]` のような任意値より、`text-xs` / `tracking-tight` などの組み込みスケールを優先する。組み込みに対応するものがない場合のみ任意値を使う。例外は CSS 変数参照 `(--var)` と動的な `style={}` のみ。
- **一般アイコン** — `lucide-react` を使う。ドラム固有の図形は `DrumIcon.tsx` に SVG で定義する。

## 禁止事項・注意点

- 外部 API・DB は導入しない（個人用、オーバーエンジニアリング回避）。
