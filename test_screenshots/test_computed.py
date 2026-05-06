from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')

    page.locator('#settingsTriggerBtn').click()
    page.wait_for_timeout(1000)

    computed = page.evaluate('''() => {
        const el = document.getElementById('settingsContainer');
        const cs = window.getComputedStyle(el);
        return {
            position: cs.position,
            right: cs.right,
            left: cs.left,
            top: cs.top,
            width: cs.width,
            transform: cs.transform,
            parentTagName: el.parentElement?.tagName,
            parentId: el.parentElement?.id,
            parentClass: el.parentElement?.className,
            parentComputedPosition: el.parentElement ? window.getComputedStyle(el.parentElement).position : null,
            parentComputedTransform: el.parentElement ? window.getComputedStyle(el.parentElement).transform : null,
        };
    }''')
    print("Computed styles:", computed)

    browser.close()
