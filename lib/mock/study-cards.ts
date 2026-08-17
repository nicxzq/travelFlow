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
  links: Array<{
    label: string;
    url: string;
  }>;
  quickSearches: Array<{
    label: string;
    query: string;
  }>;
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
    eventIds: ['day-1-event-5'],
    eventTitle: '黄崖洞景区',
    theme: '太行山里的兵工厂',
    roleName: '太行山地形侦察员',
    estimatedMinutes: 25,
    badgeName: '太行山地形徽章',
    story: '黄崖洞位于太行山深处，峡谷、山体和道路让这里成为重要的隐蔽地点。八路军曾在这里建设兵工厂，孩子可以把地形、安全、运输和历史联系起来观察。',
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
        prompt: '找到一处能说明“易守难攻”的地形，并说出原因。',
        referenceAnswer: '可以观察入口较窄、两侧崖壁陡立或视野较高的位置：窄口不利于大量人员同时进入，陡坡不易攀爬，高处也更方便观察。请以现场实际看到的地形为准。',
      },
      {
        id: 'huangyadong-observe-canyon',
        type: 'observe',
        prompt: '记录峡谷里的温度、风、水声或岩壁特点。',
        referenceAnswer: '可以记录最明显的一项，例如阴凉感、风沿峡谷吹动、水流声，或岩壁上的风化纹路、水渍和青苔。不同天气下的观察可能不同。',
      },
      {
        id: 'huangyadong-quiz-location',
        type: 'quiz',
        prompt: '为什么兵工厂不建在平原城市？',
        referenceAnswer: '平原城市目标明显，较容易被发现和攻击；山区地形复杂，更便于隐蔽、防守和保护人员物资，但运输也会更困难。',
      },
      {
        id: 'huangyadong-reflection-history',
        type: 'reflection',
        prompt: '用 3 句话讲清“地形如何影响历史”。',
        referenceAnswer: '可以这样组织：太行山地形险要，适合隐蔽和防守；人们利用地形建设兵工厂；自然条件因此影响了人员、物资和历史事件的发展。请用自己的话表达。',
      },
    ],
  },
  {
    id: 'study-pingyao-wall',
    eventIds: ['day-2-event-15'],
    eventTitle: '平遥古城墙',
    theme: '一座古城怎样保护自己',
    roleName: '古城防御观察员',
    estimatedMinutes: 20,
    badgeName: '古城防御徽章',
    story: '城墙不只是高高的一圈砖墙。城门、城楼、垛口和向外突出的墙体共同承担观察、通行和防御任务。今天先用眼睛寻找证据，再画出你理解的防守路线。',
    imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '古城墙与城楼',
    accent: 'from-stone-950/75 via-amber-950/55 to-slate-900/40',
    links: [
      { label: '景区官网', url: 'https://pingyao888.cn/' },
      { label: '地图导航', url: mapUrl('平遥古城墙') },
    ],
    quickSearches: [
      { label: '平遥城墙结构', query: '平遥古城墙 城门 垛口 马面 小学生' },
      { label: '古城布局', query: '平遥古城 街巷布局 儿童讲解' },
    ],
    tasks: [
      {
        id: 'pingyao-wall-observe-defense',
        type: 'observe',
        prompt: '找到一处你认为能帮助守城人观察或阻挡来者的结构，写下它的样子和作用。',
        referenceAnswer: '可以观察城门、城楼、垛口或向城墙外突出的结构，并根据视野、通道宽度或遮挡方式推测作用。具体名称和用途请以现场说明牌为准，答案不唯一。',
      },
      {
        id: 'pingyao-wall-quiz-height',
        type: 'quiz',
        prompt: '站在安全位置比较城内和城外的视野：城墙为什么要建得高？',
        referenceAnswer: '较高的位置通常看得更远，更容易提前发现城外动静，也增加了攀爬进入的难度。请把你的解释和现场实际看到的视野联系起来。',
      },
      {
        id: 'pingyao-wall-reflection-route',
        type: 'reflection',
        prompt: '画一条从城门进入主街的简单路线，并圈出一个你认为需要重点防守的位置。',
        referenceAnswer: '可以圈城门、转弯、狭窄通道或通往主街的位置，并说明理由。路线和重点位置取决于你的现场观察，没有唯一画法。',
      },
    ],
  },
  {
    id: 'study-pingyao-yamen',
    eventIds: ['day-3-event-12'],
    eventTitle: '平遥县衙',
    theme: '古代县城怎样治理',
    roleName: '古城治理观察员',
    estimatedMinutes: 20,
    badgeName: '县城治理徽章',
    story: '县衙既是古代地方官员办公的地方，也通过建筑次序、匾额和陈设表达规则。今天不背官职名称，而是从空间和物件推测这里怎样处理一座县城的事务。',
    imageUrl: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '传统院落与中轴建筑',
    accent: 'from-red-950/75 via-amber-950/50 to-slate-950/40',
    links: [
      { label: '景区官网', url: 'https://pingyao888.cn/' },
      { label: '地图导航', url: mapUrl('平遥县衙') },
    ],
    quickSearches: [
      { label: '平遥县衙布局', query: '平遥县衙 建筑布局 小学生' },
      { label: '古代县衙职责', query: '古代县衙 做什么 儿童科普' },
    ],
    tasks: [
      {
        id: 'pingyao-yamen-observe-inscription',
        type: 'observe',
        prompt: '抄下一块现场匾额或楹联里的关键词，再用自己的话猜它想提醒官员什么。',
        referenceAnswer: '先准确记录你现场看到的字，再从公正、责任、规则或为民办事等方向解释。不同匾额表达不同，请以现场文字和说明牌为准。',
      },
      {
        id: 'pingyao-yamen-quiz-object',
        type: 'quiz',
        prompt: '找一件与公堂或办公有关的物件，根据外形和摆放位置推测它的用途。',
        referenceAnswer: '可以选择桌案、印章、文书、告示或其他现场物件，从谁会使用、放在哪里、解决什么事务三个角度推测。答案不唯一，最后用展签核验。',
      },
      {
        id: 'pingyao-yamen-reflection-today',
        type: 'reflection',
        prompt: '比较县衙和今天的政府服务场所：说出一个相同点和一个不同点。',
        referenceAnswer: '相同点可以是都处理公共事务、保存记录或有分工；不同点可以从建筑、办事方式、法律程序或服务对象比较。请说出自己的依据。',
      },
    ],
  },
  {
    id: 'study-pingyao-finance',
    eventIds: ['day-3-event-15'],
    eventTitle: '日昇昌票号',
    theme: '银子不搬家，信用怎样走天下',
    roleName: '晋商信用小掌柜',
    estimatedMinutes: 25,
    badgeName: '晋商信用徽章',
    story: '远距离运送银两既沉重又危险。票号尝试用汇票、账本和密押传递可信的信息，镖局则保护必须移动的人和货物。把两个地方连起来观察，就能看见金融与物流怎样合作。',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '账本、纸张和计算工具',
    accent: 'from-emerald-950/75 via-teal-950/50 to-amber-950/40',
    links: [
      { label: '日昇昌资料', url: 'https://www.cchfound.com/product/2920.html' },
      { label: '地图导航', url: mapUrl('日昇昌票号旧址') },
    ],
    quickSearches: [
      { label: '票号和汇票', query: '日昇昌 票号 汇票 密押 小学生' },
      { label: '票号与镖局', query: '晋商 票号 镖局 关系' },
    ],
    tasks: [
      {
        id: 'pingyao-finance-observe-draft',
        type: 'observe',
        prompt: '找一件汇票、账本或密押相关展品，记录它如何帮助异地交易。',
        referenceAnswer: '可以观察金额、印记、文字、编号或密押等线索，推测它怎样证明交易信息可信。具体防伪和汇兑方式请以现场展陈为准，不必照抄整段说明。',
      },
      {
        id: 'pingyao-finance-quiz-zones',
        type: 'quiz',
        prompt: '观察柜台或院落分区：为什么钱、账本和办事的人可能需要分开管理？',
        referenceAnswer: '分区可能方便核对、保密、减少差错并控制谁能接触钱和账。请先指出你看到的空间证据，再提出解释；答案不唯一。',
      },
      {
        id: 'pingyao-finance-reflection-escort',
        type: 'reflection',
        prompt: '比较票号和镖局：它们分别保护什么，又怎样合作？',
        referenceAnswer: '票号主要用信用、记录和凭证支持异地汇兑，镖局主要保护需要实际移动的人与货物。两者都在降低远距离交易风险，但具体业务关系请结合两处现场资料判断。',
      },
    ],
  },
  {
    id: 'study-hukou',
    eventIds: ['day-4-event-3'],
    eventTitle: '壶口瀑布山西侧',
    theme: '黄河为什么在这里变窄',
    roleName: '黄河水文观察员',
    estimatedMinutes: 20,
    badgeName: '黄河水文徽章',
    story: '壶口瀑布的震撼来自水量、河道宽度和地形变化。今天重点观察水流、声音、水雾和岩石形态，理解“壶口”这个名字。',
    imageUrl: 'https://images.unsplash.com/photo-1503424886307-b090341d25d1?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '瀑布水流',
    accent: 'from-blue-950/75 via-cyan-950/55 to-slate-950/40',
    links: [
      { label: '景区官网', url: 'https://www.hhhkpb.com/' },
      { label: '地图导航', url: mapUrl('山西黄河壶口瀑布旅游区') },
    ],
    quickSearches: [
      { label: '壶口瀑布地貌', query: '壶口瀑布 地貌 黄河 为什么变窄' },
      { label: '黄河水文', query: '黄河 水文 小学生 科普' },
    ],
    tasks: [
      {
        id: 'hukou-observe-waterfall',
        type: 'observe',
        prompt: '观察瀑布水流颜色、水雾和声音的变化。',
        referenceAnswer: '可以比较远近位置看到的颜色、水雾和听到的声音。黄河水常因泥沙呈黄褐色，靠近主要落差处通常水雾更明显、声音更响，但请以当天水量和安全观景位置为准。',
      },
      {
        id: 'hukou-quiz-narrow',
        type: 'quiz',
        prompt: '河道变窄时，水流速度为什么会变快？',
        referenceAnswer: '同样多的水要通过更窄的河道时，水流会更加集中，通常速度也会加快。壶口河床骤然收窄和落差共同形成了壮观水势。',
      },
      {
        id: 'hukou-reflection-metaphor',
        type: 'reflection',
        prompt: '用一个比喻描述你看到的黄河。',
        referenceAnswer: '例如把奔涌水流比作“万马奔腾”，把水雾比作“一层白纱”。没有标准答案，请选择最符合你现场感受的比喻。',
      },
    ],
  },
  {
    id: 'study-yunqiu',
    eventIds: ['day-5-event-1'],
    eventTitle: '云丘山深度游',
    theme: '冰洞和古村的自然密码',
    roleName: '山地自然观察员',
    estimatedMinutes: 25,
    badgeName: '冰洞古村徽章',
    story: '云丘山有山地自然资源和古村文化，冰洞群尤其适合观察温度、岩洞和季节之间的关系。今天重点比较“洞内”和“洞外”。',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '冰雪洞穴感的自然景观',
    accent: 'from-sky-950/75 via-indigo-950/45 to-slate-950/35',
    links: [
      { label: '云丘山线路', url: 'https://www.yunqiushan.cn/zhphone/djyqs/xcglxq.shtml?id=6' },
      { label: '地图导航', url: mapUrl('云丘山景区') },
    ],
    quickSearches: [
      { label: '云丘山冰洞', query: '云丘山 冰洞群 形成 原因' },
      { label: '古村保护', query: '古村落 保护 研学 小学生' },
    ],
    tasks: [
      {
        id: 'yunqiu-observe-cave',
        type: 'observe',
        prompt: '比较洞内外温度、湿度和光线，记录一个明显差别。',
        referenceAnswer: '可以从温度、湿润感或亮度中选一项比较，例如洞内更冷、更暗。不同季节和位置会有差异，请记录实际感受。',
      },
      {
        id: 'yunqiu-quiz-cold-cave',
        type: 'quiz',
        prompt: '为什么有些洞穴夏天也会很冷？',
        referenceAnswer: '洞穴内部较少受到阳光直接加热，岩层传热慢，空气交换方式也与洞外不同，因此有些洞穴能长期保持较低温度。具体冰洞的形成还与洞体结构和当地气候有关。',
      },
      {
        id: 'yunqiu-reflection-village',
        type: 'reflection',
        prompt: '说出自然景观和村落生活之间的一个联系。',
        referenceAnswer: '可以观察村落是否利用当地石材建房、顺着山势布局，或自然条件怎样影响取水、种植和出行。选择现场能找到证据的一点来写。',
      },
    ],
  },
  {
    id: 'study-guandi',
    eventIds: ['day-5-event-4'],
    eventTitle: '解州关帝庙',
    theme: '忠义文化和古建筑',
    roleName: '古建礼制观察员',
    estimatedMinutes: 25,
    badgeName: '关公文化徽章',
    story: '解州关帝庙和关公信俗有关，也是一处古建筑观察现场。孩子可以看中轴线、匾额、屋顶和院落，理解建筑如何表达文化秩序。',
    imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '传统中式建筑屋顶',
    accent: 'from-red-950/70 via-amber-950/45 to-slate-950/35',
    links: [
      { label: '关帝庙资料', url: 'https://history.sxu.edu.cn/kxyj/kydt/19b4316256794f3bb51700e37109d64b.htm' },
      { label: '地图导航', url: mapUrl('解州关帝庙') },
    ],
    quickSearches: [
      { label: '关庙之祖', query: '解州关帝庙 关庙之祖' },
      { label: '古建筑中轴线', query: '中国古建筑 中轴线 小学生' },
    ],
    tasks: [
      {
        id: 'guandi-observe-decoration',
        type: 'observe',
        prompt: '找一块匾额或一处屋顶装饰，说出它给你的感觉。',
        referenceAnswer: '可以记录匾额文字、飞檐、脊饰或色彩，并写下“庄严、精美、古朴”等真实感受。请以现场实际看到的内容为准。',
      },
      {
        id: 'guandi-quiz-axis',
        type: 'quiz',
        prompt: '为什么庙宇常常按中轴线展开？',
        referenceAnswer: '中轴线布局让主要建筑前后有序、左右相对对称，能够表现庄重和秩序，也方便人们按一定顺序进入和参观。',
      },
      {
        id: 'guandi-reflection-loyalty',
        type: 'reflection',
        prompt: '用一个词解释你理解的“忠义”。',
        referenceAnswer: '可以选择“守信、担当、可靠、重情义”等词，再用一个生活中的小例子说明自己的理解。没有唯一答案。',
      },
    ],
  },
  {
    id: 'study-salt-lake',
    eventIds: ['day-5-event-5'],
    eventTitle: '七彩盐湖日落',
    theme: '盐湖为什么有颜色',
    roleName: '盐湖生态观察员',
    estimatedMinutes: 15,
    badgeName: '盐湖生态徽章',
    story: '运城盐湖有很长的盐业历史，也会因为盐分、藻类、卤虫、光照等因素呈现不同颜色。今天重点观察颜色和环境条件。',
    imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '夕阳下的彩色地貌',
    accent: 'from-fuchsia-950/65 via-rose-950/45 to-amber-900/35',
    links: [
      { label: '新华网盐湖资料', url: 'https://www.news.cn/politics/2023-06/05/c_1129670188.htm' },
      { label: '地图导航', url: mapUrl('运城七彩盐湖') },
    ],
    quickSearches: [
      { label: '七彩盐湖原因', query: '运城七彩盐湖 颜色 原因' },
      { label: '盐湖生态', query: '盐湖 藻类 卤虫 科普' },
    ],
    tasks: [
      {
        id: 'salt-lake-observe-colors',
        type: 'observe',
        prompt: '记录你看到的两种盐湖颜色，并观察太阳角度。',
        referenceAnswer: '记录当天实际看到的颜色，再写下太阳较高、接近日落或被云遮挡等光线条件。颜色会随季节、天气和观察角度变化。',
      },
      {
        id: 'salt-lake-quiz-colors',
        type: 'quiz',
        prompt: '为什么盐湖不同区域可能呈现不同颜色？',
        referenceAnswer: '不同区域的盐度、藻类和其他盐水生物数量可能不同，加上光照和水深差异，会让湖水呈现不同颜色。',
      },
      {
        id: 'salt-lake-reflection-protection',
        type: 'reflection',
        prompt: '说出盐湖从生产到旅游保护的一点变化。',
        referenceAnswer: '可以从“过去重视产盐和资源利用，现在同时发展观光并重视生态保护”来思考，再写下你认为保护和利用怎样平衡。',
      },
    ],
  },
  {
    id: 'study-guanque',
    eventIds: ['day-6-event-3'],
    eventTitle: '鹳雀楼',
    theme: '诗词里的黄河与高楼',
    roleName: '登楼小诗人',
    estimatedMinutes: 15,
    badgeName: '黄河诗词徽章',
    story: '鹳雀楼适合把诗词、地理和视野联系起来。登高以后，试着理解古人为什么会写下壮阔的句子。',
    imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '登高远眺的山河景色',
    accent: 'from-orange-950/65 via-sky-950/45 to-slate-950/35',
    links: [
      { label: '搜索资料', url: searchUrl('鹳雀楼 王之涣 登鹳雀楼') },
      { label: '地图导航', url: mapUrl('鹳雀楼') },
    ],
    quickSearches: [
      { label: '登鹳雀楼', query: '登鹳雀楼 王之涣 诗词讲解 儿童' },
      { label: '黄河地理', query: '黄河 中游 地理 小学生' },
    ],
    tasks: [
      {
        id: 'guanque-observe-view',
        type: 'observe',
        prompt: '登楼后找到黄河方向，并描述远近景物。',
        referenceAnswer: '可以借助现场标识确认方向，分别写近处和远处看到的景物。能否直接看到黄河会受天气、视野和观景位置影响。',
      },
      {
        id: 'guanque-quiz-climb',
        type: 'quiz',
        prompt: '为什么“登高”常常会让人想到更远的目标？',
        referenceAnswer: '站得更高时视野通常更开阔，人也更容易想到远方和更大的目标。“欲穷千里目，更上一层楼”就把登高与追求更远联系在一起。',
      },
      {
        id: 'guanque-reflection-discovery',
        type: 'reflection',
        prompt: '写一句自己的登楼发现。',
        referenceAnswer: '例如：“站得更高以后，远近景物的层次更清楚了。”请写你当时最真实的发现，不必照抄。',
      },
    ],
  },
  {
    id: 'study-pujindu',
    eventIds: ['day-6-event-4'],
    eventTitle: '蒲津渡遗址',
    theme: '大铁牛和古代工程',
    roleName: '古代工程侦探',
    estimatedMinutes: 15,
    badgeName: '古桥工程徽章',
    story: '蒲津渡的大铁牛和古渡口有关。今天重点看古人如何利用材料、重量和位置解决黄河渡桥问题。',
    imageUrl: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '河岸与古代工程想象场景',
    accent: 'from-zinc-950/75 via-amber-950/45 to-stone-950/35',
    links: [
      { label: '搜索资料', url: searchUrl('蒲津渡遗址 黄河大铁牛') },
      { label: '地图导航', url: mapUrl('蒲津渡遗址') },
    ],
    quickSearches: [
      { label: '黄河大铁牛', query: '蒲津渡 黄河大铁牛 古代工程' },
      { label: '古代桥梁', query: '古代浮桥 铁牛 原理' },
    ],
    tasks: [
      {
        id: 'pujindu-observe-iron-oxen',
        type: 'observe',
        prompt: '观察铁牛的大小、朝向和固定方式。',
        referenceAnswer: '可以记录铁牛与人的大小对比、成组排列方式，以及周围铁柱等构件。具体朝向和结构作用请结合现场说明牌判断。',
      },
      {
        id: 'pujindu-quiz-anchor',
        type: 'quiz',
        prompt: '为什么古代桥梁需要这么重的铁牛？',
        referenceAnswer: '这些沉重的铁牛是蒲津浮桥地锚系统的重要组成部分，用来固定连接浮桥的构件，帮助桥梁抵抗黄河水流的冲击。',
      },
      {
        id: 'pujindu-reflection-engineering',
        type: 'reflection',
        prompt: '说出一个古代工程和现代工程的相同点。',
        referenceAnswer: '例如都要选择合适材料、计算受力、保证稳固，并考虑水流和长期使用。可以选一个共同点，用现场构件作证据。',
      },
    ],
  },
];

export function getStudyCardForEvent(event: TripEvent) {
  if (event.category !== 'spot') return undefined;
  return studyCards.find(
    (card) =>
      card.eventIds.includes(event.id) ||
      event.title.includes(card.eventTitle) ||
      card.eventTitle.includes(event.title) ||
      (event.locationName ? card.eventTitle.includes(event.locationName) || event.locationName.includes(card.eventTitle) : false),
  );
}
