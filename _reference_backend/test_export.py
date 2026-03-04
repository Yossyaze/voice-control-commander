import sys
import os
sys.path.append(os.getcwd())
from parser import create_combined_plist
import plistlib
import base64

def test_export():
    commands_data = [
        {
            'name': 'Test Sequence',
            'strokes': [
                [{'x': 100.0, 'y': 100.0}, {'x': 200.0, 'y': 200.0}], # Stroke 1
                [{'x': 300.0, 'y': 300.0}, {'x': 400.0, 'y': 400.0}]  # Stroke 2
            ]
        }
    ]
    
    plist_bytes = create_combined_plist(commands_data)
    
    with open('test_output.voicecontrolcommands', 'wb') as f:
        f.write(plist_bytes)
    
    print("Exported to test_output.voicecontrolcommands")

if __name__ == "__main__":
    test_export()
