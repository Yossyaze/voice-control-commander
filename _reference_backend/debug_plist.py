import plistlib
import base64
import pprint
import datetime

def decode_gesture_data(data_bytes):
    try:
        # data_bytes はすでに bytes です (plistlib.load から)
        # 内部はバイナリ plist です。
        return plistlib.loads(data_bytes)
    except Exception as e:
        return f"Error decoding gesture data: {e}"

def analyze_plist(file_path):
    print(f"--- Analyzing {file_path} ---")
    try:
        with open(file_path, 'rb') as f:
            pl = plistlib.load(f)
        
        commands = pl.get('CommandsTable', {})
        for key, val in commands.items():
            print(f"Command ID: {key}")
            
            # CustomModifyDate の確認
            modify_date = val.get('CustomModifyDate')
            print(f"  CustomModifyDate Type: {type(modify_date)}")
            print(f"  CustomModifyDate Value: {modify_date}")

            # CustomGesture の確認
            gesture_data = val.get('CustomGesture')
            if gesture_data:
                print(f"  CustomGesture Data Size: {len(gesture_data)} bytes")
                decoded_gesture = decode_gesture_data(gesture_data)
                # plistlib だけでは NSKeyedArchiver オブジェクトの深層まで簡単に再帰できません
                # plistlib は NSKeyedArchiver ロジックを自動的にアンパックしないためです。
                # しかし、生の構造 (stream, $objects, $top など) は確認できます。
                if isinstance(decoded_gesture, dict):
                     print("  CustomGesture Structure Keys:", list(decoded_gesture.keys()))
                     if '$objects' in decoded_gesture:
                         print(f"  $objects count: {len(decoded_gesture['$objects'])}")
                         # 可能な場合、クラス名を確認するために最初のいくつかのオブジェクトを表示
                         for i, obj in enumerate(decoded_gesture['$objects'][:10]):
                             if isinstance(obj, dict) and '$classname' in obj:
                                 print(f"    Object {i} class: {obj['$classname']}")
                             elif isinstance(obj, dict) and '$class' in obj:
                                 # クラス参照の確認
                                 print(f"    Object {i} class ref: {obj['$class']}")
                             else:
                                 print(f"    Object {i}: {type(obj)}")
                else:
                    print("  CustomGesture is not a dict:", type(decoded_gesture))
            else:
                 print("  No CustomGesture data found")
                 
            # print("  Value keys:", list(val.keys()))

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
    print("\n")

if __name__ == "__main__":
    analyze_plist("samples/New Command.plist")
    analyze_plist("samples/シークエンステスト.voicecontrolcommands")
