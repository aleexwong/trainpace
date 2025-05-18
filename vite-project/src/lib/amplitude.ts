import * as amplitude from "@amplitude/analytics-browser";

const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY;

export const initAmplitude = () => {
  if (!AMPLITUDE_API_KEY) return;
  amplitude.init(AMPLITUDE_API_KEY);
};

export const track = (eventName: string, eventProps?: object) => {
  amplitude.track(eventName, eventProps);
};
