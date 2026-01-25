#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
2つのplistファイルを徹底的に比較し、差異を報告するスクリプト
"""

import plistlib
import base64
import sys
from pprint import pprint

def load_plist(file_path):
    """plistファイルを読み込む"""
    with open(file_path, 'rb') as f:
        return plistlib.load(f)

def decode_gesture_plist(data_bytes):
    """CustomGesture のバイナリデータをデコード"""
    try:
        return plistlib.loads(data_bytes)
    except Exception as e:
        return f"デコードエラー: {e}"

def compare_top_level(pl1, pl2, name1, name2):
    """トップレベルのキーと値を比較"""
    print("=" * 60)
    print("【1. トップレベル構造の比較】")
    print("=" * 60)
    
    keys1 = set(pl1.keys())
    keys2 = set(pl2.keys())
    
    print(f"\n{name1} のキー: {sorted(keys1)}")
    print(f"{name2} のキー: {sorted(keys2)}")
    
    only_in_1 = keys1 - keys2
    only_in_2 = keys2 - keys1
    
    if only_in_1:
        print(f"\n⚠️  {name1} にのみ存在: {only_in_1}")
    if only_in_2:
        print(f"\n⚠️  {name2} にのみ存在: {only_in_2}")
    
    # 共通キーの値を比較
    common_keys = keys1 & keys2
    for key in sorted(common_keys):
        if key == 'CommandsTable':
            continue  # 後で詳細分析
        
        val1 = pl1[key]
        val2 = pl2[key]
        
        print(f"\n--- {key} ---")
        print(f"  {name1}: {type(val1).__name__} = {val1}")
        print(f"  {name2}: {type(val2).__name__} = {val2}")

def compare_command_entry(cmd1, cmd2, name1, name2):
    """単一コマンドエントリの構造を比較"""
    print("\n" + "=" * 60)
    print("【2. コマンドエントリ構造の比較】")
    print("=" * 60)
    
    keys1 = set(cmd1.keys())
    keys2 = set(cmd2.keys())
    
    print(f"\n{name1} のキー: {sorted(keys1)}")
    print(f"{name2} のキー: {sorted(keys2)}")
    
    only_in_1 = keys1 - keys2
    only_in_2 = keys2 - keys1
    
    if only_in_1:
        print(f"\n⚠️  {name1} にのみ存在: {only_in_1}")
    if only_in_2:
        print(f"\n⚠️  {name2} にのみ存在: {only_in_2}")
    
    # 共通キーの値を比較（CustomGesture 以外）
    common_keys = keys1 & keys2
    for key in sorted(common_keys):
        if key == 'CustomGesture':
            continue
        
        val1 = cmd1[key]
        val2 = cmd2[key]
        
        print(f"\n--- {key} ---")
        print(f"  {name1}: {type(val1).__name__} = {val1}")
        print(f"  {name2}: {type(val2).__name__} = {val2}")
        
        if type(val1) != type(val2):
            print(f"  ⚠️ 型が異なる！")

def compare_gesture_structure(gesture1, gesture2, name1, name2):
    """CustomGesture 内部構造を詳細比較"""
    print("\n" + "=" * 60)
    print("【3. CustomGesture 内部構造の詳細比較】")
    print("=" * 60)
    
    g1 = decode_gesture_plist(gesture1)
    g2 = decode_gesture_plist(gesture2)
    
    if isinstance(g1, str) or isinstance(g2, str):
        print(f"デコードエラー: {g1} / {g2}")
        return
    
    # トップレベルキー
    print(f"\n{name1} トップキー: {sorted(g1.keys())}")
    print(f"{name2} トップキー: {sorted(g2.keys())}")
    
    # $version 比較
    print(f"\n--- $version ---")
    print(f"  {name1}: {g1.get('$version')}")
    print(f"  {name2}: {g2.get('$version')}")
    
    # $archiver 比較
    print(f"\n--- $archiver ---")
    print(f"  {name1}: {g1.get('$archiver')}")
    print(f"  {name2}: {g2.get('$archiver')}")
    
    # $top 比較
    print(f"\n--- $top ---")
    print(f"  {name1}: {g1.get('$top')}")
    print(f"  {name2}: {g2.get('$top')}")
    
    # $objects 比較
    objs1 = g1.get('$objects', [])
    objs2 = g2.get('$objects', [])
    
    print(f"\n--- $objects 配列 ---")
    print(f"  {name1}: {len(objs1)} 個のオブジェクト")
    print(f"  {name2}: {len(objs2)} 個のオブジェクト")
    
    return g1, g2

def compare_objects_array(g1, g2, name1, name2):
    """$objects 配列を詳細に比較"""
    print("\n" + "=" * 60)
    print("【4. $objects 配列の詳細比較】")
    print("=" * 60)
    
    objs1 = g1.get('$objects', [])
    objs2 = g2.get('$objects', [])
    
    # クラス定義を抽出
    classes1 = []
    classes2 = []
    
    for i, obj in enumerate(objs1):
        if isinstance(obj, dict) and '$classname' in obj:
            classes1.append((i, obj['$classname'], obj.get('$classes', [])))
    
    for i, obj in enumerate(objs2):
        if isinstance(obj, dict) and '$classname' in obj:
            classes2.append((i, obj['$classname'], obj.get('$classes', [])))
    
    print(f"\n--- クラス定義 ({name1}) ---")
    for idx, classname, classes in classes1:
        print(f"  UID({idx}): {classname} -> {classes}")
    
    print(f"\n--- クラス定義 ({name2}) ---")
    for idx, classname, classes in classes2:
        print(f"  UID({idx}): {classname} -> {classes}")
    
    # ルートオブジェクトを取得
    root_uid1 = g1.get('$top', {}).get('root')
    root_uid2 = g2.get('$top', {}).get('root')
    
    print(f"\n--- ルートオブジェクト ---")
    if root_uid1:
        root_obj1 = objs1[root_uid1.data] if root_uid1.data < len(objs1) else "不明"
        print(f"  {name1} (UID {root_uid1.data}): {type(root_obj1).__name__}")
        if isinstance(root_obj1, dict):
            print(f"    キー: {list(root_obj1.keys())}")
            # $class を解決
            if '$class' in root_obj1:
                class_uid = root_obj1['$class']
                if isinstance(class_uid, plistlib.UID):
                    class_obj = objs1[class_uid.data] if class_uid.data < len(objs1) else "不明"
                    if isinstance(class_obj, dict):
                        print(f"    クラス: {class_obj.get('$classname', '不明')}")
    
    if root_uid2:
        root_obj2 = objs2[root_uid2.data] if root_uid2.data < len(objs2) else "不明"
        print(f"  {name2} (UID {root_uid2.data}): {type(root_obj2).__name__}")
        if isinstance(root_obj2, dict):
            print(f"    キー: {list(root_obj2.keys())}")
            # $class を解決
            if '$class' in root_obj2:
                class_uid = root_obj2['$class']
                if isinstance(class_uid, plistlib.UID):
                    class_obj = objs2[class_uid.data] if class_uid.data < len(objs2) else "不明"
                    if isinstance(class_obj, dict):
                        print(f"    クラス: {class_obj.get('$classname', '不明')}")
    
    # 最初の10オブジェクトを詳細表示
    print(f"\n--- 最初の15オブジェクト ({name1}) ---")
    for i in range(min(15, len(objs1))):
        obj = objs1[i]
        if isinstance(obj, dict):
            print(f"  [{i}] dict: keys={list(obj.keys())}")
        elif isinstance(obj, plistlib.UID):
            print(f"  [{i}] UID: {obj.data}")
        else:
            print(f"  [{i}] {type(obj).__name__}: {repr(obj)[:80]}")
    
    print(f"\n--- 最初の15オブジェクト ({name2}) ---")
    for i in range(min(15, len(objs2))):
        obj = objs2[i]
        if isinstance(obj, dict):
            print(f"  [{i}] dict: keys={list(obj.keys())}")
        elif isinstance(obj, plistlib.UID):
            print(f"  [{i}] UID: {obj.data}")
        else:
            print(f"  [{i}] {type(obj).__name__}: {repr(obj)[:80]}")

def main():
    file1 = "samples/New Command.plist"
    file2 = "samples/シークエンステスト.voicecontrolcommands"
    name1 = "New Command (動作しない)"
    name2 = "シークエンス (動作する)"
    
    print("🔍 Plist ファイル徹底比較分析")
    print(f"   ファイル1: {file1}")
    print(f"   ファイル2: {file2}")
    
    pl1 = load_plist(file1)
    pl2 = load_plist(file2)
    
    # 1. トップレベル比較
    compare_top_level(pl1, pl2, name1, name2)
    
    # 2. コマンドエントリ比較（最初のコマンドを使用）
    cmds1 = pl1.get('CommandsTable', {})
    cmds2 = pl2.get('CommandsTable', {})
    
    if cmds1 and cmds2:
        cmd1_key = list(cmds1.keys())[0]
        cmd2_key = list(cmds2.keys())[0]
        cmd1 = cmds1[cmd1_key]
        cmd2 = cmds2[cmd2_key]
        
        compare_command_entry(cmd1, cmd2, name1, name2)
        
        # 3. CustomGesture 比較
        gesture1 = cmd1.get('CustomGesture')
        gesture2 = cmd2.get('CustomGesture')
        
        if gesture1 and gesture2:
            g1, g2 = compare_gesture_structure(gesture1, gesture2, name1, name2)
            
            # 4. $objects 配列の詳細比較
            compare_objects_array(g1, g2, name1, name2)

if __name__ == "__main__":
    main()
