// 네이버 지도 API는 공식 npm 타입 패키지가 없어 최소한의 전역 타입만 선언합니다.
export {};

declare global {
  interface Window {
    naver: typeof naver;
  }

  namespace naver.maps {
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }
    class Point {
      constructor(x: number, y: number);
    }
    interface PointerEvent {
      coord: LatLng;
    }
    class Map {
      constructor(el: HTMLElement | string, options: Record<string, unknown>);
      setCenter(latlng: LatLng): void;
    }
    class Marker {
      constructor(options: Record<string, unknown>);
      setMap(map: Map | null): void;
    }
    namespace Event {
      function addListener(
        target: unknown,
        eventName: string,
        handler: (...args: unknown[]) => void
      ): void;
      function trigger(target: unknown, eventName: string): void;
    }
  }
}
