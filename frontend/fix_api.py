import re

with open("src/api.ts", "r") as f:
    code = f.read()

# 1. Alias firebase db
code = code.replace("import { auth, db, storage }", "import { auth, db as firestoreDb, storage }")

# 2. Replace Firestore usages
code = code.replace("collection(db,", "collection(firestoreDb,")
code = code.replace("doc(db,", "doc(firestoreDb,")

# 3. Revert dbInstance to db
code = code.replace("dbInstance", "db")

# 4. Remove duplicate import
code = code.replace("import type { ParseResult, ExportCommandData } from \"./utils/parser\";\n\n// --- 型定義 (変更なし) ---", "// --- 型定義 (変更なし) ---")

# 5. Fix syntax error in function signature
code = code.replace("export async function deleteBackground(id: string): Promise<void> => {", "export async function deleteBackground(id: string): Promise<void> {")

with open("src/api.ts", "w") as f:
    f.write(code)

print("Fixed api.ts")
