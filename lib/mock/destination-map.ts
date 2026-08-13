export type DestinationMapPoint = {
  id: string;
  eventId?: string;
  name: string;
  city: string;
  kind: 'airport' | 'spot' | 'hotel' | 'food' | 'route';
  lat: number;
  lng: number;
  dayIndex?: number;
  description?: string;
  navigationUrl?: string;
};

function nav(keyword: string) {
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(keyword)}`;
}

export const changzhiMapPoints: DestinationMapPoint[] = [
  { id: 'changzhi-airport-d1', eventId: 'day-1-event-2', name: '长治王村机场', city: '长治', kind: 'airport', lat: 36.247, lng: 113.126, dayIndex: 1, description: '长沙抵达后取车出发。', navigationUrl: nav('长治王村机场') },
  { id: 'huangyadong', eventId: 'day-1-event-5', name: '黄崖洞景区', city: '长治', kind: 'spot', lat: 36.879, lng: 113.387, dayIndex: 1, description: '太行峡谷与八路军兵工厂旧址。', navigationUrl: nav('黄崖洞景区') },
  { id: 'hualuxian', eventId: 'day-2-event-2', name: '花壶线', city: '长治', kind: 'route', lat: 36.363, lng: 113.575, dayIndex: 2, description: '晋东南山地自驾景观路段。', navigationUrl: nav('花壶线') },
  { id: 'shenlongwan-road', eventId: 'day-2-event-3', name: '神龙湾挂壁公路', city: '长治', kind: 'spot', lat: 36.158, lng: 113.676, dayIndex: 2, description: '太行绝壁上的工程奇观。', navigationUrl: nav('神龙湾挂壁公路') },
  { id: 'shenlongwan-canyon', eventId: 'day-2-event-5', name: '神龙湾大峡谷', city: '长治', kind: 'spot', lat: 36.151, lng: 113.67, dayIndex: 2, description: '峡谷浅滩与山地水文观察点。', navigationUrl: nav('神龙湾大峡谷') },
  { id: 'jingdi', eventId: 'day-2-event-4', name: '井底村', city: '长治', kind: 'hotel', lat: 36.148, lng: 113.662, dayIndex: 2, description: '挂壁公路旁住宿与休整点。', navigationUrl: nav('井底村') },
  { id: 'taihang-music-road', eventId: 'day-3-event-2', name: '太行音乐公路', city: '长治', kind: 'spot', lat: 36.223, lng: 113.49, dayIndex: 3, description: '道路纹理与车速共同产生旋律。', navigationUrl: nav('太行音乐公路') },
  { id: 'changzhi-city', eventId: 'day-3-event-3', name: '长治市区', city: '长治', kind: 'food', lat: 36.195, lng: 113.116, dayIndex: 3, description: '午餐补给和长车程中转。', navigationUrl: nav('长治市区') },
  { id: 'hongdong-dahuaishu', eventId: 'day-3-event-5', name: '洪洞大槐树', city: '临汾', kind: 'spot', lat: 36.2678, lng: 111.6765, dayIndex: 3, description: '移民历史与寻根文化研学点。', navigationUrl: nav('洪洞大槐树寻根祭祖园') },
  { id: 'hukou-waterfall', eventId: 'day-4-event-3', name: '壶口瀑布山西侧', city: '临汾', kind: 'spot', lat: 36.137, lng: 110.442, dayIndex: 4, description: '黄河峡谷、水文和地质奇观。', navigationUrl: nav('山西黄河壶口瀑布旅游区') },
  { id: 'yunqiu-mountain', eventId: 'day-5-event-1', name: '云丘山景区', city: '临汾', kind: 'spot', lat: 35.728, lng: 111.02, dayIndex: 5, description: '冰洞、古村和山地自然资源。', navigationUrl: nav('云丘山景区') },
  { id: 'yuncheng-city', eventId: 'day-5-event-3', name: '运城市区', city: '运城', kind: 'route', lat: 35.026, lng: 111.007, dayIndex: 5, description: '晋南住宿与盐湖游览中转。', navigationUrl: nav('运城市盐湖区') },
  { id: 'guandi-temple', eventId: 'day-5-event-4', name: '解州关帝庙', city: '运城', kind: 'spot', lat: 34.909, lng: 110.867, dayIndex: 5, description: '关公文化与古建筑研学点。', navigationUrl: nav('解州关帝庙') },
  { id: 'salt-lake', eventId: 'day-5-event-5', name: '七彩盐湖', city: '运城', kind: 'spot', lat: 35.006, lng: 110.897, dayIndex: 5, description: '盐湖生态、色彩和盐业历史观察点。', navigationUrl: nav('运城七彩盐湖') },
  { id: 'guanque-tower', eventId: 'day-6-event-3', name: '鹳雀楼', city: '运城', kind: 'spot', lat: 34.837, lng: 110.306, dayIndex: 6, description: '黄河视野与诗词文化研学点。', navigationUrl: nav('鹳雀楼') },
  { id: 'pujindu', eventId: 'day-6-event-4', name: '蒲津渡遗址', city: '运城', kind: 'spot', lat: 34.842, lng: 110.297, dayIndex: 6, description: '黄河古渡与大铁牛工程遗址。', navigationUrl: nav('蒲津渡遗址') },
  { id: 'changzhi-airport-d6', eventId: 'day-6-event-5', name: '返程长治机场', city: '长治', kind: 'airport', lat: 36.247, lng: 113.126, dayIndex: 6, description: '还车候机与返程航班。', navigationUrl: nav('长治王村机场') },
];

export function getDestinationMapPoints(destination: string) {
  if (destination.includes('长治')) {
    return changzhiMapPoints;
  }

  return [];
}
