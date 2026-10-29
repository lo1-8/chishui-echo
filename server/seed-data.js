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
  insertAudio.run({
    spot_id: spot.id,
    title: spot.audio.title,
    audio_url: spot.audio.audio_url,
    duration: spot.audio.duration,
    transcript: spot.audio.transcript,
    audio_type: spot.audio.audio_type,
    record_time: '2026年暑期社会实践采集',
    record_location: spot.audio.record_location,
    narrator: '赤水回声实践团队',
    authorization_status: 'internal',
    is_public: 1,
    sort_order: 1
  })

  insertQuestion.run({
    spot_id: spot.id,
    question: spot.question.question,
    question_type: 'single',
    options_json: JSON.stringify(spot.question.options),
    correct_answer: spot.question.correct_answer,
    explanation: spot.question.explanation,
    is_published: 1
  })
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

seedData()

console.log('')
console.log('==============================================')
console.log('赤水回声真实地图数据写入成功')
console.log('==============================================')
console.log(`核心点位数量：${coreSpots.length}`)
console.log(`服务设施数量：${servicePoints.length}`)
console.log('数据库已写入：点位、音频、问答、服务设施。')
console.log('==============================================')
console.log('')