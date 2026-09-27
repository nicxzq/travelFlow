import type { JourneyOverlay } from '@/lib/domain/journey';
import type { TransportMode, TripEvent, TripWithDaysAndEvents } from '@/lib/domain/trip';

export const SOUTHWEST_LOOP_TRIP_ID = 'southwest-loop-2026';

const tripId = SOUTHWEST_LOOP_TRIP_ID;

// 国庆自驾大环线：长沙→贵州→云南→广西→长沙，全程自驾（transportMode 统一 drive）。
// 坐标为区域/城市级近似，非门店级；餐饮、住宿点锚定到所属城区或景区。
const places: Record<string, { lat: number; lng: number }> = {
  长沙: { lat: 28.2282, lng: 112.9388 },
  怀化: { lat: 27.5497, lng: 109.9785 },
  凯里: { lat: 26.5661, lng: 107.9832 },
  凯里顾府街: { lat: 26.573, lng: 108.003 },
  郎德上寨: { lat: 26.4721, lng: 108.0748 },
  安顺: { lat: 26.2455, lng: 105.9476 },
  安顺古城夜市: { lat: 26.2503, lng: 105.9401 },
  黄果树瀑布: { lat: 25.9881, lng: 105.6802 },
  曲靖: { lat: 25.49, lng: 103.7962 },
  曲靖西门街: { lat: 25.4917, lng: 103.7938 },
  昆明: { lat: 24.8801, lng: 102.8329 },
  翠湖公园: { lat: 25.0553, lng: 102.701 },
  昆明老街: { lat: 25.043, lng: 102.708 },
  斗南花市: { lat: 24.888, lng: 102.762 },
  石林风景区: { lat: 24.8135, lng: 103.3268 },
  篆新农贸市场: { lat: 25.033, lng: 102.69 },
  南强街夜市: { lat: 25.036, lng: 102.717 },
  百色: { lat: 23.9019, lng: 106.6186 },
  德天瀑布: { lat: 22.855, lng: 106.708 },
  明仕田园: { lat: 22.749, lng: 106.913 },
  靖西: { lat: 23.1345, lng: 106.4177 },
  旧州古镇: { lat: 23.05, lng: 106.38 },
  柳州: { lat: 24.3264, lng: 109.4155 },
  青云市场: { lat: 24.325, lng: 109.428 },
  胜利夜市: { lat: 24.331, lng: 109.412 },
  柳江夜景: { lat: 24.312, lng: 109.411 },
  阳朔: { lat: 24.7784, lng: 110.4972 },
  遇龙河: { lat: 24.752, lng: 110.42 },
  十里画廊: { lat: 24.762, lng: 110.46 },
  阳朔西街: { lat: 24.778, lng: 110.496 },
  兴坪古镇: { lat: 24.938, lng: 110.548 },
};

function nav(keyword: string) {
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(keyword)}`;
}

function event(
  dayId: string,
  index: number,
  startTime: string,
  endTime: string | undefined,
  title: string,
  category: TripEvent['category'],
  description: string,
  locationName: string,
  transportMode?: TransportMode,
): TripEvent {
  const dayIndex = dayId.replace('day-', '');

  return {
    id: `sw-d${dayIndex}-e${index}`,
    dayId,
    tripId,
    startTime,
    endTime,
    title,
    category,
    description,
    locationName,
    geo: places[locationName],
    navigationUrl: nav(locationName),
    status: 'planned',
    transportMode,
  };
}

export const southwestLoopTrip: TripWithDaysAndEvents = {
  id: tripId,
  userId: 'carlxu',
  planRevision: 1,
  title: '长沙 → 贵州 → 昆明 → 广西 → 长沙 · 国庆自驾环线',
  destination: '贵州凯里安顺 / 云南曲靖昆明石林 / 广西百色崇左靖西柳州阳朔',
  status: 'active',
  startDate: '2026-09-25',
  endDate: '2026-10-06',
  todos: [],
  days: [
    {
      id: 'day-1',
      tripId,
      dayIndex: 1,
      date: '2026-09-25',
      summary: '长沙出发，怀化午饭，下午转场凯里，晚上顾府街扫街。',
      events: [
        event('day-1', 1, '08:00', '12:00', '长沙自驾出发赴怀化', 'transport', '早上出发，约 4 小时到怀化。', '长沙', 'drive'),
        event('day-1', 2, '12:00', '13:00', '怀化午餐：芷江鸭 + 米粉', 'food', '在怀化吃芷江鸭配米粉。', '怀化'),
        event('day-1', 3, '13:00', '16:00', '自驾怀化前往凯里', 'transport', '下午 1 点出发，约 3 小时到凯里。', '凯里', 'drive'),
        event('day-1', 4, '16:00', '18:30', '抵达凯里入住', 'hotel', '入住凯里市区酒店，稍作休整。', '凯里'),
        event('day-1', 5, '19:00', undefined, '顾府街扫街：夺夺粉 / 裹卷 / 冰浆', 'food', '晚上逛顾府街，夺夺粉、裹卷、冰浆先吃一轮。', '凯里顾府街'),
      ],
    },
    {
      id: 'day-2',
      tripId,
      dayIndex: 2,
      date: '2026-09-26',
      summary: '上午郎德上寨看拦门酒芦笙舞，中午回凯里酸汤牛肉，下午转场安顺。',
      events: [
        event('day-2', 1, '09:30', '12:00', '郎德上寨：11 点拦门酒 + 芦笙舞', 'spot', '原生态苗寨，门票 50 元，看 11 点的拦门酒和芦笙舞表演。', '郎德上寨'),
        event('day-2', 2, '12:30', '13:30', '回凯里午餐：酸汤牛肉', 'food', '中午回凯里吃酸汤牛肉。', '凯里'),
        event('day-2', 3, '14:00', '17:30', '自驾凯里前往安顺', 'transport', '下午开车到安顺，约 3.5 小时。', '安顺', 'drive'),
        event('day-2', 4, '17:30', '19:00', '抵达安顺入住', 'hotel', '入住安顺市区酒店。', '安顺'),
        event('day-2', 5, '19:00', undefined, '安顺古城夜市小吃', 'food', '晚上在安顺老城继续扫街小吃（原计划顾府街属凯里，此处按安顺就近安排）。', '安顺古城夜市'),
      ],
    },
    {
      id: 'day-3',
      tripId,
      dayIndex: 3,
      date: '2026-09-27',
      summary: '早起黄果树瀑布（或安顺老城），午后转场曲靖，晚逛南门城西门街。',
      events: [
        event('day-3', 1, '07:30', '11:00', '黄果树瀑布（早起 2-3 小时逛完）', 'spot', '7:30 出发，2-3 小时逛完；不想早起可改安顺老城区闲逛。', '黄果树瀑布'),
        event('day-3', 2, '12:00', '13:00', '午餐', 'food', '午饭后出发。', '安顺'),
        event('day-3', 3, '13:00', '17:00', '自驾安顺前往曲靖', 'transport', '到曲靖约 3.5-4 小时。', '曲靖', 'drive'),
        event('day-3', 4, '17:00', '18:30', '抵达曲靖入住', 'hotel', '入住曲靖市区酒店。', '曲靖'),
        event('day-3', 5, '18:30', undefined, '南门城 + 西门街逛吃', 'food', '晚上逛吃，蒸饵丝和辣子鸡必尝。', '曲靖西门街'),
      ],
    },
    {
      id: 'day-4',
      tripId,
      dayIndex: 4,
      date: '2026-09-28',
      summary: '曲靖到昆明，慢逛翠湖老街或斗南花市，晚上野生菌火锅。',
      events: [
        event('day-4', 1, '09:00', '11:00', '自驾曲靖前往昆明', 'transport', '上午出发，约 2 小时到昆明。', '昆明', 'drive'),
        event('day-4', 2, '11:30', '13:00', '翠湖 + 昆明老街漫游', 'spot', '慢逛翠湖公园与昆明老街。', '翠湖公园'),
        event('day-4', 3, '13:00', '14:00', '午餐', 'food', '老街附近午餐。', '昆明老街'),
        event('day-4', 4, '15:00', '16:00', '斗南花市（可选）', 'spot', '下午可去斗南花市看花。', '斗南花市'),
        event('day-4', 5, '16:00', '18:30', '入住昆明', 'hotel', '入住昆明市区酒店。', '昆明'),
        event('day-4', 6, '19:00', undefined, '晚餐：野生菌火锅', 'food', '晚上吃野生菌火锅。', '昆明'),
      ],
    },
    {
      id: 'day-5',
      tripId,
      dayIndex: 5,
      date: '2026-09-29',
      summary: '往返石林，逛风景区、彝族羊汤锅，晚上篆新市场或南强街夜市。',
      events: [
        event('day-5', 1, '08:00', '09:30', '自驾昆明前往石林', 'transport', '早上出发，约 1.5 小时到石林。', '石林风景区', 'drive'),
        event('day-5', 2, '09:30', '12:30', '石林风景区', 'spot', '逛风景区 3-4 小时。', '石林风景区'),
        event('day-5', 3, '12:30', '13:30', '午餐：彝族羊汤锅', 'food', '中午吃彝族羊汤锅。', '石林风景区'),
        event('day-5', 4, '14:30', '16:30', '自驾返回昆明', 'transport', '下午回昆明。', '昆明', 'drive'),
        event('day-5', 5, '18:30', undefined, '篆新农贸市场 / 南强街夜市', 'food', '晚上逛吃篆新农贸市场或南强街夜市。', '篆新农贸市场'),
      ],
    },
    {
      id: 'day-6',
      tripId,
      dayIndex: 6,
      date: '2026-09-30',
      summary: '昆明参加婚礼，不排景点，轻松待着。',
      events: [
        event('day-6', 1, '10:00', undefined, '参加婚礼', 'custom', '婚礼日不安排景点，轻松待着。', '昆明'),
      ],
    },
    {
      id: 'day-7',
      tripId,
      dayIndex: 7,
      date: '2026-10-01',
      summary: '昆明到百色，晚上八方火焰鹅。',
      events: [
        event('day-7', 1, '08:00', '14:00', '自驾昆明前往百色', 'transport', '走广昆高速，隧道多弯道多注意限速；约 5-6 小时。', '百色', 'drive'),
        event('day-7', 2, '14:30', '17:00', '抵达百色休整', 'hotel', '下午到百色，长途后休整。', '百色'),
        event('day-7', 3, '18:30', '20:00', '晚餐：八方火焰鹅', 'food', '晚上吃八方火焰鹅。', '百色'),
        event('day-7', 4, '20:00', undefined, '入住百色', 'hotel', '入住百色市区酒店。', '百色'),
      ],
    },
    {
      id: 'day-8',
      tripId,
      dayIndex: 8,
      date: '2026-10-02',
      summary: '百色到崇左德天瀑布看瀑布，下午到明仕田园骑行住宿。',
      events: [
        event('day-8', 1, '08:00', '10:30', '自驾百色前往德天瀑布', 'transport', '上午前往崇左德天瀑布。', '德天瀑布', 'drive'),
        event('day-8', 2, '10:30', '13:30', '德天瀑布 + 观景台', 'spot', '看瀑布、走观景台，不坐竹筏。', '德天瀑布'),
        event('day-8', 3, '14:00', '15:30', '自驾前往明仕田园', 'transport', '下午到明仕田园。', '明仕田园', 'drive'),
        event('day-8', 4, '15:30', '18:30', '明仕田园电动车骑行', 'spot', '租电动车在峰林间骑行。', '明仕田园'),
        event('day-8', 5, '19:00', undefined, '入住明仕田园', 'hotel', '住明仕田园。', '明仕田园'),
      ],
    },
    {
      id: 'day-9',
      tripId,
      dayIndex: 9,
      date: '2026-10-03',
      summary: '明仕田园晨游，午后到靖西逛旧州古镇。',
      events: [
        event('day-9', 1, '09:00', '11:30', '明仕田园晨游', 'spot', '上午田园再转转。', '明仕田园'),
        event('day-9', 2, '12:00', '14:00', '自驾前往靖西', 'transport', '午饭后到靖西。', '靖西', 'drive'),
        event('day-9', 3, '14:00', '17:30', '旧州古镇', 'spot', '逛旧州古镇。', '旧州古镇'),
        event('day-9', 4, '18:30', undefined, '晚餐：八方火焰鹅 / 酸嘢', 'food', '晚上吃八方火焰鹅或酸嘢。', '靖西'),
      ],
    },
    {
      id: 'day-10',
      tripId,
      dayIndex: 10,
      date: '2026-10-04',
      summary: '靖西到柳州，全天嗦粉：青云市场、胜利夜市、柳江夜景。',
      events: [
        event('day-10', 1, '08:30', '13:00', '自驾靖西前往柳州', 'transport', '上午出发到柳州。', '柳州', 'drive'),
        event('day-10', 2, '13:00', '14:30', '青云市场嗦粉', 'food', '螺蛳粉找本地人多的店，不用排网红店。', '青云市场'),
        event('day-10', 3, '17:00', '19:00', '胜利夜市', 'food', '傍晚逛胜利夜市继续嗦粉。', '胜利夜市'),
        event('day-10', 4, '19:30', undefined, '柳江夜景', 'spot', '晚上看柳江夜景。', '柳江夜景'),
      ],
    },
    {
      id: 'day-11',
      tripId,
      dayIndex: 11,
      date: '2026-10-05',
      summary: '柳州到阳朔，遇龙河竹筏、十里画廊骑行，晚逛西街。',
      events: [
        event('day-11', 1, '09:00', '13:00', '自驾柳州前往阳朔', 'transport', '上午出发到阳朔。', '阳朔', 'drive'),
        event('day-11', 2, '14:00', '16:00', '遇龙河竹筏', 'spot', '人工撑筏，约 1-2 小时。国庆会排队，建议尽早去。', '遇龙河'),
        event('day-11', 3, '16:00', '18:00', '十里画廊骑电动车', 'spot', '骑电动车逛十里画廊。', '十里画廊'),
        event('day-11', 4, '19:00', undefined, '西街逛逛', 'custom', '晚上逛阳朔西街。', '阳朔西街'),
      ],
    },
    {
      id: 'day-12',
      tripId,
      dayIndex: 12,
      date: '2026-10-06',
      summary: '兴坪古镇打卡，午后返程长沙，傍晚到家。',
      events: [
        event('day-12', 1, '07:00', '10:30', '兴坪古镇：20 元背景照打卡', 'spot', '早起去兴坪古镇打卡 20 元人民币背景照。', '兴坪古镇'),
        event('day-12', 2, '11:00', '12:30', '午餐', 'food', '返程前午饭。', '阳朔'),
        event('day-12', 3, '13:00', '19:00', '自驾阳朔返回长沙', 'transport', '返程高峰，别晚于 13 点出发；全程约 6 小时，傍晚到长沙。', '长沙', 'drive'),
      ],
    },
  ],
};

export const southwestLoopOverlay: JourneyOverlay = Object.fromEntries(
  southwestLoopTrip.days.flatMap((day) =>
    day.events
      .filter((evt) => evt.category === 'spot' || evt.category === 'food')
      .map((evt) => [evt.id, { tags: [evt.locationName ?? evt.title] }]),
  ),
);
