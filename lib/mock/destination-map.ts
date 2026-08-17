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
  { id: 'pingyao-arrival', eventId: 'day-2-event-13', name: '平遥古城游客中心', city: '晋中', kind: 'route', lat: 37.198, lng: 112.19, dayIndex: 2, description: '午餐、停车与客栈接驳确认点。', navigationUrl: nav('平遥古城游客中心') },
  { id: 'pingyao-stay', eventId: 'day-2-event-14', name: '平遥古城客栈', city: '晋中', kind: 'hotel', lat: 37.202, lng: 112.176, dayIndex: 2, description: '抵达后放行李、午休和次日寄存行李。', navigationUrl: nav('平遥古城客栈') },
  { id: 'pingyao-wall', eventId: 'day-2-event-15', name: '平遥古城墙', city: '晋中', kind: 'spot', lat: 37.2109, lng: 112.1838, dayIndex: 2, description: '从城防结构和高处视野理解古城布局。', navigationUrl: nav('平遥古城墙') },
  { id: 'pingyao-south-street', eventId: 'day-2-event-16', name: '平遥古城南大街', city: '晋中', kind: 'food', lat: 37.201, lng: 112.178, dayIndex: 2, description: '轻量散步、晚餐与明清街巷观察。', navigationUrl: nav('平遥古城南大街') },
  { id: 'pingyao-yamen', eventId: 'day-3-event-12', name: '平遥县衙', city: '晋中', kind: 'spot', lat: 37.201, lng: 112.172, dayIndex: 3, description: '古代县级治理空间和公堂陈设研学点。', navigationUrl: nav('平遥县衙') },
  { id: 'rishengchang', eventId: 'day-3-event-15', name: '日昇昌票号', city: '晋中', kind: 'spot', lat: 37.2047, lng: 112.1775, dayIndex: 3, description: '汇票、账本、密押和晋商信用研学点。', navigationUrl: nav('日昇昌票号旧址') },
  { id: 'china-escort-agency', eventId: 'day-3-event-16', name: '中国镖局博物馆', city: '晋中', kind: 'spot', lat: 37.2015, lng: 112.1783, dayIndex: 3, description: '理解实物运输、安全保障与票号协作。', navigationUrl: nav('中国镖局博物馆') },
  { id: 'linfen-stay', eventId: 'day-3-event-19', name: '临汾市区住宿', city: '临汾', kind: 'hotel', lat: 36.088, lng: 111.519, dayIndex: 3, description: '保证次日清晨从临汾前往壶口。', navigationUrl: nav('临汾市区酒店') },
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
