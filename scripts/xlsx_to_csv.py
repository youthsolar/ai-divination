#!/usr/bin/env python3
"""
xlsx_to_csv.py — Convert 3 Oracle Excel files to CSV for Zoho Creator import.

Handles:
  - 孔明大易神術.xlsx (384 rows)
  - 觀音靈籤.xlsx (100 rows)
  - 關帝靈籤.xlsx (100 rows)

Output: data/divination-database/csv/{kongming,guanyin,guandi}_oracle.csv
Encoding: UTF-8 with BOM (required by Zoho Creator bulk import)
"""

import csv
import os
import re
import sys

import openpyxl

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "divination-database")
CSV_DIR = os.path.join(DATA_DIR, "csv")

KONGMING_XLSX = os.path.join(DATA_DIR, "孔明大易神術.xlsx")
GUANYIN_XLSX = os.path.join(DATA_DIR, "觀音靈籤.xlsx")
GUANDI_XLSX = os.path.join(DATA_DIR, "關帝靈籤.xlsx")

# ---------------------------------------------------------------------------
# Column mappings: Excel header → Creator field name
# ---------------------------------------------------------------------------
KONGMING_COLUMNS = {
    "籤序":  "Sign_Order",
    "卦象":  "Fortune_Level",
    "本位":  "Palace",
    "現爻":  "Current_Hexagram",
    "變":    "Change_Trigger",
    "變爻":  "Changed_Hexagram",
    "吉凶":  "Fortune_Category",
    "五行":  "Five_Elements",
    "符令1": "Symbol_1",
    "符令2": "Symbol_2",
    "符令3": "Symbol_3",
    "符令4": "Symbol_4",
    "符令5": "Symbol_5",
    "籤文":  "Poem_Text",
    "籤解":  "Interpretation",
}

GUANYIN_COLUMNS = {
    "籤序":     "Sign_Order",
    "簽號吉凶": "Fortune_Level",
    "籤詩標題": "Poem_Title",
    "籤文":     "Poem_Text",
    "聖意":     "Holy_Meaning",
    "籤解":     "Sign_Interpretation",
    "仙機":     "Divine_Guidance",
    "典故":     "Allusion",
}

GUANDI_COLUMNS = {
    "籤序":     "Sign_Order",
    "簽號吉凶": "Fortune_Level",
    "籤詩標題": "Poem_Title",
    "籤文":     "Poem_Text",
    "聖意":     "Holy_Meaning",
    "籤解":     "Sign_Interpretation",
    "釋意":     "Meaning_Explanation",
    "解釋":     "Detailed_Explanation",
    "東坡解":   "DongPo_Commentary",
    "碧仙注":   "BiXian_Commentary",
}


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def extract_sign_order_num(sign_order_text: str) -> int:
    """Extract numeric sign order from text like '第 1 籤' → 1."""
    if not sign_order_text:
        return 0
    match = re.search(r"(\d+)", str(sign_order_text))
    if match:
        return int(match.group(1))
    return 0


def clean_fortune_level(text: str) -> str:
    """Remove 【】 brackets from Fortune_Level. E.g. '【上上籤】' → '上上籤'."""
    if not text:
        return ""
    return str(text).replace("【", "").replace("】", "")


def safe_str(value) -> str:
    """Convert cell value to string; None → empty string."""
    if value is None:
        return ""
    return str(value).strip()


def convert_xlsx(xlsx_path: str, column_map: dict, csv_filename: str) -> dict:
    """
    Read an Excel file, apply column mapping and cleaning, write CSV with BOM.

    Returns a summary dict with row count and any warnings.
    """
    wb = openpyxl.load_workbook(xlsx_path, read_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    wb.close()

    if not rows:
        return {"file": csv_filename, "rows": 0, "error": "Empty sheet"}

    # --- Build header index from Excel header row ---
    excel_headers = [safe_str(h) for h in rows[0]]
    header_index = {}
    missing_headers = []
    for excel_col, creator_col in column_map.items():
        if excel_col in excel_headers:
            header_index[creator_col] = excel_headers.index(excel_col)
        else:
            missing_headers.append(excel_col)

    if missing_headers:
        print(f"  WARNING: Missing Excel columns: {missing_headers}")

    # --- Determine output column order ---
    # Sign_Order_Num is injected right after Sign_Order
    creator_fields = list(column_map.values())
    sign_order_idx = creator_fields.index("Sign_Order")
    output_fields = (
        creator_fields[: sign_order_idx + 1]
        + ["Sign_Order_Num"]
        + creator_fields[sign_order_idx + 1 :]
    )

    # --- Write CSV ---
    os.makedirs(CSV_DIR, exist_ok=True)
    csv_path = os.path.join(CSV_DIR, csv_filename)

    data_rows = rows[1:]  # skip header
    warnings = []

    with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(output_fields)

        for row_num, row in enumerate(data_rows, start=2):
            record = {}
            for creator_col, col_idx in header_index.items():
                val = row[col_idx] if col_idx < len(row) else None
                record[creator_col] = safe_str(val)

            # --- Clean Fortune_Level ---
            if "Fortune_Level" in record:
                record["Fortune_Level"] = clean_fortune_level(record["Fortune_Level"])

            # --- Extract Sign_Order_Num ---
            sign_order_text = record.get("Sign_Order", "")
            sign_order_num = extract_sign_order_num(sign_order_text)
            record["Sign_Order_Num"] = str(sign_order_num)

            if sign_order_num == 0:
                warnings.append(f"Row {row_num}: could not extract sign number from '{sign_order_text}'")

            # --- Write row in output field order ---
            csv_row = [record.get(field, "") for field in output_fields]
            writer.writerow(csv_row)

    summary = {
        "file": csv_filename,
        "path": csv_path,
        "rows": len(data_rows),
        "columns": len(output_fields),
        "warnings": warnings,
    }
    return summary


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("Oracle Excel → CSV Converter")
    print("=" * 60)

    tasks = [
        ("孔明大易神術", KONGMING_XLSX, KONGMING_COLUMNS, "kongming_oracle.csv"),
        ("觀音靈籤",     GUANYIN_XLSX,  GUANYIN_COLUMNS,  "guanyin_oracle.csv"),
        ("關帝靈籤",     GUANDI_XLSX,   GUANDI_COLUMNS,   "guandi_oracle.csv"),
    ]

    all_ok = True
    for label, xlsx, col_map, csv_name in tasks:
        print(f"\n--- {label} ---")
        if not os.path.exists(xlsx):
            print(f"  ERROR: File not found: {xlsx}")
            all_ok = False
            continue

        summary = convert_xlsx(xlsx, col_map, csv_name)
        print(f"  Rows:    {summary['rows']}")
        print(f"  Columns: {summary['columns']}")
        print(f"  Output:  {summary['path']}")

        if summary.get("warnings"):
            for w in summary["warnings"]:
                print(f"  WARNING: {w}")
            all_ok = False

    print("\n" + "=" * 60)
    if all_ok:
        print("All conversions completed successfully.")
    else:
        print("Completed with warnings — please review above.")
    print(f"CSV output directory: {CSV_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
