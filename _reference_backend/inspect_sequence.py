import plistlib
import base64
import pprint

# Read the sample file
with open('/Users/kasugaiakira/Desktop/voice-control-commander/samples/アムマラコマンド.voicecontrolcommands', 'rb') as f:
    data = plistlib.load(f)

print("--- Root Keys ---")
print(data.keys())

if 'CommandsTable' in data:
    print(f"COMMAND_COUNT: {len(data['CommandsTable'])}")
    for cmd_id, cmd_data in data['CommandsTable'].items():
        name = "Unknown"
        if 'CustomCommands' in cmd_data:
            if 'ja_JP' in cmd_data['CustomCommands']:
                name = cmd_data['CustomCommands']['ja_JP'][0]
            elif 'en_US' in cmd_data['CustomCommands']:
                name = cmd_data['CustomCommands']['en_US'][0]
        
        stroke_count = 0
        if 'CustomGesture' in cmd_data:
            gesture_data = cmd_data['CustomGesture']
            try:
                inner_plist = plistlib.loads(gesture_data)
                if '$objects' in inner_plist:
                    objects = inner_plist['$objects']
                    root_uid = inner_plist['$top']['root']
                    
                    # Manual unarchive of root to find AllEvents
                    # (Simplified logic for speed)
                    root_obj = objects[root_uid.data]
                    if 'AllEvents' in root_obj:
                         events_uid = root_obj['AllEvents']
                         events_container = objects[events_uid.data] # Resolve UID
                         
                         events = []
                         if isinstance(events_container, dict) and 'NS.objects' in events_container:
                             events = events_container['NS.objects']
                         elif isinstance(events_container, list):
                             events = events_container
                             
                         # Debug
                         print(f"DEBUG: Processing {len(events)} events for {name}")
                         
                         # Count strokes based on Touch ID changes or Lift events
                         active_touch_ids = set()
                         stroke_ids_seen = set()
                         
                         for i, event_obj in enumerate(events):
                             event_raw = None
                             if isinstance(event_obj, plistlib.UID):
                                 event_raw = objects[event_obj.data]
                             elif isinstance(event_obj, dict):
                                 event_raw = event_obj
                             
                             if event_raw and isinstance(event_raw, dict) and 'NS.keys' in event_raw:
                                     keys = [objects[k.data] for k in event_raw['NS.keys']]
                                     vals = event_raw['NS.objects']
                                     event_map = dict(zip(keys, vals))
                                     
                                     if 'Fingers' in event_map:
                                         f_obj = event_map['Fingers']
                                         f_raw = None
                                         if isinstance(f_obj, plistlib.UID):
                                              f_raw = objects[f_obj.data]
                                         elif isinstance(f_obj, dict):
                                              f_raw = f_obj
                                         if f_raw:
                                              # Trace
                                              if i < 5:
                                                  print(f"Processing fingers for event {i}")
                                              if 'NS.keys' in f_raw:
                                                   if i < 5:
                                                       print(f"  Has NS.keys: {f_raw['NS.keys']}")
                                                   if len(f_raw['NS.keys']) > 0:
                                                      # Get the Touch ID keys
                                                      t_ids = []
                                                      for k in f_raw['NS.keys']:
                                                          if isinstance(k, plistlib.UID):
                                                              t_ids.append(objects[k.data])
                                                          else:
                                                              t_ids.append(k)
                                                      
                                                      if i < 5:
                                                          print(f"  Touch IDs: {t_ids}")
                                                      for tid in t_ids:
                                                          if tid not in stroke_ids_seen:
                                                              stroke_ids_seen.add(tid)
                                                              stroke_count += 1

                                              # Handle case where fingers might be direct dictionary
                                              elif isinstance(f_raw, dict) and not 'NS.keys' in f_raw and len(f_raw) > 0:
                                                   # Maybe it's a direct dictionary not archived?
                                                   pass # TODO: Investigate
                                         elif isinstance(f_uid, dict):
                                              # Maybe it's not a UID but the dict itself?
                                              if 'NS.keys' in f_uid:
                                                   t_ids = [objects[k.data] for k in f_uid['NS.keys']]
                                                   for tid in t_ids:
                                                        if tid not in stroke_ids_seen:
                                                            stroke_ids_seen.add(tid)
                                                            stroke_count += 1
                                              
            except Exception as e:
                print(f"Error parsing gesture for {name}: {e}")
                
        print(f"COMMAND: {name}, STROKES: {stroke_count}")

# Stop here
import sys
sys.exit(0)

    
if 'UUID' in data:
    print(f"\nUUID: {data['UUID']}")
    
# Simple NSKeyedUnarchiver
def unarchive(obj, objects):
    if isinstance(obj, plistlib.UID):
        return unarchive(objects[obj.data], objects)
    if isinstance(obj, dict):
        if '$class' in obj:
            # It's an archived object
            new_obj = {}
            for k, v in obj.items():
                if k == '$class':
                    continue
                new_obj[k] = unarchive(v, objects)
            return new_obj
        elif 'NS.keys' in obj and 'NS.objects' in obj:
            # It's a dictionary or map
            keys = [unarchive(k, objects) for k in obj['NS.keys']]
            vals = [unarchive(v, objects) for v in obj['NS.objects']]
            return dict(zip(keys, vals))
        elif 'NS.objects' in obj:
             # It's an array/set
            return [unarchive(v, objects) for v in obj['NS.objects']]
        else:
            # Regular dict
            return {k: unarchive(v, objects) for k, v in obj.items()}
    if isinstance(obj, list):
        return [unarchive(v, objects) for v in obj]
    return obj

commands = data['CommandsTable']
for key, cmd in commands.items():
    if 'CustomGesture' in cmd:
        gesture_data = cmd['CustomGesture']
        try:
            inner_plist = plistlib.loads(gesture_data)
            if '$objects' in inner_plist:
                objects = inner_plist['$objects']
                root_uid = inner_plist['$top']['root']
                root_obj = unarchive(root_uid, objects)
                
                print(f"First 20 Objects: {objects[:20]}")
                
                if 'AllEvents' in root_obj:
                    print(f"Root Object Keys: {root_obj.keys()}")
                    events_container = root_obj['AllEvents']
                if 'AllEvents' in root_obj:
                    # Simplify event printing to see the flow
                    events_container = root_obj['AllEvents']
                    events = []
                    
                    if isinstance(events_container, dict) and 'NS.objects' in events_container:
                        events = events_container['NS.objects'] # This is list of UIDs
                    elif isinstance(events_container, list):
                        events = events_container # List of UIDs
                        
                    print(f"Total Events: {len(events)}")
                    
                    for i, event_uid in enumerate(events):
                        print(f"Debug: i={i}, type={type(event_uid)}, val={event_uid}")
                        if isinstance(event_uid, plistlib.UID):
                            event_raw = objects[event_uid.data]
                        else:
                            print(f"Warning: Expected UID but got {type(event_uid)}")
                            continue
                        
                        # Assuming event_raw is a dict with NS.keys and NS.objects (NSDictionary)
                        if 'NS.keys' in event_raw and 'NS.objects' in event_raw:
                            keys = [objects[k.data] for k in event_raw['NS.keys']]
                            vals = event_raw['NS.objects']
                            event_map = dict(zip(keys, vals))
                            
                            time = "N/A"
                            if 'Time' in event_map:
                                time = event_map['Time']
                            
                            fingers = "Unknown"
                            if 'Fingers' in event_map:
                                f_uid = event_map['Fingers']
                                f_raw = objects[f_uid.data]
                                # Check if it has objects (meaning fingers exist) or is empty
                                if 'NS.objects' in f_raw:
                                    fingers = f"Count: {len(f_raw['NS.objects'])}"
                                else:
                                    fingers = "Empty"
                            
                            print(f"Event {i}: Time={time}, Fingers={fingers}")
                        else:
                             print(f"Event {i}: Raw={event_raw}")

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
