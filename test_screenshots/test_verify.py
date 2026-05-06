from playwright.sync_api import sync_playwright
import os

SCREENSHOT_DIR = '/workspace/test_screenshots'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

console_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')

    # Test 1: Check CSP - no inline style violations
    print("=== Test 1: CSP Inline Style Fix ===")
    page.wait_for_timeout(2000)
    csp_errors = [e for e in console_errors if 'Content Security Policy' in e or 'style-src' in e]
    if csp_errors:
        print(f"FAIL: CSP style errors still present: {len(csp_errors)}")
        for e in csp_errors:
            print(f"  - {e[:150]}")
    else:
        print("PASS: No CSP inline style violations")

    # Test 2: Check Google Fonts loading
    print("\n=== Test 2: Google Fonts Loading ===")
    font_errors = [e for e in console_errors if 'fonts.googleapis.com' in e]
    if font_errors:
        print(f"FAIL: Google Fonts still blocked: {len(font_errors)}")
        for e in font_errors:
            print(f"  - {e[:150]}")
    else:
        print("PASS: Google Fonts loading correctly")

    # Test 3: Check frame-ancestors warning removed
    print("\n=== Test 3: frame-ancestors Warning ===")
    frame_errors = [e for e in console_errors if 'frame-ancestors' in e]
    if frame_errors:
        print(f"FAIL: frame-ancestors warning still present: {len(frame_errors)}")
    else:
        print("PASS: No frame-ancestors warning")

    # Test 4: Settings panel close button accessible
    print("\n=== Test 4: Settings Close Button ===")
    settings_btn = page.locator('#settingsTriggerBtn')
    settings_btn.click()
    page.wait_for_timeout(500)

    close_btn = page.locator('#settingsCloseBtn')
    if close_btn.is_visible():
        in_viewport = close_btn.evaluate('el => { const rect = el.getBoundingClientRect(); return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth; }')
        if in_viewport:
            print("PASS: Close button is visible and in viewport")
        else:
            print("WARN: Close button visible but may be partially outside viewport")
        close_btn.click()
        page.wait_for_timeout(300)
    else:
        print("FAIL: Close button not visible")

    # Test 5: All console errors
    print("\n=== Test 5: All Console Errors ===")
    if console_errors:
        print(f"Total console errors: {len(console_errors)}")
        for e in console_errors:
            print(f"  - {e[:150]}")
    else:
        print("PASS: No console errors at all!")

    # Test 6: Full functionality check
    print("\n=== Test 6: Full Functionality Check ===")

    # Add tasks
    task_input = page.locator('#taskInput')
    task_input.fill('验证任务1')
    task_input.press('Enter')
    page.wait_for_timeout(300)
    task_input.fill('验证任务2')
    task_input.press('Enter')
    page.wait_for_timeout(300)

    # Start timer
    toggle_btn = page.locator('#timerToggleBtn')
    toggle_btn.click()
    page.wait_for_timeout(2000)
    timer_text = page.locator('#timerDisplay').text_content().strip()
    print(f"  Timer running: {timer_text}")

    # Pause
    toggle_btn.click()
    page.wait_for_timeout(300)
    timer_classes = page.locator('.timer-display').get_attribute('class') or ''
    print(f"  Timer paused class: {'paused' in timer_classes}")

    # Reset
    page.locator('#timerResetBtn').click()
    page.wait_for_timeout(300)

    # Theme toggle
    page.locator('#themeToggleBtn').click()
    page.wait_for_timeout(300)
    theme = page.evaluate('document.documentElement.getAttribute("data-theme")')
    print(f"  Theme toggle works: {theme}")
    page.locator('#themeToggleBtn').click()

    # Active task
    page.locator('.task-title').first.click()
    page.wait_for_timeout(300)
    active = page.locator('.task-active')
    print(f"  Active task works: {active.count() > 0}")

    # Mode switch
    page.locator('button:has-text("短休息")').first.click()
    page.wait_for_timeout(300)
    timer_text = page.locator('#timerDisplay').text_content().strip()
    print(f"  Mode switch works: {timer_text}")

    page.screenshot(path=f'{SCREENSHOT_DIR}/21_after_fix.png', full_page=True)

    print("\n" + "=" * 50)
    print("VERIFICATION COMPLETE")
    print("=" * 50)
    browser.close()
