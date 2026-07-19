# Shield Hub copy update design

## Scope

Update only the introductory badge and main heading in `ShieldHub`.

## Copy

- Badge: `BeUnion • 台灣環境生態護育產業工會`
- Heading: `我們保護為萬物挺身而出的人`

## Presentation

- Preserve the existing badge and heading layout, typography, and responsive
  behavior.
- Render the heading as one consistent phrase and let it wrap naturally.
- Remove the old `beunion.tw` wavy underline and the previous official
  information wording.

## Verification

- Add a regression test for the two exact new strings.
- Assert the two replaced strings no longer exist in `ShieldHub`.
- Run the full test suite, type checking, build, and production inspection.
