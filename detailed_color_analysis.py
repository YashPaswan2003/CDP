#!/usr/bin/env python3
"""
Detailed color analysis of Ethinos CDP pages
"""

from playwright.sync_api import sync_playwright
from pathlib import Path
import json

screenshots_dir = Path("/tmp/ethinos_screenshots")

BASE_URL = "https://main.ethinos-cdp.pages.dev"

def extract_color_values(page, url):
    """Extract actual color values from a page"""
    try:
        page.goto(url, wait_until='networkidle', timeout=30000)

        # Get all computed colors from elements
        colors = page.evaluate("""
        () => {
            const colorMap = {
                buttons: [],
                backgrounds: [],
                text: [],
                accents: [],
                borders: []
            };

            // Get all elements
            const allElements = document.querySelectorAll('*');

            for (let el of allElements) {
                const style = window.getComputedStyle(el);
                const bgColor = style.backgroundColor;
                const textColor = style.color;
                const borderColor = style.borderColor;

                // Only capture colors that are actual RGB values
                if (bgColor && bgColor.includes('rgb')) {
                    if (el.tagName === 'BUTTON' || el.classList.toString().includes('btn')) {
                        colorMap.buttons.push({ color: bgColor, element: el.tagName });
                    } else {
                        colorMap.backgrounds.push({ color: bgColor, element: el.tagName });
                    }
                }

                if (textColor && textColor.includes('rgb')) {
                    colorMap.text.push({ color: textColor, sample: el.textContent?.substring(0, 20) });
                }

                if (borderColor && borderColor.includes('rgb')) {
                    colorMap.borders.push({ color: borderColor });
                }
            }

            // Remove duplicates
            const unique = (arr) => [...new Set(arr.map(a => typeof a === 'string' ? a : a.color))];

            return {
                buttons: unique(colorMap.buttons).slice(0, 5),
                backgrounds: unique(colorMap.backgrounds).slice(0, 5),
                text: unique(colorMap.text).slice(0, 3),
                borders: unique(colorMap.borders).slice(0, 3)
            };
        }
        """)

        return colors
    except Exception as e:
        print(f"Error analyzing {url}: {str(e)}")
        return None

def rgb_to_hex(rgb_str):
    """Convert RGB string to hex"""
    try:
        # Extract numbers from 'rgb(r, g, b)' or 'rgba(r, g, b, a)'
        match = rgb_str.replace('rgba', '').replace('rgb', '').strip('()')
        values = [int(x.strip()) for x in match.split(',')][:3]
        return '#{:02x}{:02x}{:02x}'.format(*values).upper()
    except:
        return rgb_str

def main():
    print("="*70)
    print("ETHINOS CDP - DETAILED COLOR ANALYSIS")
    print("="*70)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        pages = [
            ("Dashboard", f"{BASE_URL}/dashboard"),
            ("Upload Page", f"{BASE_URL}/dashboard/upload"),
            ("Google Ads", f"{BASE_URL}/dashboard/analytics/google-ads"),
            ("DV360", f"{BASE_URL}/dashboard/analytics/dv360"),
            ("Meta", f"{BASE_URL}/dashboard/analytics/meta"),
            ("Clients", f"{BASE_URL}/dashboard/clients"),
        ]

        for page_name, url in pages:
            print(f"\n{page_name}")
            print("-" * 70)
            print(f"URL: {url}")

            page = browser.new_page(viewport={'width': 1920, 'height': 1080})
            colors = extract_color_values(page, url)

            if colors:
                print("\nButton Colors (RGB -> HEX):")
                for color in colors['buttons'][:3]:
                    hex_color = rgb_to_hex(color)
                    print(f"  {color} -> {hex_color}")

                print("\nBackground Colors (RGB -> HEX):")
                for color in colors['backgrounds'][:3]:
                    hex_color = rgb_to_hex(color)
                    print(f"  {color} -> {hex_color}")

                print("\nText Colors (RGB -> HEX):")
                for color in colors['text'][:2]:
                    hex_color = rgb_to_hex(color)
                    print(f"  {color} -> {hex_color}")

            page.close()

        browser.close()

    print("\n" + "="*70)
    print("EXPECTED AMPLITUDE COLORS:")
    print("="*70)
    print("Indigo (Primary):   #5C6BC0")
    print("Amber (Accent):     #F79009")
    print("Dark BG:            #0F172A")
    print("Surface:            #1E293B")
    print("\nEXPECTED KOTAK COLORS (SHOULD NOT APPEAR):")
    print("Red:                #EC1D24")
    print("Navy:               #003087")
    print("Gold:               #FFB81C")

if __name__ == "__main__":
    main()
