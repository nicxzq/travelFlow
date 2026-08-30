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
  { id: 'changzhi-airport-d1', eventId: 'r3-d1-e2', name: '长治王村机场', city: '长治', kind: 'airport', lat: 36.247, lng: 113.126, dayIndex: 1, description: '去程航班抵达长治，之后取车前往黄崖洞。', navigationUrl: nav('长治王村机场') },
  { id: 'huangyadong', eventId: 'r3-d2-e2', name: '黄崖洞景区', city: '长治', kind: 'spot', lat: 36.879, lng: 113.387, dayIndex: 2, description: '深度游太行峡谷、兵工厂旧址和冰工厂遗址。', navigationUrl: nav('黄崖洞景区') },
  { id: 'pingyao-arrival', eventId: 'r3-d2-e4', name: '平遥古城客栈', city: '晋中', kind: 'hotel', lat: 37.202, lng: 112.176, dayIndex: 2, description: '傍晚抵达并入住古城院落客栈。', navigationUrl: nav('平遥古城客栈') },
  { id: 'pingyao-streets', eventId: 'r3-d3-e2', name: '平遥古城南大街', city: '晋中', kind: 'spot', lat: 37.201, lng: 112.178, dayIndex: 3, description: '从北大街到南大街漫游，路过票号核心区。', navigationUrl: nav('平遥古城南大街') },
  { id: 'tianyuan-kui', eventId: 'r3-d3-e3', name: '天元魁总店', city: '晋中', kind: 'food', lat: 37.201, lng: 112.176, dayIndex: 3, description: '午餐并体验山西陈醋品鉴和文化讲解。', navigationUrl: nav('平遥天元魁饭店总店') },
  { id: 'hongtong-stay', eventId: 'r3-d3-e6', name: '洪洞大槐树旁住宿', city: '临汾', kind: 'hotel', lat: 36.262, lng: 111.667, dayIndex: 3, description: '入住大槐树景区旁连锁酒店。', navigationUrl: nav('洪洞大槐树景区附近酒店') },
  { id: 'dahuaishu', eventId: 'r3-d4-e2', name: '洪洞大槐树寻根祭祖园', city: '临汾', kind: 'spot', lat: 36.264, lng: 111.664, dayIndex: 4, description: '公祭日未入园，在门口拍摄并了解移民典故。', navigationUrl: nav('洪洞大槐树寻根祭祖园') },
  { id: 'guangsheng-temple', eventId: 'r3-d4-e3', name: '广胜寺', city: '临汾', kind: 'spot', lat: 36.30293, lng: 111.80879, dayIndex: 4, description: '参观飞虹塔、上下寺和水神庙壁画。', navigationUrl: nav('洪洞广胜寺') },
  { id: 'yunqiu-stay', eventId: 'r3-d4-e6', name: '康家坪窑洞大院', city: '临汾', kind: 'hotel', lat: 35.728, lng: 111.02, dayIndex: 4, description: '入住依山而建的窑洞大院。', navigationUrl: nav('云丘山康家坪窑洞大院') },
  { id: 'yunqiu-mountain', eventId: 'r3-d5-e2', name: '云丘山景区', city: '临汾', kind: 'spot', lat: 35.728, lng: 111.02, dayIndex: 5, description: '体验财神道民俗互动与塔尔坡古村。', navigationUrl: nav('云丘山景区') },
  { id: 'yunqiu-ice-cave', eventId: 'r3-d5-e3', name: '云丘山冰洞群', city: '临汾', kind: 'spot', lat: 35.726, lng: 111.02, dayIndex: 5, description: '穿棉袄进入冰洞，观察洞内外环境差异。', navigationUrl: nav('云丘山冰洞群') },
  { id: 'changzhi-chenghuangmiao', eventId: 'r3-d6-e2', name: '长治城隍庙', city: '长治', kind: 'spot', lat: 36.18333, lng: 113.10972, dayIndex: 6, description: '参观地契文书、刺绣、木版画和琉璃展。', navigationUrl: nav('长治城隍庙') },
  { id: 'changzhi-airport-d6', eventId: 'r3-d6-e3', name: '返程长治机场', city: '长治', kind: 'airport', lat: 36.247, lng: 113.126, dayIndex: 6, description: '加油还车并等待返程航班。', navigationUrl: nav('长治王村机场') },
];

export function getDestinationMapPoints(destination: string) {
  if (destination.includes('长治')) {
    return changzhiMapPoints;
  }

  return [];
}
