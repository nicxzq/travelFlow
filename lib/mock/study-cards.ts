import type { TripEvent } from '@/lib/domain/trip';

export type StudyTaskType = 'observe' | 'quiz' | 'reflection';

export type StudyCard = {
  id: string;
  eventIds: string[];
  eventTitle: string;
  theme: string;
  roleName: string;
  estimatedMinutes: number;
  badgeName: string;
  story: string;
  imageUrl: string;
  imageAlt: string;
  accent: string;
  links: Array<{ label: string; url: string }>;
  quickSearches: Array<{ label: string; query: string }>;
  tasks: Array<{
    id: string;
    type: StudyTaskType;
    prompt: string;
    referenceAnswer: string;
  }>;
};

function searchUrl(query: string) {
  return `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`;
}

function mapUrl(query: string) {
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}`;
}

const studyCards: StudyCard[] = [
  {
    id: 'study-huangyadong',
    eventIds: ['r3-d2-e2'],
    eventTitle: '黄崖洞景区深度游',
    theme: '太行山里的兵工厂',
    roleName: '太行山地形侦察员',
    estimatedMinutes: 25,
    badgeName: '太行山地形徽章',
    story: '黄崖洞位于太行山深处，峡谷、山体和道路让这里成为重要的隐蔽地点。八路军曾在这里建设兵工厂，可以把地形、安全、运输和历史联系起来观察。',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '太行山峡谷地貌',
    accent: 'from-slate-950/75 via-emerald-950/55 to-cyan-950/40',
    links: [
      { label: '兵工厂旧址资料', url: 'https://www.sastind.gov.cn/n10086200/n10086361/n10696722/n10696765/c10699720/content.html' },
      { label: '地图导航', url: mapUrl('黄崖洞景区') },
    ],
    quickSearches: [
      { label: '黄崖洞兵工厂', query: '黄崖洞兵工厂 研学' },
      { label: '黄崖洞保卫战', query: '黄崖洞保卫战 儿童讲解' },
    ],
    tasks: [
      {
        id: 'huangyadong-observe-terrain',
        type: 'observe',
        prompt: '找到一处能说明“易守难攻”的地形，说出你看到的证据。',
        referenceAnswer: '可以观察狭窄峡谷、陡峭山壁、转弯或高处视野，再说明这些地形如何帮助隐蔽和防守。请以现场实际地形和展签为准，答案不唯一。',
      },
      {
        id: 'huangyadong-quiz-factory',
        type: 'quiz',
        prompt: '兵工厂为什么会建在太行山深处？',
        referenceAnswer: '山地便于隐蔽和防守，附近的峡谷道路也能控制进出，但运输和生产会更困难。请结合旧址说明和自己的现场观察回答。',
      },
      {
        id: 'huangyadong-reflection-experience',
        type: 'reflection',
        prompt: '从索道、装甲车或军事体验中选一项，说说它怎样帮助你理解这里的历史。',
        referenceAnswer: '先记录真实体验，再把速度、路线、装备或操作难度与当时的交通和防守联系起来。每个人的感受可以不同。',
      },
    ],
  },
  {
    id: 'study-pingyao-commerce',
    eventIds: ['r3-d3-e2'],
    eventTitle: '平遥古城街区漫游',
    theme: '平遥晋商 · 票号与古城布局',
    roleName: '晋商街区观察员',
    estimatedMinutes: 25,
    badgeName: '晋商信用徽章',
    story: '平遥的街巷、院落和商铺共同保存了晋商活动的空间。即使不进入收费展馆，也能从北大街、东西大街、南大街和票号外观，观察商业如何在古城里运行。',
    imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '传统古城街巷',
    accent: 'from-stone-950/75 via-amber-950/55 to-slate-900/40',
    links: [
      { label: '平遥古城官网', url: 'https://pingyao888.cn/' },
      { label: '地图导航', url: mapUrl('平遥古城南大街') },
    ],
    quickSearches: [
      { label: '平遥票号', query: '平遥古城 票号 晋商 信用' },
      { label: '古城街巷布局', query: '平遥古城 街巷布局 儿童讲解' },
    ],
    tasks: [
      {
        id: 'pingyao-commerce-observe-street',
        type: 'observe',
        prompt: '在主街找一处老商铺或票号外观，记录招牌、门面和所在街道。',
        referenceAnswer: '可以记录匾额文字、门窗、柜台痕迹或与周边街巷的关系。不要根据外观断定具体年代，名称和历史请以现场展签为准。',
      },
      {
        id: 'pingyao-commerce-quiz-location',
        type: 'quiz',
        prompt: '票号和商铺为什么喜欢集中在交通方便的主街？',
        referenceAnswer: '主街通常人流更多、辨认和运送更方便，也便于不同商号交换信息。请先指出现场人流或道路证据，再提出解释，答案不唯一。',
      },
      {
        id: 'pingyao-commerce-reflection-credit',
        type: 'reflection',
        prompt: '如果银子不随身搬运，商人怎样让远方的人相信一张汇票？',
        referenceAnswer: '可以从商号信誉、账本核对、印记、密押和分号网络思考。具体票号做法请查阅可靠资料，不必只有一种答案。',
      },
    ],
  },
  {
    id: 'study-dahuaishu',
    eventIds: ['r3-d4-e2'],
    eventTitle: '洪洞大槐树门口寻根学习',
    theme: '明代移民与家族迁徙',
    roleName: '家族迁徙记录员',
    estimatedMinutes: 20,
    badgeName: '寻根迁徙徽章',
    story: '洪洞大槐树承载着明代移民和后人寻根的集体记忆。这次没有入园，可以从门口文字、对联和“解手”典故出发，分清历史资料、民间传说与家族记忆。',
    imageUrl: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '枝叶繁茂的古树',
    accent: 'from-emerald-950/75 via-lime-950/45 to-amber-950/35',
    links: [
      { label: '大槐树资料搜索', url: searchUrl('洪洞大槐树 明代移民 解手 典故') },
      { label: '地图导航', url: mapUrl('洪洞大槐树寻根祭祖园') },
    ],
    quickSearches: [
      { label: '明代大移民', query: '洪洞大槐树 明代移民 历史' },
      { label: '地名与迁徙', query: '家族迁徙 地名 分布 寻根' },
    ],
    tasks: [
      {
        id: 'dahuaishu-observe-inscription',
        type: 'observe',
        prompt: '记录门口一副对联或一处与“根”有关的文字，并说说它想表达什么。',
        referenceAnswer: '先准确抄写现场文字，再从故乡、祖先、迁徙或团聚等方向解释。具体含义请结合现场说明，个人感受没有唯一答案。',
      },
      {
        id: 'dahuaishu-quiz-release-hands',
        type: 'quiz',
        prompt: '“解手”典故怎样讲述移民途中被管理的经历？',
        referenceAnswer: '常见说法与移民途中被捆绑、需要请求解开双手有关，但它属于流传广泛的民间解释。应把现场讲述与史料证据分开，并以权威展陈为准。',
      },
      {
        id: 'dahuaishu-reflection-family-route',
        type: 'reflection',
        prompt: '画一条你知道的家庭迁徙或居住路线，并标出一个地名。',
        referenceAnswer: '可以从长辈知道的出生地、居住地或搬家经历中选择一段；不知道完整路线也可以写下要向谁询问。每个家庭的答案都不同。',
      },
    ],
  },
  {
    id: 'study-guangsheng',
    eventIds: ['r3-d4-e3'],
    eventTitle: '广胜寺深度参观',
    theme: '飞虹塔琉璃与壁画的去向',
    roleName: '古建壁画调查员',
    estimatedMinutes: 30,
    badgeName: '飞虹壁画徽章',
    story: '广胜寺把多彩琉璃塔、元代建筑和珍贵壁画放在同一条观察线上。下寺部分壁画曾流失海外，水神庙壁画则留下戏曲、祈雨和生活图像，可以思考文物为什么需要原址保护。',
    imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '传统塔楼与琉璃建筑',
    accent: 'from-cyan-950/70 via-amber-950/55 to-red-950/45',
    links: [
      { label: '广胜寺资料搜索', url: searchUrl('广胜寺 飞虹塔 水神庙 壁画') },
      { label: '地图导航', url: mapUrl('洪洞广胜寺') },
    ],
    quickSearches: [
      { label: '飞虹塔琉璃', query: '广胜寺 飞虹塔 琉璃 工艺' },
      { label: '药师经变壁画', query: '广胜寺 药师经变 壁画 美国大都会博物馆' },
    ],
    tasks: [
      {
        id: 'guangsheng-observe-glaze',
        type: 'observe',
        prompt: '观察飞虹塔至少三种颜色或装饰形象，记录它们在塔身的位置。',
        referenceAnswer: '可以记录黄、绿、蓝等琉璃色彩以及人物、动物或建筑构件，但不同光线下颜色会变化。名称、年代与层数请以现场展签为准。',
      },
      {
        id: 'guangsheng-quiz-mural-loss',
        type: 'quiz',
        prompt: '壁画离开原来的墙面后，我们会失去哪些信息？',
        referenceAnswer: '可能失去它与建筑位置、相邻画面、礼仪路线和当地历史的联系；博物馆能保护和展示实物，但难以完整还原原境。可结合下寺空白墙面提出自己的判断。',
      },
      {
        id: 'guangsheng-reflection-rain',
        type: 'reflection',
        prompt: '从水神庙找一处祈雨、降雨或生活场景，说说它记录了什么。',
        referenceAnswer: '先描述人物、动作和环境，再推测古人对水、农业或仪式的理解。画面名称和历史解释应以讲解与展签为准，答案不唯一。',
      },
    ],
  },
  {
    id: 'study-yunqiu',
    eventIds: ['r3-d5-e3'],
    eventTitle: '云丘山冰洞群',
    theme: '冰洞和古村的自然密码',
    roleName: '山地自然观察员',
    estimatedMinutes: 25,
    badgeName: '冰洞古村徽章',
    story: '云丘山冰洞群适合观察温度、岩洞和季节之间的关系。穿棉袄进入洞内时，重点比较洞内外的温度、湿度和光线，也留意游览设施如何保护人和洞穴。',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '冰雪洞穴感的自然景观',
    accent: 'from-sky-950/75 via-indigo-950/45 to-slate-950/35',
    links: [
      { label: '云丘山线路', url: 'https://www.yunqiushan.cn/zhphone/djyqs/xcglxq.shtml?id=6' },
      { label: '地图导航', url: mapUrl('云丘山冰洞群') },
    ],
    quickSearches: [
      { label: '云丘山冰洞', query: '云丘山 冰洞群 形成 原因' },
      { label: '洞穴保护', query: '冰洞 洞穴 旅游 保护 科普' },
    ],
    tasks: [
      {
        id: 'yunqiu-observe-cave',
        type: 'observe',
        prompt: '比较洞内外温度、湿度和光线，记录一个最明显的差别。',
        referenceAnswer: '可以从冷暖、湿润感或亮度中选一项比较。不同季节、位置和个人感受会有差异，请记录实际体验。',
      },
      {
        id: 'yunqiu-quiz-cold-cave',
        type: 'quiz',
        prompt: '为什么有些洞穴夏天也能保持低温？',
        referenceAnswer: '洞内较少受到阳光直接加热，岩层传热慢，空气交换也与洞外不同。云丘山冰洞的具体成因请以景区地质说明为准。',
      },
      {
        id: 'yunqiu-reflection-protection',
        type: 'reflection',
        prompt: '找一处保护游客或保护洞穴的设施，说说它解决了什么问题。',
        referenceAnswer: '可以观察棉衣、步道、照明、护栏或限流安排，从安全、保温和减少触碰等角度解释。现场证据不同，答案不唯一。',
      },
    ],
  },
  {
    id: 'study-chenghuangmiao',
    eventIds: ['r3-d6-e2'],
    eventTitle: '长治城隍庙',
    theme: '地契信用与民俗工艺',
    roleName: '古代契约调查员',
    estimatedMinutes: 25,
    badgeName: '契约工艺徽章',
    story: '长治城隍庙的展览把地契文书、刺绣、木版画和琉璃放在一起。可以用识图 AI 辅助辨认，但结论要回到原件、展签和可靠资料，观察古人怎样记录土地交易与承诺。',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '纸张、文字与传统印章',
    accent: 'from-red-950/70 via-orange-950/45 to-slate-950/40',
    links: [
      { label: '城隍庙资料搜索', url: searchUrl('长治城隍庙 地契 刺绣 木版画') },
      { label: '地图导航', url: mapUrl('长治城隍庙') },
    ],
    quickSearches: [
      { label: '古代地契', query: '中国古代 地契 文书 契约 信用' },
      { label: '长治民俗工艺', query: '长治 刺绣 木版画 琉璃 民俗' },
    ],
    tasks: [
      {
        id: 'chenghuangmiao-observe-deed',
        type: 'observe',
        prompt: '找一份地契，记录日期、人物、地名、金额或印记中的两类信息。',
        referenceAnswer: '只记录自己能辨认或展签明确说明的内容；旧字不确定时可以拍图辅助，但要用展签核对，不能把 AI 识别当成唯一答案。',
      },
      {
        id: 'chenghuangmiao-quiz-contract',
        type: 'quiz',
        prompt: '一份土地交易文书为什么要写清人物、边界并留下凭证？',
        referenceAnswer: '写清交易双方、土地位置、价款和见证信息，有助于确认约定、减少争议并让后人查证。不同年代格式会变化，请以展出的地契为准。',
      },
      {
        id: 'chenghuangmiao-reflection-craft',
        type: 'reflection',
        prompt: '从刺绣、木版画或琉璃中选一件，写下你认为最难完成的一步。',
        referenceAnswer: '可以从设计、选材、刻版、配色、烧制或针法等角度推测，再用作品细节说明理由。工艺流程请以现场介绍为准，个人判断没有唯一答案。',
      },
    ],
  },
];

export function getStudyCardForEvent(event: TripEvent) {
  if (event.category !== 'spot' && event.category !== 'custom') return undefined;
  return studyCards.find(
    (card) =>
      card.eventIds.includes(event.id) ||
      event.title.includes(card.eventTitle) ||
      card.eventTitle.includes(event.title) ||
      (event.locationName ? card.eventTitle.includes(event.locationName) || event.locationName.includes(card.eventTitle) : false),
  );
}
