export type DestinationMapPoint = {
  id: string;
  name: string;
  city: string;
  kind: 'airport' | 'spot' | 'hotel' | 'food' | 'route';
  lat: number;
  lng: number;
  dayIndex?: number;
};

export const changzhiMapPoints: DestinationMapPoint[] = [
  { id: 'changzhi-airport', name: '长治王村机场', city: '长治', kind: 'airport', lat: 36.247, lng: 113.126, dayIndex: 1 },
  { id: 'huangyadong', name: '黄崖洞景区', city: '长治', kind: 'spot', lat: 36.879, lng: 113.387, dayIndex: 1 },
  { id: 'hualuxian', name: '花壶线', city: '长治', kind: 'route', lat: 36.363, lng: 113.575, dayIndex: 2 },
  { id: 'shenlongwan', name: '神龙湾挂壁公路', city: '长治', kind: 'spot', lat: 36.158, lng: 113.676, dayIndex: 2 },
  { id: 'jingdi', name: '井底村', city: '长治', kind: 'hotel', lat: 36.148, lng: 113.662, dayIndex: 2 },
  { id: 'taihang-music-road', name: '太行音乐公路', city: '长治', kind: 'route', lat: 36.223, lng: 113.49, dayIndex: 3 },
  { id: 'changzhi-city', name: '长治市区', city: '长治', kind: 'food', lat: 36.195, lng: 113.116, dayIndex: 3 },
];

export function getDestinationMapPoints(destination: string) {
  if (destination.includes('长治')) {
    return changzhiMapPoints;
  }

  return [];
}
