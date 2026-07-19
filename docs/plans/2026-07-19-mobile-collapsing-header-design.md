# Mobile collapsing Header design

## Goal

Give mobile visitors more reading space by collapsing the sticky Header to the
brand block while they scroll down, then restore the full Header when they
scroll up.

## Behavior

- Apply the interaction below the `lg` breakpoint only.
- Keep the Header fully expanded at the top of the page.
- After leaving the top, collapse after at least 12 pixels of downward movement.
- Expand after at least 12 pixels of upward movement.
- The collapsed Header keeps the logo, union name, heart, and subtitle.
- Hide the swipe hint, primary navigation, member/admin controls, and quick
  action area while collapsed.
- The alert banner remains outside the sticky Header and scrolls away normally.
- Desktop layout and behavior remain unchanged.

## Motion and stability

- Animate the Header spacing and expandable content over approximately 200ms.
- Accumulate movement in one direction and reset the accumulator when direction
  changes.
- Ignore tiny scroll movements below the threshold to prevent flicker.
- Reset to expanded when the page returns near the top.

## Accessibility and verification

- Preserve the brand button as a working home link in both states.
- Respect reduced-motion preferences through Tailwind motion utilities.
- Add unit coverage for the direction-and-threshold state logic.
- Add component source coverage for mobile-only collapse and desktop visibility.
- Verify the behavior at a mobile viewport and verify desktop remains expanded.
