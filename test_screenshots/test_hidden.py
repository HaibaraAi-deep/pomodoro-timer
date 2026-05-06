from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')

    # Check initial state
    classes_before = page.evaluate('document.getElementById("settingsContainer")?.className')
    print(f"Before click - classes: {classes_before}")

    # Click settings trigger
    page.locator('#settingsTriggerBtn').click()
    page.wait_for_timeout(1000)

    classes_after = page.evaluate('document.getElementById("settingsContainer")?.className')
    print(f"After click - classes: {classes_after}")

    # Check if toggleSettings is connected
    has_listener = page.evaluate('''() => {
        const btn = document.getElementById('settingsTriggerBtn');
        return btn ? btn.onclick !== null || btn.getAttribute('data-listener') : 'no btn';
    }''')
    print(f"Button has listener: {has_listener}")

    # Try manually removing hidden class
    page.evaluate('document.getElementById("settingsContainer")?.classList.remove("hidden")')
    page.wait_for_timeout(500)

    classes_manual = page.evaluate('document.getElementById("settingsContainer")?.className')
    transform_manual = page.evaluate('window.getComputedStyle(document.getElementById("settingsContainer")).transform')
    rect_manual = page.evaluate('''() => {
        const el = document.getElementById("settingsContainer");
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, width: r.width };
    }''')
    print(f"After manual remove - classes: {classes_manual}")
    print(f"After manual remove - transform: {transform_manual}")
    print(f"After manual remove - rect: {rect_manual}")

    # Now try close button
    close_btn = page.locator('#settingsCloseBtn')
    in_viewport = close_btn.evaluate('el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth; }')
    print(f"Close button in viewport: {in_viewport}")

    browser.close()
