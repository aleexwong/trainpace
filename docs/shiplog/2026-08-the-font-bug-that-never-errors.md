# The Font Bug That Never Throws an Error

*August 2026 · from the TrainPace build log*

The numbers on my landing page were shaking.

Not badly. TrainPace has an animated feature shot that counts a pace up to its final
value, and as the digits cycled, the whole row twitched left and right by a pixel or two.
The kind of thing you only see once, and then can't stop seeing.

I also had italics that weren't italic. Same page. I'd written `<em>`, the CSS was fine,
and the text rendered bolt upright.

Neither of these produced an error. Not in the console, not in the network tab, not in
the build. Every file said the right thing. I spent an embarrassing amount of time
reading CSS that was already correct.

## The thing I got wrong

I assumed a font either loads or fails, and that failing is loud.

I checked in the browser the way you'd expect — `document.fonts.check()`, which returned
`true`. So the font was there. So the problem must be elsewhere. I went looking at the
animation, then at the layout, then at the container.

`document.fonts.check()` does not answer the question I was asking. It tells you
something about whether a font *matching that description* can be used for rendering.
It does not tell you that the specific face you asked for — this weight, this style —
actually exists in what the browser downloaded. I was asking "is this font available"
and getting an answer to a different question, in the affirmative, confidently.

## What was actually happening

Two things, sharing one root cause.

TrainPace loads two webfonts from Google Fonts: DM Sans for body text, Space Grotesk for
headings. And in `:root`, my stylesheet sets:

```css
font-synthesis: none;
```

That line is deliberate. `font-synthesis` is what lets a browser fake a face it doesn't
have — smearing a regular weight into pseudo-bold, or slanting an upright face into
pseudo-italic. Faked faces look bad. Turning synthesis off is the correct call for a
design you care about.

But it converts a cosmetic problem into a silent one. With synthesis on, a missing italic
gets faked and looks slightly wrong. With synthesis off, a missing italic **renders as if
you never asked**. No warning. No fallback you can see. The markup says italic, the
browser shrugs, you get upright text.

Both bugs were faces I hadn't actually requested:

**The italics.** My Google Fonts URL asked for DM Sans without the italic axis. Variable
font requests need italics declared explicitly — `ital,opsz,wght@0,…;1,…`, where that
`1,` branch *is* the italic. I had the `0,` branch only. Every `<em>` on the site had
been upright since the day I added the font, and I'd never noticed because nothing broke.

**The jitter.** I'd set `tabular-nums` on the animated numerals, which is exactly right —
tabular figures are fixed-width, so digits don't change the line's width as they cycle.
The problem is that `font-variant-numeric: tabular-nums` only does anything if the font
ships a `tnum` table. Space Grotesk has one. DM Sans does not. The numerals were in DM
Sans. The property was a no-op, the digits were proportional, and every frame of the
animation was a slightly different width.

The fix for the second one isn't CSS. It's putting the number in a font that can do the
thing.

## The one that's still a trap

While I was in there I found a third case I hadn't hit yet: Space Grotesk stops at
weight 700. Google Fonts returns HTTP 400 for a request that asks for 800.

So `font-extrabold` on a heading is not just unavailable — with synthesis off, it
silently renders at 700 and looks completely normal. You will never find that by looking
at the page. There's now a comment in `Landing.tsx` about it, because I know I'll
otherwise try it again in six months.

I also learned to always give a webfont an explicit fallback stack. A bare
`font-family: "Space Grotesk"` doesn't fall back to something neutral when the font fails
— it falls back to the browser default *serif*, which looks nothing like the design and
is very obvious in a screenshot you've already shipped.

## What I shipped

Three commits, all small, none of them interesting on their own:

- `91efaed` — load real DM Sans italics, add display-font fallback stacks
- `bdea344` — stop feature-shot numerals falling back to generic monospace
- `e28d9a2` — keep the elevation tooltip inside its card

The commit that mattered was the fourth: `fc3f689`, which wrote all of this down in the
project's `CLAUDE.md` and added a `verify-in-browser` skill — a documented procedure for
checking a visual change by measuring what actually rendered, in a real browser, instead
of reading the stylesheet and believing it.

That's the real output. The bugs took an afternoon. The rule is what stops the next one:

**A font that fails silently fails permanently, because nothing will ever tell you.**
Adding a weight or a style to your markup is not enough. It has to be in the request too.
And you verify it by measuring the rendered result, not by asking the font API a question
it isn't answering.

## What I'd do differently

I'd have gone to the browser first. I burned most of the afternoon in the editor, reading
CSS that was already correct, because the CSS *being correct* was the whole shape of the
bug. Nothing in the source was going to tell me. The information only existed in what got
painted.

Sitting there re-reading a stylesheet, hoping to spot something on the fourth pass, is
the debugging equivalent of adding mileage when you're already tired. It feels like work.
It isn't progress. The answer was one `getComputedStyle` away the entire time.
