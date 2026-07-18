# BeUnion Logo Replacement Design

## Goal

Use the provided `logo.png` consistently across the BeUnion website.

## Scope

- Replace the shield icon in the site header.
- Replace the shield icon in the site footer.
- Use the same logo as the browser favicon.
- Preserve the header logo button's navigation behavior.

## Asset Strategy

Move the supplied image to `public/logo.png` and reference it with the stable
public URL `/logo.png`. This keeps one source asset for the header, footer, and
favicon.

## Presentation

- Preserve the logo's original aspect ratio and transparent background.
- Use `object-contain` so the complete shield and laurel remain visible.
- Display the header logo at approximately 48 px.
- Display the footer logo at approximately 52 px.
- Keep the existing surrounding layout, text, and interactions unchanged.

## Verification

- Confirm the header and footer render `/logo.png`.
- Confirm `index.html` declares `/logo.png` as the favicon.
- Run the TypeScript check and production build.
- Visually inspect the page at desktop and mobile widths.
