from parser import create_combined_plist
import plistlib
import datetime
import base64

# Simulating command data
commands_data = [
    {
        'name': 'Test Command',
        'strokes': [[{'x': 100.0, 'y': 100.0}, {'x': 200.0, 'y': 200.0}]]
    }
]

# Generate plist content
plist_xml_bytes = create_combined_plist(commands_data)

# Save to file
output_file = "test_output.voicecontrolcommands"
with open(output_file, "wb") as f:
    f.write(plist_xml_bytes)

print(f"Generated {output_file}")

# Analyze the generated file
import debug_plist
debug_plist.analyze_plist(output_file)
