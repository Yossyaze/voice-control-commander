/**
 * Voice Control Commands の plist 解析・生成ユーティリティ。
 * Python バックエンド (parser.py) の処理をブラウザ上で再現する。
 */

import bplistParser from "bplist-parser";

import plist from "plist";
import { Buffer } from "buffer";

// --- 型定義 ---
export interface Point {
  x: number;
  y: number;
}

export interface ParsedCommand {
  id: string;
  name: string;
  points: Point[];
  strokes: Point[][];
}

export interface ParseResult {
  commands: ParsedCommand[];
}

// --- NSKeyedUnarchiver ヘルパー ---

/**
 * NSKeyedArchiver 形式のオブジェクトを再帰的に展開する。
 * Python 版 unarchive_object() と同等の処理。
 */
function unarchiveObject(obj: unknown, objects: unknown[]): unknown {
  // UID 参照の解決
  if (
    obj &&
    typeof obj === "object" &&
    "UID" in (obj as Record<string, unknown>)
  ) {
    const uid = (obj as { UID: number }).UID;
    return unarchiveObject(objects[uid], objects);
  }

  if (Array.isArray(obj)) {
    return obj.map((v) => unarchiveObject(v, objects));
  }

  if (
    obj &&
    typeof obj === "object" &&
    !(obj instanceof Date) &&
    !ArrayBuffer.isView(obj)
  ) {
    const dict = obj as Record<string, unknown>;

    // NS.keys + NS.objects → 辞書として展開
    if ("NS.keys" in dict && "NS.objects" in dict) {
      const keys = (dict["NS.keys"] as unknown[]).map((k) =>
        unarchiveObject(k, objects),
      );
      const vals = (dict["NS.objects"] as unknown[]).map((v) =>
        unarchiveObject(v, objects),
      );
      const result: Record<string, unknown> = {};
      keys.forEach((k, i) => {
        result[String(k)] = vals[i];
      });
      return result;
    }

    // NS.objects のみ → 配列として展開
    if ("NS.objects" in dict && !("NS.keys" in dict)) {
      return (dict["NS.objects"] as unknown[]).map((v) =>
        unarchiveObject(v, objects),
      );
    }

    // $class を持つオブジェクト → クラスプロパティを展開
    if ("$class" in dict) {
      const newObj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(dict)) {
        if (k === "$class") continue;
        newObj[k] = unarchiveObject(v, objects);
      }
      return newObj;
    }

    // 通常の辞書
    const newObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(dict)) {
      newObj[k] = unarchiveObject(v, objects);
    }
    return newObj;
  }

  return obj;
}

// --- ジェスチャーデータの解析 ---

/**
 * CustomGesture バイナリ（NSKeyedArchiver 形式）からストローク座標を抽出する。
 * Python 版 parse_gesture_data() と同等。
 */
function parseGestureData(gestureBytes: Uint8Array): Point[][] {
  try {
    const parsed = bplistParser.parseBuffer(gestureBytes);
    if (!parsed || parsed.length === 0) return [];

    const root = parsed[0];

    if (root["$objects"]) {
      const objects = root["$objects"] as unknown[];
      const rootUid = root["$top"]?.root;
      if (!rootUid) return [];

      const rootObj = unarchiveObject(rootUid, objects) as Record<
        string,
        unknown
      >;

      let events: Record<string, unknown>[] = [];
      if (rootObj["AllEvents"]) {
        const eventsContainer = rootObj["AllEvents"];
        if (Array.isArray(eventsContainer)) {
          events = eventsContainer as Record<string, unknown>[];
        }
      }

      const strokes: Point[][] = [];
      let currentStroke: Point[] = [];
      let lastTime: number | null = null;

      const pointPattern = /\{([\d.]+),\s*([\d.]+)\}/;

      for (const event of events) {
        const timeVal = typeof event["Time"] === "number" ? event["Time"] : 0;

        // ストロークの境界を検出（時間差 > 0.1秒）
        if (lastTime !== null && timeVal - lastTime > 0.1) {
          if (currentStroke.length > 0) {
            strokes.push(currentStroke);
            currentStroke = [];
          }
        }
        lastTime = timeVal;

        // Fingers からポイントを抽出
        const fingers = event["Fingers"];
        if (!fingers || typeof fingers !== "object") continue;

        const fingerValues = Array.isArray(fingers)
          ? fingers
          : Object.values(fingers as Record<string, unknown>);

        for (const f of fingerValues) {
          let pointStr: string | null = null;

          if (typeof f === "string") {
            pointStr = f;
          } else if (f && typeof f === "object") {
            // 再帰的に NS.pointval を探索
            const stack: unknown[] = [f];
            while (stack.length > 0) {
              const curr = stack.pop();
              if (curr && typeof curr === "object" && !Array.isArray(curr)) {
                const currDict = curr as Record<string, unknown>;
                if ("NS.pointval" in currDict) {
                  pointStr = String(currDict["NS.pointval"]);
                  break;
                }
                for (const v of Object.values(currDict)) {
                  if (v && typeof v === "object") stack.push(v);
                }
              } else if (Array.isArray(curr)) {
                for (const v of curr) {
                  if (v && typeof v === "object") stack.push(v);
                }
              }
            }
          }

          if (pointStr) {
            const match = pointPattern.exec(pointStr);
            if (match) {
              currentStroke.push({
                x: parseFloat(match[1]),
                y: parseFloat(match[2]),
              });
            }
          }
        }
      }

      if (currentStroke.length > 0) {
        strokes.push(currentStroke);
      }

      return strokes;
    }

    // フォールバック: 単純な plist
    return [];
  } catch (e) {
    console.error("ジェスチャーデータの解析エラー:", e);
    return [];
  }
}

// --- メイン解析関数 ---

/**
 * .voicecontrolcommands ファイルのバイナリを受け取り、コマンド一覧を返す。
 * Python 版 parse_voice_control_commands() と同等。
 */
export function parseVoiceControlCommands(content: ArrayBuffer): ParseResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pl: Record<string, any>;

  // まずバイナリ plist として解析を試みる
  try {
    const buf = new Uint8Array(content);
    const parsed = bplistParser.parseBuffer(buf);
    if (parsed && parsed.length > 0) {
      pl = parsed[0];
    } else {
      throw new Error("バイナリ plist の解析結果が空です");
    }
  } catch {
    // バイナリ解析に失敗した場合、XML plist として試みる
    try {
      const text = new TextDecoder().decode(content);
      pl = plist.parse(text) as Record<string, unknown>;
    } catch (e2) {
      throw new Error(`plist ファイルの解析に失敗しました: ${e2}`);
    }
  }

  const commandsTable = pl["CommandsTable"] as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!commandsTable) {
    return { commands: [] };
  }

  const commands: ParsedCommand[] = [];

  for (const [key, value] of Object.entries(commandsTable)) {
    if ("CustomGesture" in value) {
      let gestureData: Uint8Array;

      const raw = value["CustomGesture"];
      if (raw instanceof Uint8Array) {
        gestureData = raw;
      } else if (raw instanceof ArrayBuffer) {
        gestureData = new Uint8Array(raw);
      } else if (Buffer.isBuffer(raw)) {
        gestureData = new Uint8Array(raw);
      } else if (typeof raw === "string") {
        // Base64 エンコードされたデータ
        gestureData = new Uint8Array(Buffer.from(raw, "base64"));
      } else {
        continue;
      }

      const strokes = parseGestureData(gestureData);

      // コマンド名を取得
      let commandName = "Unknown";
      const customCommands = value["CustomCommands"] as
        | Record<string, string[]>
        | undefined;
      if (customCommands) {
        if (customCommands["ja_JP"]?.[0]) {
          commandName = customCommands["ja_JP"][0];
        } else if (customCommands["en_US"]?.[0]) {
          commandName = customCommands["en_US"][0];
        }
      }

      const firstStroke = strokes[0] || [];

      commands.push({
        id: key,
        name: commandName,
        points: firstStroke,
        strokes,
      });
    }
  }

  return { commands };
}

// --- NSKeyedArchiver 生成 ---

// 浮動小数点数を強制的に double として書き出すためのマーカー
class BplistReal {
  public value: number;
  constructor(value: number) {
    this.value = value;
  }
}

// NSKeyedArchiver の UID 参照（Python の plistlib.UID に相当）
class PlistUID {
  public value: number;
  constructor(value: number) {
    this.value = value;
  }
}

// 数値の一意性を保証するためのラッパー（JS では同じ数値が同一扱いされるため）
class BoxedNumber {
  public value: number;
  public isReal: boolean;
  constructor(value: number, isReal = false) {
    this.value = value;
    this.isReal = isReal;
  }
}

/**
 * Python の plistlib._BinaryPlistWriter と同等のバイナリ plist シリアライザー。
 * 再帰的にオブジェクトツリーを走査し、フラットなオブジェクトテーブルを構築する。
 */
class BinaryPlistWriter {
  private flatList: unknown[] = [];
  private refMap = new Map<unknown, number>();
  private refSize = 1;

  write(rootObj: unknown): Uint8Array {
    this.flatList = [];
    this.refMap = new Map();

    // Phase 1: 再帰的にオブジェクトを走査しインデックスを割り当て
    this.flatten(rootObj);

    const numObjects = this.flatList.length;
    this.refSize = numObjects <= 0xff ? 1 : numObjects <= 0xffff ? 2 : 4;

    // Phase 2: バイナリ書き出し
    const buf: number[] = [];
    const offsets: number[] = [];

    // ヘッダー
    this.writeASCII(buf, "bplist00");

    // 各オブジェクトの書き出し
    for (const obj of this.flatList) {
      offsets.push(buf.length);
      this.writeObject(buf, obj);
    }

    const offsetTableStart = buf.length;
    const maxOffset = offsetTableStart;
    const offsetSize =
      maxOffset <= 0xff
        ? 1
        : maxOffset <= 0xffff
          ? 2
          : maxOffset <= 0xffffff
            ? 3
            : 4;

    for (const off of offsets) {
      this.writeSizedInt(buf, off, offsetSize);
    }

    // トレーラー（32バイト）
    for (let i = 0; i < 6; i++) buf.push(0);
    buf.push(offsetSize);
    buf.push(this.refSize);
    this.writeUint64(buf, numObjects);
    this.writeUint64(buf, 0); // トップオブジェクトは常にインデックス0
    this.writeUint64(buf, offsetTableStart);

    return new Uint8Array(buf);
  }

  private flatten(value: unknown): void {
    // 文字列: 値で重複排除（Python のインターンに相当）
    if (typeof value === "string") {
      if (this.refMap.has(value)) return;
      this.refMap.set(value, this.flatList.length);
      this.flatList.push(value);
      return;
    }

    // null
    if (value === null || value === undefined) {
      if (this.refMap.has(null)) return;
      this.refMap.set(null, this.flatList.length);
      this.flatList.push(null);
      return;
    }

    // boolean: シングルトン（Python と同じ）
    if (typeof value === "boolean") {
      if (this.refMap.has(value)) return;
      this.refMap.set(value, this.flatList.length);
      this.flatList.push(value);
      return;
    }

    // 生の数値（辞書内の直接値として出現する場合）
    if (typeof value === "number") {
      if (this.refMap.has(value)) return;
      this.refMap.set(value, this.flatList.length);
      this.flatList.push(value);
      return;
    }

    // オブジェクト型: 参照で重複排除
    if (typeof value === "object") {
      if (this.refMap.has(value)) return;
      this.refMap.set(value, this.flatList.length);
      this.flatList.push(value);

      // リーフ型
      if (
        value instanceof PlistUID ||
        value instanceof BplistReal ||
        value instanceof BoxedNumber
      ) {
        return;
      }

      // 配列
      if (Array.isArray(value)) {
        for (const el of value) this.flatten(el);
        return;
      }

      // 辞書
      const dict = value as Record<string, unknown>;
      const keys = Object.keys(dict).sort();
      for (const k of keys) {
        this.flatten(k);
        this.flatten(dict[k]);
      }
    }
  }

  private getRef(value: unknown): number {
    const ref = this.refMap.get(value);
    if (ref === undefined) {
      throw new Error(`BinaryPlistWriter: オブジェクトが見つかりません`);
    }
    return ref;
  }

  private writeObject(buf: number[], obj: unknown): void {
    if (obj === null || obj === undefined) {
      buf.push(0x00);
      return;
    }
    if (typeof obj === "boolean") {
      buf.push(obj ? 0x09 : 0x08);
      return;
    }
    if (obj instanceof PlistUID) {
      const v = obj.value;
      if (v <= 0xff) {
        buf.push(0x80);
        buf.push(v);
      } else {
        buf.push(0x81);
        buf.push((v >> 8) & 0xff, v & 0xff);
      }
      return;
    }
    if (obj instanceof BplistReal) {
      buf.push(0x23);
      this.writeDoubleBE(buf, obj.value);
      return;
    }
    if (obj instanceof BoxedNumber) {
      if (obj.isReal || !Number.isInteger(obj.value)) {
        buf.push(0x23);
        this.writeDoubleBE(buf, obj.value);
      } else {
        this.writeInt(buf, obj.value);
      }
      return;
    }
    if (typeof obj === "number") {
      if (Number.isInteger(obj)) {
        this.writeInt(buf, obj);
      } else {
        buf.push(0x23);
        this.writeDoubleBE(buf, obj);
      }
      return;
    }
    if (typeof obj === "string") {
      let isASCII = true;
      for (let i = 0; i < obj.length; i++) {
        if (obj.charCodeAt(i) > 127) {
          isASCII = false;
          break;
        }
      }
      if (isASCII) {
        this.writeHeader(buf, 0x5, obj.length);
        this.writeASCII(buf, obj);
      } else {
        this.writeHeader(buf, 0x6, obj.length);
        for (let i = 0; i < obj.length; i++) {
          const code = obj.charCodeAt(i);
          buf.push((code >> 8) & 0xff, code & 0xff);
        }
      }
      return;
    }
    if (Array.isArray(obj)) {
      this.writeHeader(buf, 0xa, obj.length);
      for (const el of obj) {
        this.writeRef(buf, this.getRef(el));
      }
      return;
    }
    if (typeof obj === "object") {
      const dict = obj as Record<string, unknown>;
      const keys = Object.keys(dict).sort();
      this.writeHeader(buf, 0xd, keys.length);
      for (const k of keys) this.writeRef(buf, this.getRef(k));
      for (const k of keys) this.writeRef(buf, this.getRef(dict[k]));
      return;
    }
  }

  private writeInt(buf: number[], v: number): void {
    if (v >= 0 && v <= 0xff) {
      buf.push(0x10, v);
    } else if (v >= 0 && v <= 0xffff) {
      buf.push(0x11);
      this.writeSizedInt(buf, v, 2);
    } else if (v >= 0 && v <= 0xffffffff) {
      buf.push(0x12);
      this.writeSizedInt(buf, v, 4);
    } else {
      buf.push(0x13);
      this.writeUint64(buf, v);
    }
  }

  private writeHeader(buf: number[], kind: number, count: number): void {
    if (count < 15) {
      buf.push((kind << 4) | count);
    } else {
      buf.push((kind << 4) | 0x0f);
      if (count <= 0xff) {
        buf.push(0x10, count);
      } else if (count <= 0xffff) {
        buf.push(0x11);
        this.writeSizedInt(buf, count, 2);
      } else {
        buf.push(0x12);
        this.writeSizedInt(buf, count, 4);
      }
    }
  }

  private writeASCII(buf: number[], s: string): void {
    for (let i = 0; i < s.length; i++) buf.push(s.charCodeAt(i));
  }

  private writeSizedInt(buf: number[], v: number, bytes: number): void {
    for (let i = bytes - 1; i >= 0; i--) {
      buf.push((v >> (i * 8)) & 0xff);
    }
  }

  private writeUint64(buf: number[], v: number): void {
    const high = Math.floor(v / 0x100000000);
    const low = v % 0x100000000;
    this.writeSizedInt(buf, high, 4);
    this.writeSizedInt(buf, low, 4);
  }

  private writeDoubleBE(buf: number[], v: number): void {
    const tmp = Buffer.alloc(8);
    tmp.writeDoubleBE(v, 0);
    for (let i = 0; i < 8; i++) buf.push(tmp[i]);
  }

  private writeRef(buf: number[], ref: number): void {
    this.writeSizedInt(buf, ref, this.refSize);
  }
}

/**
 * Python 版 NSKeyedArchiverWriter と同等のアーカイバー。
 * objects 配列にネイティブな辞書・配列・UID を格納し、
 * toBytes() で NSKeyedArchiver ラッパー付きバイナリ plist を生成する。
 */
class NSKeyedArchiverWriter {
  // UID(0) = '$null', UID(1) = ルートオブジェクト（後で設定）
  private objects: unknown[] = ["$null", null];
  private classDefs = new Map<string, PlistUID>();
  private stringCache = new Map<string, PlistUID>();
  private uidCounter = 2;

  addObject(obj: unknown): PlistUID {
    // 文字列の重複排除
    if (typeof obj === "string") {
      const cached = this.stringCache.get(obj);
      if (cached) return cached;
      const uid = new PlistUID(this.uidCounter++);
      this.objects.push(obj);
      this.stringCache.set(obj, uid);
      return uid;
    }
    // 数値は BoxedNumber でラップ（一意性保証のため）
    if (typeof obj === "number") {
      const uid = new PlistUID(this.uidCounter++);
      this.objects.push(new BoxedNumber(obj, false));
      return uid;
    }
    // BplistReal は double として扱う
    if (obj instanceof BplistReal) {
      const uid = new PlistUID(this.uidCounter++);
      this.objects.push(new BoxedNumber(obj.value, true));
      return uid;
    }
    const uid = new PlistUID(this.uidCounter++);
    this.objects.push(obj);
    return uid;
  }

  setRootObject(rootObj: unknown): void {
    this.objects[1] = rootObj;
  }

  getClassUid(classname: string, classesList: string[]): PlistUID {
    const key = `${classname}:${classesList.join(",")}`;
    const cached = this.classDefs.get(key);
    if (cached) return cached;
    // Python版と同じ: ネイティブ辞書として格納
    const classObj = {
      $classname: classname,
      $classes: classesList,
    };
    const uid = this.addObject(classObj);
    this.classDefs.set(key, uid);
    return uid;
  }

  archiveNSValuePoint(pointStr: string): PlistUID {
    const classUid = this.getClassUid("NSValue", ["NSValue", "NSObject"]);
    const pointStrUid = this.addObject(pointStr);
    // Python版と同じ: NS.special は直接 int（UID ではない！）
    const nsValueObj = {
      "NS.pointval": pointStrUid,
      $class: classUid,
      "NS.special": 1,
    };
    return this.addObject(nsValueObj);
  }

  archiveMutableDict(keysUids: PlistUID[], objectsUids: PlistUID[]): PlistUID {
    const classUid = this.getClassUid("NSMutableDictionary", [
      "NSMutableDictionary",
      "NSDictionary",
      "NSObject",
    ]);
    return this.addObject({
      "NS.keys": keysUids,
      "NS.objects": objectsUids,
      $class: classUid,
    });
  }

  archiveDict(keysUids: PlistUID[], objectsUids: PlistUID[]): PlistUID {
    const classUid = this.getClassUid("NSDictionary", [
      "NSDictionary",
      "NSObject",
    ]);
    return this.addObject({
      "NS.keys": keysUids,
      "NS.objects": objectsUids,
      $class: classUid,
    });
  }

  archiveMutableArray(elementsUids: PlistUID[]): PlistUID {
    const classUid = this.getClassUid("NSMutableArray", [
      "NSMutableArray",
      "NSArray",
      "NSObject",
    ]);
    return this.addObject({
      "NS.objects": elementsUids,
      $class: classUid,
    });
  }

  /** Python版 to_bytes() と同等: NSKeyedArchiver ラッパー付きバイナリ plist を生成 */
  toBytes(): Uint8Array {
    const finalPlist = {
      $version: 100000,
      $archiver: "NSKeyedArchiver",
      $top: { root: new PlistUID(1) },
      $objects: this.objects,
    };
    const writer = new BinaryPlistWriter();
    return writer.write(finalPlist);
  }
}

/**
 * ストロークデータから CustomGesture バイナリ plist を生成する。
 * Python 版 create_gesture_data() と完全に同等。
 */
export function createGestureData(
  strokes: Point[][],
  waits?: number[],
): Uint8Array {
  const archiver = new NSKeyedArchiverWriter();

  // Cocoa Epoch offset (2001-01-01 からの秒数)
  const COCOA_EPOCH_OFFSET = 978307200.0;
  const startTime = Date.now() / 1000 - COCOA_EPOCH_OFFSET;
  let currentTime = startTime;
  const frameDuration = 1.0 / 60.0;

  // 共通キー文字列を事前登録（Python版と同じ順序）
  const fingersKeyUid = archiver.addObject("Fingers");
  const forcesKeyUid = archiver.addObject("Forces");
  const timeKeyUid = archiver.addObject("Time");

  const eventUids: PlistUID[] = [];
  let touchId = 2;

  for (let strokeIndex = 0; strokeIndex < strokes.length; strokeIndex++) {
    const stroke = strokes[strokeIndex];

    if (strokeIndex > 0) {
      let waitTime = 0.1;
      if (waits && strokeIndex - 1 < waits.length) {
        waitTime = waits[strokeIndex - 1];
      }
      // ウェイトを置く前に、前のストロークの「Touch Up」は既に追加されているはず。
      // ここではウェイト時間を加算する。
      currentTime += waitTime;
      touchId += 1;
    }

    // ストローク内の各ポイントを記録
    for (let pointIndex = 0; pointIndex < stroke.length; pointIndex++) {
      const p = stroke[pointIndex];
      const pStr = `{${p.x.toFixed(6)}, ${p.y.toFixed(6)}}`;
      const pointUid = archiver.archiveNSValuePoint(pStr);
      const touchIdUid = archiver.addObject(touchId);

      // Fingers 辞書
      const fingersDictUid = archiver.archiveMutableDict(
        [touchIdUid],
        [pointUid],
      );

      // Forces 辞書
      const forceValUid = archiver.addObject(new BplistReal(0.0));
      const forcesDictUid = archiver.archiveMutableDict(
        [touchIdUid],
        [forceValUid],
      );

      // タイムスタンプ
      const eventTimeUid = archiver.addObject(new BplistReal(currentTime));

      // イベント辞書
      const eventUid = archiver.archiveDict(
        [fingersKeyUid, forcesKeyUid, timeKeyUid],
        [fingersDictUid, forcesDictUid, eventTimeUid],
      );
      eventUids.push(eventUid);

      // 次のポイントへ
      currentTime += frameDuration;
    }

    // --- ストローク終了時の「Touch Up」イベントを追加 ---
    // これにより、ゲーム側が「指が離れた瞬間の座標」を正確に認識できる。
    const emptyDictUid = archiver.archiveMutableDict([], []);
    // 最後のポイントの時刻から極小時間（0.001s）経過後、または同時刻
    const liftTimeUid = archiver.addObject(new BplistReal(currentTime));
    const liftEventUid = archiver.archiveDict(
      [fingersKeyUid, forcesKeyUid, timeKeyUid],
      [emptyDictUid, emptyDictUid, liftTimeUid],
    );
    eventUids.push(liftEventUid);

    // 次のストロークのために少し時間を空ける
    currentTime += 0.05;
  }

  // AllEvents 配列
  const allEventsUid = archiver.archiveMutableArray(eventUids);

  // ルートオブジェクト (AXMutableReplayableGesture)
  const rootClassUid = archiver.getClassUid("AXMutableReplayableGesture", [
    "AXMutableReplayableGesture",
    "AXReplayableGesture",
    "NSObject",
  ]);

  // Python版と同じ: Version と ArePointsDeviceRelative は直接値（UID ではない）
  const rootObj = {
    $class: rootClassUid,
    AllEvents: allEventsUid,
    Version: 1,
    ArePointsDeviceRelative: false,
  };

  archiver.setRootObject(rootObj);
  return archiver.toBytes();
}

// --- エクスポート用インターフェース ---

export interface ExportCommandData {
  id?: string;
  name: string;
  points?: Point[];
  strokes: Point[][];
  stroke_waits?: number[];
}

/**
 * XML plist の文字列を構築する。
 */
function serializePlistValue(value: unknown, indent: number): string {
  const tab = "\t".repeat(indent);

  if (value === null || value === undefined) {
    return `${tab}<string></string>`;
  }

  if (typeof value === "boolean") {
    return value ? `${tab}<true/>` : `${tab}<false/>`;
  }

  if (typeof value === "number") {
    const numStr = Number.isInteger(value) ? value.toFixed(1) : String(value);
    return `${tab}<real>${numStr}</real>`;
  }

  if (typeof value === "string") {
    const escaped = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `${tab}<string>${escaped}</string>`;
  }

  if (value instanceof Date) {
    return `${tab}<date>${value.toISOString().replace(/\.\d{3}Z$/, "Z")}</date>`;
  }

  if (value instanceof Uint8Array || ArrayBuffer.isView(value)) {
    const bytes =
      value instanceof Uint8Array
        ? value
        : new Uint8Array((value as ArrayBufferView).buffer);
    const b64 = Buffer.from(bytes).toString("base64");
    const lines: string[] = [];
    for (let i = 0; i < b64.length; i += 48) {
      lines.push(b64.slice(i, i + 48));
    }
    const innerIndent = "\t".repeat(indent);
    if (lines.length === 0) {
      return `${tab}<data>\n${innerIndent}</data>`;
    }
    return `${tab}<data>\n${lines.map((l) => `${innerIndent}${l}`).join("\n")}\n${innerIndent}</data>`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${tab}<array>\n${tab}</array>`;
    }
    const items = value
      .map((v) => serializePlistValue(v, indent + 1))
      .join("\n");
    return `${tab}<array>\n${items}\n${tab}</array>`;
  }

  if (typeof value === "object") {
    const dict = value as Record<string, unknown>;
    const keys = Object.keys(dict).sort();
    if (keys.length === 0) {
      return `${tab}<dict>\n${tab}</dict>`;
    }
    const entries = keys
      .map((k) => {
        const escapedKey = k
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return `${tab}\t<key>${escapedKey}</key>\n${serializePlistValue(dict[k], indent + 1)}`;
      })
      .join("\n");
    return `${tab}<dict>\n${entries}\n${tab}</dict>`;
  }

  return `${tab}<string>${String(value)}</string>`;
}

function buildPlistXML(obj: unknown): string {
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">`;
  const body = serializePlistValue(obj, 0);
  return `${header}\n${body}\n</plist>\n`;
}

export function createCombinedPlist(
  commandsData: ExportCommandData[],
): Uint8Array {
  const commandsTable: Record<string, unknown> = {};

  let index = 0;
  for (const cmd of commandsData) {
    // インデックスをゼロパディングしてIDの先頭に付与することで、
    // Plistの辞書(アルファベット順)ソート後も配列の順番を維持する。
    // 例: Custom.0000.167812345.abcdef
    const indexStr = String(index).padStart(4, "0");
    const timestamp = Math.floor(Date.now() / 1000);
    const shortUuid = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
    const cmdId = `Custom.${indexStr}.${timestamp}.${shortUuid}`;
    index++;

    let strokesToUse: Point[][] = [];
    if (cmd.strokes && cmd.strokes.length > 0) {
      strokesToUse = cmd.strokes;
    } else if (cmd.points && cmd.points.length > 0) {
      strokesToUse = [cmd.points];
    }

    const gestureData = createGestureData(strokesToUse, cmd.stroke_waits || []);

    commandsTable[cmdId] = {
      CommandID: cmdId,
      ConfirmationRequired: false,
      CustomCommands: {
        en_US: [cmd.name],
        ja_JP: [cmd.name],
      },
      CustomGesture: gestureData,
      CustomModifyDate: new Date(),
      CustomScope: "com.apple.speech.SystemWideScope",
      CustomType: "RunGesture",
    };
  }

  const plObj = {
    CommandsTable: commandsTable,
    ExportDate: Number((Date.now() / 1000).toFixed(6)),
    SystemVersion: {
      BuildID: "7248A20C-D4C5-11F0-8B3C-9A234E799B22",
      ProductBuildVersion: "23C55",
      ProductCopyright: "1983-2025 Apple Inc.",
      ProductName: "iPhone OS",
      ProductVersion: "26.1",
      SystemImageID: "A81059B2-172D-4149-9EA1-CB12DD872AFC",
    },
  };

  const xmlStr = buildPlistXML(plObj);
  return new TextEncoder().encode(xmlStr);
}

export function exportMerged(commands: ExportCommandData[]): Uint8Array {
  return createCombinedPlist(commands);
}
