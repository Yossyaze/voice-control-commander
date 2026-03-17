import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import Canvas from "./components/Canvas";
import ControlPanel from "./components/ControlPanel";
import Sidebar from "./components/Sidebar";
import AuthStatus from "./components/AuthStatus";
import { useAuth } from "./contexts/AuthContext";
import { useDialog } from "./contexts/DialogContext";
import {
  type Command,
  type Point,
  parseFile,
  exportMerged,
  type EnvironmentSettings,
  fetchProjects,
  loadProject,
  createProject,
  updateProject,
  renameProject,
  deleteProject,
  type ProjectSummary,
  type BackgroundImage,
  fetchBackgrounds,
  uploadBackground,
  deleteBackground,
} from "./api";

// Define Device Model Interface
interface DeviceModel {
  id: string;
  name: string;
  width: number;
  height: number;
  category: "iPhone" | "iPad";
}

// Comprehensive List of Apple Devices
const DEVICE_MODELS: DeviceModel[] = [
  // iPhone 16 Series
  {
    id: "iphone_16_pro_max",
    name: "iPhone 16 Pro Max",
    width: 440,
    height: 956,
    category: "iPhone",
  },
  {
    id: "iphone_16_pro",
    name: "iPhone 16 Pro",
    width: 402,
    height: 874,
    category: "iPhone",
  },
  {
    id: "iphone_16_plus",
    name: "iPhone 16 Plus",
    width: 430,
    height: 932,
    category: "iPhone",
  },
  {
    id: "iphone_16",
    name: "iPhone 16",
    width: 393,
    height: 852,
    category: "iPhone",
  },

  // iPhone 15 Series
  {
    id: "iphone_15_pro_max",
    name: "iPhone 15 Pro Max",
    width: 430,
    height: 932,
    category: "iPhone",
  },
  {
    id: "iphone_15_pro",
    name: "iPhone 15 Pro",
    width: 393,
    height: 852,
    category: "iPhone",
  },
  {
    id: "iphone_15_plus",
    name: "iPhone 15 Plus",
    width: 430,
    height: 932,
    category: "iPhone",
  },
  {
    id: "iphone_15",
    name: "iPhone 15",
    width: 393,
    height: 852,
    category: "iPhone",
  },

  // iPhone 14 Series
  {
    id: "iphone_14_pro_max",
    name: "iPhone 14 Pro Max",
    width: 430,
    height: 932,
    category: "iPhone",
  },
  {
    id: "iphone_14_pro",
    name: "iPhone 14 Pro",
    width: 393,
    height: 852,
    category: "iPhone",
  },
  {
    id: "iphone_14_plus",
    name: "iPhone 14 Plus",
    width: 428,
    height: 926,
    category: "iPhone",
  },
  {
    id: "iphone_14",
    name: "iPhone 14",
    width: 390,
    height: 844,
    category: "iPhone",
  },

  // iPhone 13 Series
  {
    id: "iphone_13_pro_max",
    name: "iPhone 13 Pro Max",
    width: 428,
    height: 926,
    category: "iPhone",
  },
  {
    id: "iphone_13_pro",
    name: "iPhone 13 Pro",
    width: 390,
    height: 844,
    category: "iPhone",
  },
  {
    id: "iphone_13",
    name: "iPhone 13",
    width: 390,
    height: 844,
    category: "iPhone",
  },
  {
    id: "iphone_13_mini",
    name: "iPhone 13 mini",
    width: 375,
    height: 812,
    category: "iPhone",
  },

  // iPhone 12 Series
  {
    id: "iphone_12_pro_max",
    name: "iPhone 12 Pro Max",
    width: 428,
    height: 926,
    category: "iPhone",
  },
  {
    id: "iphone_12_pro",
    name: "iPhone 12 Pro",
    width: 390,
    height: 844,
    category: "iPhone",
  },
  {
    id: "iphone_12",
    name: "iPhone 12",
    width: 390,
    height: 844,
    category: "iPhone",
  },
  {
    id: "iphone_12_mini",
    name: "iPhone 12 mini",
    width: 375,
    height: 812,
    category: "iPhone",
  },

  // iPhone 11 Series
  {
    id: "iphone_11_pro_max",
    name: "iPhone 11 Pro Max",
    width: 414,
    height: 896,
    category: "iPhone",
  },
  {
    id: "iphone_11_pro",
    name: "iPhone 11 Pro",
    width: 375,
    height: 812,
    category: "iPhone",
  },
  {
    id: "iphone_11",
    name: "iPhone 11",
    width: 414,
    height: 896,
    category: "iPhone",
  },

  // iPhone XS/XR/X
  {
    id: "iphone_xs_max",
    name: "iPhone XS Max",
    width: 414,
    height: 896,
    category: "iPhone",
  },
  {
    id: "iphone_xs",
    name: "iPhone XS",
    width: 375,
    height: 812,
    category: "iPhone",
  },
  {
    id: "iphone_xr",
    name: "iPhone XR",
    width: 414,
    height: 896,
    category: "iPhone",
  },
  {
    id: "iphone_x",
    name: "iPhone X",
    width: 375,
    height: 812,
    category: "iPhone",
  },

  // iPhone 8/7/SE
  {
    id: "iphone_8_plus",
    name: "iPhone 8 Plus",
    width: 414,
    height: 736,
    category: "iPhone",
  },
  {
    id: "iphone_8",
    name: "iPhone 8",
    width: 375,
    height: 667,
    category: "iPhone",
  },
  {
    id: "iphone_7_plus",
    name: "iPhone 7 Plus",
    width: 414,
    height: 736,
    category: "iPhone",
  },
  {
    id: "iphone_7",
    name: "iPhone 7",
    width: 375,
    height: 667,
    category: "iPhone",
  },
  {
    id: "iphone_se_3",
    name: "iPhone SE (3rd gen)",
    width: 375,
    height: 667,
    category: "iPhone",
  },
  {
    id: "iphone_se_2",
    name: "iPhone SE (2nd gen)",
    width: 375,
    height: 667,
    category: "iPhone",
  },

  // iPad Pro
  {
    id: "ipad_pro_13_m4",
    name: 'iPad Pro 13" (M4)',
    width: 1032,
    height: 1376,
    category: "iPad",
  },
  {
    id: "ipad_pro_12_9_6",
    name: 'iPad Pro 12.9" (3rd-6th gen)',
    width: 1024,
    height: 1366,
    category: "iPad",
  },
  {
    id: "ipad_pro_12_9_2",
    name: 'iPad Pro 12.9" (1st-2nd gen)',
    width: 1024,
    height: 1366,
    category: "iPad",
  },
  {
    id: "ipad_pro_11_m4",
    name: 'iPad Pro 11" (M4)',
    width: 834,
    height: 1210,
    category: "iPad",
  },
  {
    id: "ipad_pro_11_4",
    name: 'iPad Pro 11" (1st-4th gen)',
    width: 834,
    height: 1194,
    category: "iPad",
  },
  {
    id: "ipad_pro_10_5",
    name: 'iPad Pro 10.5"',
    width: 834,
    height: 1112,
    category: "iPad",
  },
  {
    id: "ipad_pro_9_7",
    name: 'iPad Pro 9.7"',
    width: 768,
    height: 1024,
    category: "iPad",
  },

  // iPad Air
  {
    id: "ipad_air_13_m2",
    name: 'iPad Air 13" (M2)',
    width: 1032,
    height: 1376,
    category: "iPad",
  },
  {
    id: "ipad_air_11_m2",
    name: 'iPad Air 11" (M2)',
    width: 820,
    height: 1180,
    category: "iPad",
  },
  {
    id: "ipad_air_5",
    name: "iPad Air (5th gen)",
    width: 820,
    height: 1180,
    category: "iPad",
  },
  {
    id: "ipad_air_4",
    name: "iPad Air (4th gen)",
    width: 820,
    height: 1180,
    category: "iPad",
  },
  {
    id: "ipad_air_3",
    name: "iPad Air (3rd gen)",
    width: 834,
    height: 1112,
    category: "iPad",
  },

  // iPad
  {
    id: "ipad_10",
    name: "iPad (10th gen)",
    width: 820,
    height: 1180,
    category: "iPad",
  },
  {
    id: "ipad_9",
    name: "iPad (9th gen)",
    width: 810,
    height: 1080,
    category: "iPad",
  },
  {
    id: "ipad_8",
    name: "iPad (8th gen)",
    width: 810,
    height: 1080,
    category: "iPad",
  },
  {
    id: "ipad_7",
    name: "iPad (7th gen)",
    width: 810,
    height: 1080,
    category: "iPad",
  },
  {
    id: "ipad_6",
    name: "iPad (6th gen)",
    width: 768,
    height: 1024,
    category: "iPad",
  },
  {
    id: "ipad_5",
    name: "iPad (5th gen)",
    width: 768,
    height: 1024,
    category: "iPad",
  },

  // iPad mini
  {
    id: "ipad_mini_6",
    name: "iPad mini (6th gen)",
    width: 744,
    height: 1133,
    category: "iPad",
  },
  {
    id: "ipad_mini_5",
    name: "iPad mini (5th gen)",
    width: 768,
    height: 1024,
    category: "iPad",
  },
];

const DEFAULT_COMMAND_POINTS: Point[] = [
  { x: 160, y: 400 }, // Start point
  { x: 160, y: 500 }, // End point (Swipe Down)
];

const COMMAND_COLORS = [
  "#ef4444", // Red 500
  "#f97316", // Orange 500
  "#f59e0b", // Amber 500
  "#84cc16", // Lime 500
  "#10b981", // Emerald 500
  "#06b6d4", // Cyan 500
  "#3b82f6", // Blue 500
  "#6366f1", // Indigo 500
  "#8b5cf6", // Violet 500
  "#d946ef", // Fuchsia 500
  "#f43f5e", // Rose 500
  "#dc2626", // Red 600
  "#ea580c", // Orange 600
  "#d97706", // Amber 600
  "#65a30d", // Lime 600
  "#059669", // Emerald 600
  "#0891b2", // Cyan 600
  "#2563eb", // Blue 600
  "#4f46e5", // Indigo 600
  "#7c3aed", // Violet 600
  "#c026d3", // Fuchsia 600
  "#e11d48", // Rose 600
];

// --- localStorage ヘルパー ---
const STORAGE_KEY = "voiceControlCommander";

function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${key}`);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(value));
  } catch {
    // localStorage が満杯の場合など、エラーを握りつぶす
  }
}

function App() {
  const { confirm, prompt, alert } = useDialog();

  // --- 永続化される状態 (localStorage から復元) ---
  const [commands, setCommands] = useState<Command[]>(() =>
    loadState<Command[]>("commands", []),
  );

  // --- プロジェクト状態 ---
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() =>
    loadState<string | null>("currentProjectId", null),
  );
  const [currentProjectName, setCurrentProjectName] = useState<string>(() =>
    loadState<string>("currentProjectName", "名称未設定プロジェクト"),
  );
  const [projectsList, setProjectsList] = useState<ProjectSummary[]>([]);

  // --- 未保存状態の管理 ---
  const [savedCommandsJSON, setSavedCommandsJSON] = useState<string>(() =>
    loadState<string>("savedCommandsJSON", "[]"),
  );

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(commands) !== savedCommandsJSON;
  }, [commands, savedCommandsJSON]);

  useEffect(() => {
    saveState("savedCommandsJSON", savedCommandsJSON);
  }, [savedCommandsJSON]);

  const { currentUser } = useAuth(); // ログイン状態を取得

  useEffect(() => {
    fetchProjects()
      .then(setProjectsList)
      .catch((err) => console.error("Failed to load projects list", err));
  }, [currentUser]); // currentUser が変化したら再取得

  // プロジェクトの設定を組み立てるヘルパー
  const buildProjectSettings = () => {
    let backgroundImageId: string | null = null;
    if (backgroundImage) {
      const found = backgroundsList.find((bg) => bg.url === backgroundImage);
      backgroundImageId = found?.id ?? null;
    }

    return {
      selectedModelId,
      orientation,
      scale,
      backgroundImageId,
    };
  };

  const handleCreateProject = async (name: string) => {
    try {
      const data = await createProject({
        name,
        commands,
        settings: buildProjectSettings(),
      });
      if (data.id) {
        setCurrentProjectId(data.id);
        setCurrentProjectName(data.name);
        setProjectsList((prev) => [...prev, { id: data.id!, name: data.name }]);
        setSavedCommandsJSON(JSON.stringify(data.commands));
        alert("プロジェクトを作成しました");
      }
    } catch (err) {
      console.error(err);
      alert("プロジェクトの作成に失敗しました");
    }
  };

  const handleSaveProject = async () => {
    if (!currentProjectId) {
      const name = await prompt(
        "新しいプロジェクト名を入力してください:",
        currentProjectName,
      );
      if (name) {
        await handleCreateProject(name);
      }
      return;
    }
    try {
      await updateProject(currentProjectId, {
        name: currentProjectName,
        commands,
        settings: buildProjectSettings(),
      });
      setSavedCommandsJSON(JSON.stringify(commands));
      await alert("プロジェクトを上書き保存しました");
    } catch (err) {
      console.error(err);
      await alert("保存に失敗しました");
    }
  };

  // 名前を付けて保存（Save As）: 現在の内容を新しいプロジェクトとしてコピー保存
  const handleSaveAsProject = async () => {
    const defaultName = currentProjectName
      ? `${currentProjectName} のコピー`
      : "名称未設定プロジェクト";
    const name = await prompt(
      "新しいプロジェクト名を入力してください:",
      defaultName,
    );
    if (!name || !name.trim()) return;
    await handleCreateProject(name.trim());
  };

  const handleLoadProject = async (id: string) => {
    // 未保存の変更がある場合は確認ダイアログを表示
    if (hasUnsavedChanges) {
      const confirmed = await confirm(
        "現在の編集内容は保存されていません。\nプロジェクトを切り替えますか？",
      );
      if (!confirmed) return;
    }
    try {
      const data = await loadProject(id);
      if (data.id) {
        setCurrentProjectId(data.id);
        setCurrentProjectName(data.name);
        setCommands(data.commands);
        setSavedCommandsJSON(JSON.stringify(data.commands));
        if (data.settings) {
          if (data.settings.selectedModelId)
            setSelectedModelId(data.settings.selectedModelId as string);
          if (data.settings.orientation)
            setOrientation(
              data.settings.orientation as "portrait" | "landscape",
            );
          if (data.settings.scale) setScale(data.settings.scale as number);

          // 背景画像を IndexedDB のIDから復元
          const bgId = data.settings.backgroundImageId as string | null;
          if (bgId) {
            const matchedBg = backgroundsList.find((bg) => bg.id === bgId);
            setBackgroundImage(matchedBg?.url ?? null);
          } else {
            // 旧形式の backgroundImage（Data URL）もフォールバック対応
            if (data.settings.backgroundImage !== undefined) {
              setBackgroundImage(
                data.settings.backgroundImage as string | null,
              );
            } else {
              setBackgroundImage(null);
            }
          }
        }
        // 読み込んだコマンドの先頭を選択
        setActiveCommandId(
          data.commands.length > 0 ? data.commands[0].id : null,
        );
        // 履歴をリセット
        setPastLevels([]);
        setFutureLevels([]);
      }
    } catch (err) {
      console.error(err);
      await alert("読み込みに失敗しました");
    }
  };

  const handleDeleteProject = async (id: string) => {
    const project = projectsList.find((p) => p.id === id);
    if (!project) return;
    const confirmed = await confirm(
      `プロジェクト「${project.name}」を削除しますか？\nこの操作は元に戻せません。`,
    );
    if (!confirmed) return;
    try {
      await deleteProject(id);
      setProjectsList((prev) => prev.filter((p) => p.id !== id));
      // 削除したのが現在のプロジェクトなら未保存状態にリセット
      if (currentProjectId === id) {
        setCurrentProjectId(null);
        setCurrentProjectName("名称未設定プロジェクト");
      }
    } catch (err) {
      console.error(err);
      await alert("プロジェクトの削除に失敗しました");
    }
  };

  const handleRenameProject = async (id: string) => {
    const project = projectsList.find((p) => p.id === id);
    if (!project) return;
    const newName = await prompt("新しいプロジェクト名:", project.name);
    if (!newName || !newName.trim() || newName.trim() === project.name) return;
    try {
      await renameProject(id, newName.trim());
      setProjectsList((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: newName.trim() } : p)),
      );
      // 現在のプロジェクトなら名前も更新
      if (currentProjectId === id) {
        setCurrentProjectName(newName.trim());
      }
    } catch (err) {
      console.error(err);
      await alert("プロジェクト名の変更に失敗しました");
    }
  };

  // Helper to get next color
  const getNextColor = (currentCommands: Command[]) => {
    const usedColors = new Set(currentCommands.map((c) => c.color));
    for (const color of COMMAND_COLORS) {
      if (!usedColors.has(color)) return color;
    }
    return COMMAND_COLORS[currentCommands.length % COMMAND_COLORS.length];
  };

  // --- 一時的な状態 (永続化しない) ---
  const [activeCommandId, setActiveCommandId] = useState<string | null>(null);
  const [checkedCommandIds, setCheckedCommandIds] = useState<Set<string>>(
    new Set(),
  );
  const [checkedStrokeIndices, setCheckedStrokeIndices] = useState<Set<number>>(
    new Set(),
  );
  const [selectedStrokeIndex, setSelectedStrokeIndex] = useState<number | null>(
    null,
  );
  const [selectionType, setSelectionType] = useState<"stroke" | "wait">(
    "stroke",
  );

  useEffect(() => {
    setCheckedStrokeIndices(new Set());
  }, [activeCommandId]);

  // --- 履歴管理 (Undo / Redo) ---
  const [pastLevels, setPastLevels] = useState<Command[][]>([]);
  const [futureLevels, setFutureLevels] = useState<Command[][]>([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveToHistory = (currentCommands?: Command[]) => {
    const stateToSave = currentCommands || commands;
    setPastLevels((prev) => [
      ...prev,
      JSON.parse(JSON.stringify(stateToSave)),
    ]);
    setFutureLevels([]);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleUndo = () => {
    if (pastLevels.length === 0) return;
    const previousState = pastLevels[pastLevels.length - 1];
    setPastLevels((prev) => prev.slice(0, -1));
    setFutureLevels((prev) => [JSON.parse(JSON.stringify(commands)), ...prev]);
    setCommands(previousState);
    if (
      activeCommandId &&
      !previousState.find((c) => c.id === activeCommandId)
    ) {
      setActiveCommandId(previousState.length > 0 ? previousState[0].id : null);
      setSelectedStrokeIndex(null);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleRedo = () => {
    if (futureLevels.length === 0) return;
    const nextState = futureLevels[0];
    setFutureLevels((prev) => prev.slice(1));
    setPastLevels((prev) => [...prev, JSON.parse(JSON.stringify(commands))]);
    setCommands(nextState);
  };

  // --- 永続化される表示設定 ---
  const [selectedModelId, setSelectedModelId] = useState<string>(() =>
    loadState<string>("selectedModelId", "iphone_16_pro"),
  );
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(() =>
    loadState<"portrait" | "landscape">("orientation", "portrait"),
  );
  const [scale, setScale] = useState<number>(() =>
    loadState<number>("scale", 0.6),
  );

  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const [backgroundsList, setBackgroundsList] = useState<BackgroundImage[]>([]);
  // 背景リストの初回ロードが完了したかどうかのフラグ
  const [isBackgroundsLoaded, setIsBackgroundsLoaded] = useState(false);

  // 起動時に背景画像リストを取得
  useEffect(() => {
    const loadBackgrounds = async () => {
      try {
        const bgData = await fetchBackgrounds();
        setBackgroundsList(bgData);

        // localStorage から最後に使用した背景IDを復元
        const savedBgId = loadState<string | null>("backgroundImageId", null);
        if (savedBgId) {
          const matchedBg = bgData.find((bg) => bg.id === savedBgId);
          if (matchedBg) {
            setBackgroundImage(matchedBg.url);
          }
        }
        setIsBackgroundsLoaded(true);
      } catch (err) {
        console.error("背景画像の取得に失敗しました:", err);
        setIsBackgroundsLoaded(true);
      }
    };
    loadBackgrounds();
  }, [currentUser]);
  const [showGrid, setShowGrid] = useState<boolean>(() =>
    loadState<boolean>("showGrid", false),
  );
  const [showPoints, setShowPoints] = useState<boolean>(() =>
    loadState<boolean>("showPoints", true),
  );

  // --- 書き出し拡張子設定 ---
  const [exportExtension, setExportExtension] = useState<string>(() =>
    loadState<string>("exportExtension", ".voicecontrolcom"),
  );
  useEffect(() => {
    saveState("exportExtension", exportExtension);
  }, [exportExtension]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(() =>
    loadState<boolean>("isLeftSidebarOpen", window.innerWidth >= 768),
  );
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(() =>
    loadState<boolean>("isRightSidebarOpen", window.innerWidth >= 768),
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // --- お気に入り環境設定 ---
  const [favoriteEnvironments, setFavoriteEnvironments] = useState<
    EnvironmentSettings[]
  >(() => loadState<EnvironmentSettings[]>("favoriteEnvironments", []));

  // 名前の重複チェック（自分自身は除外可能）
  const isEnvironmentNameDuplicate = (name: string, excludeId?: string) => {
    return favoriteEnvironments.some(
      (env) => env.name === name && env.id !== excludeId,
    );
  };

  const handleSaveEnvironment = (name: string) => {
    if (isEnvironmentNameDuplicate(name)) {
      alert(
        `「${name}」は既に使われている名前です。別の名前を指定してください。`,
      );
      return;
    }
    const newEnv: EnvironmentSettings = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15),
      name,
      modelId: selectedModelId,
      orientation,
    };
    setFavoriteEnvironments((prev) => [...prev, newEnv]);
  };

  const handleLoadEnvironment = (env: EnvironmentSettings) => {
    setSelectedModelId(env.modelId);
    setOrientation(env.orientation);
  };

  // お気に入りの名前を変更する
  const handleRenameEnvironment = (id: string, newName: string) => {
    if (isEnvironmentNameDuplicate(newName, id)) {
      alert(
        `「${newName}」は既に使われている名前です。別の名前を指定してください。`,
      );
      return;
    }
    setFavoriteEnvironments((prev) =>
      prev.map((env) => (env.id === id ? { ...env, name: newName } : env)),
    );
  };

  // 既存のお気に入りを現在の設定で上書き保存する
  const handleOverwriteEnvironment = (id: string) => {
    setFavoriteEnvironments((prev) =>
      prev.map((env) =>
        env.id === id ? { ...env, modelId: selectedModelId, orientation } : env,
      ),
    );
  };

  const handleDeleteEnvironment = (id: string) => {
    setFavoriteEnvironments((prev) => prev.filter((env) => env.id !== id));
  };

  // --- localStorage への自動保存 ---
  useEffect(() => {
    saveState("commands", commands);
  }, [commands]);
  useEffect(() => {
    saveState("selectedModelId", selectedModelId);
  }, [selectedModelId]);
  useEffect(() => {
    saveState("orientation", orientation);
  }, [orientation]);
  useEffect(() => {
    saveState("scale", scale);
  }, [scale]);
  useEffect(() => {
    if (!isBackgroundsLoaded) return; // ロード完了前は保存しない（初期化でnullを上書きするのを防ぐ）

    // 保存するのは無効になるURL文字列ではなくID
    const bgId = backgroundImage
      ? (backgroundsList.find((bg) => bg.url === backgroundImage)?.id ?? null)
      : null;
    saveState("backgroundImageId", bgId);
  }, [backgroundImage, backgroundsList, isBackgroundsLoaded]);
  useEffect(() => {
    saveState("showGrid", showGrid);
  }, [showGrid]);
  useEffect(() => {
    saveState("showPoints", showPoints);
  }, [showPoints]);
  useEffect(() => {
    saveState("isLeftSidebarOpen", isLeftSidebarOpen);
  }, [isLeftSidebarOpen]);
  useEffect(() => {
    saveState("isRightSidebarOpen", isRightSidebarOpen);
  }, [isRightSidebarOpen]);
  useEffect(() => {
    saveState("favoriteEnvironments", favoriteEnvironments);
  }, [favoriteEnvironments]);

  // Remove unused state
  // const [showSettingsPopup, setShowSettingsPopup] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [markerPositions, setMarkerPositions] = useState<Point[]>([]);

  const appRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const selectedCommand = useMemo(() => {
    return commands.find((c) => c.id === activeCommandId);
  }, [commands, activeCommandId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Animation Loop
  useEffect(() => {
    if (isPlaying && selectedCommand) {
      // Build Sequential Groups based on groupId
      // Blocks of actions that start at the same time
      const timeline: {
        startTime: number;
        duration: number;
        items: {
          strokeIndex: number;
          duration: number;
        }[];
      }[] = [];

      let currentTime = 0;
      const waitTime = selectedCommand.waitDuration !== undefined ? selectedCommand.waitDuration : 0.1;

      for (let i = 0; i < selectedCommand.strokes.length; i++) {
        const metadata = selectedCommand.strokeMetadata?.[i];
        const currentGroupId = metadata?.groupId;

        // Determine duration for this stroke
        const s = selectedCommand.strokes[i];
        const strokeTapDuration = 
          metadata?.tapDuration !== undefined
            ? metadata.tapDuration
            : (selectedCommand.tapDuration || 0.05);

        const strokeDuration = s.length === 1 
          ? strokeTapDuration 
          : Math.max(0.1, (s.length - 1) / 60);

        if (currentGroupId && i > 0 && selectedCommand.strokeMetadata?.[i - 1]?.groupId === currentGroupId) {
          // Part of existing group - append to the last timeline block
          const lastBlock = timeline[timeline.length - 1];
          lastBlock.items.push({ strokeIndex: i, duration: strokeDuration });
          lastBlock.duration = Math.max(lastBlock.duration, strokeDuration);
        } else {
          // New group or sequential action
          // Wait time before this block (unless first)
          if (i > 0) {
            const prevWait = selectedCommand.strokeMetadata?.[i - 1]?.waitAfter;
            currentTime += (prevWait !== undefined ? prevWait : waitTime);
          }

          timeline.push({
            startTime: currentTime,
            duration: strokeDuration,
            items: [{ strokeIndex: i, duration: strokeDuration }]
          });
        }

        // If not grouped with next, currentTime advances by group duration
        const nextGroupId = selectedCommand.strokeMetadata?.[i + 1]?.groupId;
        if (!currentGroupId || currentGroupId !== nextGroupId) {
          currentTime += timeline[timeline.length - 1].duration;
        }
      }

      const totalDuration = currentTime;

      const animate = (time: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = time;
        }

        const elapsed = (time - startTimeRef.current) / 1000;

        if (elapsed >= totalDuration) {
          setIsPlaying(false);
          setMarkerPositions([]);
          startTimeRef.current = null;
          return;
        }

        const currentMarkers: Point[] = [];

        // Check each block in timeline
        for (const block of timeline) {
          if (elapsed >= block.startTime && elapsed < block.startTime + block.duration) {
            // This block is active
            block.items.forEach(item => {
              const localElapsed = elapsed - block.startTime;
              if (localElapsed < item.duration) {
                const stroke = selectedCommand.strokes[item.strokeIndex];
                const progress = localElapsed / item.duration;
                if (stroke.length > 0) {
                  const exactIndex = progress * (stroke.length - 1);
                  const idx = Math.floor(exactIndex);
                  const nextIdx = Math.min(idx + 1, stroke.length - 1);
                  const t = exactIndex - idx;
                  const p1 = stroke[idx];
                  const p2 = stroke[nextIdx];
                  currentMarkers.push({
                    x: p1.x + (p2.x - p1.x) * t,
                    y: p1.y + (p2.y - p1.y) * t,
                  });
                }
              } else {
                // Stroke finished within block - stick to last point if grouped?
                // For simplicity, just don't add marker if finished.
              }
            });
            break; // found the active block
          }
        }

        setMarkerPositions(currentMarkers);
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setTimeout(() => setMarkerPositions([]), 0);
      startTimeRef.current = null;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, selectedCommand]);

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const selectedDevice = useMemo(() => {
    const model =
      DEVICE_MODELS.find((d) => d.id === selectedModelId) || DEVICE_MODELS[0];
    if (orientation === "landscape") {
      return { ...model, width: model.height, height: model.width };
    }
    return model;
  }, [selectedModelId, orientation]);

  // Helper for path resampling
  const resamplePath = (points: Point[], dur: number): Point[] => {
    if (points.length === 0) return [];
    // targetCount = (所要時間 * 60フレーム) + 1 (始点分)
    // これにより、最後の点がちょうど dur 秒の地点になる。
    const targetCount = Math.max(2, Math.round(dur * 60) + 1);
    if (points.length === 1) return Array(targetCount).fill(points[0]);
    if (points.length === 2) {
      const start = points[0];
      const end = points[1];
      const newPoints: Point[] = [];
      for (let i = 0; i < targetCount; i++) {
        const t = i / (targetCount - 1);
        newPoints.push({
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t,
        });
      }
      return newPoints;
    }
    // Complex path resampling
    let totalLength = 0;
    const segmentLengths: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      segmentLengths.push(dist);
      totalLength += dist;
    }
    if (totalLength === 0) return Array(targetCount).fill(points[0]);
    const newPoints: Point[] = [points[0]];
    const step = totalLength / (targetCount - 1);
    let currentDist = 0;
    let currentSegmentIndex = 0;

    for (let i = 1; i < targetCount - 1; i++) {
      const targetDist = i * step;
      while (
        currentSegmentIndex < segmentLengths.length &&
        currentDist + segmentLengths[currentSegmentIndex] < targetDist
      ) {
        currentDist += segmentLengths[currentSegmentIndex];
        currentSegmentIndex++;
      }
      if (currentSegmentIndex >= segmentLengths.length) {
        newPoints.push(points[points.length - 1]);
        continue;
      }
      const segmentStart = points[currentSegmentIndex];
      const segmentEnd = points[currentSegmentIndex + 1];
      const segmentLen = segmentLengths[currentSegmentIndex];
      const distInSegment = targetDist - currentDist;
      const t = distInSegment / segmentLen;
      newPoints.push({
        x: segmentStart.x + (segmentEnd.x - segmentStart.x) * t,
        y: segmentStart.y + (segmentEnd.y - segmentStart.y) * t,
      });
    }
    // 最後に必ず終点を追加
    newPoints.push(points[points.length - 1]);
    return newPoints;
  };

  // Command Management
  const handleCreateNewCommand = () => {
    saveToHistory();
    const newId = crypto.randomUUID();
    const initialPoints = resamplePath(DEFAULT_COMMAND_POINTS, 0.4);

    // Create new command with one stroke
    const newCommand: Command = {
      id: newId,
      name: "新規コマンド",
      points: initialPoints, // Legacy support, keeps sync with first stroke
      strokes: [initialPoints],
      isVisible: true,
      duration: 0.4,
      tapDuration: 0.05,
      waitDuration: 0.1, // Default wait duration
      color: getNextColor(commands), // Assign color to command
    };

    setCommands((prev) => [...prev, newCommand]);
    setActiveCommandId(newId);
    setSelectedStrokeIndex(0); // Select the first stroke by default for immediate editing
    setSelectionType("stroke");
    // Auto-select the new command in multi-select too? Or clear others?
    // User requested: Do not check the checkbox automatically.
    // setCheckedCommandIds(new Set([newId]));
  };

  const handleDuplicateCommand = (id: string) => {
    const cmdToCopy = commands.find((c) => c.id === id);
    if (!cmdToCopy) return;

    saveToHistory();

    // macOSスタイル (連番) の命名ロジック
    const originalName = cmdToCopy.name;
    let nextName = "";
    
    // 末尾の「 数字」パターンを抽出 (例: "コマンド 2" -> "2")
    const match = originalName.match(/(.+)\s(\d+)$/);
    let baseName = originalName;
    let nextNumber = 2;

    if (match) {
      baseName = match[1];
      nextNumber = parseInt(match[2], 10) + 1;
    }

    // 重複しない名前が見つかるまでインクリメント
    while (true) {
      nextName = `${baseName} ${nextNumber}`;
      if (!commands.some((c) => c.name === nextName)) {
        break;
      }
      nextNumber++;
    }

    const newId = crypto.randomUUID();
    const duplicatedCommand: Command = {
      ...JSON.parse(JSON.stringify(cmdToCopy)), // deep copy
      id: newId,
      name: nextName,
      color: getNextColor(commands),
    };

    setCommands((prev) => {
      const index = prev.findIndex((c) => c.id === id);
      if (index === -1) return [...prev, duplicatedCommand];
      const next = [...prev];
      next.splice(index + 1, 0, duplicatedCommand);
      return next;
    });

    setActiveCommandId(newId);
    setSelectedStrokeIndex(0);
    setSelectionType("stroke");
  };

  const handleFileUpload = async (file: File) => {
    try {
      const result = await parseFile(file);

      saveToHistory();
      const newCommands: Command[] = [];
      const tempCommands = [...commands];

      result.commands.forEach((c) => {
        // Ensure strokes are populated
        const strokes =
          c.strokes && c.strokes.length > 0 ? c.strokes : [c.points];

        const newId = crypto.randomUUID();
        const nextColor = getNextColor(tempCommands);

        const newCmd: Command = {
          ...c,
          id: newId,
          isVisible: true,
          color: nextColor,
          strokes: strokes,
          points: strokes[0], // Main preview points
        };

        newCommands.push(newCmd);
        tempCommands.push(newCmd);
      });

      setCommands((prev) => [...prev, ...newCommands]);
      if (newCommands.length > 0) {
        setActiveCommandId(newCommands[0].id);
        setSelectedStrokeIndex(0); // Default to first stroke for immediate editing
        setSelectionType("stroke");
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      alert(`ファイルの解析に失敗しました: ${file.name}`);
    }
  };

  // selectedCommand moved up to fix scoping
  // const selectedCommand = ...

  // Helper functions for geometric transformations
  const getSelectedStrokePoints = useCallback((): Point[] | null => {
    if (!selectedCommand) return null;
    if (selectedStrokeIndex !== null) {
      if (selectedStrokeIndex < selectedCommand.strokes.length) {
        return selectedCommand.strokes[selectedStrokeIndex];
      }
    } else if (selectedCommand.strokes.length > 0) {
      return selectedCommand.strokes[0];
    }
    return null;
  }, [selectedCommand, selectedStrokeIndex]);

  const calculateAngle = (points: Point[]): number => {
    if (points.length < 2) return 0;
    const start = points[0];
    const end = points[points.length - 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    let angleRad = Math.atan2(dy, dx);
    if (angleRad < 0) angleRad += 2 * Math.PI;
    return Math.round((angleRad / (2 * Math.PI)) * 1024) % 1024;
  };

  const calculateLength = (points: Point[]): number => {
    if (points.length < 2) return 0;
    const start = points[0];
    const end = points[points.length - 1];
    return Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
    );
  };

  const updateSelectedStroke = (newPoints: Point[]) => {
    if (!activeCommandId) return;
    saveToHistory();
    setCommands((prev) =>
      prev.map((cmd) => {
        if (cmd.id !== activeCommandId) return cmd;
        const newStrokes = [...cmd.strokes];
        if (selectedStrokeIndex !== null) {
          if (selectedStrokeIndex < newStrokes.length) {
            newStrokes[selectedStrokeIndex] = newPoints;
          }
        } else {
          if (newStrokes.length > 0) newStrokes[0] = newPoints;
        }
        const legacyPoints = newStrokes.length > 0 ? newStrokes[0] : [];
        return { ...cmd, strokes: newStrokes, points: legacyPoints };
      }),
    );
  };

  const handleAngleChange = (newAngleRaw: number) => {
    const points = getSelectedStrokePoints();
    if (!points || points.length < 2) return;

    const currentAngleRaw = calculateAngle(points);
    const diffRaw = newAngleRaw - currentAngleRaw;
    const diffRad = (diffRaw / 1024) * 2 * Math.PI;

    const end = points[points.length - 1];
    const pivot = { x: end.x, y: end.y };

    const cos = Math.cos(diffRad);
    const sin = Math.sin(diffRad);

    const newPoints = points.map((p) => {
      const dx = p.x - pivot.x;
      const dy = p.y - pivot.y;
      return {
        x: pivot.x + (dx * cos - dy * sin),
        y: pivot.y + (dx * sin + dy * cos),
      };
    });

    updateSelectedStroke(newPoints);
  };

  const handleDurationChange = (newDur: number) => {
    if (!activeCommandId) return;
    if (selectedStrokeIndex !== null) {
      const points = getSelectedStrokePoints();
      if (!points || points.length < 2) return;
      const newPoints = resamplePath(points, newDur);
      updateSelectedStroke(newPoints);
    }
  };

  const handleNudge = useCallback(
    (type: "x" | "y", delta: number) => {
      if (!activeCommandId) return;
      saveToHistory();
      setCommands((prev) =>
        prev.map((cmd) => {
          if (cmd.id !== activeCommandId) return cmd;
          let strokesToUpdate: number[] = [];
          if (selectedStrokeIndex !== null) {
            const idx = selectedStrokeIndex;
            if (idx < cmd.strokes.length) strokesToUpdate.push(idx);
          } else {
            strokesToUpdate = cmd.strokes.map((_, i) => i);
          }
          const newStrokes = cmd.strokes.map((stroke, i) => {
            if (strokesToUpdate.includes(i)) {
              // Explicitly preserve length/duration by using resample or just map
              // Mapping points 1:1 preserves count, which preserves duration.
              // Just ensure we don't accidentally add/remove points.
              return stroke.map((p) => ({
                x: type === "x" ? p.x + delta : p.x,
                y: type === "y" ? p.y + delta : p.y,
              }));
            }
            return stroke;
          });
          const legacyPoints = newStrokes.length > 0 ? newStrokes[0] : [];
          return { ...cmd, strokes: newStrokes, points: legacyPoints };
        }),
      );
    },
    [activeCommandId, selectedStrokeIndex, saveToHistory],
  );

  const handleCurve = () => {
    if (!activeCommandId) return;

    saveToHistory();
    setCommands((prev) =>
      prev.map((cmd) => {
        if (cmd.id !== activeCommandId) return cmd;

        // Determine usage:
        // If selectedStrokeIndex is set, curve only that one.
        // If null, curve ALL strokes.
        const indicesToCurve =
          selectedStrokeIndex !== null
            ? [selectedStrokeIndex]
            : cmd.strokes.map((_, i) => i);

        const newStrokes = cmd.strokes.map((stroke, index) => {
          if (!indicesToCurve.includes(index) || stroke.length < 2)
            return stroke;

          const start = stroke[0];
          const end = stroke[stroke.length - 1];
          const pointCount = stroke.length;

          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 1) return stroke;

          // Randomize offset direction and magnitude (approx 30% of length)
          const offset = dist * 0.3;
          const angle = Math.atan2(dy, dx);
          const perpAngle =
            angle + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);

          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;

          const controlX = midX + Math.cos(perpAngle) * offset;
          const controlY = midY + Math.sin(perpAngle) * offset;

          const newPoints: Point[] = [];
          for (let i = 0; i < pointCount; i++) {
            const t = i / (pointCount - 1);
            const x =
              (1 - t) * (1 - t) * start.x +
              2 * (1 - t) * t * controlX +
              t * t * end.x;
            const y =
              (1 - t) * (1 - t) * start.y +
              2 * (1 - t) * t * controlY +
              t * t * end.y;
            newPoints.push({ x, y });
          }
          return newPoints;
        });

        const legacyPoints = newStrokes.length > 0 ? newStrokes[0] : [];
        return { ...cmd, strokes: newStrokes, points: legacyPoints };
      }),
    );
  };

  const handleMakeStraight = () => {
    if (!activeCommandId) return;

    saveToHistory();
    setCommands((prev) =>
      prev.map((cmd) => {
        if (cmd.id !== activeCommandId) return cmd;

        const indicesToModify =
          selectedStrokeIndex !== null
            ? [selectedStrokeIndex]
            : cmd.strokes.map((_, i) => i);

        const newStrokes = cmd.strokes.map((stroke, index) => {
          if (!indicesToModify.includes(index) || stroke.length < 2)
            return stroke;

          const start = stroke[0];
          const end = stroke[stroke.length - 1];
          const pointCount = Math.max(2, stroke.length);

          const newPoints: Point[] = [];
          for (let i = 0; i < pointCount; i++) {
            const t = i / (pointCount - 1);
            newPoints.push({
              x: start.x + (end.x - start.x) * t,
              y: start.y + (end.y - start.y) * t,
            });
          }
          return newPoints;
        });

        const legacyPoints = newStrokes.length > 0 ? newStrokes[0] : [];
        return { ...cmd, strokes: newStrokes, points: legacyPoints };
      }),
    );
  };

  const handleFlip = (direction: "horizontal" | "vertical") => {
    if (!activeCommandId) return;

    saveToHistory();
    setCommands((prev) =>
      prev.map((cmd) => {
        if (cmd.id !== activeCommandId) return cmd;

        const indicesToModify =
          selectedStrokeIndex !== null
            ? [selectedStrokeIndex]
            : cmd.strokes.map((_, i) => i);

        const newStrokes = cmd.strokes.map((stroke, index) => {
          if (!indicesToModify.includes(index) || stroke.length === 0)
            return stroke;

          let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;
          for (const p of stroke) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          }
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;

          return stroke.map((p) => ({
            x: direction === "horizontal" ? centerX - (p.x - centerX) : p.x,
            y: direction === "vertical" ? centerY - (p.y - centerY) : p.y,
          }));
        });

        const legacyPoints = newStrokes.length > 0 ? newStrokes[0] : [];
        return { ...cmd, strokes: newStrokes, points: legacyPoints };
      }),
    );
  };

  const currentAngle = useMemo(() => {
    const points = getSelectedStrokePoints();
    return points ? calculateAngle(points) : 0;
  }, [getSelectedStrokePoints]);

  const currentLength = useMemo(() => {
    const points = getSelectedStrokePoints();
    return points ? calculateLength(points) : 0;
  }, [getSelectedStrokePoints]);

  const currentHeadX = useMemo(() => {
    const points = getSelectedStrokePoints();
    if (points && points.length > 0) {
      const start = points[0];
      const end = points[points.length - 1];
      return (start.x + end.x) / 2;
    }
    return 0;
  }, [getSelectedStrokePoints]);

  const currentHeadY = useMemo(() => {
    const points = getSelectedStrokePoints();
    if (points && points.length > 0) {
      const start = points[0];
      const end = points[points.length - 1];
      return (start.y + end.y) / 2;
    }
    return 0;
  }, [getSelectedStrokePoints]);

  // Duration Sync:
  // If stroke selected -> Show stroke duration
  // If command selected -> Show total sequential duration (Read only preferably, or editable as global scale?)
  // User said "No need to set for command". So treating as Read Only or just informational.
  const displayDuration = useMemo(() => {
    if (selectedCommand) {
      if (
        selectedStrokeIndex !== null &&
        selectedStrokeIndex < selectedCommand.strokes.length
      ) {
        // Specific stroke
        const s = selectedCommand.strokes[selectedStrokeIndex];
        // For tap (length 1), use tapDuration
        if (s.length === 1) {
          const strokeTapDuration = 
            selectedCommand.strokeMetadata?.[selectedStrokeIndex]?.tapDuration;
          return strokeTapDuration !== undefined 
            ? strokeTapDuration 
            : (selectedCommand.tapDuration || 0.05);
        }
        // Allow shorter durations like 0.1s. Min 0.1s for safety for paths.
        return Math.max(0.1, Math.round(((s.length - 1) / 60) * 100) / 100);
      } else {
        // Total sequential time: Sum(strokes) + Sum(gaps)
        const waitTime =
          selectedCommand.waitDuration !== undefined
            ? selectedCommand.waitDuration
            : 0.1;
        let total = 0;
        selectedCommand.strokes.forEach((s, i) => {
          if (i > 0) total += waitTime;
          total += Math.max(0.1, (s.length - 1) / 60);
        });
        return Math.round(total * 100) / 100;
      }
    }
    return 0;
  }, [selectedCommand, selectedStrokeIndex]);

  const handleDeleteSelectedAction = () => {
    if (!activeCommandId || selectedStrokeIndex === null) return;

    saveToHistory();
    setCommands((prev) =>
      prev.map((cmd) => {
        if (cmd.id !== activeCommandId) return cmd;
        const newStrokes = [...cmd.strokes];
        if (selectedStrokeIndex < newStrokes.length) {
          newStrokes.splice(selectedStrokeIndex, 1);
        }
        return { ...cmd, strokes: newStrokes };
      }),
    );

    // Adjust selection
    if (selectedStrokeIndex > 0) {
      setSelectedStrokeIndex(selectedStrokeIndex - 1);
    } else {
      setSelectedStrokeIndex(null); // Deselect if 0 was deleted, or maybe stay null
      // If there are still strokes, maybe select 0?
      // Logic: if 0 deleted and others remain -> select new 0?
      // Let's stick to null (command selection) to be safe or index 0 if exists?
      // Let's just go null for now.
    }
  };

  // ==== 角度反転ハンドラー ====
  const handleFlipAngle = () => {
    if (
      !selectedCommand ||
      selectedCommand.strokes.length === 0 ||
      selectedStrokeIndex === null
    )
      return;

    const stroke = selectedCommand.strokes[selectedStrokeIndex];
    if (stroke.length < 1) return;

    // 軌跡を囲む枠（バウンディングボックス）の中心を計算
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const p of stroke) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // 中心点に対する点対称移動（180度回転）
    const newPoints = stroke.map((p) => ({
      x: 2 * centerX - p.x,
      y: 2 * centerY - p.y,
    }));

    updateSelectedStroke(newPoints);
  };

  // ============================================================================
  // Playback Control
  // ============================================================================
  // Prepare canvas paths: Flatten all strokes of all visible commands
  const canvasPaths = useMemo(() => {
    return commands
      .filter((c) => c.isVisible)
      .flatMap((cmd) => {
        const isCommandSelected = cmd.id === activeCommandId;

        // Map each stroke
        return cmd.strokes.map((stroke, index) => {
          // Highlight logic:
          // 1. If Command is NOT selected -> False
          // 2. If Command IS selected:
          //    a. If selectedStrokeIndex is NULL -> Highlights ALL strokes (True)
          //    b. If selectedStrokeIndex matches index -> True
          //    c. Otherwise -> False

          const isSelected =
            isCommandSelected &&
            (selectedStrokeIndex === null || selectedStrokeIndex === index);

          return {
            id: `${cmd.id}_stroke_${index}`,
            fileId: "N/A",
            commandId: cmd.id,
            points: stroke,
            color: cmd.color || "#000",
            isSelected: isSelected,
            label: isSelected ? String(index + 1) : undefined,
            showPoints: cmd.showPoints, // <-- Action-specific showPoints
          };
        });
      });
  }, [commands, activeCommandId, selectedStrokeIndex]);

  const canvasConnections = useMemo(() => {
    if (!selectedCommand || selectedCommand.strokes.length < 2) return [];

    const connections: {
      from: Point;
      to: Point;
      duration: number;
      strokeIndex: number;
    }[] = [];
    const waitTime =
      selectedCommand.waitDuration !== undefined
        ? selectedCommand.waitDuration
        : 0.1;

    for (let i = 0; i < selectedCommand.strokes.length - 1; i++) {
      const strokeA = selectedCommand.strokes[i];
      const strokeB = selectedCommand.strokes[i + 1];
      if (strokeA.length === 0 || strokeB.length === 0) continue;

      const endA = strokeA[strokeA.length - 1];
      const startB = strokeB[0];

      // Duration logic
      const prevStrokeWait = selectedCommand.strokeMetadata?.[i]?.waitAfter;
      const actualWait =
        prevStrokeWait !== undefined ? prevStrokeWait : waitTime;

      connections.push({
        from: endA,
        to: startB,
        duration: actualWait,
        strokeIndex: i,
      });
    }
    return connections;
  }, [selectedCommand]);

  // 全コマンドを書き出す
  const handleExportAll = async () => {
    if (commands.length === 0) {
      alert("書き出すコマンドがありません。");
      return;
    }

    const commandsToExport = commands.map((cmd) => {
      const strokeWaits = cmd.strokes.map(
        (_, i) => cmd.strokeMetadata?.[i]?.waitAfter ?? cmd.waitDuration ?? 0.1,
      );
      return {
        name: cmd.name,
        points: [] as Point[],
        strokes: cmd.strokes,
        stroke_waits: strokeWaits,
        tapDuration: cmd.tapDuration,
        strokeMetadata: cmd.strokeMetadata,
      };
    });

    try {
      const binaryContent = exportMerged(commandsToExport);
      const filename = `all_commands${exportExtension}`;

      // @ts-expect-error showSaveFilePicker は型定義にない
      if (window.showSaveFilePicker) {
        // @ts-expect-error showSaveFilePicker は型定義にない
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "Apple Voice Control Commands",
              accept: { "application/octet-stream": [exportExtension] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(binaryContent);
        await writable.close();
      } else {
        const blob = new Blob([new Uint8Array(binaryContent)], {
          type: "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error: unknown) {
      console.error("Export Error:", error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`エクスポートに失敗しました: ${msg}`);
    }
  };

  // 選択中のコマンドを書き出す（設定パネルのボタン用）
  const handleExportSelected = async () => {
    if (!activeCommandId) return;
    const cmd = commands.find((c) => c.id === activeCommandId);
    if (!cmd) return;

    const strokeWaits = cmd.strokes.map(
      (_, i) => cmd.strokeMetadata?.[i]?.waitAfter ?? cmd.waitDuration ?? 0.1,
    );

    const commandToExport = {
      name: cmd.name,
      points: [] as Point[],
      strokes: cmd.strokes,
      stroke_waits: strokeWaits,
      tapDuration: cmd.tapDuration,
      strokeMetadata: cmd.strokeMetadata,
    };

    try {
      const binaryContent = exportMerged([commandToExport]);
      let filename = cmd.name;
      if (!filename.toLowerCase().endsWith(exportExtension)) {
        filename += exportExtension;
      }

      // @ts-expect-error showSaveFilePicker は型定義にない
      if (typeof window.showSaveFilePicker === "function") {
        // @ts-expect-error showSaveFilePicker は型定義にない
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "Apple Voice Control Command",
              accept: { "application/octet-stream": [exportExtension] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(binaryContent);
        await writable.close();
      } else {
        const blob = new Blob([new Uint8Array(binaryContent)], {
          type: "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error: unknown) {
      console.error("Export Error:", error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`エクスポートに失敗しました: ${msg}`);
    }
  };

  // チェックしたコマンドを書き出す
  const handleBatchExport = async () => {
    const targetIds =
      checkedCommandIds.size > 0
        ? Array.from(checkedCommandIds)
        : activeCommandId
          ? [activeCommandId]
          : [];

    if (targetIds.length === 0) return;

    const commandsToExport = targetIds
      .map((id) => {
        const cmd = commands.find((c) => c.id === id);
        if (!cmd) return null;

        const strokeWaits = cmd.strokes.map(
          (_, i) =>
            cmd.strokeMetadata?.[i]?.waitAfter ?? cmd.waitDuration ?? 0.1,
        );

        return {
          name: cmd.name,
          points: [] as Point[],
          strokes: cmd.strokes,
          stroke_waits: strokeWaits,
          tapDuration: cmd.tapDuration,
          strokeMetadata: cmd.strokeMetadata,
        };
      })
      .filter((c) => c !== null);

    if (commandsToExport.length === 0) return;

    try {
      const binaryContent = exportMerged(commandsToExport);

      let filename =
        commandsToExport.length === 1
          ? commandsToExport[0]!.name
          : "ExportedCommands";

      if (!filename.toLowerCase().endsWith(exportExtension)) {
        filename += exportExtension;
      }

      // ファイル保存ロジック
      // @ts-expect-error showSaveFilePicker は型定義にない
      if (typeof window.showSaveFilePicker === "function") {
        // @ts-expect-error showSaveFilePicker は型定義にない
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "Apple Voice Control Command",
              accept: { "application/octet-stream": [exportExtension] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(binaryContent);
        await writable.close();
      } else {
        // フォールバック
        const blob = new Blob([new Uint8Array(binaryContent)], {
          type: "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error: unknown) {
      console.error("Export Error:", error);
      alert(
        `エクスポートに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const handleBatchDelete = () => {
    if (checkedCommandIds.size === 0) return;

    if (!confirm(`${checkedCommandIds.size} 件のコマンドを削除しますか？`))
      return;

    saveToHistory();
    setCommands((prev) => prev.filter((c) => !checkedCommandIds.has(c.id)));

    // Clear selection
    setCheckedCommandIds(new Set());
    if (activeCommandId && checkedCommandIds.has(activeCommandId)) {
      // 削除後の残りコマンドから先頭を選択
      const remaining = commands.filter((c) => !checkedCommandIds.has(c.id));
      setActiveCommandId(remaining.length > 0 ? remaining[0].id : null);
      setSelectedStrokeIndex(null);
    }
  };

  const handleToggleSelectCommand = (id: string, multi: boolean) => {
    setCheckedCommandIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    // Optionally sync with main selection if it's a single click
    if (!multi) {
      // If simply toggling via checkbox, we don't necessarily change "active" editing command
    }
  };

  const handleSelectAllCommands = () => {
    setCheckedCommandIds(new Set(commands.map((c) => c.id)));
  };

  const handleClearCommandSelection = () => {
    setCheckedCommandIds(new Set());
  };

  const handleToggleSelectStroke = (index: number) => {
    setCheckedStrokeIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleGroupStrokes = () => {
    if (!activeCommandId || checkedStrokeIndices.size < 2) return;
    saveToHistory();
    const newGroupId = crypto.randomUUID();
    setCommands((prev) =>
      prev.map((cmd) => {
        if (cmd.id !== activeCommandId) return cmd;
        const newMetadata = [...(cmd.strokeMetadata || [])];
        while (newMetadata.length < cmd.strokes.length) {
          newMetadata.push({});
        }
        checkedStrokeIndices.forEach((idx) => {
          if (idx < newMetadata.length) {
            newMetadata[idx] = { ...newMetadata[idx], groupId: newGroupId };
          }
        });
        return { ...cmd, strokeMetadata: newMetadata };
      })
    );
    setCheckedStrokeIndices(new Set());
  };

  const handleUngroupStrokes = () => {
    if (!activeCommandId || checkedStrokeIndices.size === 0) return;
    saveToHistory();
    setCommands((prev) =>
      prev.map((cmd) => {
        if (cmd.id !== activeCommandId) return cmd;
        const newMetadata = [...(cmd.strokeMetadata || [])];
        checkedStrokeIndices.forEach((idx) => {
          if (idx < newMetadata.length && newMetadata[idx]) {
            newMetadata[idx] = { ...newMetadata[idx], groupId: undefined };
          }
        });
        return { ...cmd, strokeMetadata: newMetadata };
      })
    );
    setCheckedStrokeIndices(new Set());
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleScaleChange = (
    newScaleOrUpdater: number | ((prev: number) => number),
    cursorX?: number,
    cursorY?: number,
  ) => {
    setScale((prevScale) => {
      let newScale: number;
      if (typeof newScaleOrUpdater === "function") {
        newScale = newScaleOrUpdater(prevScale);
      } else {
        newScale = newScaleOrUpdater;
      }

      newScale = Math.min(Math.max(newScale, 0.2), 10.0);

      if (newScale !== prevScale && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const canvasEl = container.querySelector("canvas");
        if (canvasEl) {
          const containerRect = container.getBoundingClientRect();
          const canvasRect = canvasEl.getBoundingClientRect();

          // ビューポート内の基準点（スクリーン座標）
          let screenX = cursorX;
          let screenY = cursorY;
          if (screenX === undefined || screenY === undefined) {
            screenX = containerRect.left + containerRect.width / 2;
            screenY = containerRect.top + containerRect.height / 2;
          }

          // ビューポート内の基準点の位置（コンテナ相対）
          const viewportX = screenX - containerRect.left;
          const viewportY = screenY - containerRect.top;

          // 基準点のキャンバス左端からの距離（CSSピクセル、旧スケール時）
          const canvasContentLeft =
            canvasRect.left - containerRect.left + container.scrollLeft;
          const canvasContentTop =
            canvasRect.top - containerRect.top + container.scrollTop;
          const dxFromCanvas =
            container.scrollLeft + viewportX - canvasContentLeft;
          const dyFromCanvas =
            container.scrollTop + viewportY - canvasContentTop;

          const scaleRatio = newScale / prevScale;

          // rAF内でReactのレンダリング後の実際のキャンバス位置を使って補正
          window.requestAnimationFrame(() => {
            if (!scrollContainerRef.current) return;
            const c = scrollContainerRef.current;
            const newCanvasRect = canvasEl.getBoundingClientRect();
            const newContainerRect = c.getBoundingClientRect();

            // レンダリング後のキャンバスのコンテンツ内位置
            const newCanvasContentLeft =
              newCanvasRect.left - newContainerRect.left + c.scrollLeft;
            const newCanvasContentTop =
              newCanvasRect.top - newContainerRect.top + c.scrollTop;

            // 基準点のコンテンツ内新位置
            const targetContentX =
              newCanvasContentLeft + dxFromCanvas * scaleRatio;
            const targetContentY =
              newCanvasContentTop + dyFromCanvas * scaleRatio;

            // 基準点がビューポート上の同じ位置に来るようスクロール
            c.scrollLeft = targetContentX - viewportX;
            c.scrollTop = targetContentY - viewportY;
          });
        }
      }

      return newScale;
    });
  };

  // Handle pinch-to-zoom and two-finger pan
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Check for pinch gesture (ctrlKey + wheel)
      // Note: On Mac trackpad, pinch sends wheel events with ctrlKey=true
      if (e.ctrlKey) {
        e.preventDefault();

        // スケール感度の調整
        const delta = -e.deltaY * 0.01;
        // 指数関数的なズームに変更: e^delta を掛けることでどの倍率でも同じ変化量に感じる
        handleScaleChange(
          (prev) => prev * Math.exp(delta),
          e.clientX,
          e.clientY,
        );
      }
    };

    let initialPinchDistance: number | null = null;
    let lastPanCenter: { x: number; y: number } | null = null;

    const getDistance = (touches: TouchList) => {
      return Math.sqrt(
        Math.pow(touches[0].clientX - touches[1].clientX, 2) +
          Math.pow(touches[0].clientY - touches[1].clientY, 2),
      );
    };

    const getCenter = (touches: TouchList) => {
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault(); // Prevent default browser zoom/pan
        initialPinchDistance = getDistance(e.touches);
        lastPanCenter = getCenter(e.touches);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (
        e.touches.length === 2 &&
        initialPinchDistance !== null &&
        lastPanCenter !== null
      ) {
        e.preventDefault();

        const currentDistance = getDistance(e.touches);
        const currentCenter = getCenter(e.touches);

        // 1. Zoom
        if (initialPinchDistance > 0) {
          const ratio = currentDistance / initialPinchDistance;
          handleScaleChange(
            (prev) => prev * ratio,
            currentCenter.x,
            currentCenter.y,
          );
        }
        initialPinchDistance = currentDistance; // Incremental update

        // 2. Pan
        const dx = currentCenter.x - lastPanCenter.x;
        const dy = currentCenter.y - lastPanCenter.y;

        container.scrollLeft -= dx;
        container.scrollTop -= dy;

        lastPanCenter = currentCenter;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialPinchDistance = null;
        lastPanCenter = null;
      }
    };

    // Need non-passive listener to prevent default browser zoom
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [handleScaleChange]);

  const handlePathDrag = (
    id: string,
    deltaX: number,
    deltaY: number,
    type: "move" | "start" | "end",
  ) => {
    if (isPlaying) return;

    // Use refined regex parsing to handle IDs like "uuid_stroke_0" safely vs "uuid_stroke_10"
    const match = id.match(/^(.*)_stroke_(\d+)$/);
    if (!match) return;
    const commandId = match[1];
    const targetStrokeIndex = parseInt(match[2], 10);

    setCommands((prev: Command[]) =>
      prev.map((cmd: Command) => {
        if (cmd.id !== commandId) return cmd;

        // If Command is selected (selectedStrokeIndex === null) and type is 'move', move ALL strokes
        const isCommandMove = selectedStrokeIndex === null && type === "move";

        const newStrokes = cmd.strokes.map((stroke, index) => {
          // Condition to update this specific stroke:
          // 1. It's a "Command Move" (move all)
          // 2. OR it's the specific target stroke (single edit)
          const shouldUpdate = isCommandMove || index === targetStrokeIndex;

          if (!shouldUpdate) return stroke;

          // Apply modification
          let newPoints = [...stroke];

          if (type === "move") {
            newPoints = newPoints.map((p) => ({
              x: p.x + deltaX,
              y: p.y + deltaY,
            }));
          } else if (index === targetStrokeIndex) {
            // Start/End drags only apply to the specific target stroke even in command mode
            // (Can't meaningfully drag 5 start points at once with one mouse cursor)
            if (type === "start") {
              const newStart = {
                x: newPoints[0].x + deltaX,
                y: newPoints[0].y + deltaY,
              };
              const end = newPoints[newPoints.length - 1];

              if (newPoints.length) {
                const currentPointsCount = stroke.length;
                const currentDuration = Math.max(
                  0.40,
                  (currentPointsCount - 1) / 60,
                );
                newPoints = resamplePath([newStart, end], currentDuration);
              }
            } else if (type === "end") {
              const start = newPoints[0];
              const newEnd = {
                x: newPoints[newPoints.length - 1].x + deltaX,
                y: newPoints[newPoints.length - 1].y + deltaY,
              };
              if (newPoints.length) {
                const currentPointsCount = stroke.length;
                const currentDuration = Math.max(
                  0.40,
                  (currentPointsCount - 1) / 60,
                );
                newPoints = resamplePath([start, newEnd], currentDuration);
              }
            }
          }
          return newPoints;
        });

        // Update legacy points for preview if first stroke changed
        const newLegacyPoints =
          newStrokes.length > 0 ? newStrokes[0] : cmd.points;

        return { ...cmd, strokes: newStrokes, points: newLegacyPoints };
      }),
    );
  };

  const handleReorderCommands = (oldIndex: number, newIndex: number) => {
    saveToHistory();
    setCommands((items) => arrayMove(items, oldIndex, newIndex));
  };

  const handleReorderStrokes = (
    commandId: string,
    oldIndex: number,
    newIndex: number,
  ) => {
    saveToHistory();
    setCommands((prev) =>
      prev.map((cmd) => {
        if (cmd.id !== commandId) return cmd;
        const newStrokes = arrayMove(cmd.strokes, oldIndex, newIndex);
        // We also need to reorder metadata if it exists
        let newMetadata = cmd.strokeMetadata ? [...cmd.strokeMetadata] : [];
        // Ensure metadata is long enough before moving
        while (newMetadata.length < cmd.strokes.length) {
          newMetadata.push({});
        }
        newMetadata = arrayMove(newMetadata, oldIndex, newIndex);

        return { ...cmd, strokes: newStrokes, strokeMetadata: newMetadata };
      }),
    );
    // If selectedStrokeIndex was pointing to the moved item, we might need to update it,
    // but simpler to just deselect or keep index?
    // If we move item at index A to B. And we effectively selected index A.
    // If we keep selection index A, we are now selecting a different item.
    // Let's try to track the selection.
    if (activeCommandId === commandId && selectedStrokeIndex !== null) {
      if (selectedStrokeIndex === oldIndex) {
        setSelectedStrokeIndex(newIndex);
      } else if (
        oldIndex < selectedStrokeIndex &&
        newIndex >= selectedStrokeIndex
      ) {
        setSelectedStrokeIndex(selectedStrokeIndex - 1);
      } else if (
        oldIndex > selectedStrokeIndex &&
        newIndex <= selectedStrokeIndex
      ) {
        setSelectedStrokeIndex(selectedStrokeIndex + 1);
      }
    }
  };

  const handleBackgroundImageUpload = async (files: FileList) => {
    try {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        const bgImage = await uploadBackground(file);
        // IndexedDB 版では url が Object URL
        setBackgroundImage(bgImage.url);

        // 背景画像リストを更新
        setBackgroundsList((prev) => [bgImage, ...prev]);
      }
    } catch (err) {
      console.error("Failed to upload background:", err);
      alert("背景画像のアップロード中にエラーが発生しました。一部の画像が読み込まれていない可能性があります。");
    }
  };

  // handleDurationChange was here, now moved and fixed

  const handleTapDurationChange = (newDuration: number) => {
    if (!activeCommandId) return;
    saveToHistory();
    setCommands((prev) =>
      prev.map((c) => {
        if (c.id !== activeCommandId) return c;

        // If a specific stroke is selected, only update that one
        if (selectedStrokeIndex !== null) {
          const newMetadata = [...(c.strokeMetadata || [])];
          while (newMetadata.length <= selectedStrokeIndex) {
            newMetadata.push({});
          }
          newMetadata[selectedStrokeIndex] = {
            ...newMetadata[selectedStrokeIndex],
            tapDuration: newDuration,
          };
          return { ...c, strokeMetadata: newMetadata };
        }

        // Otherwise update the command default
        return { ...c, tapDuration: newDuration };
      }),
    );
  };

  const handleDeleteBackground = async (id: string) => {
    try {
      // 削除対象の Object URL を特定
      const deletedBg = backgroundsList.find((bg) => bg.id === id);
      const deletedUrl = deletedBg?.url;

      await deleteBackground(id);
      setBackgroundsList((prev) => prev.filter((bg) => bg.id !== id));

      // 削除した画像が現在選択中なら背景をクリア
      if (deletedUrl && backgroundImage === deletedUrl) {
        setBackgroundImage(null);
      }

      // Object URL を解放
      if (deletedUrl) {
        URL.revokeObjectURL(deletedUrl);
      }
    } catch (err) {
      console.error("Failed to delete background:", err);
      alert("背景画像の削除に失敗しました。");
    }
  };

  const handleClearBackgroundImage = () => setBackgroundImage(null);
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      // Auto-close both sidebars when entering fullscreen
      setIsLeftSidebarOpen(false);
      setIsRightSidebarOpen(false);
      appRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
      ) {
        return;
      }

      const isMac = navigator.userAgent.toLowerCase().includes("mac");
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        handleNudge("y", -1);
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        handleNudge("y", 1);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handleNudge("x", -1);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNudge("x", 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, handleNudge, handleUndo, handleRedo]); // Dependencies ensure fresh closures

  const handleWaitDurationChange = (newDuration: number) => {
    if (!activeCommandId) return;
    saveToHistory();
    setCommands((prev) =>
      prev.map((c) =>
        c.id === activeCommandId ? { ...c, waitDuration: newDuration } : c,
      ),
    );
  };

  const handleApplyWaitDurationToAll = (newDuration: number) => {
    if (!activeCommandId) return;
    saveToHistory();
    setCommands((prev) =>
      prev.map((c) => {
        if (c.id !== activeCommandId) return c;
        // 個別の待機時間を削除し、共通の待機時間を更新する
        return {
          ...c,
          waitDuration: newDuration,
          strokeMetadata: c.strokeMetadata ? c.strokeMetadata.map(meta => {
            const newMeta = { ...meta };
            delete newMeta.waitAfter;
            return newMeta;
          }) : undefined
        };
      })
    );
  };

  const handleSelectedStrokeWaitChange = (newDuration: number) => {
    if (!activeCommandId) return;
    saveToHistory();
    setCommands((prev) =>
      prev.map((c) => {
        if (c.id !== activeCommandId) return c;

        const newMetadata = c.strokeMetadata ? [...c.strokeMetadata] : [];
        // Ensure metadata exists for all strokes
        while (newMetadata.length < c.strokes.length) {
          newMetadata.push({});
        }

        if (
          selectedStrokeIndex !== null &&
          selectedStrokeIndex < c.strokes.length
        ) {
          // Specific stroke
          newMetadata[selectedStrokeIndex] = {
            ...newMetadata[selectedStrokeIndex],
            waitAfter: newDuration,
          };
        } else {
          // If no stroke selected, maybe update global default? Or update ALL?
          // User requested individual editing. "If not selected, global editing".
          // We already separate that in UI. If this is called, it SHOULD correspond to a selected stroke OR explicitly global.
          // But the UI slider calls this handler.
          // If selectedStrokeIndex is null, we shouldn't be calling "SelectedStrokeWaitChange".
          // But let's support "Update All" here if needed? No, use handleWaitDurationChange for that.
          // So this does nothing if index is null.
          return c;
        }

        return { ...c, strokeMetadata: newMetadata };
      }),
    );
  };

  const currentStrokeWait = useMemo(() => {
    if (!selectedCommand || selectedStrokeIndex === null) return undefined;
    const meta = selectedCommand.strokeMetadata?.[selectedStrokeIndex];
    return meta?.waitAfter; // Returns undefined if not set, UI shows default
  }, [selectedCommand, selectedStrokeIndex]);

  const isTap = useMemo(() => {
    if (!selectedCommand) return false;
    // If the whole command is a single tap, treat as tap even if not explicitly selected
    if (selectedCommand.strokes.length === 1 && selectedCommand.strokes[0].length === 1) {
      return true;
    }
    if (selectionType === "stroke" && selectedStrokeIndex !== null) {
      const stroke = selectedCommand.strokes[selectedStrokeIndex];
      return stroke && stroke.length === 1;
    }
    return false;
  }, [selectedCommand, selectionType, selectedStrokeIndex]);

  return (
    <div
      className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900"
      ref={appRef}
    >
      {/* Mobile Drawer Overlay for Left Sidebar */}
      {!isFullscreen && isLeftSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}
      {/* Left Sidebar */}
      <div
        className={`
            ${isLeftSidebarOpen ? "w-64" : "w-0"} 
            ${isFullscreen ? "absolute left-0 z-50 h-full shadow-2xl" : "fixed md:relative left-0 z-50 md:z-auto h-full shadow-2xl md:shadow-none"}
            transition-all duration-300 ease-in-out shrink-0 bg-white border-r border-gray-200 overflow-hidden
        `}
      >
        <Sidebar
          commands={commands}
          activeCommandId={activeCommandId}
          hasUnsavedChanges={hasUnsavedChanges}
          onSelectCommand={setActiveCommandId}
          onDeleteCommand={(id) => {
            saveToHistory();
            const idx = commands.findIndex((c) => c.id === id);
            const newCommands = commands.filter((c) => c.id !== id);
            setCommands(newCommands);
            // 削除したのが選択中のコマンドなら次を選択
            if (activeCommandId === id) {
              if (newCommands.length > 0) {
                const nextIdx = Math.min(idx, newCommands.length - 1);
                setActiveCommandId(newCommands[nextIdx].id);
              } else {
                setActiveCommandId(null);
              }
              setSelectedStrokeIndex(null);
            }
          }}
          onDuplicateCommand={handleDuplicateCommand}
          onToggleVisibility={(id) => {
            saveToHistory();
            setCommands((prev) =>
              prev.map((c) =>
                c.id === id ? { ...c, isVisible: !c.isVisible } : c,
              ),
            );
          }}
          onToggleAllVisibility={(visible: boolean) => {
            saveToHistory();
            setCommands((prev) =>
              prev.map((c) => ({ ...c, isVisible: visible }))
            );
          }}
          onFileUpload={handleFileUpload}
          onCreateNew={handleCreateNewCommand}
          onRenameCommand={(id, name) => {
            saveToHistory();
            setCommands((prev) =>
              prev.map((c) => (c.id === id ? { ...c, name } : c)),
            );
          }}
          onUpdateCommand={(updatedCmd) => {
            saveToHistory();
            setCommands((prev) =>
              prev.map((c) => (c.id === updatedCmd.id ? updatedCmd : c)),
            );
          }}
          selectedStrokeIndex={selectedStrokeIndex}
          onSelectStroke={setSelectedStrokeIndex}
          selectionType={selectionType}
          onSelectType={setSelectionType}
          onReorderCommands={handleReorderCommands}
          onReorderStrokes={handleReorderStrokes}
          checkedCommandIds={checkedCommandIds}
          checkedStrokeIndices={checkedStrokeIndices}
          onToggleSelectCommand={handleToggleSelectCommand}
          onToggleSelectStroke={handleToggleSelectStroke}
          onGroupStrokes={handleGroupStrokes}
          onUngroupStrokes={handleUngroupStrokes}
          onBatchExport={handleBatchExport}
          onBatchDelete={handleBatchDelete}
          onSelectAll={handleSelectAllCommands}
          onClearSelection={handleClearCommandSelection}
          currentProjectId={currentProjectId}
          projectsList={projectsList}
          onLoadProject={handleLoadProject}
          onSaveProject={handleSaveProject}
          onSaveAsProject={handleSaveAsProject}
          onDeleteProject={handleDeleteProject}
          onRenameProject={handleRenameProject}
        />
        {/* Close button for fullscreen popup mode */}
        {isFullscreen && isLeftSidebarOpen && (
          <button
            onClick={() => setIsLeftSidebarOpen(false)}
            className="absolute top-2 right-2 p-1 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Center Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 relative">
        {/* Fullscreen Hover Zones */}
        {isFullscreen && (
          <>
            {/* Left Hover Zone */}
            <div
              className="absolute left-0 top-0 bottom-0 w-4 z-40 hover:bg-blue-500/10 transition-colors cursor-pointer flex items-center justify-start group"
              onClick={() => setIsLeftSidebarOpen(true)}
              title="サイドバーを開く"
            >
              <div className="h-12 w-1 bg-blue-500/50 rounded-r opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
            </div>
            {/* Right Hover Zone */}
            <div
              className="absolute right-0 top-0 bottom-0 w-4 z-40 hover:bg-blue-500/10 transition-colors cursor-pointer flex items-center justify-end group"
              onClick={() => setIsRightSidebarOpen(true)}
              title="設定を開く"
            >
              <div className="h-12 w-1 bg-blue-500/50 rounded-l opacity-0 group-hover:opacity-100 transition-opacity mr-0.5" />
            </div>
          </>
        )}

        {/* Header (Hidden in fullscreen usually, or kept? Plan said keep functionality but fullscreen usually hides chrome. 
            Let's keep separate header if not fullscreen, or overlays if fullscreen.
            For "Clean Studio", a persistent top bar is good unless maximized.
        */}
        {!isFullscreen && (
          <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 text-sm select-none">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {
                    isLeftSidebarOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      /> // Menu icon (open)
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    ) // Menu icon (closed) - keep same or change? Let's use Sidebar icon
                  }
                </svg>
              </button>
              <h1 className="font-semibold text-gray-700 tracking-tight hidden sm:block">
                Voice Control Commander
              </h1>
              <h1 className="font-semibold text-gray-700 tracking-tight sm:hidden text-xs truncate max-w-[100px]">
                VCC
              </h1>
            </div>
            <div className="flex items-center space-x-1 md:space-x-3">
              {/* Undo / Redo */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleUndo}
                  disabled={pastLevels.length === 0}
                  className={`p-1.5 rounded transition-colors ${pastLevels.length === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}
                  title="元に戻す (Cmd+Z)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleRedo}
                  disabled={futureLevels.length === 0}
                  className={`p-1.5 rounded transition-colors ${futureLevels.length === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}
                  title="やり直す (Cmd+Shift+Z)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                    />
                  </svg>
                </button>
              </div>
              <div className="h-4 w-px bg-gray-300 mx-1" />

              <button
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <div className="h-4 w-px bg-gray-300 mx-2" />
              <AuthStatus />
              <div className="h-4 w-px bg-gray-300 mx-1" />
              <button
                onClick={handleExportAll}
                className="hidden md:block px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 shadow-sm transition-colors"
                title="全コマンドを書き出す"
              >
                全コマンドを書き出す
              </button>
              <button
                onClick={handleExportAll}
                className="md:hidden p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                title="全コマンドを書き出す"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden relative">
          <div
            ref={scrollContainerRef}
            className="absolute inset-0 overflow-auto bg-gray-50/50"
          >
            <div className="min-w-full min-h-full w-max h-max flex items-center justify-center p-16">
              <Canvas
                width={selectedDevice.width}
                height={selectedDevice.height}
                backgroundImage={backgroundImage}
                paths={canvasPaths}
                showGrid={showGrid}
                showPoints={showPoints}
                onPathDrag={handlePathDrag}
                onPan={(dx, dy) => {
                  if (scrollContainerRef.current) {
                    // dx, dy は Canvas 側で計算された物理ピクセルの移動量
                    scrollContainerRef.current.scrollLeft -= dx;
                    scrollContainerRef.current.scrollTop -= dy;
                  }
                }}
                onSelectCommand={(_, cmdId, pathId) => {
                  let strokeIndex: number | null = null;
                  if (pathId) {
                    const match = pathId.match(/_stroke_(\d+)$/);
                    if (match) {
                      strokeIndex = parseInt(match[1], 10);
                    }
                  }

                  setActiveCommandId(cmdId);
                  setSelectedStrokeIndex(strokeIndex);
                  // Also open settings if closed?
                  if (!isRightSidebarOpen && !isFullscreen)
                    setIsRightSidebarOpen(true);
                }}
                connections={canvasConnections.map((c) => ({
                  ...c,
                  isSelected:
                    selectionType === "wait" &&
                    selectedStrokeIndex === c.strokeIndex,
                }))}
                onSelectWait={(index) => {
                  setSelectedStrokeIndex(index);
                  setSelectionType("wait");
                  if (!isRightSidebarOpen && !isFullscreen)
                    setIsRightSidebarOpen(true);
                }}
                markerPositions={markerPositions}
                scale={scale}
              />
            </div>
          </div>

          {/* Overlay Play Controls (Floating) */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
            <button
              onClick={togglePlay}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-full shadow-lg backdrop-blur-md border border-white/20 transition-all transform hover:scale-105 active:scale-95 ${
                isPlaying
                  ? "bg-red-500/90 text-white"
                  : "bg-white/90 text-gray-800 hover:bg-white"
              }`}
            >
              {isPlaying ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="font-medium text-sm">
                {isPlaying ? "停止" : "再生"}
              </span>
            </button>
            {/* Quick Fullscreen Toggle for center access */}
            <button
              onClick={handleToggleFullscreen}
              className="p-2.5 bg-white/90 text-gray-600 rounded-full shadow-lg backdrop-blur-md border border-white/20 hover:bg-white transition-all transform hover:scale-105 active:scale-95"
              title="全画面切替"
            >
              {isFullscreen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay for Right Sidebar */}
      {!isFullscreen && isRightSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={() => setIsRightSidebarOpen(false)}
        />
      )}
      {/* Right Sidebar (Control Panel) */}
      <div
        className={`
            ${isFullscreen ? "absolute right-0 z-50 h-full shadow-2xl md:rounded-none" : "fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-0 z-50 md:z-auto shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none"}
            ${
              isRightSidebarOpen
                ? "w-full md:w-72 h-[75vh] md:h-full translate-y-0 md:translate-y-0"
                : "w-full md:w-0 h-[75vh] md:h-full translate-y-full md:translate-y-0"
            }
            transition-all duration-300 ease-out shrink-0 bg-white border-t md:border-t-0 md:border-l border-gray-200 overflow-hidden rounded-t-2xl md:rounded-none flex flex-col
        `}
      >
        {/* Mobile Bottom Sheet Handle & Close Button */}
        <div
          className="w-full flex justify-center pt-3 pb-2 md:hidden cursor-pointer shrink-0 relative"
          onClick={() => setIsRightSidebarOpen(false)}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <ControlPanel
            models={DEVICE_MODELS}
            selectedModelId={selectedModelId}
            onSelectModel={setSelectedModelId}
            orientation={orientation}
            onSelectOrientation={setOrientation}
            scale={scale}
            onScaleChange={handleScaleChange}
            onNudge={(dx, dy) => {
              if (dx !== 0) handleNudge("x", dx);
              if (dy !== 0) handleNudge("y", dy);
            }}
            onExport={handleExportSelected}
            onBackgroundImageUpload={handleBackgroundImageUpload}
            onBackgroundImageSelect={(url) => setBackgroundImage(url)}
            onClearBackgroundImage={handleClearBackgroundImage}
            backgroundsList={backgroundsList}
            onDeleteBackground={handleDeleteBackground}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(!showGrid)}
            showPoints={showPoints}
            onTogglePoints={() => setShowPoints(!showPoints)}
            selectedCommandShowPoints={
              selectedCommand ? selectedCommand.showPoints : undefined
            }
            onToggleCommandPoints={(show) => {
              if (activeCommandId) {
                setCommands((prev) =>
                  prev.map((cmd) =>
                    cmd.id === activeCommandId
                      ? { ...cmd, showPoints: show }
                      : cmd,
                  ),
                );
              }
            }}
            onEnterFullscreen={handleToggleFullscreen}
            isFullscreen={isFullscreen}
            duration={displayDuration}
            onDurationChange={handleDurationChange}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            angle={currentAngle}
            onAngleChange={handleAngleChange}
            length={currentLength}
            onLengthChange={(newLen) => {
              if (selectedStrokeIndex !== null) {
                const points = getSelectedStrokePoints();
                if (!points || points.length < 2) return;
                const currentLen = calculateLength(points);
                if (currentLen === 0) return;

                const scaleFactor = newLen / currentLen;
                const start = points[0];
                const end = points[points.length - 1];
                const mid = {
                  x: (start.x + end.x) / 2,
                  y: (start.y + end.y) / 2,
                };

                const newPoints = points.map((p) => ({
                  x: mid.x + (p.x - mid.x) * scaleFactor,
                  y: mid.y + (p.y - mid.y) * scaleFactor,
                }));
                updateSelectedStroke(newPoints);
              }
            }}
            onCurve={handleCurve}
            onStraight={handleMakeStraight}
            onFlip={handleFlip}
            absoluteX={currentHeadX}
            absoluteY={currentHeadY}
            isActionSelected={selectedStrokeIndex !== null}
            waitDuration={
              selectedCommand?.waitDuration !== undefined
                ? selectedCommand.waitDuration
                : 0.1
            }
            onWaitDurationChange={handleWaitDurationChange}
            onApplyWaitToAll={handleApplyWaitDurationToAll}
            isTap={isTap}
            tapDuration={
              selectedCommand && selectedStrokeIndex !== null && selectedCommand.strokeMetadata?.[selectedStrokeIndex]?.tapDuration !== undefined
                ? selectedCommand.strokeMetadata[selectedStrokeIndex].tapDuration
                : (selectedCommand?.tapDuration !== undefined ? selectedCommand.tapDuration : 0.05)
            }
            onTapDurationChange={handleTapDurationChange}
            selectedStrokeWait={currentStrokeWait}
            onSelectedStrokeWaitChange={handleSelectedStrokeWaitChange}
            selectionType={selectionType}
            onDeleteSelectedAction={handleDeleteSelectedAction}
            onFlipAngle={
              selectedStrokeIndex !== null &&
              selectedCommand &&
              selectedCommand.strokes[selectedStrokeIndex]?.length > 1
                ? handleFlipAngle
                : undefined
            }
            favoriteEnvironments={favoriteEnvironments}
            onSaveEnvironment={handleSaveEnvironment}
            onLoadEnvironment={handleLoadEnvironment}
            onRenameEnvironment={handleRenameEnvironment}
            onOverwriteEnvironment={handleOverwriteEnvironment}
            onDeleteEnvironment={handleDeleteEnvironment}
            exportExtension={exportExtension}
            onExportExtensionChange={setExportExtension}
          />
        </div>
        {/* Close button for fullscreen popup mode */}
        {isFullscreen && isRightSidebarOpen && (
          <button
            onClick={() => setIsRightSidebarOpen(false)}
            className="absolute top-2 left-2 p-1 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
