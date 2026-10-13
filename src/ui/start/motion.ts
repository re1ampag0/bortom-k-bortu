// Movement on screen: off when the system asks for less motion and at the test speed «?speed=instant».
export function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** «?speed=instant» (or 0) in the address: the browser tests skip every show and banner. */
export function instantUrl(): boolean {
  const v = new URLSearchParams(location.search).get('speed');
  return v === '0' || v === 'instant';
}
