// Tinted dot-grid panel that sits behind a card for depth. One shared look
// for the hero demo, the feature shots and the founder card on the landing
// page. The parent must be `relative`; the card after it needs `relative` too
// so it stacks above the panel.
// `light` follows the site theme (it sits on sections that turn dark);
// `dark` is for sections that are dark in both themes, like the founder card.

const TONES = {
  light: {
    panel: "bg-emerald-50 dark:bg-slate-800/60",
    dots: "radial-gradient(rgb(16 185 129 / 0.18) 1px, transparent 1px)",
  },
  dark: {
    panel: "bg-slate-800/60",
    dots: "radial-gradient(rgb(52 211 153 / 0.16) 1px, transparent 1px)",
  },
};

export default function DotPanel({
  tone = "light",
}: {
  tone?: keyof typeof TONES;
}) {
  return (
    <div
      aria-hidden
      className={`absolute -inset-4 rounded-2xl sm:-inset-6 ${TONES[tone].panel}`}
      style={{ backgroundImage: TONES[tone].dots, backgroundSize: "16px 16px" }}
    />
  );
}
