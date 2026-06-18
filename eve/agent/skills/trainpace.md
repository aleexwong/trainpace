# Skill: Long-run readiness review

Use this procedure when a runner shares a GPX route **and** a recent race result and
asks something like *"am I going out too hard, and where are the climbs?"*

## Steps

1. **Analyze the route.** Call `gpx` with the file contents. Note `totalDistance`,
   `elevationGain`, and the high point (`maxElevation`).
2. **Get their paces.** Call `vdot` (or `paces`) with the race result converted to
   meters + seconds. Take the **Easy** pace range — that's the long-run target.
3. **Compare and judge.**
   - If they named an intended long-run pace, compare it to the Easy range. Faster
     than Easy on a long run = going out too hard; say so and give the Easy number.
   - If `elevationGain` is meaningful (say >150 m over the route), explain that Easy
     *effort* means slowing on the climbs (~+0:30/km on real hills), so their pace
     will drift slower uphill and that is correct, not a failure.
   - Point to the high point / steepest section as the crux to manage effort on.
4. **Answer like a coach.** One or two clear takeaways: the target easy pace, and how
   to handle the hills. Avoid dumping every zone.

## Guardrails

- All numbers come from the tools. Never estimate VDOT, pace, or climbing yourself.
- If the GPX lacks elevation data, say the route had no elevation track and skip the
  climb analysis rather than inventing it.
