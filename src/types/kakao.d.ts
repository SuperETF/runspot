declare global {
  interface Window {
    kakao: {
      maps: {
        LatLng: new (lat: number, lng: number) => any;
        Map: new (container: HTMLElement, options: any) => any;
        Marker: new (options: any) => any;
        Polyline: new (options: any) => any;
        InfoWindow: new (options: any) => any;
        services: {
          Geocoder: new () => any;
          Places: new () => any;
        };
        event: {
          addListener: (target: any, type: string, handler: Function) => void;
          removeListener: (target: any, type: string, handler: Function) => void;
        };
        MarkerImage: new (src: string, size: any, options?: any) => any;
        Size: new (width: number, height: number) => any;
        Point: new (x: number, y: number) => any;
        load: (callback: () => void) => void;
      };
    };
  }
}

export {};
