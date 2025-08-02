// types/leaflet.d.ts
// Minimal stub to silence “cannot find declaration file” errors
declare module 'leaflet' {
  const L: any;            // you can replace `any` with real interfaces later
  export = L;
}

declare module 'react-leaflet';
