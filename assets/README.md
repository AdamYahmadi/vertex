# Vertex — brand assets

## The mark

One plane, one cut, three planes.

The mark begins as a single parent form built on two directions, 10° and 72°. A
channel of constant width enters it, branches once, and leaves again through two
edges. That branch point is the vertex: it is never drawn, only addressed — every
edge of every plane runs to it or away from it.

The cut leaves three planes with three different jobs. A bar and a plate stack on
one side of the channel. The third plane keeps a step where the fourth sector opens,
so it wraps that corner and reaches back under the channel, locking the other two in
place. Remove any one of the three and the silhouette falls apart; that is what
makes them read as one mark rather than three shapes.

The whole symbol is then rotated 32°. The construction is unchanged, but it no
longer sits on the 18° axis that italic type uses, which is what kept earlier
versions reading as a monogram.

**Construction** (64 × 64 grid). Parent 46 × 44 units on directions 10° and 72°;
the channel branches at (17, 18) in those coordinates and is 3.8 units wide,
opening to 5.2 at 24 px and below; the fourth sector opens at (26, 21); the
assembled mark is rotated 32°, fitted to a 57-unit box, then dropped 0.9 units so
that its mass centroid — not its bounding box — sits on the centre of the artboard.

Nothing in the mark is white — each plane is its own path — so it inverts onto any
background, including the Vertex green, by changing one fill.

## Files

| File | Use |
| --- | --- |
| `logo-mark.svg` | primary symbol, ink `#111114` |
| `logo-mark-white.svg` | dark and accent backgrounds |
| `logo-mark-accent.svg` | accent `#0B6E52` |
| `logo-mark-small.svg` / `-small-white.svg` | 24 px and below (wider channel) |
| `logo-lockup.svg` / `-dark.svg` | symbol + wordmark |
| `logo-mark.png`, `logo-mark-white.png` | 512 px raster |
| `logo-lockup.png`, `logo-lockup-dark.png` | 624 px raster |

App icons live in `frontend/public/`: `favicon.svg` (symbol on an accent square at
86%), `favicon-32.png`, `favicon-16.png`, `apple-touch-icon.png`.

## Wordmark

`VERTEX`, Helvetica Neue / Helvetica / Arial, weight 500, letter-spacing 3.6 units
at 20 px. The symbol sits at 84%, its tallest plane aligned to the cap height, with
one cap-height of clear space before the V.

## Colour

| Token | Value |
| --- | --- |
| Ink | `#111114` |
| Accent | `#0B6E52` |
| Accent, dark backgrounds | `#16A67C` |

The symbol is designed monochrome and must work that way; colour is optional. Never
add gradients, outlines, shadows or a second colour inside the mark.

## Clear space and minimum size

Keep clear space of two channel widths (about 8 units, 14% of the mark) on all
sides. Minimum size is 16 px for the symbol and 96 px wide for the lockup. Below
24 px use `logo-mark-small.svg`, which opens the channel so it survives the pixel
grid.
