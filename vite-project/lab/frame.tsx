// Standalone entry for the hero lab artifact: renders one LandingLab variant,
// chosen by the URL hash (#a … #o), outside the app shell.
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import LandingLab from "@/pages/LandingLab";
import "@/index.css";

// Buttons inside a design point at real TrainPace pages that don't exist in
// this bundle; say where they go instead of showing a blank screen.
function LinkTarget() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
      <div>
        <p className="text-sm text-slate-400">On the real site this goes to</p>
        <p className="mt-2 font-display text-3xl font-bold">trainpace.com{pathname}</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-6 rounded-md border border-slate-700 bg-transparent px-4 py-2 text-sm font-semibold text-white hover:border-slate-500"
        >
          Back to the design
        </button>
      </div>
    </div>
  );
}

const variantFromHash = () => location.hash.replace("#", "").toLowerCase() || "l";

function Frame() {
  const [v, setV] = useState(variantFromHash);
  useEffect(() => {
    const on = () => setV(variantFromHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return (
    <MemoryRouter key={v} initialEntries={[`/lab/${v}`]}>
      <Routes>
        <Route path="/lab/:variant" element={<LandingLab />} />
        <Route path="*" element={<LinkTarget />} />
      </Routes>
    </MemoryRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Frame />
  </StrictMode>
);
