// The projection of tools/print/map/caribbean.json (shared by build-map.ts and chart.ts): Mercator, one degree of
// longitude = 10 units, north up, (0, 0) = the north-west corner of FRAME.
export const FRAME = { lon0: -86, lon1: -60, lat0: 10, lat1: 27 };
const ymerc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 180 / Math.PI;
export const project = (lon: number, lat: number): [number, number] => [(lon - FRAME.lon0) * 10, (ymerc(FRAME.lat1) - ymerc(lat)) * 10];
