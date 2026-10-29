// Tinted dot-grid panel that sits behind a card for depth. One shared look
// for the hero demo, the feature shots and the founder card on the landing
// page. The parent must be `relative`; the card after it needs `relative` too
// so it stacks above the panel.
// `light` sits on sections that turn dark with the theme; `dark` is for
// sections that are dark in both themes, like the founder card. In dark mode
// both drop the emerald for plain grey dots.

const DARK_THEME =
  "dark:bg-neutral-800/50 dark:[background-image:radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)]";

const TONES = {
  light: `bg-emerald-50 [background-image:radial-gradient(rgb(16_185_129/0.18)_1px,transparent_1px)] ${DARK_THEME}`,
  dark: `bg-slate-800/60 [background-image:radial-gradient(rgb(52_211_153/0.16)_1px,transparent_1px)] ${DARK_THEME}`,
};

export default function DotPanel({
  tone = "light",
}: {
  tone?: keyof typeof TONES;
}) {
  return (
    <div
      aria-hidden
      className={`absolute -inset-4 rounded-2xl [background-size:16px_16px] sm:-inset-6 ${TONES[tone]}`}
    />
  );
}
