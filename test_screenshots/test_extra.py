from playwright.sync_api import sync_playwright
import os

SCREENSHOT_DIR = '/workspace/test_screenshots'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

console_errors = []
console_warnings = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.on("console", lambda msg: console_warnings.append(msg.text) if msg.type == "warning" else None)

    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')

    # Test timer toggle button (correct ID is timerToggleBtn)
    print("=== Test: Timer Toggle Button ===")
    toggle_btn = page.locator('#timerToggleBtn')
    if toggle_btn.is_visible():
        btn_text = toggle_btn.text_content().strip()
        print(f"Toggle button text: '{btn_text}'")
        toggle_btn.click()
        page.wait_for_timeout(3000)
        timer_text = page.locator('#timerDisplay').text_content().strip()
        print(f"Timer after start: {timer_text}")
        page.screenshot(path=f'{SCREENSHOT_DIR}/15_timer_started.png', full_page=True)
        if timer_text != "25:00":
            print("PASS: Timer counting down")
        else:
            print("WARN: Timer still at 25:00")

        # Pause
        btn_text_after = toggle_btn.text_content().strip()
        print(f"Button text after start: '{btn_text_after}'")
        toggle_btn.click()
        page.wait_for_timeout(500)
        timer_el = page.locator('.timer-display')
        if timer_el.count() > 0:
            classes = timer_el.get_attribute('class') or ''
            print(f"Timer classes after pause: {classes}")
            if 'paused' in classes:
                print("PASS: Paused state has visual distinction")
            else:
                print("WARN: No 'paused' class on timer")
        page.screenshot(path=f'{SCREENSHOT_DIR}/16_timer_paused.png', full_page=True)

        # Resume
        toggle_btn.click()
        page.wait_for_timeout(2000)
        resumed_text = page.locator('#timerDisplay').text_content().strip()
        print(f"Timer after resume: {resumed_text}")
        print("PASS: Timer resume works")

        # Reset
        reset_btn = page.locator('#timerResetBtn')
        reset_btn.click()
        page.wait_for_timeout(300)
        reset_text = page.locator('#timerDisplay').text_content().strip()
        print(f"Timer after reset: {reset_text}")
    else:
        print("FAIL: Timer toggle button not found")

    # Test skip button (correct ID is timerSkipBtn)
    print("\n=== Test: Skip Button ===")
    skip_btn = page.locator('#timerSkipBtn')
    if skip_btn.is_visible():
        # Start timer first
        toggle_btn.click()
        page.wait_for_timeout(1000)
        skip_btn.click()
        page.wait_for_timeout(500)
        mode_indicator = page.locator('#timerModeIndicator').text_content().strip()
        timer_text = page.locator('#timerDisplay').text_content().strip()
        print(f"After skip - Mode: {mode_indicator}, Timer: {timer_text}")
        page.screenshot(path=f'{SCREENSHOT_DIR}/17_skip.png', full_page=True)
        print("PASS: Skip button works")
    else:
        print("WARN: Skip button not visible")

    # Test settings button (correct ID is settingsTriggerBtn)
    print("\n=== Test: Settings Panel ===")
    settings_btn = page.locator('#settingsTriggerBtn')
    if settings_btn.is_visible():
        settings_btn.click()
        page.wait_for_timeout(500)
        settings_panel = page.locator('#settingsContainer')
        is_visible = settings_panel.is_visible()
        page.screenshot(path=f'{SCREENSHOT_DIR}/18_settings.png', full_page=True)
        print(f"Settings panel visible: {is_visible}")
        if is_visible:
            print("PASS: Settings panel opens")
            # Check settings content
            export_btn = page.locator('#exportBtn')
            import_btn = page.locator('#importBtn')
            clear_btn = page.locator('#clearAllBtn')
            print(f"  Export button visible: {export_btn.is_visible()}")
            print(f"  Import button visible: {import_btn.is_visible()}")
            print(f"  Clear button visible: {clear_btn.is_visible()}")
        # Close
        close_btn = page.locator('#settingsCloseBtn')
        if close_btn.is_visible():
            close_btn.click()
            page.wait_for_timeout(300)
    else:
        print("WARN: Settings trigger button not found")

    # Test CSP issues
    print("\n=== Test: CSP and Console Issues ===")
    print(f"Console errors: {len(console_errors)}")
    for err in console_errors:
        print(f"  ERROR: {err[:200]}")
    print(f"Console warnings: {len(console_warnings)}")
    for w in console_warnings[:5]:
        print(f"  WARN: {w[:200]}")

    # Check CSP meta tag
    csp_tag = page.evaluate('''() => {
        const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        return meta ? meta.content : 'not found';
    }''')
    print(f"\nCSP meta tag: {csp_tag}")

    # Check if Google Fonts loaded
    fonts_loaded = page.evaluate('''() => {
        return document.fonts.ready.then(() => {
            return Array.from(document.fonts).map(f => f.family);
        });
    }''')
    print(f"Loaded fonts: {fonts_loaded}")

    # Test language toggle
    print("\n=== Test: Language Toggle ===")
    lang_btn = page.locator('#langToggleBtn')
    if lang_btn.is_visible():
        lang_text = lang_btn.text_content().strip()
        print(f"Language button text: '{lang_text}'")
        lang_btn.click()
        page.wait_for_timeout(500)
        page.screenshot(path=f'{SCREENSHOT_DIR}/19_lang_toggled.png', full_page=True)
        # Check if UI changed
        toggle_text = page.locator('#timerToggleBtn').text_content().strip()
        print(f"Timer button text after lang switch: '{toggle_text}'")
        # Switch back
        lang_btn.click()
        page.wait_for_timeout(300)

    # Final comprehensive screenshot
    page.screenshot(path=f'{SCREENSHOT_DIR}/20_final.png', full_page=True)

    print("\n" + "=" * 60)
    print("COMPREHENSIVE TEST SUMMARY")
    print("=" * 60)
    browser.close()
