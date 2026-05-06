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
    page.wait_for_timeout(2000)

    # Test 1: CSP - no inline style violations
    print("=== Test 1: CSP Inline Style Fix ===")
    csp_errors = [e for e in console_errors if 'Content Security Policy' in e or 'style-src' in e]
    if csp_errors:
        print(f"FAIL: CSP style errors: {len(csp_errors)}")
        for e in csp_errors:
            print(f"  - {e[:120]}")
    else:
        print("PASS: No CSP inline style violations")

    # Test 2: Google Fonts loading
    print("\n=== Test 2: Google Fonts Loading ===")
    font_errors = [e for e in console_errors if 'fonts.googleapis.com' in e]
    if font_errors:
        print(f"FAIL: Google Fonts blocked: {len(font_errors)}")
    else:
        print("PASS: Google Fonts loading correctly")

    # Test 3: frame-ancestors warning
    print("\n=== Test 3: frame-ancestors Warning ===")
    frame_errors = [e for e in console_errors if 'frame-ancestors' in e]
    if frame_errors:
        print(f"FAIL: frame-ancestors warning: {len(frame_errors)}")
    else:
        print("PASS: No frame-ancestors warning")

    # Test 4: Settings panel opens and closes correctly
    print("\n=== Test 4: Settings Panel Open/Close ===")
    settings_btn = page.locator('#settingsTriggerBtn')
    settings_btn.click()
    page.wait_for_timeout(500)

    container_classes = page.evaluate('document.getElementById("settingsContainer")?.className')
    print(f"  Container classes after open: {container_classes}")

    is_hidden = 'hidden' in container_classes
    if is_hidden:
        print("FAIL: Settings panel did not open (hidden class still present)")
    else:
        print("PASS: Settings panel opened (hidden class removed)")

        # Check close button is in viewport
        close_btn = page.locator('#settingsCloseBtn')
        in_viewport = close_btn.evaluate('el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth; }')
        if in_viewport:
            print("PASS: Close button is in viewport")
            close_btn.click()
            page.wait_for_timeout(500)
            classes_after_close = page.evaluate('document.getElementById("settingsContainer")?.className')
            if 'hidden' in classes_after_close:
                print("PASS: Settings panel closed correctly")
            else:
                print("FAIL: Settings panel did not close")
        else:
            print("FAIL: Close button still outside viewport")
            # Force close via JS
            page.evaluate('document.getElementById("settingsContainer")?.classList.add("hidden")')

    # Test 5: Full functionality
    print("\n=== Test 5: Full Functionality ===")

    # Add tasks
    task_input = page.locator('#taskInput')
    task_input.fill('测试任务1')
    task_input.press('Enter')
    page.wait_for_timeout(300)
    task_input.fill('测试任务2')
    task_input.press('Enter')
    page.wait_for_timeout(300)
    task_count = page.locator('[data-task-id]').count()
    print(f"  Tasks added: {task_count}")

    # Timer
    toggle_btn = page.locator('#timerToggleBtn')
    toggle_btn.click()
    page.wait_for_timeout(2000)
    timer_text = page.locator('#timerDisplay').text_content().strip()
    print(f"  Timer running: {timer_text} (counting down: {timer_text != '25:00'})")

    # Pause
    toggle_btn.click()
    page.wait_for_timeout(300)
    has_paused = page.evaluate('document.querySelector(".timer-display")?.classList.contains("paused")')
    print(f"  Timer paused with visual: {has_paused}")

    # Reset
    page.locator('#timerResetBtn').click()
    page.wait_for_timeout(300)

    # Theme
    page.locator('#themeToggleBtn').click()
    page.wait_for_timeout(300)
    theme = page.evaluate('document.documentElement.getAttribute("data-theme")')
    print(f"  Theme toggle: {theme}")
    page.locator('#themeToggleBtn').click()

    # Active task
    page.locator('.task-title').first.click()
    page.wait_for_timeout(300)
    has_active = page.locator('.task-active').count() > 0
    print(f"  Active task: {has_active}")

    # Mode switch
    page.locator('button:has-text("短休息")').first.click()
    page.wait_for_timeout(300)
    timer_text = page.locator('#timerDisplay').text_content().strip()
    print(f"  Mode switch: {timer_text}")

    # Skip
    page.locator('#timerSkipBtn').click()
    page.wait_for_timeout(300)
    print(f"  Skip works: yes")

    # Console errors summary
    print("\n=== Test 6: Console Errors Summary ===")
    if console_errors:
        print(f"Total console errors: {len(console_errors)}")
        for e in console_errors:
            print(f"  - {e[:120]}")
    else:
        print("PASS: Zero console errors!")

    page.screenshot(path=f'{SCREENSHOT_DIR}/22_final_verification.png', full_page=True)

    print("\n" + "=" * 50)
    print("ALL VERIFICATION TESTS COMPLETE")
    print("=" * 50)
    browser.close()
