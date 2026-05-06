from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='/workspace/test_screenshots/01_initial.png', full_page=True)
    print("=== Initial page screenshot saved ===")
    print(f"Title: {page.title()}")
    print(f"URL: {page.url}")
    content = page.content()
    print(f"Page content length: {len(content)}")
    buttons = page.locator('button').all()
    print(f"Buttons found: {len(buttons)}")
    for i, btn in enumerate(buttons):
        text = btn.text_content()
        visible = btn.is_visible()
        print(f"  Button {i}: '{text}' (visible: {visible})")
    inputs = page.locator('input').all()
    print(f"Inputs found: {len(inputs)}")
    for i, inp in enumerate(inputs):
        placeholder = inp.get_attribute('placeholder')
        inp_type = inp.get_attribute('type')
        print(f"  Input {i}: type='{inp_type}' placeholder='{placeholder}'")
    browser.close()
