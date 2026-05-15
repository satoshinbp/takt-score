export const LANGS = ["en", "ja"] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "en";
const STORAGE_KEY = "takt-score:lang";

const en = {
  "header.toLight": "Switch to light mode",
  "header.toDark": "Switch to dark mode",
  "header.langJa": "日本語",
  "header.langEn": "English",
  "header.langSwitchToJa": "日本語に切り替え",
  "header.langSwitchToEn": "Switch to English",

  "dashboard.title": "Scores",
  "dashboard.count": "{count} scores",
  "dashboard.newScore": "New score",

  "scoreCard.measures": "{count} measures",
  "scoreCard.duplicate": "Duplicate",
  "scoreCard.copySuffix": "(copy)",

  "detail.confirmDelete": 'Delete "{title}"?',
  "detail.notFound": "Score not found",

  "transport.play": "Play",
  "transport.pause": "Pause",
  "transport.stop": "Stop",
  "transport.loop": "Loop",

  "cellPopover.velocity": "Velocity",
  "cellPopover.ornament": "Ornament",
  "cellPopover.hint.off": "Don't play",
  "cellPopover.hint.normal": "Normal",
  "cellPopover.hint.accent": "Accent (>)",
  "cellPopover.hint.ghost": "Ghost (faded)",
  "cellPopover.hint.ornamentNone": "No ornament",
  "cellPopover.hint.flam": "Ornament 1",
  "cellPopover.hint.drag": "Ornament 2",
  "cellPopover.hint.ruff": "Ornament 3",

  "scoreEditor.back": "Back",
  "scoreEditor.titlePlaceholder": "Title...",
  "scoreEditor.create": "Create",
  "scoreEditor.save": "Save",

  "scoreEditorToolbar.aiGenerate": "AI generate",
  "scoreEditorToolbar.add": "Add",
  "scoreEditorToolbar.addBlank": "Blank measure",
  "scoreEditorToolbar.duplicateSelected": "Duplicate selection",
  "scoreEditorToolbar.duplicateLast": "Duplicate last",
  "scoreEditorToolbar.selectionOps": "Selection",
  "scoreEditorToolbar.selectPrompt":
    "Click an M-number below to select a measure",
  "scoreEditorToolbar.selectedBadge": "M{measures} selected",
  "scoreEditorToolbar.copy": "Copy",
  "scoreEditorToolbar.paste": "Paste ({count})",
  "scoreEditorToolbar.clear": "Clear",
  "scoreEditorToolbar.delete": "Delete",
  "scoreEditorToolbar.deselect": "Deselect",

  "aiDialog.title": "Generate score with AI",
  "aiDialog.songTitle": "Song title *",
  "aiDialog.artist": "Artist",
  "aiDialog.genre": "Genre",
  "aiDialog.genrePlaceholder": "Select…",
  "aiDialog.genreOther": "Other",
  "aiDialog.measureCount": "Measures",
  "aiDialog.audioFile": "Audio file (auto BPM)",
  "aiDialog.detecting": "Detecting…",
  "aiDialog.selectFile": "Select",
  "aiDialog.filePlaceholder": "MP3 / WAV, etc.",
  "aiDialog.requests": "Additional requests",
  "aiDialog.requestsPlaceholder":
    "Beginner-friendly, halftime, more fills, etc.",
  "aiDialog.cancel": "Cancel",
  "aiDialog.generating": "Generating…",
  "aiDialog.generate": "Generate",
  "aiDialog.bpmDetectFailed": "Failed to detect BPM. Please enter it manually.",
  "aiDialog.generateFailed": "Generation failed",
  "aiDialog.networkError": "Network error",

  "scoreViewer.edit": "Edit",
  "scoreViewer.delete": "Delete",
  "scoreViewer.back": "Back",
} as const;

export type DictKey = keyof typeof en;

const ja: Record<DictKey, string> = {
  "header.toLight": "ライトモードに切り替え",
  "header.toDark": "ダークモードに切り替え",
  "header.langJa": "日本語",
  "header.langEn": "English",
  "header.langSwitchToJa": "日本語に切り替え",
  "header.langSwitchToEn": "Switch to English",

  "dashboard.title": "Scores",
  "dashboard.count": "{count}件",
  "dashboard.newScore": "新規ドラム譜",

  "scoreCard.measures": "{count}小節",
  "scoreCard.duplicate": "複製",
  "scoreCard.copySuffix": "(コピー)",

  "detail.confirmDelete": "「{title}」を削除しますか？",
  "detail.notFound": "スコアが見つかりません",

  "transport.play": "再生",
  "transport.pause": "一時停止",
  "transport.stop": "停止",
  "transport.loop": "ループ",

  "cellPopover.velocity": "強弱",
  "cellPopover.ornament": "装飾音",
  "cellPopover.hint.off": "鳴らさない",
  "cellPopover.hint.normal": "通常",
  "cellPopover.hint.accent": "強く（>）",
  "cellPopover.hint.ghost": "弱く（半透明）",
  "cellPopover.hint.ornamentNone": "装飾音なし",
  "cellPopover.hint.flam": "装飾音 1",
  "cellPopover.hint.drag": "装飾音 2",
  "cellPopover.hint.ruff": "装飾音 3",

  "scoreEditor.back": "戻る",
  "scoreEditor.titlePlaceholder": "タイトル...",
  "scoreEditor.create": "作成",
  "scoreEditor.save": "保存",

  "scoreEditorToolbar.aiGenerate": "AI 生成",
  "scoreEditorToolbar.add": "追加",
  "scoreEditorToolbar.addBlank": "空の小節",
  "scoreEditorToolbar.duplicateSelected": "選択を複製",
  "scoreEditorToolbar.duplicateLast": "末尾を複製",
  "scoreEditorToolbar.selectionOps": "選択操作",
  "scoreEditorToolbar.selectPrompt": "下のM番号をクリックして小節を選択",
  "scoreEditorToolbar.selectedBadge": "M{measures} 選択中",
  "scoreEditorToolbar.copy": "コピー",
  "scoreEditorToolbar.paste": "貼り付け ({count})",
  "scoreEditorToolbar.clear": "クリア",
  "scoreEditorToolbar.delete": "削除",
  "scoreEditorToolbar.deselect": "解除",

  "aiDialog.title": "AI で譜面を生成",
  "aiDialog.songTitle": "曲名 *",
  "aiDialog.artist": "アーティスト",
  "aiDialog.genre": "ジャンル",
  "aiDialog.genrePlaceholder": "選択…",
  "aiDialog.genreOther": "その他",
  "aiDialog.measureCount": "小節数",
  "aiDialog.audioFile": "音声ファイル（BPM 自動検出）",
  "aiDialog.detecting": "検出中…",
  "aiDialog.selectFile": "選択",
  "aiDialog.filePlaceholder": "MP3 / WAV など",
  "aiDialog.requests": "追加リクエスト",
  "aiDialog.requestsPlaceholder": "初心者向け、ハーフタイム、フィル多めなど",
  "aiDialog.cancel": "キャンセル",
  "aiDialog.generating": "生成中…",
  "aiDialog.generate": "生成する",
  "aiDialog.bpmDetectFailed":
    "BPM の検出に失敗しました。手動で入力してください。",
  "aiDialog.generateFailed": "生成に失敗しました",
  "aiDialog.networkError": "ネットワークエラーが発生しました",

  "scoreViewer.edit": "編集",
  "scoreViewer.delete": "削除",
  "scoreViewer.back": "戻る",
};

const dict: Record<Lang, Record<DictKey, string>> = { en, ja };

const isLang = (v: unknown): v is Lang =>
  typeof v === "string" && (LANGS as readonly string[]).includes(v);

const listeners = new Set<() => void>();

export const subscribeLang = (listener: () => void) => {
  listeners.add(listener);
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", handler);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handler);
  };
};

export const getLangSnapshot = (): Lang => {
  const v = localStorage.getItem(STORAGE_KEY);
  return isLang(v) ? v : DEFAULT_LANG;
};

export const getServerLangSnapshot = (): Lang => DEFAULT_LANG;

export const setLang = (lang: Lang) => {
  localStorage.setItem(STORAGE_KEY, lang);
  listeners.forEach((l) => l());
};

export const translate = (
  lang: Lang,
  key: DictKey,
  params?: Record<string, string | number>
): string => {
  const template = dict[lang][key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in params ? String(params[k]) : `{${k}}`
  );
};
