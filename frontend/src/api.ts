/**
 * API レイヤー – バックエンド不要版。
 * すべてのデータを LocalStorage で管理する。
 */

import { parseVoiceControlCommands, createCombinedPlist } from "./utils/parser";
import type { ParseResult, ExportCommandData } from "./utils/parser";
import { auth, db } from "./lib/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";

/**
 * Firestoreにデータを保存する際、
 * 1. `undefined` が含まれているとエラーになる
 * 2. Nested Arrays (配列の配列)が含まれているとエラーになる
 * そのため、オブジェクトから undefined を除去し、
 * 配列の中にさらに配列が含まれるもの（例: strokes: Point[][]）は JSON 文字列に変換する。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeForFirestore(obj: any): any {
  if (Array.isArray(obj)) {
    // Nested Array かどうかチェック
    // 配列の要素に一つでも配列があれば、この配列自体をシリアライズする
    const hasNestedArray = obj.some((item) => Array.isArray(item));
    if (hasNestedArray) {
      return { _isNestedArray: true, data: JSON.stringify(obj) };
    }
    // Nested Arrayでなければ、各要素を再帰的に処理
    return obj.map(serializeForFirestore);
  } else if (obj !== null && typeof obj === "object") {
    if (obj._isNestedArray) return obj;
    return Object.keys(obj).reduce((acc, key) => {
      if (obj[key] !== undefined) {
        acc[key] = serializeForFirestore(obj[key]);
      }
      return acc;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any);
  }
  return obj;
}

/**
 * Firestore から取得したデータを元の形に復元するユーティリティ。
 * _isNestedArray フラグを持つオブジェクトを配列に戻す。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializeFromFirestore(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(deserializeFromFirestore);
  } else if (obj !== null && typeof obj === "object") {
    if (obj._isNestedArray && typeof obj.data === "string") {
      try {
        return JSON.parse(obj.data);
      } catch (e) {
        console.error("Failed to parse nested array from Firestore", e);
        return [];
      }
    }
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = deserializeFromFirestore(obj[key]);
      return acc;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any);
  }
  return obj;
}
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
}

export interface Command {
  id: string;
  name: string;
  points: Point[];
  strokes: Point[][];
  strokeMetadata?: { waitAfter?: number }[];
  isVisible?: boolean;
  duration?: number;
  tapDuration?: number;
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

// --- プロジェクト API (IndexedDB) ---

const PROJ_DB_NAME = "vcc_projects_db";
const PROJ_DB_VERSION = 1;
const PROJ_STORE_NAME = "projects";

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

/** IndexedDB に保存するプロジェクトレコード */
interface ProjectRecord {
  id: string;
  name: string;
  commands: Command[];
  settings: Record<string, unknown>;
  updatedAt: number; // タイムスタンプ（ソート用）
}

/** プロジェクト用 IndexedDB を開く */
function openProjDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PROJ_DB_NAME, PROJ_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJ_STORE_NAME)) {
        db.createObjectStore(PROJ_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** localStorage から旧プロジェクトデータをマイグレーションする（初回のみ） */
async function migrateProjectsFromLocalStorage(): Promise<void> {
  const LEGACY_KEY = "vcc_projects";
  const MIGRATED_FLAG = "vcc_projects_migrated";

  if (localStorage.getItem(MIGRATED_FLAG)) return;

  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATED_FLAG, "true");
    return;
  }

  try {
    const legacyProjects: Record<string, ProjectData> = JSON.parse(raw);
    const entries = Object.entries(legacyProjects);
    if (entries.length === 0) {
      localStorage.setItem(MIGRATED_FLAG, "true");
      return;
    }

    const dbInstance = await openProjDb();
    const tx = dbInstance.transaction(PROJ_STORE_NAME, "readwrite");
    const store = tx.objectStore(PROJ_STORE_NAME);

    for (let i = 0; i < entries.length; i++) {
      const [id, data] = entries[i];
      const record: ProjectRecord = {
        id,
        name: data.name,
        commands: data.commands,
        settings: data.settings,
        updatedAt: Date.now() - i,
      };
      store.put(record);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    dbInstance.close();

    localStorage.removeItem(LEGACY_KEY);
    localStorage.setItem(MIGRATED_FLAG, "true");
  } catch (err) {
    console.error("プロジェクトのマイグレーションに失敗:", err);
  }
}

/** プロジェクト一覧を取得（更新日時の新しい順） */
export const fetchProjects = async (): Promise<ProjectSummary[]> => {
  if (auth.currentUser) {
    const q = query(
      collection(db, "users", auth.currentUser.uid, "projects"),
      orderBy("updatedAt", "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      name: d.data().name,
    }));
  }

  await migrateProjectsFromLocalStorage();

  const dbInstance = await openProjDb();
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(PROJ_STORE_NAME, "readonly");
    const store = tx.objectStore(PROJ_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const records: ProjectRecord[] = request.result;
      records.sort((a, b) => b.updatedAt - a.updatedAt);
      const summaries: ProjectSummary[] = records.map((r) => ({
        id: r.id,
        name: r.name,
      }));
      dbInstance.close();
      resolve(summaries);
    };
    request.onerror = () => {
      dbInstance.close();
      reject(request.error);
    };
  });
};

/** プロジェクトを読み込む */
export const loadProject = async (id: string): Promise<ProjectData> => {
  if (auth.currentUser) {
    const docRef = doc(db, "users", auth.currentUser.uid, "projects", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error("プロジェクトが見つかりません");
    }
    const data = deserializeFromFirestore(snap.data());
    return {
      id: snap.id,
      name: data.name,
      commands: data.commands,
      settings: data.settings,
    };
  }

  const dbInstance = await openProjDb();
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(PROJ_STORE_NAME, "readonly");
    const store = tx.objectStore(PROJ_STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      dbInstance.close();
      const record: ProjectRecord | undefined = request.result;
      if (!record) {
        reject(new Error("プロジェクトが見つかりません"));
        return;
      }
      resolve({
        id: record.id,
        name: record.name,
        commands: record.commands,
        settings: record.settings,
      });
    };
    request.onerror = () => {
      dbInstance.close();
      reject(request.error);
    };
  });
};

/** プロジェクトを新規作成 */
export const createProject = async (
  data: ProjectData,
): Promise<ProjectData> => {
  const id = crypto.randomUUID();

  if (auth.currentUser) {
    const docRef = doc(db, "users", auth.currentUser.uid, "projects", id);
    await setDoc(
      docRef,
      serializeForFirestore({
        name: data.name,
        commands: data.commands,
        settings: data.settings,
        updatedAt: Date.now(),
      }),
    );
    return {
      id,
      name: data.name,
      commands: data.commands,
      settings: data.settings,
    };
  }

  const record: ProjectRecord = {
    id,
    name: data.name,
    commands: data.commands,
    settings: data.settings,
    updatedAt: Date.now(),
  };

  const dbInstance = await openProjDb();
  await new Promise<void>((resolve, reject) => {
    const tx = dbInstance.transaction(PROJ_STORE_NAME, "readwrite");
    const store = tx.objectStore(PROJ_STORE_NAME);
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  dbInstance.close();

  return {
    id,
    name: data.name,
    commands: data.commands,
    settings: data.settings,
  };
};

/** プロジェクトを上書き保存 */
export const updateProject = async (
  id: string,
  data: ProjectData,
): Promise<ProjectData> => {
  if (auth.currentUser) {
    const docRef = doc(db, "users", auth.currentUser.uid, "projects", id);
    await updateDoc(
      docRef,
      serializeForFirestore({
        name: data.name,
        commands: data.commands,
        settings: data.settings,
        updatedAt: Date.now(),
      }),
    );
    return {
      id,
      name: data.name,
      commands: data.commands,
      settings: data.settings,
    };
  }

  const dbInstance = await openProjDb();
  // 存在確認
  const existing = await new Promise<ProjectRecord | undefined>(
    (resolve, reject) => {
      const tx = dbInstance.transaction(PROJ_STORE_NAME, "readonly");
      const store = tx.objectStore(PROJ_STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    },
  );

  if (!existing) {
    dbInstance.close();
    throw new Error("プロジェクトが見つかりません");
  }

  const record: ProjectRecord = {
    id,
    name: data.name,
    commands: data.commands,
    settings: data.settings,
    updatedAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = dbInstance.transaction(PROJ_STORE_NAME, "readwrite");
    const store = tx.objectStore(PROJ_STORE_NAME);
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  dbInstance.close();

  return {
    id,
    name: data.name,
    commands: data.commands,
    settings: data.settings,
  };
};

/** プロジェクト名を変更 */
export const renameProject = async (
  id: string,
  newName: string,
): Promise<void> => {
  if (auth.currentUser) {
    const docRef = doc(db, "users", auth.currentUser.uid, "projects", id);
    await updateDoc(docRef, {
      name: newName,
      updatedAt: Date.now(),
    });
    return;
  }

  const dbInstance = await openProjDb();

  const existing = await new Promise<ProjectRecord | undefined>(
    (resolve, reject) => {
      const tx = dbInstance.transaction(PROJ_STORE_NAME, "readonly");
      const store = tx.objectStore(PROJ_STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    },
  );

  if (!existing) {
    dbInstance.close();
    throw new Error("プロジェクトが見つかりません");
  }

  existing.name = newName;
  existing.updatedAt = Date.now();

  await new Promise<void>((resolve, reject) => {
    const tx = dbInstance.transaction(PROJ_STORE_NAME, "readwrite");
    const store = tx.objectStore(PROJ_STORE_NAME);
    store.put(existing);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  dbInstance.close();
};

/** プロジェクトを削除 */
export const deleteProject = async (id: string): Promise<void> => {
  if (auth.currentUser) {
    const docRef = doc(db, "users", auth.currentUser.uid, "projects", id);
    await deleteDoc(docRef);
    return;
  }

  const dbInstance = await openProjDb();
  await new Promise<void>((resolve, reject) => {
    const tx = dbInstance.transaction(PROJ_STORE_NAME, "readwrite");
    const store = tx.objectStore(PROJ_STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  dbInstance.close();
};

// --- 背景画像 API (IndexedDB) ---

const BG_DB_NAME = "vcc_backgrounds_db";
const BG_DB_VERSION = 1;
const BG_STORE_NAME = "backgrounds";

export interface BackgroundImage {
  id: string;
  url: string; // Object URL（表示用、メモリ上のみ）
}

/** IndexedDB に保存する背景画像レコード */
interface BackgroundRecord {
  id: string;
  blob: Blob;
  createdAt: number; // タイムスタンプ（ソート用）
}

/** IndexedDB のデータベースを開く */
function openBgDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BG_DB_NAME, BG_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BG_STORE_NAME)) {
        db.createObjectStore(BG_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** localStorage から旧データをマイグレーションする（初回のみ） */
async function migrateFromLocalStorage(): Promise<void> {
  const LEGACY_KEY = "vcc_backgrounds";
  const MIGRATED_FLAG = "vcc_backgrounds_migrated";

  // マイグレーション済みならスキップ
  if (localStorage.getItem(MIGRATED_FLAG)) return;

  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATED_FLAG, "true");
    return;
  }

  try {
    const legacyData: { id: string; url: string }[] = JSON.parse(raw);
    if (legacyData.length === 0) {
      localStorage.setItem(MIGRATED_FLAG, "true");
      return;
    }

    const dbInstance = await openBgDb();
    const tx = dbInstance.transaction(BG_STORE_NAME, "readwrite");
    const store = tx.objectStore(BG_STORE_NAME);

    for (let i = 0; i < legacyData.length; i++) {
      const item = legacyData[i];
      // Base64 Data URL を Blob に変換
      try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const record: BackgroundRecord = {
          id: item.id,
          blob,
          createdAt: Date.now() - i, // 順序を維持（先頭が最新）
        };
        store.put(record);
      } catch {
        // 変換に失敗した場合はスキップ
        console.warn(`背景画像のマイグレーションをスキップ: ${item.id}`);
      }
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    dbInstance.close();

    // 旧データを削除してフラグを立てる
    localStorage.removeItem(LEGACY_KEY);
    localStorage.setItem(MIGRATED_FLAG, "true");
  } catch (err) {
    console.error("背景画像のマイグレーションに失敗:", err);
    // 失敗しても続行可能（次回再試行される）
  }
}

/** 背景画像一覧を取得（新しい順） */
export async function fetchBackgrounds(): Promise<BackgroundImage[]> {
  // 初回のみ旧データをマイグレーション
  await migrateFromLocalStorage();

  const dbInstance = await openBgDb();
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(BG_STORE_NAME, "readonly");
    const store = tx.objectStore(BG_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const records: BackgroundRecord[] = request.result;
      // 新しい順にソート
      records.sort((a, b) => b.createdAt - a.createdAt);
      const images: BackgroundImage[] = records.map((r) => ({
        id: r.id,
        url: URL.createObjectURL(r.blob),
      }));
      dbInstance.close();
      resolve(images);
    };
    request.onerror = () => {
      dbInstance.close();
      reject(request.error);
    };
  });
}

/** 背景画像をアップロード（IndexedDB に Blob として保存） */
export async function uploadBackground(file: File): Promise<BackgroundImage> {
  const id = crypto.randomUUID();

  const blob = new Blob([await file.arrayBuffer()], { type: file.type });

  const record: BackgroundRecord = {
    id,
    blob,
    createdAt: Date.now(),
  };

  const dbInstance = await openBgDb();
  await new Promise<void>((resolve, reject) => {
    const tx = dbInstance.transaction(BG_STORE_NAME, "readwrite");
    const store = tx.objectStore(BG_STORE_NAME);
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  dbInstance.close();

  return { id, url: URL.createObjectURL(blob) };
}

/** 背景画像を削除 */
export async function deleteBackground(id: string): Promise<void> {
  const dbInstance = await openBgDb();
  await new Promise<void>((resolve, reject) => {
    const tx = dbInstance.transaction(BG_STORE_NAME, "readwrite");
    const store = tx.objectStore(BG_STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  dbInstance.close();
}

// --- 後方互換性のためにダミーで残す定数 ---
// ControlPanel.tsx で import されているため残す
export const API_BASE_URL = "";
export const SERVER_URL = "";
