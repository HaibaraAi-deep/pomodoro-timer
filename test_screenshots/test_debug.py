from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')

    # Open settings
    page.locator('#settingsTriggerBtn').click()
    page.wait_for_timeout(500)

    # Check close button position
    btn_info = page.evaluate('''() => {
        const btn = document.getElementById('settingsCloseBtn');
        const container = document.getElementById('settingsContainer');
        const rect = btn.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        return {
            btnRect: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height },
            containerRect: { top: containerRect.top, right: containerRect.right, bottom: containerRect.bottom, left: containerRect.left, width: containerRect.width, height: containerRect.height },
            containerScrollTop: container.scrollTop,
            containerScrollHeight: container.scrollHeight,
            containerClientHeight: container.clientHeight,
            viewport: { width: window.innerWidth, height: window.innerHeight },
            btnInViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth
        };
    }''')
    print("Close button position:", btn_info)

    # Try force clicking
    page.locator('#settingsCloseBtn').click(force=True)
    page.wait_for_timeout(300)
    is_hidden = page.locator('#settingsContainer').evaluate('el => el.classList.contains("hidden")')
    print(f"Settings closed after force click: {is_hidden}")

    browser.close()
