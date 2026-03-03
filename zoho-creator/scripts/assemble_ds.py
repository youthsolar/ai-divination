#!/usr/bin/env python3
"""
assemble_ds.py — AI易經 DS 組裝腳本

將原始 DS 檔案的非函數區段與 functions/ 目錄中的重寫 .deluge 函數檔案
合併為完整的 AI易經_rewritten.ds。

用法：
    python3 assemble_ds.py
    python3 assemble_ds.py --dry-run   # 只印出統計，不寫入檔案

結構對照（原始 DS 行號）：
    1-4587      Prefix（header, forms, pages, variables） → 原樣複製，修正 Pages 注解
    4588-20805  functions { Deluge { ... } }              → 替換為重寫的 .deluge 檔案
    20806-22017 workflow { form { ... } }                 → 原樣複製，套用重命名串接
    22018-22620 第二個 functions { ... }                  → 原樣複製，套用重命名串接
    22621-25652 share_settings 等區段                     → 原樣複製
"""

import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# 路徑設定
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent                     # zoho-creator/
ORIGINAL_DS = PROJECT_ROOT / "apps" / "AI易經.ds"
FUNCTIONS_DIR = PROJECT_ROOT / "functions"
OUTPUT_DS = PROJECT_ROOT / "apps" / "AI易經_rewritten.ds"

# ---------------------------------------------------------------------------
# 行號邊界（以 1 為基底，與原始 DS 行號一致）
# ---------------------------------------------------------------------------
PREFIX_END = 4587           # 前綴最後一行
FUNCTIONS_BLOCK_START = 4588  # 函數區段開始
FUNCTIONS_BLOCK_END = 20805   # 函數區段結束
WORKFLOW_START = 20806        # workflow 區段開始
WORKFLOW_END = 22017          # workflow 區段結束
SECOND_FUNCTIONS_START = 22018  # 第二個 functions 區段開始
SECOND_FUNCTIONS_END = 22620    # 第二個 functions 區段結束
SUFFIX_START = 22621          # 後綴開始
SUFFIX_END = 25652            # 後綴結束（檔案結尾）

# ---------------------------------------------------------------------------
# 重命名對照表（舊名 → 新名）
# 套用於 workflow 及第二個 functions 區段（行 20806-22620）
# ---------------------------------------------------------------------------
RENAME_MAP = {
    "Bazi.PreciseBaziCalculator": "Bazi.preciseBaziCalculator",
    "LunarAI.SolarToLunar": "LunarAI.solarToLunar",
    "Tarot.TarotDivinationFunction": "Tarot.tarotDivinationFunction",
}

# ---------------------------------------------------------------------------
# Pages 注解修正（行 4536 中的 API 函數名稱）
# ---------------------------------------------------------------------------
PAGES_COMMENT_OLD = "API.LIFF_Divination_MVP"
PAGES_COMMENT_NEW = "API.liffDivinationMvp"

# ---------------------------------------------------------------------------
# 模組目錄順序與排除規則
# ---------------------------------------------------------------------------
MODULE_ORDER = [
    "aiinterpreter",
    "api",
    "bazi",
    "crm",
    "ecpay",
    "email",
    "flow",
    "gamma",
    "gua-calculator",
    "hexagram",
    "iching",
    "lunar-ai",
    "lunar-data",
    "openai",
    "solar-terms",
    "star",
    "talisman",
    "tarot",
    "tools",
    "training",
    "webhook",
    "widget",
    "zodiac",
    # 以下模組不在原始 DS 中，排除
    # "calendar",        — Calendar.* 是獨立部署到 Creator IDE 的函數
    # "content-factory", — ContentFactory API 是獨立部署的函數
]

# 要跳過的目錄（不掃描）
SKIP_DIRS = {"DEPRECATED", "pages", "calendar", "content-factory"}

# 要跳過的個別檔案（standalone .deluge，不在原始 DS 中）
# 這些是透過 Creator Microservices 獨立部署的 API 函數
SKIP_FILES = {
    "API.BindLineUser.deluge",       # standalone Microservice API
    "API.bindLineUser.deluge",       # macOS case-insensitive alias
    "API.GetTalismanByToken.deluge", # standalone Microservice API
    "API.getTalismanByToken.deluge", # macOS case-insensitive alias
    "API.PredictFromLine_v1.deluge", # standalone Microservice API
    "API.DeliveryPushCallback_v1.deluge",  # standalone Microservice API
}


def load_original_ds() -> list[str]:
    """讀取原始 DS 檔案，回傳每行的列表（保留換行符號）。"""
    if not ORIGINAL_DS.exists():
        print(f"[ERROR] 找不到原始 DS 檔案：{ORIGINAL_DS}")
        sys.exit(1)
    with open(ORIGINAL_DS, "r", encoding="utf-8") as f:
        return f.readlines()


def get_deluge_files(module_dir: Path) -> list[Path]:
    """取得指定模組目錄中的 .deluge 檔案，按字母順序排序，排除 DEPRECATED 和 standalone。"""
    if not module_dir.exists():
        return []
    files = sorted(module_dir.glob("*.deluge"))
    # 排除任何在 DEPRECATED 子目錄中的檔案（雙重保險）
    files = [f for f in files if "DEPRECATED" not in str(f)]
    # 排除 standalone .deluge 檔案（不在原始 DS 中）
    files = [f for f in files if f.name not in SKIP_FILES]
    return files


def apply_rename_cascade(text: str) -> str:
    """將重命名對照表套用到文字中。"""
    for old_name, new_name in RENAME_MAP.items():
        text = text.replace(old_name, new_name)
    return text


def apply_pages_comment_fix(text: str) -> str:
    """修正 Pages 區段中的 API 函數名稱注解。"""
    return text.replace(PAGES_COMMENT_OLD, PAGES_COMMENT_NEW)


def build_functions_block() -> tuple[list[str], int]:
    """
    組裝 functions { Deluge { ... } } 區段。

    回傳：
        (lines, function_count) — 組裝後的行列表與函數檔案計數
    """
    lines = []
    function_count = 0
    warnings = []

    # 函數區段標頭（複製原始 DS 的格式：tab+space 縮排）
    lines.append("\t\t functions\n")
    lines.append("\t\t {\n")
    lines.append("\t\t\t Deluge\n")
    lines.append("\t\t\t {\n")

    first_function = True

    for module_name in MODULE_ORDER:
        module_dir = FUNCTIONS_DIR / module_name
        if module_name in SKIP_DIRS:
            continue

        deluge_files = get_deluge_files(module_dir)

        if not deluge_files:
            if module_dir.exists():
                print(f"  [WARN] 模組 {module_name}/ 目錄存在但無 .deluge 檔案")
            else:
                print(f"  [WARN] 模組 {module_name}/ 目錄不存在，跳過")
            warnings.append(module_name)
            continue

        print(f"  [OK]   {module_name}/ — {len(deluge_files)} 個函數")

        for deluge_file in deluge_files:
            try:
                with open(deluge_file, "r", encoding="utf-8") as f:
                    content = f.read()
            except Exception as e:
                print(f"  [WARN] 無法讀取 {deluge_file}: {e}")
                warnings.append(str(deluge_file))
                continue

            # 函數之間加空行
            if not first_function:
                lines.append("\n")
            first_function = False

            # 加入函數內容（不額外縮排）
            # 確保內容以換行結尾
            if not content.endswith("\n"):
                content += "\n"
            lines.append(content)
            function_count += 1

    # 函數區段結尾
    lines.append("\t\t\t }\n")
    lines.append("\t\t }\n")

    if warnings:
        print(f"\n  共 {len(warnings)} 個警告")

    return lines, function_count


def assemble(dry_run: bool = False) -> None:
    """主組裝流程。"""
    print("=" * 60)
    print("AI易經 DS 組裝腳本")
    print("=" * 60)

    # 1. 讀取原始 DS
    print(f"\n[1/5] 讀取原始 DS：{ORIGINAL_DS}")
    original_lines = load_original_ds()
    total_original = len(original_lines)
    print(f"       原始 DS 共 {total_original} 行")

    if total_original < SUFFIX_END:
        print(f"[WARN] 原始 DS 行數 ({total_original}) 少於預期 ({SUFFIX_END})，"
              f"後綴區段可能不完整")

    # 2. 擷取各區段
    print(f"\n[2/5] 擷取原始 DS 區段")

    # 前綴（行 1 ~ PREFIX_END）→ 索引 0 ~ PREFIX_END-1
    prefix_lines = original_lines[0:PREFIX_END]
    print(f"       前綴：行 1-{PREFIX_END} ({len(prefix_lines)} 行)")

    # 套用 Pages 注解修正
    pages_fix_count = 0
    for i in range(len(prefix_lines)):
        if PAGES_COMMENT_OLD in prefix_lines[i]:
            prefix_lines[i] = apply_pages_comment_fix(prefix_lines[i])
            pages_fix_count += 1
    print(f"       Pages 注解修正：{pages_fix_count} 處")

    # workflow 區段（行 WORKFLOW_START ~ WORKFLOW_END）
    workflow_lines = original_lines[WORKFLOW_START - 1:WORKFLOW_END]
    print(f"       Workflow：行 {WORKFLOW_START}-{WORKFLOW_END} ({len(workflow_lines)} 行)")

    # 第二個 functions 區段（行 SECOND_FUNCTIONS_START ~ SECOND_FUNCTIONS_END）
    second_func_lines = original_lines[SECOND_FUNCTIONS_START - 1:SECOND_FUNCTIONS_END]
    print(f"       第二 functions：行 {SECOND_FUNCTIONS_START}-{SECOND_FUNCTIONS_END} "
          f"({len(second_func_lines)} 行)")

    # 套用重命名串接到 workflow + 第二個 functions 區段
    rename_count = 0
    for i in range(len(workflow_lines)):
        new_line = apply_rename_cascade(workflow_lines[i])
        if new_line != workflow_lines[i]:
            rename_count += workflow_lines[i].count("PreciseBaziCalculator") + \
                           workflow_lines[i].count("SolarToLunar") + \
                           workflow_lines[i].count("TarotDivinationFunction")
            workflow_lines[i] = new_line

    for i in range(len(second_func_lines)):
        new_line = apply_rename_cascade(second_func_lines[i])
        if new_line != second_func_lines[i]:
            rename_count += second_func_lines[i].count("PreciseBaziCalculator") + \
                           second_func_lines[i].count("SolarToLunar") + \
                           second_func_lines[i].count("TarotDivinationFunction")
            second_func_lines[i] = new_line
    print(f"       重命名串接：共 {rename_count} 處替換")

    # 後綴區段（行 SUFFIX_START ~ 檔案結尾）
    suffix_lines = original_lines[SUFFIX_START - 1:]
    print(f"       後綴：行 {SUFFIX_START}-{total_original} ({len(suffix_lines)} 行)")

    # 3. 組裝函數區段
    print(f"\n[3/5] 組裝函數區段（從 .deluge 檔案）")
    func_block_lines, function_count = build_functions_block()
    print(f"\n       共納入 {function_count} 個函數")

    # 4. 合併所有區段
    print(f"\n[4/5] 合併所有區段")
    assembled = []
    assembled.extend(prefix_lines)
    assembled.extend(func_block_lines)
    assembled.extend(workflow_lines)
    assembled.extend(second_func_lines)
    assembled.extend(suffix_lines)

    # 精確行數計算：將所有內容合併後計算
    full_text = "".join(assembled)
    total_lines = full_text.count("\n")
    if full_text and not full_text.endswith("\n"):
        total_lines += 1

    print(f"       合併後總行數：{total_lines}")

    # 5. 寫入輸出檔案
    if dry_run:
        print(f"\n[5/5] 乾跑模式 — 不寫入檔案")
    else:
        print(f"\n[5/5] 寫入輸出檔案：{OUTPUT_DS}")
        OUTPUT_DS.parent.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_DS, "w", encoding="utf-8") as f:
            f.write(full_text)
        # 驗證寫入
        actual_size = OUTPUT_DS.stat().st_size
        print(f"       檔案大小：{actual_size:,} bytes")

    # 6. 摘要
    print("\n" + "=" * 60)
    print("組裝完成摘要")
    print("=" * 60)
    print(f"  原始 DS 行數：       {total_original}")
    print(f"  組裝後行數：         {total_lines}")
    print(f"  函數檔案數：         {function_count}")
    print(f"  Pages 注解修正：     {pages_fix_count} 處")
    print(f"  重命名串接替換：     {rename_count} 處")
    if not dry_run:
        print(f"  輸出檔案：           {OUTPUT_DS}")
    print("=" * 60)


def main():
    dry_run = "--dry-run" in sys.argv
    assemble(dry_run=dry_run)


if __name__ == "__main__":
    main()
