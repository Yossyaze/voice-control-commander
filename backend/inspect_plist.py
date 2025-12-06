import plistlib
import re
import pprint

def inspect_plist(file_path):
    with open(file_path, 'rb') as f:
        pl = plistlib.load(f)
    
    commands_table = pl.get('CommandsTable', {})
    for key, value in commands_table.items():
        if 'CustomGesture' in value:
            print(f"--- Command: {key} ---")
            gesture_data = value['CustomGesture']
            root = plistlib.loads(gesture_data)
            
            objects = root.get('$objects', [])
            print(f"Total Objects: {len(objects)}")
            
            # Find strings that look like points
            point_pattern = re.compile(r'\{([\d\.]+),\s*([\d\.]+)\}')
            point_indices = []
            for i, obj in enumerate(objects):
                if isinstance(obj, str) and point_pattern.match(obj):
                    point_indices.append(i)
            
            print(f"Found {len(point_indices)} point strings.")
            if point_indices:
                print(f"First point index: {point_indices[0]}, Last: {point_indices[-1]}")
            
            # Find objects that reference these points
            # NSKeyedArchiver arrays usually have 'NS.objects' which is a list of UIDs
            for i, obj in enumerate(objects):
                if isinstance(obj, dict) and 'NS.objects' in obj:
                    refs = obj['NS.objects']
                    # Check if these refs point to our points
                    # refs are plistlib.UID objects
                    ref_values = [uid.data for uid in refs]
                    
                    # Check intersection
                    common = set(ref_values).intersection(set(point_indices))
                    if common:
                        print(f"Object {i} references points: {obj.get('$class', 'Unknown Class')}")
                        print(f"  References {len(common)} points out of {len(refs)} total refs.")
                        if len(common) == len(point_indices):
                            print("  -> This seems to be the main point array!")
                            # Print class info if available
                            class_uid = obj.get('$class')
                            if class_uid:
                                class_obj = objects[class_uid.data]
                                print(f"  Class Info: {class_obj}")

inspect_plist('/Users/kasugaiakira/.gemini/antigravity/scratch/voice-control-commander/samples/sample.voicecontrolcommands')
