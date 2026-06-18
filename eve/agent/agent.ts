import { defineAgent } from "eve";

/**
 * The TrainPace running coach.
 *
 * `model` is an AI SDK model handle. A bare string is routed through the
 * Vercel AI Gateway as `creator/model-id` — set this to a current Claude id
 * available on your gateway before deploying. (Eve does not assert the id
 * names a real model at compile time.)
 */
export default defineAgent({
  model: "anthropic/claude-opus-4.8",
});
