import plistlib
import uuid
import time
import base64

def create_template_plist():
    # Create a minimal valid structure
    # We need a CommandsTable with one command
    
    command_id = f"Custom.{int(time.time())}.{uuid.uuid4().hex[:6]}"
    
    # Create dummy gesture data (NSKeyedArchiver)
    # 2 points: {0.5, 0.5}, {0.6, 0.6} (normalized coordinates 0-1?) 
    # Actually, Voice Control seems to use screen coordinates (points).
    # Let's use some default values like {100, 100}, {200, 200}
    
    objects = [
        '$null',
        {
            'NS.objects': [plistlib.UID(2), plistlib.UID(3)],
            '$class': plistlib.UID(4)
        },
        '{500, 400}', # Start point (approx center)
        '{600, 400}', # End point
        {
            '$classname': 'NSArray',
            '$classes': ['NSArray', 'NSObject']
        }
    ]
    
    gesture_root = {
        '$archiver': 'NSKeyedArchiver',
        '$objects': objects,
        '$top': {'root': plistlib.UID(1)},
        '$version': 100000
    }
    
    gesture_data = plistlib.dumps(gesture_root, fmt=plistlib.FMT_BINARY)
    
    # Main plist structure
    pl = {
        'CommandsTable': {
            command_id: {
                'CommandID': command_id,
                'CustomCommands': {
                    'en_US': ['New Command'],
                    'ja_JP': ['新規コマンド']
                },
                'CustomGesture': gesture_data,
                'Enabled': True,
            }
        },
        'ExportDate': time.time(),
        'Version': 1.0
    }
    
    plist_bytes = plistlib.dumps(pl, fmt=plistlib.FMT_XML)
    b64_content = base64.b64encode(plist_bytes).decode('utf-8')
    
    print(b64_content)

if __name__ == "__main__":
    create_template_plist()
