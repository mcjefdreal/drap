import { type Component, createContext } from 'svelte';

export const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = Record<
  string,
  {
    label?: string;
    icon?: Component;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
>;

export interface TooltipPayload {
  key: string;
  label: string;
  value: unknown;
  color?: string;
  visible?: boolean;
  config?: unknown;
}

// Helper to extract item config from a payload.
export function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: TooltipPayload | undefined,
  key: string,
) {
  if (typeof payload !== 'object' || payload === null) return;

  let configLabelKey = key;
  if (payload.key === key) configLabelKey = payload.key;
  else if (payload.label === key) configLabelKey = payload.label;

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

interface ChartContextValue {
  config: ChartConfig;
}

const [useChart, setContext] = createContext<ChartContextValue>();

export function setChartContext(value: ChartContextValue) {
  return setContext(value);
}

export { useChart };
