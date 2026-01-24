import plistlib
import base64
import uuid
import datetime
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
            gesture_data_b64 = value['CustomGesture']
            
            if isinstance(gesture_data_b64, bytes):
                 gesture_data = gesture_data_b64
            else:
                 gesture_data = base64.b64decode(gesture_data_b64)

            strokes = parse_gesture_data(gesture_data)
            
            command_name = "Unknown"
            if 'CustomCommands' in value and 'ja_JP' in value['CustomCommands']:
                 command_name = value['CustomCommands']['ja_JP'][0]
            elif 'CustomCommands' in value and 'en_US' in value['CustomCommands']:
                 command_name = value['CustomCommands']['en_US'][0]

            # For backward compatibility, 'points' will be the first stroke or empty
            # But the frontend should prefer 'strokes'
            first_stroke = strokes[0] if strokes else []

            commands.append({
                'id': key,
                'name': command_name,
                'points': first_stroke,
                'strokes': strokes
            })

    return {'commands': commands}

def unarchive_object(obj, objects):
    if isinstance(obj, plistlib.UID):
        return unarchive_object(objects[obj.data], objects)
    if isinstance(obj, dict):
        if 'NS.keys' in obj and 'NS.objects' in obj:
            # It's a dictionary or map
            keys = [unarchive_object(k, objects) for k in obj['NS.keys']]
            vals = [unarchive_object(v, objects) for v in obj['NS.objects']]
            return dict(zip(keys, vals))
        elif 'NS.objects' in obj:
             # It's an array/set
            return [unarchive_object(v, objects) for v in obj['NS.objects']]
        elif '$class' in obj:
            # It's an archived object
            new_obj = {}
            for k, v in obj.items():
                if k == '$class':
                    continue
                new_obj[k] = unarchive_object(v, objects)
            return new_obj
        else:
            # Regular dict
            return {k: unarchive_object(v, objects) for k, v in obj.items()}
    if isinstance(obj, list):
        return [unarchive_object(v, objects) for v in obj]
    return obj

def parse_gesture_data(gesture_data: bytes):
    try:
        root = plistlib.loads(gesture_data)
        
        if '$objects' in root:
            objects = root['$objects']
            root_uid = root['$top']['root']
            root_obj = unarchive_object(root_uid, objects)
            
            events = []
            if 'AllEvents' in root_obj:
                events_container = root_obj['AllEvents']
                if isinstance(events_container, list):
                    events = events_container
                elif isinstance(events_container, dict) and 'NS.objects' in events_container:
                    # This case shouldn't be hit if unarchive_object works correctly for NS.objects
                    # but just in case
                    pass
            
            strokes = []
            current_stroke = []
            last_time = None
            
            # Regex to match "{x, y}" format
            point_pattern = re.compile(r'\{([\d\.]+),\s*([\d\.]+)\}')

            for event in events:
                # Extract time
                time_val = event.get('Time', 0.0)
                
                # Check for stroke break
                if last_time is not None and (time_val - last_time) > 0.1:
                    if current_stroke:
                        strokes.append(current_stroke)
                        current_stroke = []
                
                last_time = time_val
                
                # Extract fingers/points
                fingers = event.get('Fingers', {})
                # Fingers は dict（Touch ID → ポイントデータ）またはリストの可能性がある
                
                # 辞書の場合は values() を使って値をイテレート
                if isinstance(fingers, dict):
                    finger_values = fingers.values()
                else:
                    finger_values = fingers
                
                for f in finger_values:
                    point_str = None
                    if isinstance(f, str):
                        point_str = f
                    elif isinstance(f, dict):
                         # Recursively find NS.pointval
                        stack = [f]
                        while stack:
                            curr = stack.pop()
                            if isinstance(curr, dict):
                                if 'NS.pointval' in curr:
                                    point_str = curr['NS.pointval']
                                    break
                                for v in curr.values():
                                    if isinstance(v, (dict, list)):
                                        stack.append(v)
                            elif isinstance(curr, list):
                                for v in curr:
                                    if isinstance(v, (dict, list)):
                                        stack.append(v)
                    
                    if point_str:
                        match = point_pattern.match(point_str)
                        if match:
                            x = float(match.group(1))
                            y = float(match.group(2))
                            current_stroke.append({'x': x, 'y': y})
            
            if current_stroke:
                strokes.append(current_stroke)
                
            return strokes

        else:
            # Fallback for old format (if any) or simple plist
            # This matches the old logic
            objects = root.get('$objects', [])
            points = []
            point_pattern = re.compile(r'\{([\d\.]+),\s*([\d\.]+)\}')
            
            for obj in objects:
                if isinstance(obj, str):
                    match = point_pattern.match(obj)
                    if match:
                        x = float(match.group(1))
                        y = float(match.group(2))
                        points.append({'x': x, 'y': y})
            
            return [points] if points else []

    except Exception as e:
        print(f"Error parsing gesture data: {e}")
        return []

def update_voice_control_commands(content: bytes, command_id: str, new_points: list):
    # new_points might be a list of points (single stroke) or list of lists of points (sequence)
    # We need to handle both.
    
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
    del commands_table[original_command_key]
    commands_table[new_command_id] = target_command
    
    # Check if new_points is a sequence (list of lists)
    strokes = []
    if new_points and isinstance(new_points[0], list):
        strokes = new_points
    else:
        strokes = [new_points]

    # Update gesture data
    new_gesture_data = create_gesture_data(strokes)
    target_command['CustomGesture'] = new_gesture_data
    
    # Update ExportDate
    pl['ExportDate'] = time.time()
    
    return plistlib.dumps(pl)

def update_gesture_data(original_gesture_data: bytes, new_points: list):
    # Deprecated/Unused in this new logic, but kept for safety if called elsewhere
    # We redirect to create_gesture_data
    strokes = []
    if new_points and isinstance(new_points[0], list):
        strokes = new_points
    else:
        strokes = [new_points]
    return create_gesture_data(strokes)

class NSKeyedArchiverWriter:
    """
    動作するファイル構造を模倣した NSKeyedArchiver ライター。
    ルートオブジェクトを UID(1) に配置し、NSValue/NSMutableDictionary を使用。
    """
    def __init__(self):
        # UID(0) は常に '$null'
        # UID(1) はルートオブジェクト用に予約（後で挿入）
        self.objects = ['$null', None]  # None は後でルートオブジェクトに置換
        self.class_defs = {}
        self.string_cache = {}
        self.uid_counter = 2  # 2 から開始（0=$null, 1=root）

    def _add_object(self, obj):
        """オブジェクトを配列に追加し、UID を返す"""
        # 文字列の重複排除
        if isinstance(obj, str):
            if obj in self.string_cache:
                return self.string_cache[obj]
            uid = plistlib.UID(self.uid_counter)
            self.objects.append(obj)
            self.string_cache[obj] = uid
            self.uid_counter += 1
            return uid
        
        uid = plistlib.UID(self.uid_counter)
        self.objects.append(obj)
        self.uid_counter += 1
        return uid

    def _get_class_uid(self, classname, classes_list):
        """クラス定義の UID を取得または作成"""
        key = (classname, tuple(classes_list))
        if key not in self.class_defs:
            class_obj = {
                '$classname': classname,
                '$classes': classes_list
            }
            self.class_defs[key] = self._add_object(class_obj)
        return self.class_defs[key]

    def archive_nsvalue_point(self, point_str):
        """ポイント座標を NSValue としてアーカイブ"""
        # 動作するファイルの構造: {'NS.pointval': str, '$class': UID, 'NS.special': int}
        class_uid = self._get_class_uid('NSValue', ['NSValue', 'NSObject'])
        point_str_uid = self._add_object(point_str)
        
        nsvalue_obj = {
            'NS.pointval': point_str_uid,
            '$class': class_uid,
            'NS.special': 1
        }
        return self._add_object(nsvalue_obj)

    def archive_mutable_dict(self, keys_uids, objects_uids):
        """NSMutableDictionary としてアーカイブ"""
        class_uid = self._get_class_uid('NSMutableDictionary', ['NSMutableDictionary', 'NSDictionary', 'NSObject'])
        
        ns_dict_obj = {
            'NS.keys': keys_uids,
            'NS.objects': objects_uids,
            '$class': class_uid
        }
        return self._add_object(ns_dict_obj)

    def archive_dict(self, keys_uids, objects_uids):
        """NSDictionary としてアーカイブ"""
        class_uid = self._get_class_uid('NSDictionary', ['NSDictionary', 'NSObject'])
        
        ns_dict_obj = {
            'NS.keys': keys_uids,
            'NS.objects': objects_uids,
            '$class': class_uid
        }
        return self._add_object(ns_dict_obj)

    def archive_mutable_array(self, elements_uids):
        """NSMutableArray としてアーカイブ"""
        class_uid = self._get_class_uid('NSMutableArray', ['NSMutableArray', 'NSArray', 'NSObject'])
        
        ns_array_obj = {
            'NS.objects': elements_uids,
            '$class': class_uid
        }
        return self._add_object(ns_array_obj)

    def set_root_object(self, root_obj):
        """ルートオブジェクトを UID(1) に設定"""
        self.objects[1] = root_obj

    def to_bytes(self):
        """バイナリ plist を生成"""
        final_plist = {
            '$version': 100000,
            '$archiver': 'NSKeyedArchiver',
            '$top': {'root': plistlib.UID(1)},
            '$objects': self.objects
        }
        return plistlib.dumps(final_plist, fmt=plistlib.FMT_BINARY)


def create_gesture_data(strokes: list):
    """
    ストロークデータから CustomGesture バイナリを生成。
    動作するファイルの構造を完全に模倣。
    """
    archiver = NSKeyedArchiverWriter()
    
    # Cocoa Epoch オフセット
    COCOA_EPOCH_OFFSET = 978307200.0
    start_time = time.time() - COCOA_EPOCH_OFFSET
    current_time = start_time
    frame_duration = 1.0 / 60.0
    
    # 共通文字列キーを事前登録（重複排除のため）
    fingers_key_uid = archiver._add_object('Fingers')
    forces_key_uid = archiver._add_object('Forces')
    time_key_uid = archiver._add_object('Time')
    
    # 各イベントを構築
    event_uids = []
    touch_id = 2  # サンプルファイルでは 2 から開始
    
    for stroke_index, stroke in enumerate(strokes):
        if stroke_index > 0:
            current_time += 0.2
            # リフトイベント（空の Fingers/Forces）
            empty_dict_uid = archiver.archive_mutable_dict([], [])
            time_uid = archiver._add_object(current_time)
            
            lift_event_uid = archiver.archive_dict(
                [fingers_key_uid, forces_key_uid, time_key_uid],
                [empty_dict_uid, empty_dict_uid, time_uid]
            )
            event_uids.append(lift_event_uid)
            current_time += 0.1
            touch_id += 1
        
        for p in stroke:
            # ポイント文字列
            p_str = f"{{{p['x']:.6f}, {p['y']:.6f}}}"
            
            # NSValue でポイントをアーカイブ
            point_uid = archiver.archive_nsvalue_point(p_str)
            
            # Touch ID を文字列キーとして（動作ファイルでは整数キー）
            touch_id_uid = archiver._add_object(touch_id)
            
            # Fingers 辞書: {touch_id: NSValue}
            fingers_dict_uid = archiver.archive_mutable_dict(
                [touch_id_uid],
                [point_uid]
            )
            
            # Forces 辞書: {touch_id: 0.0}
            force_val_uid = archiver._add_object(0.0)
            forces_dict_uid = archiver.archive_mutable_dict(
                [touch_id_uid],
                [force_val_uid]
            )
            
            # Time
            time_uid = archiver._add_object(current_time)
            
            # イベント辞書
            event_uid = archiver.archive_dict(
                [fingers_key_uid, forces_key_uid, time_key_uid],
                [fingers_dict_uid, forces_dict_uid, time_uid]
            )
            event_uids.append(event_uid)
            current_time += frame_duration
    
    # AllEvents 配列
    all_events_uid = archiver.archive_mutable_array(event_uids)
    
    # ルートオブジェクト (AXMutableReplayableGesture)
    root_class_uid = archiver._get_class_uid(
        'AXMutableReplayableGesture',
        ['AXMutableReplayableGesture', 'AXReplayableGesture', 'NSObject']
    )
    
    root_obj = {
        '$class': root_class_uid,
        'AllEvents': all_events_uid,
        'Version': 1,
        'ArePointsDeviceRelative': False
    }
    
    archiver.set_root_object(root_obj)
    
    return archiver.to_bytes()


def create_combined_plist(commands_data: list):
    # commands_data: [{'name': str, 'strokes': [[{'x': float, 'y': float}, ...], ...]}, ...]
    # Or for backward compatibility, 'points': [{'x': float, 'y': float}, ...]
    
    commands_table = {}
    
    for cmd in commands_data:
        cmd_id = f"Custom.{int(time.time())}.{uuid.uuid4().hex[:6]}"
        
        # Determine if 'strokes' or 'points' is provided
        if 'strokes' in cmd and cmd['strokes']:
            strokes_to_use = cmd['strokes']
        elif 'points' in cmd and cmd['points']:
            strokes_to_use = [cmd['points']] # Treat single list of points as one stroke
        else:
            strokes_to_use = [] # No points/strokes provided

        gesture_data = create_gesture_data(strokes_to_use)
        
        commands_table[cmd_id] = {
            'CommandID': cmd_id,
            'CustomCommands': {
                'en_US': [cmd['name']],
                'ja_JP': [cmd['name']]
            },
            'CustomGesture': gesture_data,
            'CustomScope': 'com.apple.speech.SystemWideScope',
            'CustomType': 'RunGesture',
            'ConfirmationRequired': False,
            'CustomModifyDate': datetime.datetime.now(datetime.timezone.utc)
        }
        
    pl = {
        'CommandsTable': commands_table,
        'ExportDate': time.time(),
        'SystemVersion': {
            'BuildID': '7248A20C-D4C5-11F0-8B3C-9A234E799B22',
            'ProductBuildVersion': '23C55',
            'ProductCopyright': '1983-2025 Apple Inc.',
            'ProductName': 'iPhone OS',
            'ProductVersion': '26.1', # Using a future version matching sample
            'SystemImageID': 'A81059B2-172D-4149-9EA1-CB12DD872AFC'
        }
    }


    
    return plistlib.dumps(pl, fmt=plistlib.FMT_XML)
