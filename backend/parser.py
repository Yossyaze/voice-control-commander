import plistlib
import base64
import uuid
import time
import re

def parse_voice_control_commands(content: bytes):
    try:
        pl = plistlib.loads(content)
    except Exception as e:
        raise ValueError(f"Invalid plist file: {e}")

    commands_table = pl.get('CommandsTable', {})
    commands = []

    for key, value in commands_table.items():
        if 'CustomGesture' in value:
            gesture_data_b64 = value['CustomGesture'] # This is bytes in plistlib loaded dict if it's <data>
            
            # plistlib loads <data> tags as bytes objects directly
            if isinstance(gesture_data_b64, bytes):
                 gesture_data = gesture_data_b64
            else:
                 # Should not happen with plistlib.loads on valid file, but just in case
                 gesture_data = base64.b64decode(gesture_data_b64)

            points = parse_gesture_data(gesture_data)
            
            command_name = "Unknown"
            if 'CustomCommands' in value and 'ja_JP' in value['CustomCommands']:
                 command_name = value['CustomCommands']['ja_JP'][0]
            elif 'CustomCommands' in value and 'en_US' in value['CustomCommands']:
                 command_name = value['CustomCommands']['en_US'][0]

            commands.append({
                'id': key,
                'name': command_name,
                'points': points
            })

    return {'commands': commands}

def parse_gesture_data(gesture_data: bytes):
    # The CustomGesture data is a binary plist (NSKeyedArchiver)
    try:
        # We need to decode the binary plist
        # Since Python's plistlib can read binary plists, let's try that.
        root = plistlib.loads(gesture_data)
        
        # NSKeyedArchiver format is complex.
        # It usually has '$objects', '$top', '$version', '$archiver'.
        # The points are likely stored as strings "{x, y}" in $objects.
        
        objects = root.get('$objects', [])
        points = []
        
        # Regex to match "{x, y}" format
        point_pattern = re.compile(r'\{([\d\.]+),\s*([\d\.]+)\}')
        
        for obj in objects:
            if isinstance(obj, str):
                match = point_pattern.match(obj)
                if match:
                    x = float(match.group(1))
                    y = float(match.group(2))
                    points.append({'x': x, 'y': y})
        
        return points

    except Exception as e:
        print(f"Error parsing gesture data: {e}")
        return []

def update_voice_control_commands(content: bytes, command_id: str, new_points: list):
    pl = plistlib.loads(content)
    commands_table = pl.get('CommandsTable', {})
    
    # Generate new ID
    new_command_id = f"Custom.{int(time.time())}.{uuid.uuid4().hex[:6]}"
    
    target_command = None
    original_command_key = None
    
    # Find the command to update
    if command_id in commands_table:
        target_command = commands_table[command_id]
        original_command_key = command_id
    
    if not target_command:
        raise ValueError(f"Command ID {command_id} not found")

    # Update the command key (ID)
    # We need to remove the old key and add the new one
    del commands_table[original_command_key]
    commands_table[new_command_id] = target_command
    
    # Update gesture data
    original_gesture_data = target_command['CustomGesture']
    new_gesture_data = update_gesture_data(original_gesture_data, new_points)
    target_command['CustomGesture'] = new_gesture_data
    
    # Update ExportDate
    pl['ExportDate'] = time.time()
    
    return plistlib.dumps(pl)

def update_gesture_data(original_gesture_data: bytes, new_points: list):
    root = plistlib.loads(original_gesture_data)
    objects = root.get('$objects', [])
    
    # 1. Find the NSArray containing points
    # Heuristic: It has 'NS.objects' and points to strings that look like points
    point_pattern = re.compile(r'\{([\d\.]+),\s*([\d\.]+)\}')
    
    target_array_obj = None
    
    for i, obj in enumerate(objects):
        if isinstance(obj, dict) and 'NS.objects' in obj:
            refs = obj['NS.objects']
            if len(refs) > 0:
                # Check the first referenced object
                first_ref_idx = refs[0].data
                if first_ref_idx < len(objects):
                    first_obj = objects[first_ref_idx]
                    if isinstance(first_obj, str) and point_pattern.match(first_obj):
                        target_array_obj = obj
                        break
    
    if not target_array_obj:
        # Fallback: If we can't find the array, we can't update safely.
        # But maybe the original gesture had 0 points?
        # For now, log error or raise
        print("Error: Could not find point array in gesture data")
        return original_gesture_data

    # 2. Prepare new point strings and append to objects
    new_point_uids = []
    current_object_count = len(objects)
    
    for p in new_points:
        p_str = f"{{{p['x']}, {p['y']}}}"
        objects.append(p_str)
        new_point_uids.append(plistlib.UID(current_object_count))
        current_object_count += 1
        
    # 3. Update the array's references
    target_array_obj['NS.objects'] = new_point_uids
    
    return plistlib.dumps(root, fmt=plistlib.FMT_BINARY)

def create_gesture_data(points: list):
    # Create NSKeyedArchiver structure for gesture data
    # points: [{'x': x, 'y': y}, ...]
    
    objects = [
        '$null',
        {
            'NS.objects': [], # Will be populated with UIDs
            '$class': plistlib.UID(len(points) + 2) # The last object is the class definition
        }
    ]
    
    # Add points
    point_uids = []
    for i, p in enumerate(points):
        p_str = f"{{{p['x']}, {p['y']}}}"
        objects.append(p_str)
        point_uids.append(plistlib.UID(i + 2)) # +2 because index 0 is null, 1 is the array dict
        
    # Update the array's objects reference
    objects[1]['NS.objects'] = point_uids
    
    # Add class definition at the end
    objects.append({
        '$classname': 'NSArray',
        '$classes': ['NSArray', 'NSObject']
    })
    
    gesture_root = {
        '$archiver': 'NSKeyedArchiver',
        '$objects': objects,
        '$top': {'root': plistlib.UID(1)},
        '$version': 100000
    }
    
    return plistlib.dumps(gesture_root, fmt=plistlib.FMT_BINARY)

def create_combined_plist(commands_data: list):
    # commands_data: [{'name': str, 'points': [{'x': float, 'y': float}, ...]}, ...]
    
    commands_table = {}
    
    for cmd in commands_data:
        # Generate ID
        cmd_id = f"Custom.{int(time.time())}.{uuid.uuid4().hex[:6]}"
        
        # Create gesture data
        gesture_data = create_gesture_data(cmd['points'])
        
        commands_table[cmd_id] = {
            'CommandID': cmd_id,
            'CustomCommands': {
                'en_US': [cmd['name']],
                'ja_JP': [cmd['name']]
            },
            'CustomGesture': gesture_data,
            'Enabled': True,
            'CustomScope': 'com.apple.speech.SystemWideScope',
            'CustomType': 'RunGesture',
            'ConfirmationRequired': False,
            'CustomModifyDate': time.time() # Should be date object ideally, but float timestamp might work or need conversion
        }
        
    pl = {
        'CommandsTable': commands_table,
        'ExportDate': time.time(),
        'Version': 1.0,
        'SystemVersion': {
            'ProductName': 'iPhone OS',
            'ProductVersion': '16.0' # Dummy version
        }
    }
    
    return plistlib.dumps(pl, fmt=plistlib.FMT_XML)
