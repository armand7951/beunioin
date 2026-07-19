# Desktop navigation simplification design

## Goal

Desktop visitors must see the complete primary navigation without horizontal
scrolling. Secondary destinations should remain easy to find in the footer.

## Header

- Keep four primary menu items: 守護首頁、志工家族、志工福利、暖心後盾.
- Remove 權益學堂、AI守護獸、權益申訴 from the main menu.
- Keep the separate 諮詢守護獸 call-to-action.
- At the desktop breakpoint, remove horizontal scrolling, swipe snapping, and
  scroll-edge gradients from the navigation.
- Keep the compact horizontal swipe treatment on smaller screens.

## Footer

- Rename 快速巡邏 to 更多服務.
- Show only 權益學堂、諮詢守護獸、權益申訴 in that section.
- Preserve the existing navigation behavior for all three links.

## Verification

- Add a source-level regression test for the exact Header and Footer menus.
- Verify the desktop navigation uses non-scrolling desktop classes.
- Run the full test suite, type checking, and production build.
- Inspect the deployed desktop Header and Footer in the browser.
