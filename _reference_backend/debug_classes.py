import plistlib
import base64
import pprint

def inspect_classes():
    with open('/Users/kasugaiakira/Desktop/voice-control-commander/samples/Sequence_sample.voicecontrolcommands', 'rb') as f:
        pl = plistlib.load(f)
    
    commands = pl['CommandsTable']
    for key, cmd in commands.items():
        gesture_data_b64 = cmd['CustomGesture']
        if isinstance(gesture_data_b64, bytes):
            gesture_data = gesture_data_b64
        else:
            gesture_data_b64 = gesture_data_b64.replace('\n', '').replace('\t', '').replace(' ', '')
            gesture_data = base64.b64decode(gesture_data_b64)
        
        try:
            root = plistlib.loads(gesture_data)
            objects = root['$objects']
            
            # Root Class (UID 255 in previous run, but let's find it dynamically)
            top = root['$top']
            root_uid = top['root']
            root_obj = objects[root_uid.data]
            root_class_uid = root_obj['$class']
            print(f"Root Class UID: {root_class_uid}")
            pprint.pprint(objects[root_class_uid.data])
            
            # Find an event to get its class
            if 'AllEvents' in root_obj:
                all_events_uid = root_obj['AllEvents']
                all_events_obj = objects[all_events_uid.data]
                if 'NS.objects' in all_events_obj:
                    first_event_uid = all_events_obj['NS.objects'][0]
                    first_event_obj = objects[first_event_uid.data]
                    event_class_uid = first_event_obj['$class']
                    print(f"Event Class UID: {event_class_uid}")
                    pprint.pprint(objects[event_class_uid.data])
            
            break # Only need one

        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    inspect_classes()
