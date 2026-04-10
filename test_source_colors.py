#!/usr/bin/env python3
"""
Test Ethinos CDP source code for color accuracy
Analyzes TypeScript/TSX files for Amplitude vs Kotak colors
"""

import os
import re
from pathlib import Path
from collections import defaultdict

# Define expected colors
AMPLITUDE_COLORS = {
    "#5C6BC0": "Indigo (Primary)",
    "#3F51B5": "Deep Indigo (Secondary)",
    "#F79009": "Amber (Accent)",
    "#0F172A": "Dark Background",
    "#1E293B": "Surface",
    "#1E2034": "Card Background",
    "#2D3154": "Border Subtle",
    "#6B7280": "Text Secondary",
    "#9CA3AF": "Text Tertiary",
}

KOTAK_COLORS = {
    "#EC1D24": "Red (KOTAK - SHOULD NOT APPEAR)",
    "#003087": "Navy (KOTAK - SHOULD NOT APPEAR)",
    "#FFB81C": "Gold (KOTAK - SHOULD NOT APPEAR)",
}

def scan_file(filepath):
    """Scan a file for color references"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        return content
    except Exception as e:
        return None

def find_colors(content, color_dict, color_name):
    """Find color codes in content"""
    results = []
    for color_code, description in color_dict.items():
        # Case-insensitive search
        if re.search(color_code, content, re.IGNORECASE):
            results.append((color_code, description))
    return results

def main():
    frontend_dir = Path("/Users/yash/CDP/frontend")

    print("="*80)
    print("ETHINOS CDP - SOURCE CODE COLOR ANALYSIS")
    print("="*80)

    # Track findings
    amplitude_files = defaultdict(list)
    kotak_files = defaultdict(list)
    file_count = 0

    # Scan all TypeScript/TSX files
    for filepath in frontend_dir.rglob("*.tsx"):
        if "node_modules" in str(filepath) or ".next" in str(filepath):
            continue

        file_count += 1
        content = scan_file(filepath)
        if not content:
            continue

        # Check for Amplitude colors
        amp_colors = find_colors(content, AMPLITUDE_COLORS, "Amplitude")
        if amp_colors:
            amplitude_files[filepath.relative_to(frontend_dir)] = amp_colors

        # Check for Kotak colors
        kotak_colors = find_colors(content, KOTAK_COLORS, "Kotak")
        if kotak_colors:
            kotak_files[filepath.relative_to(frontend_dir)] = kotak_colors

    # Scan CSS/config files
    for filepath in frontend_dir.rglob("*.css"):
        if "node_modules" in str(filepath):
            continue

        file_count += 1
        content = scan_file(filepath)
        if not content:
            continue

        amp_colors = find_colors(content, AMPLITUDE_COLORS, "Amplitude")
        if amp_colors:
            amplitude_files[filepath.relative_to(frontend_dir)] = amp_colors

        kotak_colors = find_colors(content, KOTAK_COLORS, "Kotak")
        if kotak_colors:
            kotak_files[filepath.relative_to(frontend_dir)] = kotak_colors

    # Scan tailwind and config files
    for filepath in frontend_dir.rglob("*.ts"):
        if "node_modules" in str(filepath) or ".next" in str(filepath):
            continue

        file_count += 1
        content = scan_file(filepath)
        if not content:
            continue

        amp_colors = find_colors(content, AMPLITUDE_COLORS, "Amplitude")
        if amp_colors:
            amplitude_files[filepath.relative_to(frontend_dir)] = amp_colors

        kotak_colors = find_colors(content, KOTAK_COLORS, "Kotak")
        if kotak_colors:
            kotak_files[filepath.relative_to(frontend_dir)] = kotak_colors

    print(f"\n✅ AMPLITUDE COLORS FOUND ({len(amplitude_files)} files)")
    print("-" * 80)

    for filepath, colors in sorted(amplitude_files.items()):
        print(f"\n  {filepath}")
        color_set = set([c[0] for c in colors])
        for color_code, description in sorted(set(colors)):
            print(f"    • {color_code} - {description}")

    print("\n" + "="*80)

    if kotak_files:
        print(f"❌ KOTAK COLORS FOUND ({len(kotak_files)} files) - THIS IS A PROBLEM!")
        print("-" * 80)

        for filepath, colors in sorted(kotak_files.items()):
            print(f"\n  {filepath}")
            for color_code, description in sorted(set(colors)):
                print(f"    • {color_code} - {description}")
    else:
        print(f"✅ NO KOTAK COLORS FOUND - PERFECT!")

    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Files scanned: {file_count}")
    print(f"Amplitude colors used: {len(amplitude_files)} files")
    print(f"Kotak colors detected: {len(kotak_files)} files")

    print("\n" + "="*80)
    print("EXPECTED COLOR DEFINITIONS")
    print("="*80)

    print("\nAMPLITUDE COLORS (✅ Should be used):")
    for color_code, description in sorted(AMPLITUDE_COLORS.items()):
        print(f"  {color_code} - {description}")

    print("\nKOTAK COLORS (❌ Should NOT be used):")
    for color_code, description in sorted(KOTAK_COLORS.items()):
        print(f"  {color_code} - {description}")

    # Detailed analysis
    print("\n" + "="*80)
    print("DETAILED COLOR USAGE")
    print("="*80)

    # Read and display tailwind config
    tailwind_path = frontend_dir / "tailwind.config.ts"
    if tailwind_path.exists():
        print(f"\n📋 Tailwind Configuration ({tailwind_path.name}):")
        with open(tailwind_path, 'r') as f:
            lines = f.readlines()
            in_colors = False
            for line in lines:
                if 'colors:' in line:
                    in_colors = True
                if in_colors:
                    print(f"  {line.rstrip()}")
                if in_colors and line.strip() == '},' and 'colors' in lines[max(0, lines.index(line)-10)]:
                    break

    # Read and display globals.css
    globals_path = frontend_dir / "app" / "globals.css"
    if globals_path.exists():
        print(f"\n📋 Global Styles ({globals_path.name}):")
        with open(globals_path, 'r') as f:
            content = f.read()
            # Find color definitions
            for match in re.finditer(r'#[0-9A-Fa-f]{6}', content):
                color = match.group()
                if color in AMPLITUDE_COLORS or color in KOTAK_COLORS:
                    print(f"  Found {color}")

if __name__ == "__main__":
    main()
