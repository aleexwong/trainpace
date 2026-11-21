/**
 * Page description shared by the client <Helmet> (ConditionsSeoHead) and the
 * prerendered HTML (lib/llm/page-docs.ts), so the two cannot drift apart.
 * Kept in its own import-free file so page-docs does not pull in React.
 */
export const CONDITIONS_DESCRIPTION =
  "See how heat, humidity and altitude change your race time. Get an adjusted finish time, race-day pace and training paces for the forecast.";
