export interface DimensionsState {
  window: { width: number; height: number; scale: number };
  screen: { width: number; height: number; scale: number };
}

/**
 * Dimensions.get('window') / .get('screen') 値差替。 iPhone / iPad / Android 各 form factor
 * を切替、 responsive layout の test を書く経路。
 */
export function setDimensions(
  state: DimensionsState,
  next: {
    window?: Partial<DimensionsState['window']>;
    screen?: Partial<DimensionsState['screen']>;
  },
): DimensionsState {
  if (next.window) state.window = { ...state.window, ...next.window };
  if (next.screen) state.screen = { ...state.screen, ...next.screen };
  return state;
}
