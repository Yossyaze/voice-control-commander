from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import plistlib
import uvicorn
import io
from parser import parse_voice_control_commands, update_voice_control_commands
import os
import json
import uuid

PROJECTS_DIR = "projects"
if not os.path.exists(PROJECTS_DIR):
    os.makedirs(PROJECTS_DIR)

BACKGROUNDS_DIR = "backgrounds"
if not os.path.exists(BACKGROUNDS_DIR):
    os.makedirs(BACKGROUNDS_DIR)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
app.mount("/api/backgrounds/files", StaticFiles(directory=BACKGROUNDS_DIR), name="backgrounds")

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
            "filename": "modified.voicecontrolcom",
            "content": base64.b64encode(modified_bytes).decode('utf-8')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from parser import create_combined_plist

class CommandData(BaseModel):
    name: str
    points: List[Point] = []
    strokes: List[List[Point]] = None
    stroke_waits: List[float] = None # List of wait times. index i is wait AFTER stroke i.
    duration: float = None

class ExportMergedRequest(BaseModel):
    commands: List[CommandData]

@app.post("/api/export_merged")
async def export_merged(request: ExportMergedRequest):
    try:
        # Convert Pydantic models to dicts for the parser
        commands_list = []
        for cmd in request.commands:
            cmd_dict = {
                'name': cmd.name,
                'points': [{'x': p.x, 'y': p.y} for p in cmd.points]
            }
            if cmd.strokes:
                cmd_dict['strokes'] = [[{'x': p.x, 'y': p.y} for p in stroke] for stroke in cmd.strokes]
            if cmd.stroke_waits:
                cmd_dict['stroke_waits'] = cmd.stroke_waits
            commands_list.append(cmd_dict)
            
        plist_bytes = create_combined_plist(commands_list)
        
        import base64
        return {
            "filename": "merged_commands.voicecontrolcom",
            "content": base64.b64encode(plist_bytes).decode('utf-8')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ProjectData(BaseModel):
    name: str
    commands: List[Dict[str, Any]]
    settings: Dict[str, Any]

@app.get("/api/projects")
async def list_projects():
    try:
        projects = []
        for filename in os.listdir(PROJECTS_DIR):
            if filename.endswith(".json"):
                filepath = os.path.join(PROJECTS_DIR, filename)
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    projects.append({
                        "id": filename[:-5],
                        "name": data.get("name", "Unknown Project")
                    })
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    try:
        filepath = os.path.join(PROJECTS_DIR, f"{project_id}.json")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Project not found")
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/projects")
async def create_project(data: ProjectData):
    try:
        project_id = str(uuid.uuid4())
        filepath = os.path.join(PROJECTS_DIR, f"{project_id}.json")
        
        project_content = {
            "id": project_id,
            "name": data.name,
            "commands": data.commands,
            "settings": data.settings
        }
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(project_content, f, ensure_ascii=False, indent=2)
            
        return project_content
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/projects/{project_id}")
async def update_project(project_id: str, data: ProjectData):
    try:
        filepath = os.path.join(PROJECTS_DIR, f"{project_id}.json")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Project not found")
            
        project_content = {
            "id": project_id,
            "name": data.name,
            "commands": data.commands,
            "settings": data.settings
        }
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(project_content, f, ensure_ascii=False, indent=2)
            
        return project_content
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    filepath = os.path.join(PROJECTS_DIR, f"{project_id}.json")
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        os.remove(filepath)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# Backgrounds API
# ==========================================

@app.get("/api/backgrounds")
async def list_backgrounds():
    try:
        images = []
        for filename in os.listdir(BACKGROUNDS_DIR):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                images.append({
                    "id": filename,
                    "url": f"/api/backgrounds/files/{filename}"
                })
        # Sort by creation time (newest first)
        images.sort(key=lambda x: os.path.getctime(os.path.join(BACKGROUNDS_DIR, x["id"])), reverse=True)
        return images
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/backgrounds")
async def upload_background(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    # Generate unique filename to avoid overwrites
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(BACKGROUNDS_DIR, unique_filename)
    
    try:
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)
        return {
            "id": unique_filename,
            "url": f"/api/backgrounds/files/{unique_filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/backgrounds/{image_id}")
async def delete_background(image_id: str):
    # Security: prevent path traversal
    if ".." in image_id or "/" in image_id or "\\" in image_id:
        raise HTTPException(status_code=400, detail="Invalid image ID")
        
    filepath = os.path.join(BACKGROUNDS_DIR, image_id)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        os.remove(filepath)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
