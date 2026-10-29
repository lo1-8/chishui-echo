require('dotenv').config()

const db = require('./src/config/database')
const initializeDatabase = require('./src/config/initDatabase')

/**
 * 赤水回声地图真实演示数据初始化脚本。
 *
 * 运行方法：
 *
 * cd server
 * node seed-data.js
 *
 * 注意：
 * 本脚本会清空以下表中的旧测试数据：
 * - user_events
 * - feedbacks
 * - audios
 * - quiz_questions
 * - service_points
 * - spots
 *
 * 如果你的数据库中已有重要正式内容，
 * 请先备份 server/database/chishui-echo.db。
 */

initializeDatabase()

/* =====================================================
   一、五个核心声音点位
   ===================================================== */

const coreSpots = [
  {
    id: 1,
    name: '地下党活动旧址',
    subtitle: '古镇街巷中的隐秘记忆',
    type: '红色旧址',
    route_order: 1,
    map_x: 27.375,
    map_y: 36.8181818181818,
    longitude: 106.044860,
    latitude: 28.143128,
    cover_image: '/uploads/images/spots/spot-01-underground-party.jpg',
    short_intro: '沿着古镇北侧街巷，寻找一段隐秘而坚定的红色记忆。',
    story_content:
      '地下党活动旧址承载着太平古镇革命历史中隐秘而重要的一页。穿行于古镇街巷，历史不总是以宏大的姿态出现，它也常常藏在一扇门、一段石阶与普通人的日常之中。这里的故事提醒我们，革命事业的延续不仅依靠前线的壮阔行动，也离不开无数隐蔽战线工作者的坚守、联络与担当。',
    story_source:
      '请在正式上线前依据场馆资料、地方志或权威党史资料进一步核验与补充。',
    next_spot_id: 2,
    navigation_url: 'https://map.baidu.com/search/地下党活动旧址',
    is_published: 1,
    audio: {
      title: '街巷深处的回声',
      audio_url: '/uploads/audios/spots/spot-01-story.mp3',
      duration: 48,
      transcript:
        '请替换为正式录音逐字稿。建议使用环境声开场，再结合讲述者口述或青年旁白，带领听众进入古镇街巷中的历史记忆。',
      audio_type: '环境声与青年旁白',
      record_location: '地下党活动旧址周边'
    },
    question: {
      question: '在历史遗址参观中，哪些细节最能帮助我们理解“隐秘战线”的工作特点？',
      options: [
        '街巷空间、旧址位置与口述记忆',
        '只看建筑外观是否新旧',
        '只关注是否适合拍照'
      ],
      correct_answer: '0',
      explanation:
        '遗址所处空间、历史资料和口述记忆，能够帮助参观者理解隐蔽战线工作所依托的真实环境。'
    }
  },

  {
    id: 2,
    name: '毛泽东四渡赤水纪念馆',
    subtitle: '在历史节点中理解战略智慧',
    type: '红色纪念馆',
    route_order: 2,
    map_x: 34.875,
    map_y: 49.1818181818182,
    longitude: 106.045510,
    latitude: 28.142350,
    cover_image: '/uploads/images/spots/spot-02-mao-memorial.jpg',
    short_intro: '通过历史场景与展陈线索，理解四渡赤水中的战略思维。',
    story_content:
      '毛泽东四渡赤水纪念馆以相关历史资料、空间叙事和红色记忆为线索，帮助参观者理解长征途中灵活机动、实事求是的战略智慧。面对复杂局势，红军并未依赖单一固定路线，而是在不断变化的现实条件中主动判断、快速调整。今天走进纪念馆，既是回望历史，也是在理解一种面对困难时保持清醒、坚持判断与勇于行动的精神力量。',
    story_source:
      '请根据纪念馆公开展陈资料、权威党史材料补充正式史实来源。',
    next_spot_id: 3,
    navigation_url: 'https://map.baidu.com/search/毛泽东四渡赤水纪念馆',
    is_published: 1,
    audio: {
      title: '在变化中寻找方向',
      audio_url: '/uploads/audios/spots/spot-02-story.mp3',
      duration: 52,
      transcript:
        '请替换为正式录音逐字稿。建议加入纪念馆环境声、讲解员关键片段和青年旁白。',
      audio_type: '讲解片段与青年旁白',
      record_location: '毛泽东四渡赤水纪念馆'
    },
    question: {
      question: '四渡赤水相关历史最能体现哪一种战略品质？',
      options: [
        '根据实际情况灵活判断与调整',
        '始终只走固定路线',
        '只依靠单一资源解决问题'
      ],
      correct_answer: '0',
      explanation:
        '四渡赤水体现了在复杂局势中坚持实事求是、灵活机动和主动谋划的重要战略智慧。'
    }
  },

  {
    id: 3,
    name: '古蔺县红军长征四渡赤水博物馆',
    subtitle: '从展陈与文物中回望长征历史',
    type: '红色博物馆',
    route_order: 3,
    map_x: 45.0625,
    map_y: 56.2727272727273,
    longitude: 106.046580,
    latitude: 28.141864,
    cover_image: '/uploads/images/spots/spot-03-long-march-museum.jpg',
    short_intro: '沿着展陈逻辑和文物线索，理解四渡赤水与长征精神。',
    story_content:
      '古蔺县红军长征四渡赤水博物馆以文物、图片、文字和历史叙事呈现四渡赤水相关历史脉络。相较于单纯阅读文字，展陈空间能够把时间、人物、物件和地点连接起来。对于青年参观者而言，博物馆不仅提供历史知识，也提供了重新理解长征精神的入口：在困难中坚持理想，在变化中把握方向，在集体中凝聚力量。',
    story_source:
      '请依据博物馆展签、公开资料、地方志和正式讲解材料完善。',
    next_spot_id: 4,
    navigation_url: 'https://map.baidu.com/search/古蔺县红军长征四渡赤水博物馆',
    is_published: 1,
    audio: {
      title: '展厅里的历史片段',
      audio_url: '/uploads/audios/spots/spot-03-story.mp3',
      duration: 56,
      transcript:
        '请替换为正式录音逐字稿。建议使用展厅脚步声、讲解片段、展陈说明与青年旁白结合。',
      audio_type: '展厅环境声与讲解',
      record_location: '古蔺县红军长征四渡赤水博物馆'
    },
    question: {
      question: '参观红色博物馆时，哪种方式更有助于形成有效学习？',
      options: [
        '带着问题观察展品、讲解与空间叙事',
        '只快速拍照后离开',
        '只记住展厅颜色'
      ],
      correct_answer: '0',
      explanation:
        '带着问题观察展品、讲解与空间关系，能帮助参观者形成更完整的历史理解。'
    }
  },

  {
    id: 4,
    name: '四渡赤水太平渡陈列馆',
    subtitle: '一座陈列馆，一段渡口历史',
    type: '红色场馆',
    route_order: 4,
    map_x: 48.4375,
    map_y: 63.6363636363636,
    longitude: 106.046888,
    latitude: 28.141424,
    cover_image: '/uploads/images/spots/spot-04-taiping-exhibition.jpg',
    short_intro: '在太平渡相关展陈中，连接渡口、人物、行动与历史现场。',
    story_content:
      '四渡赤水太平渡陈列馆连接着古镇空间与红色历史记忆。展陈中的物件、图片与故事，让渡口不再只是地图上的一个地名，而成为理解历史行动的重要空间节点。站在这里，可以尝试将展厅中的历史线索与古镇街巷、赤水河岸以及接下来的渡口实景联系起来：历史并不只存在于展板上，它也保留在今天仍可行走、聆听和观察的山河之间。',
    story_source:
      '请根据陈列馆官方资料、讲解词和权威党史材料进行最终核验。',
    next_spot_id: 5,
    navigation_url: 'https://map.baidu.com/search/四渡赤水太平渡陈列馆',
    is_published: 1,
    audio: {
      title: '美酒劳军号子',
      audio_url: '/uploads/audios/spots/spot-04-story.mp3',
      duration: 54,
      transcript:
        '赤水河啊长又长，手捧美酒香又香。红军哥哥为穷人，献给红军尝一尝。扛起梭标扛起枪，跟着救星共产党。红军哥哥做榜样，打一个江山亮堂堂——',
      audio_type: '讲解员为实践团成员演唱号子',
      record_location: '四渡赤水太平渡陈列馆'
    },
    question: {
      question: '为什么应将陈列馆展陈与古镇、渡口等实地空间结合起来理解？',
      options: [
        '这样可以将历史资料与真实空间联系起来',
        '因为展厅内容与现场无关',
        '因为只需记住建筑名称'
      ],
      correct_answer: '0',
      explanation:
        '将展陈与真实空间联系起来，能够让历史叙事更加具体，也更容易形成场景化理解。'
    }
  },

  {
    id: 5,
    name: '太平渡渡口',
    subtitle: '赤水河畔，历史仍在回响',
    type: '渡口遗址',
    route_order: 5,
    map_x: 83.8125,
    map_y: 24.1818181818182,
    longitude: 106.050240,
    latitude: 28.143705,
    cover_image: '/uploads/images/spots/spot-05-taiping-ferry.jpg',
    short_intro: '聆听赤水河水声，在渡口中央感受历史回响。',
    story_content:
      '1935年1月29日凌晨3时,中革军委下达了西渡赤水河的命令，但是想要顺利西渡绝非易事，能否架好浮桥是关键。为了架桥，红军决定挨家挨户向老百姓借门板。得知红军渡河受阻的消息后，土城的百姓倾力相助，不仅卸下家中门板送过去，还主动献出自家船只协助红军搭建浮桥。“千户拆门送红军，赤水河边搭浮桥”的动人场面，让身处险境的红军看到了渡河成功的希望。沧海横流，方显英雄本色。今天，赤水河依然奔涌。而那些信念与坚守，也在一次次讲述、聆听与行走中重新澎湃。',
    story_source:
      '111',
    next_spot_id: null,
    navigation_url: 'https://map.baidu.com/search/太平渡渡口',
    is_published: 1,
    audio: {
      title: '赤水回响',
      audio_url: '/uploads/audios/spots/spot-05-river-and-ferry.mp3',
      duration: 60,
      transcript:
        '不变的水流，生生不息的水流...',
      audio_type: '赤水河环境声',
      record_location: '太平渡渡口'
    },
    question: {
      question: '太平渡百姓拆门板帮红军搭浮桥，浮桥绳索一头拴在哪块石头上？',
      options: [
        '老鹰石',
        '老虎石',
        '狮子石'
      ],
      correct_answer: '0',
      explanation:
        '老鹰石是太平渡渡口河边一块天然巨石，当年搭建浮桥时，粗大的竹篾绳索就牢牢拴在这块石头上，用来固定浮桥，防止湍急的赤水河河水把浮桥冲走，是太平渡非常标志性的红色实物遗迹。'
    }
  },

  {
    id: 6,
    name: '司令部旧址',
    subtitle: '赤水河畔的指挥中枢',
    type: '红色场馆',
    route_order: 5,
    map_x: 42.5,
    map_y: 50.91,
    longitude: 0,
    latitude: 0,
    cover_image: '/uploads/images/spots/spot-06-headquarters.jpg',
    short_intro: '驻足太平古镇长征街，重温四渡赤水战役运筹帷幄的红色岁月。',
    story_content:
      '油灯之下，谋划出奇兵.\n1935年2月，红军抵达太平渡，司令部里夜夜亮着油灯。指挥部的人员围在简易地图前反复研判敌情，敲定二渡赤水回师黔北的方案。\n敌人以为红军会向北突围，红军却反向杀回贵州，拿下娄山关、再占遵义，取得遵义大捷。这份扭转被动局面的作战计划，正是在太平古镇这座司令部里酝酿成型。狭小的房间里，没有先进通信设备，全靠电台、通讯员传递情报，在敌我力量悬殊的绝境中，依靠机动灵活的运动战思路，寻找战机。',
    story_source: '',
    next_spot_id: 3,
    navigation_url: '',
    is_published: 1,
    audio: {
      title: '四渡赤水出奇兵',
      audio_url: '/uploads/audios/spots/spot-06-headquarters.mp3',
      duration: 46,
      transcript: '',
      audio_type: '其他',
      record_location: '网络素材',
      narrator: '网络'
    },
    question: {
      question: '太平古镇红军司令部旧址坐落在哪条街道？',
      options: ['长征街', '赤水街', '红军街'],
      correct_answer: '0',
      explanation: '太平古镇红军司令部旧址坐落在红军街，这是一条美丽的街道。'
    }
  },

  {
    id: 7,
    name: '非遗工坊',
    subtitle: '豆香暖军民',
    type: '其他',
    route_order: 3,
    map_x: 29.5,
    map_y: 45.09,
    longitude: 0,
    latitude: 0,
    cover_image: '/uploads/images/spots/spot-07-tofu-workshop.jpg',
    short_intro: '古蔺传统豆花制作技艺点位，延续石磨点制古法，因招待四渡赤水红军而得名“红军豆腐”。',
    story_content:
      '太平古镇明清时期便是盐码头商贸集结地，当地热质豆腐技艺传承多年。1935年红军四渡赤水驻扎太平镇时，当地人拥护红军，把特制的外酥内嫩的豆腐送给红军品尝，而后被称为“红军豆腐”，广为流传。如今工坊仍坚持传统工艺，本地黄豆浸泡后石磨磨浆，卤水慢点点制，豆花嫩滑鲜香、豆香四溢，配上麻辣蘸水，既是本地人的日常烟火，也是游客必尝的古镇风味。',
    story_source: '',
    next_spot_id: 2,
    navigation_url: '',
    is_published: 1,
    audio: null,
    question: {
      question: '传统红军豆花点制成型使用的核心原料是？',
      options: ['卤水', '石膏', '内酯'],
      correct_answer: '0',
      explanation: '工坊坚持古法，用卤水慢点点制豆花，使其嫩滑鲜香、豆香四溢。'
    }
  },

  {
    id: 8,
    name: '红军银行旧址',
    subtitle: '街巷深处的红色暗线',
    type: '红色旧址',
    route_order: 2,
    map_x: 22.8125,
    map_y: 39.1818,
    longitude: 0,
    latitude: 0,
    cover_image: '/uploads/images/spots/spot-08-red-army-bank.png',
    short_intro: '原为太平古镇一处民房，红军长征期间曾作为秘密联络点，见证了隐蔽战线的忠诚与坚守。',
    story_content:
      '红军初到太平渡时，部队需要用钱向老百姓购买粮食和物资，可手里拿的却是苏维埃政府发行的纸币。当时国民党统治区根本不认这种“红票子”，老百姓见了也不敢收，怕变成废纸。为了让群众放心，红军决定在“永盛隆盐号”旧址上开设临时银行，并张贴告示：“红军买东西一律公平交易，凡收苏维埃纸币的老乡，可随时到临时银行按市价兑换成银元。”故事传开后，一位叫赵大娘的村民半信半疑，她把自己攒的一点干粮卖给红军，换回几张纸币。当天下午，她揣着纸币走进临时银行，工作人员热情地接待了她，按照1:1的比价当场兑给她白花花的银元。赵大娘攥着银元走出大门，逢人便说：“红军的票子能换钱，不骗人！”消息一传十、十传百，老百姓纷纷拿出粮食、盐巴、布匹与红军交易。临时银行前每天都排起长队，红军战士一边帮群众兑换，一边耐心解释政策。短短几天，部队就筹集到大量给养，而群众没有损失一分一毫。',
    story_source: '',
    next_spot_id: 7,
    navigation_url: '',
    is_published: 1,
    audio: null,
    question: {
      question: '红军银行旧址原来是什么地方？',
      options: ['炊事房', '太平古镇八大盐号之一的“永盛隆盐号”', '地主大院'],
      correct_answer: '1',
      explanation: '太平古镇著名盐号，后改造为红军银行，具有独特历史意义。'
    }
  },

  {
    id: 9,
    name: '炊事房旧址',
    subtitle: '炊烟深处的红色记忆',
    type: '红色旧址',
    route_order: 7,
    map_x: 41.3125,
    map_y: 58.4545,
    longitude: 0,
    latitude: 0,
    cover_image: '/uploads/images/spots/spot-09-kitchen.jpeg',
    short_intro: '一缕炊烟，见证红军长征途中的军民情深。',
    story_content:
      '炊事房旧址，是红军长征经过古蔺时留下的生活印记。锅灶虽已沉默，炊烟背后的军民情谊却从未远去。那段艰苦岁月里，炊事员以一餐一饭保障行军，群众也以朴实援助支持红军。这段故事提醒我们，征程不仅在战场，也在无数平凡岗位的坚守中。',
    story_source: '',
    next_spot_id: null,
    navigation_url: '',
    is_published: 1,
    audio: {
      title: '柴火燃烧声',
      audio_url: '/uploads/audios/spots/spot-09-kitchen-fire.mp3',
      duration: 60,
      transcript: '生火炊饭中...',
      audio_type: '环境声与青年旁白',
      record_location: '声音模仿',
      narrator: '声音模仿',
      authorization_status: 'pending'
    },
    question: null
  },

  {
    id: 10,
    name: '红五军团军团部住地旧址',
    subtitle: '赤水河畔的“铁流后卫”驻地',
    type: '红色旧址',
    route_order: 9,
    map_x: 54.9375,
    map_y: 48.7272,
    longitude: 0,
    latitude: 0,
    cover_image: '/uploads/images/spots/spot-10-fifth-corps.jpg',
    short_intro: '红五军团军团部驻地，四渡赤水重要遗址，全国重点文物保护单位。',
    story_content:
      '1935年2月19日至21日，中央红军在太平渡二渡赤水。为掩护主力渡河及船工撤出浮桥，红五军团留下约一个营（约150人）的兵力在对岸警戒。国民党川军潘左周华成部及地方武装共3000余人随后追击渡河。早已埋伏在对岸树林中的红五军团某部突然发起猛攻，成功阻击来敌，粉碎了敌军的追击企图',
    story_source: '',
    next_spot_id: null,
    navigation_url: '',
    is_published: 1,
    audio: null,
    question: {
      question: '1935年红军四渡赤水期间，红五军团在太平古镇以少胜多、阻击了数倍于己的追敌，这场战斗叫什么？',
      options: ['二郎滩背水战', '太平阻击战', '青杠坡战斗', '土城战役'],
      correct_answer: '1',
      explanation:
        '1935年2月20日上午，红五军团某营在太平渡老鹰石渡口附近，成功阻击了3000余人的追敌，取得太平阻击战胜利。红军在古蔺还取得了二郎滩背水战等胜利。'
    }
  }
]

/* =====================================================
   二、服务设施点
   ===================================================== */

const servicePoints = [
  {
    name: '太平古镇-北门',
    type: '北门',
    map_x: 24.6875,
    map_y: 35.7272727272727,
    longitude: 106.044747,
    latitude: 28.143174,
    address: '太平古镇北门入口区域',
    description: '古镇主要进入方向之一，可作为推荐声音路线的起点参考。',
    opening_hours: '以现场开放情况为准',
    navigation_url: 'https://map.baidu.com/search/太平古镇-北门',
    is_published: 1
  },

  {
    name: '太平古镇-东侧地上停车场',
    type: '停车场',
    map_x: 89.0625,
    map_y: 26.8181818181818,
    longitude: 106.050661,
    latitude: 28.143565,
    address: '太平古镇东侧',
    description: '建议自驾游客根据现场标识和管理要求停车。',
    opening_hours: '以现场开放情况为准',
    navigation_url: 'https://map.baidu.com/search/太平古镇-东侧地上停车场',
    is_published: 1
  },

  {
    name: '公共厕所',
    type: '厕所',
    map_x: 52.25,
    map_y: 32.1818181818182,
    longitude: 106.045081,
    latitude: 28.142371,
    address: '太平古镇公共服务区域',
    description: '公共卫生间，具体开放情况以现场为准。',
    opening_hours: '以现场开放情况为准',
    navigation_url: 'https://map.baidu.com/search/公共厕所',
    is_published: 1
  }
]

/* =====================================================
   三、种子数据写入逻辑
   ===================================================== */

function seedData() {
  const transaction = db.transaction(() => {
    /*
      清空旧数据。

      注意：
      仅适用于目前开发阶段。
      正式上线后不要随意执行本文件，
      否则会清空用户反馈与行为统计。
    */
    db.exec(`
      DELETE FROM user_events;
      DELETE FROM feedbacks;
      DELETE FROM audios;
      DELETE FROM quiz_questions;
      DELETE FROM service_points;
      DELETE FROM spots;
    `)

    /*
      重置 SQLite 自增 ID。
      让新插入的点位从 1 开始，便于开发调试。
    */
    db.exec(`
      DELETE FROM sqlite_sequence
      WHERE name IN (
        'spots',
        'audios',
        'quiz_questions',
        'service_points',
        'feedbacks',
        'user_events'
      );
    `)

    const insertSpot = db.prepare(`
      INSERT INTO spots (
        id,
        name,
        subtitle,
        type,
        route_order,
        map_x,
        map_y,
        latitude,
        longitude,
        cover_image,
        short_intro,
        story_content,
        story_source,
        next_spot_id,
        navigation_url,
        is_published,
        updated_at
      ) VALUES (
        @id,
        @name,
        @subtitle,
        @type,
        @route_order,
        @map_x,
        @map_y,
        @latitude,
        @longitude,
        @cover_image,
        @short_intro,
        @story_content,
        @story_source,
        @next_spot_id,
        @navigation_url,
        @is_published,
        CURRENT_TIMESTAMP
      )
    `)

    const insertAudio = db.prepare(`
      INSERT INTO audios (
        spot_id,
        title,
        audio_url,
        duration,
        transcript,
        audio_type,
        record_time,
        record_location,
        narrator,
        authorization_status,
        is_public,
        sort_order,
        updated_at
      ) VALUES (
        @spot_id,
        @title,
        @audio_url,
        @duration,
        @transcript,
        @audio_type,
        @record_time,
        @record_location,
        @narrator,
        @authorization_status,
        @is_public,
        @sort_order,
        CURRENT_TIMESTAMP
      )
    `)

    const insertQuestion = db.prepare(`
      INSERT INTO quiz_questions (
        spot_id,
        question,
        question_type,
        options_json,
        correct_answer,
        explanation,
        is_published,
        updated_at
      ) VALUES (
        @spot_id,
        @question,
        @question_type,
        @options_json,
        @correct_answer,
        @explanation,
        @is_published,
        CURRENT_TIMESTAMP
      )
    `)

    const insertService = db.prepare(`
      INSERT INTO service_points (
        name,
        type,
        address,
        map_x,
        map_y,
        latitude,
        longitude,
        description,
        opening_hours,
        navigation_url,
        is_published,
        updated_at
      ) VALUES (
        @name,
        @type,
        @address,
        @map_x,
        @map_y,
        @latitude,
        @longitude,
        @description,
        @opening_hours,
        @navigation_url,
        @is_published,
        CURRENT_TIMESTAMP
      )
    `)

    /*
      插入五个核心点位、对应音频和问答。
    */
   /*
  第一步：
  先插入全部核心点位。

  这里暂时把 next_spot_id 设为 null，
  避免出现“当前点位引用的下一站尚未插入”的外键错误。
*/
coreSpots.forEach((spot) => {
  insertSpot.run({
    id: spot.id,
    name: spot.name,
    subtitle: spot.subtitle,
    type: spot.type,
    route_order: spot.route_order,
    map_x: spot.map_x,
    map_y: spot.map_y,
    latitude: spot.latitude,
    longitude: spot.longitude,
    cover_image: spot.cover_image,
    short_intro: spot.short_intro,
    story_content: spot.story_content,
    story_source: spot.story_source,

    /*
      关键修改：
      第一轮插入点位时不设置下一站。
    */
    next_spot_id: null,

    navigation_url: spot.navigation_url,
    is_published: spot.is_published
  })
})

/*
  第二步：
  全部点位插入完成后，再建立推荐路线关系。

  此时：
  1、2、3、4、5 五个点位都已经存在于 spots 表中，
  外键引用一定可以找到对应目标。
*/
const updateNextSpot = db.prepare(`
  UPDATE spots
  SET
    next_spot_id = ?,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`)

coreSpots.forEach((spot) => {
  updateNextSpot.run(
    spot.next_spot_id || null,
    spot.id
  )
})

/*
  第三步：
  插入每个点位的音频和研学问答。

  audios.spot_id 和 quiz_questions.spot_id
  此时引用的 spots.id 已全部存在，因此不会触发外键错误。
*/
coreSpots.forEach((spot) => {
  if (spot.audio) {
    insertAudio.run({
      spot_id: spot.id,
      title: spot.audio.title,
      audio_url: spot.audio.audio_url,
      duration: spot.audio.duration,
      transcript: spot.audio.transcript,
      audio_type: spot.audio.audio_type,
      record_time: spot.audio.record_time || '2026年暑期社会实践采集',
      record_location: spot.audio.record_location,
      narrator: spot.audio.narrator || '赤水回声实践团队',
      authorization_status: spot.audio.authorization_status || 'internal',
      is_public: 1,
      sort_order: 1
    })
  }

  if (spot.question) {
    insertQuestion.run({
      spot_id: spot.id,
      question: spot.question.question,
      question_type: 'single',
      options_json: JSON.stringify(spot.question.options),
      correct_answer: spot.question.correct_answer,
      explanation: spot.question.explanation,
      is_published: 1
    })
  }
})
    /*
      插入三个服务点。
    */
    servicePoints.forEach((service) => {
      insertService.run(service)
    })
  })

  transaction()
}

function printSeedSummary() {
  console.log('')
  console.log('==============================================')
  console.log('赤水回声真实地图数据写入成功')
  console.log('==============================================')
  console.log(`核心点位数量：${coreSpots.length}`)
  console.log(`服务设施数量：${servicePoints.length}`)
  console.log('数据库已写入：点位、音频、问答、服务设施。')
  console.log('==============================================')
  console.log('')
}

/*
  补齐初始地图数据，但不会删除用户反馈、访问统计或后台新增内容。
  用于 Render Free 等没有 Shell 的环境：服务启动时自动修复缺失数据。
*/
function ensureSeedData() {
  const transaction = db.transaction(() => {
    const upsertSpot = db.prepare(`
      INSERT INTO spots (
        id,
        name,
        subtitle,
        type,
        route_order,
        map_x,
        map_y,
        latitude,
        longitude,
        cover_image,
        short_intro,
        story_content,
        story_source,
        next_spot_id,
        navigation_url,
        is_published,
        updated_at
      ) VALUES (
        @id,
        @name,
        @subtitle,
        @type,
        @route_order,
        @map_x,
        @map_y,
        @latitude,
        @longitude,
        @cover_image,
        @short_intro,
        @story_content,
        @story_source,
        @next_spot_id,
        @navigation_url,
        @is_published,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT(id) DO UPDATE SET
        name = @name,
        subtitle = @subtitle,
        type = @type,
        route_order = @route_order,
        map_x = @map_x,
        map_y = @map_y,
        latitude = @latitude,
        longitude = @longitude,
        cover_image = @cover_image,
        short_intro = @short_intro,
        story_content = @story_content,
        story_source = @story_source,
        navigation_url = @navigation_url,
        is_published = @is_published,
        updated_at = CURRENT_TIMESTAMP
    `)

    const updateNextSpot = db.prepare(`
      UPDATE spots
      SET next_spot_id = ?
      WHERE id = ?
    `)

    const insertAudio = db.prepare(`
      INSERT INTO audios (
        spot_id,
        title,
        audio_url,
        duration,
        transcript,
        audio_type,
        record_time,
        record_location,
        narrator,
        authorization_status,
        is_public,
        sort_order,
        updated_at
      ) VALUES (
        @spot_id,
        @title,
        @audio_url,
        @duration,
        @transcript,
        @audio_type,
        @record_time,
        @record_location,
        @narrator,
        @authorization_status,
        @is_public,
        @sort_order,
        CURRENT_TIMESTAMP
      )
    `)

    const audioExists = db.prepare(`
      SELECT id
      FROM audios
      WHERE spot_id = ?
        AND title = ?
      LIMIT 1
    `)

    const insertQuestion = db.prepare(`
      INSERT INTO quiz_questions (
        spot_id,
        question,
        question_type,
        options_json,
        correct_answer,
        explanation,
        is_published,
        updated_at
      ) VALUES (
        @spot_id,
        @question,
        @question_type,
        @options_json,
        @correct_answer,
        @explanation,
        @is_published,
        CURRENT_TIMESTAMP
      )
    `)

    const questionExists = db.prepare(`
      SELECT id
      FROM quiz_questions
      WHERE spot_id = ?
        AND question = ?
      LIMIT 1
    `)

    const insertService = db.prepare(`
      INSERT INTO service_points (
        name,
        type,
        address,
        map_x,
        map_y,
        latitude,
        longitude,
        description,
        opening_hours,
        navigation_url,
        is_published,
        updated_at
      ) VALUES (
        @name,
        @type,
        @address,
        @map_x,
        @map_y,
        @latitude,
        @longitude,
        @description,
        @opening_hours,
        @navigation_url,
        @is_published,
        CURRENT_TIMESTAMP
      )
    `)

    const updateService = db.prepare(`
      UPDATE service_points
      SET
        type = @type,
        address = @address,
        map_x = @map_x,
        map_y = @map_y,
        latitude = @latitude,
        longitude = @longitude,
        description = @description,
        opening_hours = @opening_hours,
        navigation_url = @navigation_url,
        is_published = @is_published,
        updated_at = CURRENT_TIMESTAMP
      WHERE name = @name
        AND address = @address
    `)

    const serviceExists = db.prepare(`
      SELECT id
      FROM service_points
      WHERE name = ?
        AND address = ?
      LIMIT 1
    `)

    coreSpots.forEach((spot) => {
      upsertSpot.run({
        id: spot.id,
        name: spot.name,
        subtitle: spot.subtitle,
        type: spot.type,
        route_order: spot.route_order,
        map_x: spot.map_x,
        map_y: spot.map_y,
        latitude: spot.latitude,
        longitude: spot.longitude,
        cover_image: spot.cover_image,
        short_intro: spot.short_intro,
        story_content: spot.story_content,
        story_source: spot.story_source,
        next_spot_id: null,
        navigation_url: spot.navigation_url,
        is_published: spot.is_published
      })
    })

    coreSpots.forEach((spot) => {
      updateNextSpot.run(spot.next_spot_id || null, spot.id)
    })

    coreSpots.forEach((spot) => {
      if (spot.audio) {
        const existingAudio = audioExists.get(
          spot.id,
          spot.audio.title
        )

        if (!existingAudio) {
          insertAudio.run({
            spot_id: spot.id,
            title: spot.audio.title,
            audio_url: spot.audio.audio_url,
            duration: spot.audio.duration,
            transcript: spot.audio.transcript,
            audio_type: spot.audio.audio_type,
            record_time: spot.audio.record_time || '2026年暑期社会实践采集',
            record_location: spot.audio.record_location,
            narrator: spot.audio.narrator || '赤水回声实践团队',
            authorization_status: spot.audio.authorization_status || 'internal',
            is_public: 1,
            sort_order: 1
          })
        }
      }

      if (spot.question) {
        const existingQuestion = questionExists.get(
          spot.id,
          spot.question.question
        )

        if (!existingQuestion) {
          insertQuestion.run({
            spot_id: spot.id,
            question: spot.question.question,
            question_type: 'single',
            options_json: JSON.stringify(spot.question.options),
            correct_answer: spot.question.correct_answer,
            explanation: spot.question.explanation,
            is_published: 1
          })
        }
      }
    })

    servicePoints.forEach((service) => {
      const existingService = serviceExists.get(
        service.name,
        service.address
      )

      if (existingService) {
        updateService.run(service)
      } else {
        insertService.run(service)
      }
    })
  })

  transaction()
}

function getTableCount(tableName) {
  const result = db
    .prepare(`SELECT COUNT(*) AS total FROM ${tableName}`)
    .get()

  return Number(result?.total || 0)
}

/*
  仅在初始数据不完整时补齐，避免服务重启后清空用户反馈和统计数据。
*/
function seedDataIfEmpty() {
  const spotCount = getTableCount('spots')
  const audioCount = getTableCount('audios')
  const questionCount = getTableCount('quiz_questions')
  const serviceCount = getTableCount('service_points')

  // 部分点位按原始内容没有音频或问答，只统计应当存在的数量。
  const expectedAudioCount = coreSpots.filter((spot) => spot.audio).length
  const expectedQuestionCount = coreSpots.filter((spot) => spot.question).length

  const dataComplete =
    spotCount >= coreSpots.length &&
    audioCount >= expectedAudioCount &&
    questionCount >= expectedQuestionCount &&
    serviceCount >= servicePoints.length

  if (dataComplete) {
    console.log('初始地图数据完整，跳过数据补齐。')
    return false
  }

  ensureSeedData()
  printSeedSummary()
  return true
}

if (require.main === module) {
  seedData()
  printSeedSummary()
}

module.exports = {
  seedData,
  ensureSeedData,
  seedDataIfEmpty
}