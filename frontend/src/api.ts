export interface Point {
  x: number;
  y: number;
}

export interface EnvironmentSettings {
  id: string; // プリセットの一意のID (UUIDなど)
  name: string; // プリセット名（例: "iPhone 16 - 風景", "iPad - iPadOS 18"）
  modelId: string; // デバイスモデル (e.g., "iphone_16_pro")
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
  strokeMetadata?: { waitAfter?: number }[]; // Metadata corresponding to each stroke
  isVisible?: boolean;
  duration?: number;
  waitDuration?: number; // Wait time between strokes in seconds (Global default)
  color?: string; // Color assigned to the command
  showPoints?: boolean; // Toggle visibility of start/end points per command
}

export interface ParseResult {
  commands: Command[];
}

export interface ExportResponse {
  filename: string;
  content: string; // Base64 encoded
}

export interface VoiceControlFile {
  id: string;
  name: string;
  originalContent: string; // Base64
  commands: Command[];
  offsetX: number;
  offsetY: number;
  selectedCommandId: string | null;
  isVisible: boolean;
  color: string;
}

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const SERVER_URL = API_BASE_URL.replace("/api", "");

export const parseFile = async (file: File): Promise<ParseResult> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/parse`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to parse file");
  }

  return response.json();
};

export const exportFile = async (
  originalContent: string,
  commandId: string,
  points: Point[],
): Promise<ExportResponse> => {
  const response = await fetch(`${API_BASE_URL}/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      original_content: originalContent,
      command_id: commandId,
      points: points,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to export file");
  }

  return response.json();
};

// --- Project API ---

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

export const fetchProjects = async (): Promise<ProjectSummary[]> => {
  const response = await fetch(`${API_BASE_URL}/projects`);
  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }
  return response.json();
};

export const loadProject = async (id: string): Promise<ProjectData> => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`);
  if (!response.ok) {
    throw new Error("Failed to load project");
  }
  return response.json();
};

export const createProject = async (
  data: ProjectData,
): Promise<ProjectData> => {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create project");
  }
  return response.json();
};

export const updateProject = async (
  id: string,
  data: ProjectData,
): Promise<ProjectData> => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update project");
  }
  return response.json();
};

export const deleteProject = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete project");
  }
  return response.json();
};

// ----------------------------------------------------------------------------
// Backgrounds API
// ----------------------------------------------------------------------------
export interface BackgroundImage {
  id: string;
  url: string;
}

export async function fetchBackgrounds(): Promise<BackgroundImage[]> {
  const response = await fetch(`${API_BASE_URL}/backgrounds`);
  if (!response.ok) {
    throw new Error(`Failed to fetch backgrounds: ${response.statusText}`);
  }
  return response.json();
}

export async function uploadBackground(file: File): Promise<BackgroundImage> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/backgrounds`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload background: ${response.statusText}`);
  }
  return response.json();
}

export async function deleteBackground(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/backgrounds/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete background: ${response.statusText}`);
  }
}
