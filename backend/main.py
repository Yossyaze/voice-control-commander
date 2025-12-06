from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import plistlib
import uvicorn
import io
from parser import parse_voice_control_commands, update_voice_control_commands

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Point(BaseModel):
    x: float
    y: float

class ExportRequest(BaseModel):
    original_content: str # Base64 encoded original file content
    command_id: str
    points: List[Point]

@app.post("/api/parse")
async def parse_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        print(f"Received content length: {len(content)}")
        print(f"First 100 bytes: {content[:100]}")
        result = parse_voice_control_commands(content)
        return result
    except Exception as e:
        print(f"Error parsing file: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/export")
async def export_file(request: ExportRequest):
    try:
        # In a real app, we might want to handle the file content differently,
        # but for now we'll assume the client sends back the original file content (base64)
        # along with the modifications.
        # Wait, sending back the whole file content is heavy.
        # Better approach: The client uploads the file, we parse it.
        # For export, maybe we should keep the state on the server?
        # But the spec says "Localhost", so state is fine, but "Stateless" is better.
        # Let's stick to the plan: Client sends modifications.
        # But we need the original file to modify.
        # Let's assume the client sends the original file content as base64 string in the request.
        
        import base64
        original_bytes = base64.b64decode(request.original_content)
        
        modified_bytes = update_voice_control_commands(original_bytes, request.command_id, request.points)
        
        return {
            "filename": "modified.voicecontrolcommands",
            "content": base64.b64encode(modified_bytes).decode('utf-8')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from parser import create_combined_plist

class CommandData(BaseModel):
    name: str
    points: List[Point]
    duration: float = None

class ExportMergedRequest(BaseModel):
    commands: List[CommandData]

@app.post("/api/export_merged")
async def export_merged(request: ExportMergedRequest):
    try:
        # Convert Pydantic models to dicts for the parser
        commands_list = []
        for cmd in request.commands:
            commands_list.append({
                'name': cmd.name,
                'points': [{'x': p.x, 'y': p.y} for p in cmd.points]
            })
            
        plist_bytes = create_combined_plist(commands_list)
        
        import base64
        return {
            "filename": "merged_commands.voicecontrolcommands",
            "content": base64.b64encode(plist_bytes).decode('utf-8')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
