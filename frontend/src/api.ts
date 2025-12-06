export interface Point {
    x: number;
    y: number;
}

export interface Command {
    id: string;
    name: string;
    points: Point[];
    isVisible?: boolean;
    duration?: number;
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

export const API_BASE_URL = 'http://localhost:8000/api';

export const parseFile = async (file: File): Promise<ParseResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/parse`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to parse file');
    }

    return response.json();
};

export const exportFile = async (originalContent: string, commandId: string, points: Point[]): Promise<ExportResponse> => {
    const response = await fetch(`${API_BASE_URL}/export`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            original_content: originalContent,
            command_id: commandId,
            points: points,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to export file');
    }

    return response.json();
};
