/**
 * API レイヤー – バックエンド不要版。
 * すべてのデータを LocalStorage で管理する。
 */

import { parseVoiceControlCommands, createCombinedPlist } from "./utils/parser";
import type { ParseResult, ExportCommandData } from "./utils/parser";

// --- 型定義 (変更なし) ---

export interface Point {
  x: number;
  y: number;
}

export interface EnvironmentSettings {
  id: string;
  name: string;
  modelId: string;
  orientation: "portrait" | "landscape";
  scale: number;
  showGrid: boolean;
  showPoints: boolean;
  backgroundImage: string | null;
}

export interface Command {
  id: string;
  name: string;
  points: Point[];
  strokes: Point[][];
  strokeMetadata?: { waitAfter?: number }[];
  isVisible?: boolean;
  duration?: number;
  waitDuration?: number;
  color?: string;
  showPoints?: boolean;
}

export interface ExportResponse {
  filename: string;
  content: string; // Base64 エンコード
}

export interface VoiceControlFile {
  id: string;
  name: string;
  originalContent: string;
  commands: Command[];
  offsetX: number;
  offsetY: number;
  selectedCommandId: string | null;
  isVisible: boolean;
  color: string;
}

// --- ファイル解析 ---

/**
 * .voicecontrolcommands ファイルをブラウザ内で直接解析する。
 * バックエンドへの通信は不要。
 */
export const parseFile = async (file: File): Promise<ParseResult> => {
  const arrayBuffer = await file.arrayBuffer();
  return parseVoiceControlCommands(arrayBuffer);
};

// --- エクスポート ---

/**
 * コマンドを .voicecontrolcom ファイルとしてエクスポートする。
 * バックエンドの /api/export_merged と同等の処理をブラウザ内で実行。
 * 戻り値は Base64 コンテンツではなく、直接 Uint8Array を返す。
 */
export const exportMerged = (commands: ExportCommandData[]): Uint8Array => {
  return createCombinedPlist(commands);
};

// --- プロジェクト API (LocalStorage) ---

const PROJECTS_STORAGE_KEY = "vcc_projects";

export interface ProjectSummary {
  id: string;
  name: string;
}

export interface ProjectData {
  id?: string;
  name: string;
  commands: Command[];
  settings: Record<string, unknown>;
}

/** LocalStorage からプロジェクト一覧を取得 */
function getProjectsFromStorage(): Record<string, ProjectData> {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** LocalStorage にプロジェクト一覧を保存 */
function saveProjectsToStorage(projects: Record<string, ProjectData>): void {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

export const fetchProjects = async (): Promise<ProjectSummary[]> => {
  const projects = getProjectsFromStorage();
  return Object.entries(projects).map(([id, data]) => ({
    id,
    name: data.name,
  }));
};

export const loadProject = async (id: string): Promise<ProjectData> => {
  const projects = getProjectsFromStorage();
  const project = projects[id];
  if (!project) throw new Error("プロジェクトが見つかりません");
  return { ...project, id };
};

export const createProject = async (
  data: ProjectData,
): Promise<ProjectData> => {
  const projects = getProjectsFromStorage();
  const id = crypto.randomUUID();
  const projectContent: ProjectData = {
    id,
    name: data.name,
    commands: data.commands,
    settings: data.settings,
  };
  projects[id] = projectContent;
  saveProjectsToStorage(projects);
  return projectContent;
};

export const updateProject = async (
  id: string,
  data: ProjectData,
): Promise<ProjectData> => {
  const projects = getProjectsFromStorage();
  if (!projects[id]) throw new Error("プロジェクトが見つかりません");
  const projectContent: ProjectData = {
    id,
    name: data.name,
    commands: data.commands,
    settings: data.settings,
  };
  projects[id] = projectContent;
  saveProjectsToStorage(projects);
  return projectContent;
};

export const deleteProject = async (id: string): Promise<void> => {
  const projects = getProjectsFromStorage();
  if (!projects[id]) throw new Error("プロジェクトが見つかりません");
  delete projects[id];
  saveProjectsToStorage(projects);
};

// --- 背景画像 API (LocalStorage) ---

const BACKGROUNDS_STORAGE_KEY = "vcc_backgrounds";

export interface BackgroundImage {
  id: string;
  url: string; // Base64 Data URL
}

/** LocalStorage から背景画像リストを取得 */
function getBackgroundsFromStorage(): BackgroundImage[] {
  try {
    const raw = localStorage.getItem(BACKGROUNDS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** LocalStorage に背景画像リストを保存 */
function saveBackgroundsToStorage(backgrounds: BackgroundImage[]): void {
  localStorage.setItem(BACKGROUNDS_STORAGE_KEY, JSON.stringify(backgrounds));
}

export async function fetchBackgrounds(): Promise<BackgroundImage[]> {
  return getBackgroundsFromStorage();
}

export async function uploadBackground(file: File): Promise<BackgroundImage> {
  // ファイルを Base64 Data URL に変換
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const id = crypto.randomUUID();
  const bgImage: BackgroundImage = { id, url: dataUrl };

  const backgrounds = getBackgroundsFromStorage();
  backgrounds.unshift(bgImage); // 新しいものを先頭に
  saveBackgroundsToStorage(backgrounds);

  return bgImage;
}

export async function deleteBackground(id: string): Promise<void> {
  const backgrounds = getBackgroundsFromStorage();
  const filtered = backgrounds.filter((bg) => bg.id !== id);
  saveBackgroundsToStorage(filtered);
}

// --- 後方互換性のためにダミーで残す定数 ---
// これらはもう使われないが、import エラーを防ぐために残す
export const API_BASE_URL = "";
export const SERVER_URL = "";
