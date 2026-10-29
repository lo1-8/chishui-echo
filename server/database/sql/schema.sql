-- =====================================================
-- 赤水回声：四川省古蔺县太平古镇数字声音导览地图
-- SQLite 数据库建表脚本
-- =====================================================


-- -----------------------------------------------------
-- 1. 管理员表
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 管理员登录账号，必须唯一
    username TEXT NOT NULL UNIQUE,

    -- bcryptjs 加密后的密码，不保存明文密码
    password_hash TEXT NOT NULL,

    -- 后台显示名称，例如“赤水回声管理员”
    display_name TEXT NOT NULL DEFAULT '管理员',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------
-- 2. 地图点位表
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS spots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 点位名称，例如“太平渡渡口”
    name TEXT NOT NULL,

    -- 点位副标题，例如“赤水河畔的历史回声”
    subtitle TEXT,

    -- 点位类型，例如：渡口遗址、历史街巷、红色场馆、长征步道
    type TEXT NOT NULL DEFAULT '其他',

    -- 主路线中的顺序。数值越小，越靠前。
    route_order INTEGER NOT NULL DEFAULT 999,

    -- SVG 地图中的相对坐标。
    -- 推荐填写 0-100 之间的数值，例如 map_x=35.5，map_y=62.1
    map_x REAL,
    map_y REAL,

    -- 真实地图经纬度。MVP 可以暂时为空，后续接入外部导航时再补充。
    latitude REAL,
    longitude REAL,

    -- 点位封面图片 URL，例如 /uploads/images/xxx.jpg
    cover_image TEXT,

    -- 一句话简介
    short_intro TEXT,

    -- 150-200 字左右的红色故事正文
    story_content TEXT,

    -- 史实资料来源或审核依据
    story_source TEXT,

    -- 推荐下一站的点位 ID，允许为空
    next_spot_id INTEGER,

    -- 外部导航链接，例如高德地图链接
    navigation_url TEXT,

    -- 是否对游客端公开：1=公开，0=隐藏
    is_published INTEGER NOT NULL DEFAULT 0
        CHECK (is_published IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (next_spot_id)
        REFERENCES spots(id)
        ON DELETE SET NULL
);


-- -----------------------------------------------------
-- 3. 点位音频表
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS audios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 所属点位
    spot_id INTEGER NOT NULL,

    -- 音频标题，例如“赤水河的清晨”
    title TEXT NOT NULL,

    -- 音频文件 URL，例如 /uploads/audios/xxx.mp3
    audio_url TEXT NOT NULL,

    -- 音频时长，单位：秒
    duration INTEGER NOT NULL DEFAULT 0,

    -- 音频逐字稿 / 字幕
    transcript TEXT,

    -- 声音类别：环境声、口述史、船工号子、讲解、青年旁白等
    audio_type TEXT NOT NULL DEFAULT '其他',

    -- 录制日期或时间说明
    record_time TEXT,

    -- 录制地点说明
    record_location TEXT,

    -- 录音对象、讲述者、素材来源
    narrator TEXT,

    -- 授权状态：pending、internal、public、restricted
    authorization_status TEXT NOT NULL DEFAULT 'pending',

    -- 是否允许游客端公开播放：1=允许，0=不允许
    is_public INTEGER NOT NULL DEFAULT 0
        CHECK (is_public IN (0, 1)),

    -- 若一个点位有多段音频，用于排序
    sort_order INTEGER NOT NULL DEFAULT 1,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (spot_id)
        REFERENCES spots(id)
        ON DELETE CASCADE
);


-- -----------------------------------------------------
-- 4. 研学问答表
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 所属点位
    spot_id INTEGER NOT NULL,

    -- 问题正文
    question TEXT NOT NULL,

    -- 题型：single（单选）、true_false（判断）、text（开放题）
    question_type TEXT NOT NULL DEFAULT 'single',

    -- 选项 JSON 字符串。
    -- 例如：["选项A","选项B","选项C"]
    options_json TEXT,

    -- 正确答案。
    -- 单选题可保存选项下标，如 "0"；
    -- 判断题可保存 "true" 或 "false"；
    -- 开放题可为空。
    correct_answer TEXT,

    -- 题目解析
    explanation TEXT,

    -- 是否对游客端公开
    is_published INTEGER NOT NULL DEFAULT 1
        CHECK (is_published IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (spot_id)
        REFERENCES spots(id)
        ON DELETE CASCADE
);


-- -----------------------------------------------------
-- 5. 周边服务点表
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS service_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 服务点名称，例如“太平古镇游客服务中心”
    name TEXT NOT NULL,

    -- 类型：厕所、休息点、餐饮、补给、文创、停车、游客服务等
    type TEXT NOT NULL DEFAULT '其他',

    -- 地址或位置描述
    address TEXT,

    -- SVG 地图中的相对坐标
    map_x REAL,
    map_y REAL,

    -- 真实经纬度
    latitude REAL,
    longitude REAL,

    -- 服务说明
    description TEXT,

    -- 营业时间或开放时间
    opening_hours TEXT,

    -- 外部导航链接
    navigation_url TEXT,

    -- 是否对游客端公开
    is_published INTEGER NOT NULL DEFAULT 1
        CHECK (is_published IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------
-- 6. 用户体验反馈表
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 浏览器端自动生成的匿名 UUID
    visitor_id TEXT NOT NULL,

    -- 用户已完成的点位数量
    completed_spot_count INTEGER NOT NULL DEFAULT 0,

    -- 五维体验评分，范围为 1-5
    clarity_score INTEGER NOT NULL
        CHECK (clarity_score BETWEEN 1 AND 5),

    immersion_score INTEGER NOT NULL
        CHECK (immersion_score BETWEEN 1 AND 5),

    emotion_score INTEGER NOT NULL
        CHECK (emotion_score BETWEEN 1 AND 5),

    knowledge_score INTEGER NOT NULL
        CHECK (knowledge_score BETWEEN 1 AND 5),

    action_score INTEGER NOT NULL
        CHECK (action_score BETWEEN 1 AND 5),

    -- 以下字段均使用 0 / 1：
    -- 0 = 否 / 不愿意
    -- 1 = 是 / 愿意
    share_intention INTEGER NOT NULL DEFAULT 0
        CHECK (share_intention IN (0, 1)),

    recommend_intention INTEGER NOT NULL DEFAULT 0
        CHECK (recommend_intention IN (0, 1)),

    revisit_intention INTEGER NOT NULL DEFAULT 0
        CHECK (revisit_intention IN (0, 1)),

    purchase_intention INTEGER NOT NULL DEFAULT 0
        CHECK (purchase_intention IN (0, 1)),

    study_intention INTEGER NOT NULL DEFAULT 0
        CHECK (study_intention IN (0, 1)),

    payment_intention INTEGER NOT NULL DEFAULT 0
        CHECK (payment_intention IN (0, 1)),

    -- 用户开放反馈
    suggestions TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------
-- 7. 匿名用户行为事件表
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 浏览器端匿名 UUID
    visitor_id TEXT NOT NULL,

    -- 事件类型，例如：
    -- page_view、spot_view、audio_play、audio_complete、
    -- spot_checkin、spot_collect、spot_uncollect、
    -- navigation_click、quiz_complete、share_generate
    event_type TEXT NOT NULL,

    -- 关联点位，可为空。
    -- 例如首页浏览事件不需要点位 ID。
    spot_id INTEGER,

    -- 额外信息，使用 JSON 字符串保存。
    -- 例如 {"duration":45,"route":"main"}
    event_value TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (spot_id)
        REFERENCES spots(id)
        ON DELETE SET NULL
);


-- -----------------------------------------------------
-- 8. 常用查询索引
-- -----------------------------------------------------

-- 查询公开点位、按路线排序时使用
CREATE INDEX IF NOT EXISTS idx_spots_published_order
ON spots(is_published, route_order);

-- 按点位查询音频
CREATE INDEX IF NOT EXISTS idx_audios_spot_id
ON audios(spot_id);

-- 按点位查询问题
CREATE INDEX IF NOT EXISTS idx_quiz_questions_spot_id
ON quiz_questions(spot_id);

-- 后台统计、按访客和事件查询
CREATE INDEX IF NOT EXISTS idx_user_events_visitor_id
ON user_events(visitor_id);

CREATE INDEX IF NOT EXISTS idx_user_events_event_type
ON user_events(event_type);

-- 后台查看反馈、按提交时间排序
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at
ON feedbacks(created_at);