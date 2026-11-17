// The projection of tools/print/map/caribbean.json (shared by build-map.ts and chart.ts): Mercator, one degree of
// longitude = 10 units, north up, (0, 0) = the north-west corner of FRAME.
export const FRAME = { lon0: -86, lon1: -60, lat0: 10, lat1: 27 };
const ymerc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 180 / Math.PI;
export const project = (lon: number, lat: number): [number, number] => [(lon - FRAME.lon0) * 10, (ymerc(FRAME.lat1) - ymerc(lat)) * 10];
/** the inverse: units → (lon, lat) */
export const unproject = (x: number, y: number): [number, number] => {
  const ym = ymerc(FRAME.lat1) - y / 10;
  return [FRAME.lon0 + x / 10, (2 * Math.atan(Math.exp(ym * Math.PI / 180)) - Math.PI / 2) * 180 / Math.PI];
};
/** the centre (lon, lat) of a w × h mm chart at mmPerDeg that puts the place (lon, lat) at the point (x, y) mm */
export const centerFor = (lon: number, lat: number, x: number, y: number, w: number, h: number, mmPerDeg: number): [number, number] => {
  const [px, py] = project(lon, lat), k = mmPerDeg / 10;
  return unproject(px - (x - w / 2) / k, py - (y - h / 2) / k);
};
