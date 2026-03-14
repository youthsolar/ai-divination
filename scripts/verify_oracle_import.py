#!/usr/bin/env python3
"""
verify_oracle_import.py — Verify Oracle CSV files before/after Creator import.

Checks:
  - Row counts match expected (KongMing=384, GuanYin=100, GuanDi=100)
  - No empty Poem_Text
  - No empty Sign_Order_Num
  - Sign_Order_Num range valid
  - No duplicate Sign_Order_Num within each file
"""

import csv
import os
import sys

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_DIR = os.path.join(BASE_DIR, "data", "divination-database", "csv")

# (csv_filename, label, expected_rows, max_sign_num)
CHECKS = [
    ("kongming_oracle.csv", "KongMing (孔明大易神術)", 384, 384),
    ("guanyin_oracle.csv",  "GuanYin (觀音靈籤)",     100, 100),
    ("guandi_oracle.csv",   "GuanDi (關帝靈籤)",      100, 100),
]


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

def verify_csv(csv_filename: str, label: str, expected_rows: int, max_sign: int) -> list:
    """
    Run all checks on a single CSV file.
    Returns a list of (check_name, passed: bool, detail: str).
    """
    results = []
    csv_path = os.path.join(CSV_DIR, csv_filename)

    # --- File existence ---
    if not os.path.exists(csv_path):
        results.append(("file_exists", False, f"File not found: {csv_path}"))
        return results
    results.append(("file_exists", True, csv_path))

    # --- Read CSV (utf-8-sig handles BOM) ---
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames or []

    # --- Check required columns exist ---
    for required_col in ("Sign_Order_Num", "Poem_Text"):
        if required_col not in fieldnames:
            results.append((f"column_{required_col}", False, f"Column '{required_col}' not found in header"))
            return results

    # --- Row count ---
    actual_rows = len(rows)
    passed = actual_rows == expected_rows
    results.append((
        "row_count",
        passed,
        f"expected={expected_rows}, actual={actual_rows}",
    ))

    # --- No empty Poem_Text ---
    empty_poems = [
        i + 2 for i, row in enumerate(rows) if not row.get("Poem_Text", "").strip()
    ]
    passed = len(empty_poems) == 0
    detail = "all filled" if passed else f"empty at rows: {empty_poems[:10]}{'...' if len(empty_poems) > 10 else ''}"
    results.append(("poem_text_not_empty", passed, detail))

    # --- No empty Sign_Order_Num ---
    empty_nums = [
        i + 2 for i, row in enumerate(rows) if not row.get("Sign_Order_Num", "").strip()
    ]
    passed = len(empty_nums) == 0
    detail = "all filled" if passed else f"empty at rows: {empty_nums[:10]}{'...' if len(empty_nums) > 10 else ''}"
    results.append(("sign_order_num_not_empty", passed, detail))

    # --- Sign_Order_Num range ---
    out_of_range = []
    sign_nums = []
    for i, row in enumerate(rows):
        raw = row.get("Sign_Order_Num", "").strip()
        if not raw:
            continue
        try:
            num = int(raw)
        except ValueError:
            out_of_range.append((i + 2, raw))
            continue
        sign_nums.append(num)
        if num < 1 or num > max_sign:
            out_of_range.append((i + 2, num))

    passed = len(out_of_range) == 0
    detail = f"range [1, {max_sign}] OK" if passed else f"out of range: {out_of_range[:10]}"
    results.append(("sign_order_num_range", passed, detail))

    # --- No duplicates ---
    seen = {}
    duplicates = []
    for i, num in enumerate(sign_nums):
        if num in seen:
            duplicates.append((num, seen[num], i + 2))
        else:
            seen[num] = i + 2

    passed = len(duplicates) == 0
    detail = "no duplicates" if passed else f"duplicates: {duplicates[:10]}"
    results.append(("sign_order_num_unique", passed, detail))

    return results


def main():
    print("=" * 65)
    print("Oracle CSV Verification")
    print("=" * 65)

    total_pass = 0
    total_fail = 0

    for csv_file, label, expected, max_sign in CHECKS:
        print(f"\n--- {label} ---")
        checks = verify_csv(csv_file, label, expected, max_sign)
        for name, passed, detail in checks:
            status = "PASS" if passed else "FAIL"
            if not passed:
                total_fail += 1
            else:
                total_pass += 1
            print(f"  [{status}] {name}: {detail}")

    print("\n" + "=" * 65)
    print(f"Total: {total_pass} PASS, {total_fail} FAIL")
    if total_fail == 0:
        print("All checks passed.")
    else:
        print("Some checks failed — please review above.")
    print("=" * 65)

    sys.exit(0 if total_fail == 0 else 1)


if __name__ == "__main__":
    main()
