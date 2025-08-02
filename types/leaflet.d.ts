// types/leaflet.d.ts

declare module 'leaflet' {
  // Use this temporary fallback only if @types/leaflet doesn't work
  const L: any;
  export default L;
}
