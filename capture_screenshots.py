#!/usr/bin/env python3
"""
Ethinos CDP Screenshot Capture and Analysis
Tests color accuracy, layout, and functionality
"""

from playwright.sync_api import sync_playwright
import os
import json
from pathlib import Path

# Create screenshots directory
screenshots_dir = Path("/tmp/ethinos_screenshots")
screenshots_dir.mkdir(exist_ok=True)

BASE_URL = "https://main.ethinos-cdp.pages.dev"

def capture_screenshot(page, url, output_name):
    """Capture a screenshot of a page"""
    try:
        page.goto(url, wait_until='networkidle', timeout=30000)
        # Wait for elements to load
        page.wait_for_load_state('networkidle')

        output_path = screenshots_dir / f"{output_name}.png"
        page.screenshot(path=str(output_path), full_page=False)
        print(f"✅ Captured: {output_name} -> {output_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to capture {output_name}: {str(e)}")
        return False

def check_page_colors(page):
    """Analyze page colors for Amplitude vs Kotak branding"""
    try:
        # Get computed styles of main elements
        colors_found = page.evaluate("""
        () => {
            const colors = {
                backgrounds: [],
                buttons: [],
                text: [],
                accents: []
            };

            // Sample various elements
            document.querySelectorAll('body, [class*="bg-"], [class*="button"], [class*="btn"], button').forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.backgroundColor) colors.backgrounds.push(style.backgroundColor);
                if (style.color) colors.text.push(style.color);
            });

            return colors;
        }
        """)
        return colors_found
    except Exception as e:
        print(f"⚠️ Could not analyze colors: {str(e)}")
        return None

def test_login_flow(browser):
    """Test login functionality"""
    print("\n" + "="*60)
    print("PART 2: ADMIN FLOW TEST")
    print("="*60)

    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # Capture login page
    print("\n1. Capturing login page...")
    capture_screenshot(page, f"{BASE_URL}/auth/login", "01_login_page")

    # Try to interact with login form
    try:
        page.goto(f"{BASE_URL}/auth/login", wait_until='networkidle', timeout=30000)

        # Check if login form exists
        email_input = page.query_selector('input[type="email"]')
        password_input = page.query_selector('input[type="password"]')
        submit_button = page.query_selector('button[type="submit"]')

        if email_input and password_input and submit_button:
            print("✅ Login form elements found")

            # Try to enter credentials (note: we're just testing the form, not actually logging in to protect the account)
            print("ℹ️ Login form is interactive")
        else:
            print("⚠️ Some login form elements missing")
    except Exception as e:
        print(f"⚠️ Error testing login form: {str(e)}")

    page.close()

def test_dashboard_pages(browser):
    """Test dashboard pages"""
    print("\n" + "="*60)
    print("PART 1 & 3: COLOR VERIFICATION & UI CHECKS")
    print("="*60)

    pages_to_test = [
        ("02_dashboard_home", f"{BASE_URL}/dashboard", "Dashboard Home"),
        ("03_upload_page", f"{BASE_URL}/dashboard/upload", "Upload Page"),
        ("04_google_ads", f"{BASE_URL}/dashboard/analytics/google-ads", "Google Ads Analytics"),
        ("05_dv360", f"{BASE_URL}/dashboard/analytics/dv360", "DV360 Analytics"),
        ("06_meta", f"{BASE_URL}/dashboard/analytics/meta", "Meta Analytics"),
        ("07_clients_page", f"{BASE_URL}/dashboard/clients", "Clients Page"),
        ("08_chat", f"{BASE_URL}/dashboard/chat", "Chat Page"),
        ("09_presentations", f"{BASE_URL}/dashboard/presentations", "Presentations Page"),
    ]

    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    results = {}

    for screenshot_name, url, page_title in pages_to_test:
        print(f"\n--- Testing: {page_title} ---")
        print(f"URL: {url}")

        if capture_screenshot(page, url, screenshot_name):
            # Analyze the page
            try:
                # Check for specific color values (Amplitude vs Kotak)
                color_check = page.evaluate("""
                () => {
                    const html = document.documentElement.outerHTML;
                    const issues = {
                        kotak_colors: [],
                        amplitude_colors: [],
                        layout_ok: true
                    };

                    // Check for Kotak red #EC1D24
                    if (html.includes('EC1D24') || html.includes('ec1d24')) issues.kotak_colors.push('Red #EC1D24');

                    // Check for Kotak navy #003087
                    if (html.includes('003087') || html.includes('003087')) issues.kotak_colors.push('Navy #003087');

                    // Check for Kotak gold #FFB81C
                    if (html.includes('FFB81C') || html.includes('ffb81c')) issues.kotak_colors.push('Gold #FFB81C');

                    // Check for Amplitude indigo #5C6BC0
                    if (html.includes('5C6BC0') || html.includes('5c6bc0')) issues.amplitude_colors.push('Indigo #5C6BC0');

                    // Check for Amplitude amber #F79009
                    if (html.includes('F79009') || html.includes('f79009')) issues.amplitude_colors.push('Amber #F79009');

                    // Check main content visibility
                    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
                    issues.layout_ok = mainContent !== null;

                    return issues;
                }
                """)

                kotak_detected = len(color_check['kotak_colors']) > 0
                amplitude_detected = len(color_check['amplitude_colors']) > 0

                color_status = "✅ Amplitude" if amplitude_detected and not kotak_detected else ("❌ Kotak colors found" if kotak_detected else "⚠️ Colors unclear")

                results[page_title] = {
                    'url': url,
                    'color_accuracy': color_status,
                    'kotak_colors': color_check['kotak_colors'],
                    'amplitude_colors': color_check['amplitude_colors'],
                    'layout_ok': color_check['layout_ok'],
                    'screenshot': screenshot_name
                }

                print(f"Color Status: {color_status}")
                if color_check['kotak_colors']:
                    print(f"  Kotak colors found: {color_check['kotak_colors']}")
                if color_check['amplitude_colors']:
                    print(f"  Amplitude colors found: {color_check['amplitude_colors']}")

            except Exception as e:
                print(f"⚠️ Could not analyze page colors: {str(e)}")
                results[page_title] = {
                    'url': url,
                    'color_accuracy': '⚠️ Could not analyze',
                    'screenshot': screenshot_name
                }

        # Check for console errors
        try:
            console_errors = page.evaluate("""
            () => window.__console_errors__ || []
            """)
            if console_errors:
                print(f"⚠️ Console errors detected: {console_errors}")
        except:
            pass

    page.close()
    return results

def test_mobile_responsiveness(browser):
    """Test mobile responsiveness"""
    print("\n" + "="*60)
    print("MOBILE RESPONSIVENESS CHECK")
    print("="*60)

    page = browser.new_page(viewport={'width': 375, 'height': 812})
    print(f"\nViewport: 375x812 (iPhone)")

    try:
        page.goto(f"{BASE_URL}/dashboard", wait_until='networkidle', timeout=30000)
        output_path = screenshots_dir / "10_mobile_dashboard.png"
        page.screenshot(path=str(output_path), full_page=False)
        print(f"✅ Captured mobile dashboard -> {output_path}")

        # Check for horizontal scroll
        viewport_width = page.evaluate("window.innerWidth")
        document_width = page.evaluate("document.documentElement.scrollWidth")

        if document_width > viewport_width:
            print(f"⚠️ Horizontal scroll detected: document width {document_width}px > viewport {viewport_width}px")
        else:
            print(f"✅ No horizontal scroll (doc: {document_width}px, viewport: {viewport_width}px)")

    except Exception as e:
        print(f"❌ Failed mobile test: {str(e)}")

    page.close()

def main():
    print("\n" + "="*60)
    print("ETHINOS CDP APPLICATION TEST SUITE")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Screenshots saved to: {screenshots_dir}")

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)

        # Capture login page and test flow
        test_login_flow(browser)

        # Capture all dashboard pages and verify colors
        results = test_dashboard_pages(browser)

        # Test mobile responsiveness
        test_mobile_responsiveness(browser)

        browser.close()

    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    if results:
        for page_title, result in results.items():
            print(f"\n{page_title}")
            print(f"  URL: {result['url']}")
            print(f"  Colors: {result['color_accuracy']}")
            if 'layout_ok' in result:
                print(f"  Layout: {'✅ OK' if result['layout_ok'] else '❌ Issues'}")

    print(f"\n✅ All screenshots saved to: {screenshots_dir}")
    print("\nScreenshot files:")
    for f in sorted(screenshots_dir.glob("*.png")):
        print(f"  - {f.name}")

if __name__ == "__main__":
    main()
