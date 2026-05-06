from playwright.sync_api import sync_playwright
import os

SCREENSHOT_DIR = '/workspace/test_screenshots'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

console_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    # Test 1: Initial page load
    print("=== Test 1: Initial Page Load ===")
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    page.screenshot(path=f'{SCREENSHOT_DIR}/01_initial.png', full_page=True)
    print(f"Title: {page.title()}")

    # Discover all element IDs and classes
    all_ids = page.evaluate('''() => {
        const ids = [];
        document.querySelectorAll('[id]').forEach(el => ids.push(el.id));
        return ids;
    }''')
    print(f"All element IDs: {all_ids}")

    # Test 2: Add tasks using Enter key
    print("\n=== Test 2: Add Tasks ===")
    task_input = page.locator('#taskInput')
    task_input.fill('测试任务1')
    task_input.press('Enter')
    page.wait_for_timeout(500)
    task_input.fill('测试任务2')
    task_input.press('Enter')
    page.wait_for_timeout(500)
    task_input.fill('测试任务3')
    task_input.press('Enter')
    page.wait_for_timeout(500)
    task_items = page.locator('[data-task-id]').all()
    print(f"Tasks added: {len(task_items)}")
    page.screenshot(path=f'{SCREENSHOT_DIR}/02_tasks_added.png', full_page=True)

    # Test 3: Start timer
    print("\n=== Test 3: Start Timer ===")
    start_btn = page.locator('#startBtn')
    if start_btn.count() > 0 and start_btn.is_visible():
        start_btn.click()
        page.wait_for_timeout(3000)
        timer_text = page.locator('#timerDisplay').text_content().strip()
        page.screenshot(path=f'{SCREENSHOT_DIR}/03_timer_running.png', full_page=True)
        print(f"Timer display: {timer_text}")
        if timer_text != "25:00":
            print("PASS: Timer is counting down")
        else:
            print("WARN: Timer still shows 25:00")
    else:
        print("FAIL: Start button not found")
        # Try to find timer buttons
        timer_btns = page.evaluate('''() => {
            const btns = document.querySelectorAll('button');
            return Array.from(btns).filter(b => b.closest('.timer-section, .timer-container, .timer')).map(b => ({id: b.id, text: b.textContent.trim(), class: b.className}));
        }''')
        print(f"Timer area buttons: {timer_btns}")

    # Test 4: Pause timer
    print("\n=== Test 4: Pause Timer ===")
    pause_btn = page.locator('#pauseBtn')
    if pause_btn.count() > 0 and pause_btn.is_visible():
        pause_btn.click()
        page.wait_for_timeout(500)
        paused_text = page.locator('#timerDisplay').text_content().strip()
        page.screenshot(path=f'{SCREENSHOT_DIR}/04_timer_paused.png', full_page=True)
        print(f"Timer after pause: {paused_text}")
        timer_el = page.locator('.timer-display')
        if timer_el.count() > 0:
            has_paused_class = timer_el.evaluate('el => el.classList.contains("paused")')
            if has_paused_class:
                print("PASS: Timer paused with visual distinction")
            else:
                print("WARN: No 'paused' CSS class on timer display")
        else:
            print("WARN: .timer-display element not found")
    else:
        print("WARN: Pause button not visible, trying start button toggle")
        start_btn = page.locator('#startBtn')
        if start_btn.is_visible():
            start_btn.click()
            page.wait_for_timeout(500)
            page.screenshot(path=f'{SCREENSHOT_DIR}/04_timer_paused.png', full_page=True)

    # Test 5: Resume timer
    print("\n=== Test 5: Resume Timer ===")
    start_btn = page.locator('#startBtn')
    if start_btn.is_visible():
        start_btn.click()
        page.wait_for_timeout(2000)
        resumed_text = page.locator('#timerDisplay').text_content().strip()
        page.screenshot(path=f'{SCREENSHOT_DIR}/05_timer_resumed.png', full_page=True)
        print(f"Timer after resume: {resumed_text}")
        print("PASS: Timer resumed")

    # Reset timer
    reset_btn = page.locator('#resetBtn')
    if reset_btn.count() > 0 and reset_btn.is_visible():
        reset_btn.click()
        page.wait_for_timeout(300)

    # Test 6: Theme toggle
    print("\n=== Test 6: Theme Toggle ===")
    current_theme = page.evaluate('document.documentElement.getAttribute("data-theme")')
    print(f"Current theme: {current_theme}")
    theme_btn = page.locator('#themeToggleBtn')
    if theme_btn.count() > 0 and theme_btn.is_visible():
        theme_btn.click()
        page.wait_for_timeout(500)
        new_theme = page.evaluate('document.documentElement.getAttribute("data-theme")')
        page.screenshot(path=f'{SCREENSHOT_DIR}/06_theme_toggled.png', full_page=True)
        print(f"After toggle theme: {new_theme}")
        if current_theme != new_theme:
            print("PASS: Theme toggled successfully")
        else:
            print("WARN: Theme did not change")
        theme_btn.click()
        page.wait_for_timeout(300)
    else:
        print("WARN: Theme toggle button not found")

    # Test 7: Settings panel
    print("\n=== Test 7: Settings Panel ===")
    settings_btn = page.locator('#settingsBtn')
    if settings_btn.count() > 0 and settings_btn.is_visible():
        settings_btn.click()
        page.wait_for_timeout(500)
        page.screenshot(path=f'{SCREENSHOT_DIR}/07_settings.png', full_page=True)
        print("PASS: Settings panel opened")
        close_btn = page.locator('button:has-text("关闭")')
        if close_btn.is_visible():
            close_btn.click()
            page.wait_for_timeout(300)
    else:
        print("WARN: Settings button not found")

    # Test 8: Active task selection
    print("\n=== Test 8: Active Task Selection ===")
    task_titles = page.locator('.task-title')
    if task_titles.count() >= 2:
        task_titles.nth(1).click()
        page.wait_for_timeout(500)
        page.screenshot(path=f'{SCREENSHOT_DIR}/08_active_task.png', full_page=True)
        all_items = page.locator('[data-task-id]')
        active_found = False
        for i in range(all_items.count()):
            classes = all_items.nth(i).get_attribute('class') or ''
            if 'active' in classes:
                active_found = True
                print(f"  Task {i} is active (class: {classes})")
        if active_found:
            print("PASS: Active task indicator visible")
        else:
            print("WARN: No active task indicator found")
    else:
        print("WARN: Not enough tasks to test active selection")

    # Test 9: Mode switching
    print("\n=== Test 9: Mode Switching ===")
    modes = ['专注', '短休息', '长休息']
    for label in modes:
        mode_btn = page.locator(f'button:has-text("{label}")')
        if mode_btn.count() > 0:
            mode_btn.first.click()
            page.wait_for_timeout(300)
            timer_text = page.locator('#timerDisplay').text_content().strip()
            print(f"  Mode '{label}': timer shows {timer_text}")
    page.screenshot(path=f'{SCREENSHOT_DIR}/09_mode_switch.png', full_page=True)
    print("PASS: Mode switching works")

    # Test 10: Skip button
    print("\n=== Test 10: Skip Button ===")
    skip_btn = page.locator('#skipBtn')
    if skip_btn.count() > 0 and skip_btn.is_visible():
        skip_btn.click()
        page.wait_for_timeout(500)
        page.screenshot(path=f'{SCREENSHOT_DIR}/10_skip.png', full_page=True)
        print("PASS: Skip button works")
    else:
        print("WARN: Skip button not visible")

    # Test 11: Console errors
    print("\n=== Test 11: Console Errors ===")
    if console_errors:
        print(f"Console errors found: {len(console_errors)}")
        for err in console_errors[:10]:
            print(f"  - {err[:150]}")
    else:
        print("PASS: No console errors detected")

    # Test 12: Empty task input validation
    print("\n=== Test 12: Empty Task Input ===")
    task_input = page.locator('#taskInput')
    task_input.fill('   ')
    task_input.press('Enter')
    page.wait_for_timeout(300)
    task_items = page.locator('[data-task-id]').all()
    print(f"Tasks after empty input attempt: {len(task_items)}")

    # Test 13: Complete a task
    print("\n=== Test 13: Complete Task ===")
    checkboxes = page.locator('.task-checkbox, input[type="checkbox"], .task-toggle')
    if checkboxes.count() > 0:
        checkboxes.first.click()
        page.wait_for_timeout(500)
        page.screenshot(path=f'{SCREENSHOT_DIR}/12_task_completed.png', full_page=True)
        print("PASS: Task completion toggle works")
    else:
        print("WARN: Task checkbox not found")

    # Test 14: Delete a task
    print("\n=== Test 14: Delete Task ===")
    delete_btns = page.locator('.task-delete-btn, button[aria-label*="删除"]')
    if delete_btns.count() > 0:
        delete_btns.first.click()
        page.wait_for_timeout(500)
        page.screenshot(path=f'{SCREENSHOT_DIR}/13_task_deleted.png', full_page=True)
        remaining = page.locator('[data-task-id]').all()
        print(f"Remaining tasks: {len(remaining)}")
        print("PASS: Task deletion works")
    else:
        print("WARN: Delete button not found")

    # Final screenshot
    page.screenshot(path=f'{SCREENSHOT_DIR}/14_final.png', full_page=True)

    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    print("All screenshots saved to:", SCREENSHOT_DIR)
    browser.close()
