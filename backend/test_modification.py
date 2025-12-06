import plistlib
import re

def create_dummy_gesture_data():
    # Construct a minimal object graph resembling a gesture
    # Object 0: "$null" (standard)
    # Object 1: The main NSArray of points
    # Object 2: Point string 1
    # Object 3: Point string 2
    # Object 4: NSArray class definition
    
    objects = [
        '$null',
        {
            'NS.objects': [plistlib.UID(2), plistlib.UID(3)],
            '$class': plistlib.UID(4)
        },
        '{10, 10}',
        '{20, 20}',
        {
            '$classname': 'NSArray',
            '$classes': ['NSArray', 'NSObject']
        }
    ]
    
    root = {
        '$archiver': 'NSKeyedArchiver',
        '$objects': objects,
        '$top': {'root': plistlib.UID(1)},
        '$version': 100000
    }
    
    return plistlib.dumps(root, fmt=plistlib.FMT_BINARY)

def update_gesture_points(gesture_data, new_points):
    root = plistlib.loads(gesture_data)
    objects = root['$objects']
    
    # 1. Find the NSArray containing points
    # Heuristic: It has 'NS.objects' and points to strings that look like points
    point_pattern = re.compile(r'\{([\d\.]+),\s*([\d\.]+)\}')
    
    target_array_obj = None
    target_array_index = -1
    
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
                        target_array_index = i
                        break
    
    if not target_array_obj:
        print("Could not find point array")
        return None

    print(f"Found point array at index {target_array_index}")
    
    # 2. Prepare new point strings
    new_point_uids = []
    
    # Strategy: Append ALL new points to the end of $objects to avoid index shifting issues for existing objects
    # We leave old point strings as garbage (unreferenced)
    
    current_object_count = len(objects)
    
    for p in new_points:
        p_str = f"{{{p['x']}, {p['y']}}}"
        objects.append(p_str)
        new_point_uids.append(plistlib.UID(current_object_count))
        current_object_count += 1
        
    # 3. Update the array's references
    target_array_obj['NS.objects'] = new_point_uids
    
    return plistlib.dumps(root, fmt=plistlib.FMT_BINARY)

def verify_gesture_data(gesture_data):
    root = plistlib.loads(gesture_data)
    objects = root['$objects']
    
    point_pattern = re.compile(r'\{([\d\.]+),\s*([\d\.]+)\}')
    points = []
    
    # Find array again
    for obj in objects:
        if isinstance(obj, dict) and 'NS.objects' in obj:
            refs = obj['NS.objects']
            if len(refs) > 0:
                first_ref_idx = refs[0].data
                if first_ref_idx < len(objects):
                    first_obj = objects[first_ref_idx]
                    if isinstance(first_obj, str) and point_pattern.match(first_obj):
                        # This is likely it
                        for uid in refs:
                            p_str = objects[uid.data]
                            match = point_pattern.match(p_str)
                            if match:
                                points.append({'x': float(match.group(1)), 'y': float(match.group(2))})
                        break
    return points

# Test
print("Creating dummy data...")
original_data = create_dummy_gesture_data()
print("Original points:", verify_gesture_data(original_data))

new_points = [
    {'x': 100, 'y': 100},
    {'x': 110, 'y': 110},
    {'x': 120, 'y': 120}
]

print("Updating points...")
updated_data = update_gesture_points(original_data, new_points)

print("Verifying updated data...")
final_points = verify_gesture_data(updated_data)
print("Final points:", final_points)

assert len(final_points) == 3
assert final_points[0]['x'] == 100
print("SUCCESS")
