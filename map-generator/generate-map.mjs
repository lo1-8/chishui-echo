import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { colors } from './config/map-colors.mjs'
import {
  mapMeta,
  coreSpots,
  servicePoints
} from './config/locations.mjs'

/* =====================================================
   一、基础目录与地图配置
   ===================================================== */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const outputDirectory = path.join(__dirname, 'output')

if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory, { recursive: true })
}

const {
  width,
  height,
  padding,
  bounds
} = mapMeta

const {
  west,
  east,
  south,
  north
} = bounds

const drawableWidth = width - padding.left - padding.right
const drawableHeight = height - padding.top - padding.bottom

/* =====================================================
   二、百度地图 BD-09 坐标 → SVG 相对坐标
   ===================================================== */

/**
 * 将百度地图 BD-09 经纬度转换为 SVG 画布坐标。
 *
 * 注意：
 * 1. 本函数仅用于“赤水回声”太平古镇导览地图内的相对位置；
 * 2. 不用于严格 GIS、测距或跨地图导航；
 * 3. 纬度越大越偏北，但 SVG 的 y 越小，因此采用 north - latitude；
 * 4. 地图统一采用“北朝上”。
 */
function projectToCanvas(longitude, latitude) {
  const xRatio = (longitude - west) / (east - west)
  const yRatio = (north - latitude) / (north - south)

  const x = padding.left + xRatio * drawableWidth
  const y = padding.top + yRatio * drawableHeight

  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    map_x: Number((x / width * 100).toFixed(2)),
    map_y: Number((y / height * 100).toFixed(2))
  }
}

const projectedCoreSpots = coreSpots.map((spot) => ({
  ...spot,
  ...projectToCanvas(spot.longitude, spot.latitude)
}))

const projectedServicePoints = servicePoints.map((spot) => ({
  ...spot,
  ...projectToCanvas(spot.longitude, spot.latitude)
}))

/* =====================================================
   三、辅助函数
   ===================================================== */

/**
 * 生成低密度街区建筑块。
 *
 * 不使用重复的小屋图形，而是用不同尺寸、
 * 不同方向、不同透明度的块状表达古镇肌理。
 */
function block(
  x,
  y,
  w,
  h,
  fill,
  opacity = 0.72,
  rotate = 0
) {
  return `
    <rect
      x="${x}"
      y="${y}"
      width="${w}"
      height="${h}"
      rx="2"
      fill="${fill}"
      opacity="${opacity}"
      transform="rotate(${rotate} ${x + w / 2} ${y + h / 2})"
    />
  `
}

/**
 * 生成少量重点历史建筑。
 *
 * 仅保留少数带坡屋顶语义的建筑，
 * 避免旧版地图中密集重复的“小房子”问题。
 */
function landmarkBuilding(
  x,
  y,
  w,
  h,
  wallColor,
  roofColor,
  label = ''
) {
  const roofHeight = Math.max(16, h * 0.28)

  return `
    <g class="landmark-building">
      <rect
        x="${x}"
        y="${y + roofHeight}"
        width="${w}"
        height="${h - roofHeight}"
        rx="2"
        fill="${wallColor}"
        opacity="0.88"
      />

      <path
        d="
          M${x - 6} ${y + roofHeight}
          L${x + w / 2} ${y}
          L${x + w + 6} ${y + roofHeight}
          L${x + w / 2} ${y + roofHeight + 7}
          Z
        "
        fill="${roofColor}"
        opacity="0.9"
      />

      ${
        label
          ? `
            <text
              x="${x + w / 2}"
              y="${y + h + 21}"
              text-anchor="middle"
              font-family="Noto Sans SC, Microsoft YaHei, sans-serif"
              font-size="11"
              fill="${colors.text.secondary}"
              opacity="0.7"
            >
              ${label}
            </text>
          `
          : ''
      }
    </g>
  `
}

/* =====================================================
   四、计算渡口的大致视觉位置
   ===================================================== */

const ferrySpot = projectedCoreSpots.find(
  (spot) => spot.name === '太平渡渡口'
)

/*
  渡口点位最终会由 Vue 在 map_x / map_y 位置叠加 Marker。

  此处仅用于放置“河面声音水纹”和“极小渡船”装饰。
  视觉位置稍偏北，让渡船处于河流中、Marker 处于河岸。
*/
const ferryVisual = {
  x: ferrySpot ? ferrySpot.x + 4 : 1090,
  y: 238
}

/* =====================================================
   五、地图图层：地貌与绿地
   ===================================================== */

/*
  新版取消大面积山峦。

  仅保留极淡的绿地、河岸、外围自然地貌，
  使地图更接近博物馆导览图和真实地图结构。
*/
const terrainLayer = `
  <g id="02-terrain-and-green-areas">
    <!-- 赤水河南岸与古镇外围的淡绿过渡 -->
    <path
      d="
        M0 310
        C110 282 190 300 280 318
        C390 342 482 330 575 348
        C690 370 784 344 904 353
        C1035 364 1130 332 1246 345
        C1364 356 1492 335 1600 360
        L1600 470
        C1485 445 1365 464 1250 452
        C1136 441 1043 476 926 464
        C798 452 690 487 570 470
        C453 454 337 485 223 466
        C130 451 66 464 0 488
        Z
      "
      fill="${colors.mountain.far}"
      opacity="0.28"
    />

    <!-- 古镇周边大范围绿地 -->
    <path
      d="
        M88 502
        C214 432 358 444 468 488
        C572 528 658 505 768 518
        C900 534 1006 498 1125 522
        C1274 552 1404 516 1520 560
        L1600 1030
        C1455 1004 1314 1022 1170 988
        C1024 953 899 995 748 966
        C612 940 500 982 372 954
        C259 930 157 948 0 1016
        L0 600
        Z
      "
      fill="${colors.mountain.middle}"
      opacity="0.16"
    />

    <!-- 南部较弱地貌阴影 -->
    <path
      d="
        M122 770
        C278 726 408 758 544 735
        C682 711 830 747 974 724
        C1098 705 1238 729 1400 696
        C1490 677 1553 686 1600 700
        L1600 1100
        L0 1100
        L0 858
        C48 826 82 792 122 770
        Z
      "
      fill="${colors.mountain.near}"
      opacity="0.08"
    />
  </g>
`

/* =====================================================
   六、地图图层：赤水河
   ===================================================== */

/*
  河流采用“真实河岸线优先”的表达：

  - 河道位于地图北部；
  - 河岸不再是规律波浪；
  - 北岸、南岸采用不规则连续曲线；
  - 河面仅做轻渐变；
  - 渡口附近才出现声音水纹和小船。
*/
const riverLayer = `
  <g id="03-river">
    <!-- 赤水河主水体 -->
    <path
      id="chishui-river-base"
      d="
        M0 88
        C86 82 160 96 238 105
        C303 112 350 95 412 98
        C496 101 554 128 622 135
        C716 145 771 132 850 122
        C940 111 1018 123 1100 111
        C1192 98 1268 60 1358 48
        C1452 35 1531 42 1600 64

        L1600 252
        C1525 236 1455 229 1385 238
        C1290 250 1228 285 1138 292
        C1055 300 975 276 892 284
        C804 291 731 320 648 314
        C564 308 502 276 428 266
        C351 255 285 280 214 284
        C137 288 75 264 0 280
        Z
      "
      fill="url(#river-gradient)"
    />

    <!-- 赤水河北岸轮廓线 -->
    <path
      d="
        M0 88
        C86 82 160 96 238 105
        C303 112 350 95 412 98
        C496 101 554 128 622 135
        C716 145 771 132 850 122
        C940 111 1018 123 1100 111
        C1192 98 1268 60 1358 48
        C1452 35 1531 42 1600 64
      "
      fill="none"
      stroke="${colors.river.deep}"
      stroke-width="2"
      opacity="0.34"
    />

    <!-- 赤水河南岸轮廓线 -->
    <path
      d="
        M0 280
        C75 264 137 288 214 284
        C285 280 351 255 428 266
        C502 276 564 308 648 314
        C731 320 804 291 892 284
        C975 276 1055 300 1138 292
        C1228 285 1290 250 1385 238
        C1455 229 1525 236 1600 252
      "
      fill="none"
      stroke="${colors.river.deep}"
      stroke-width="2"
      opacity="0.4"
    />

    <!-- 河面晨光反射 -->
    <path
      id="chishui-river-subtle-highlight"
      d="
        M115 148
        C245 132 341 163 444 161
        C560 158 647 203 753 188
        C868 172 955 178 1062 165
        C1182 151 1264 115 1378 105
        C1454 98 1516 106 1578 119
        L1578 142
        C1497 127 1437 128 1370 140
        C1252 161 1177 192 1061 198
        C947 204 870 195 761 216
        C651 238 556 198 443 196
        C335 193 248 167 121 181
        Z
      "
      fill="url(#river-highlight-gradient)"
      opacity="0.38"
    />

    <!-- 渡口附近水波：只出现于太平渡空间 -->
    <g
      id="taiping-ferry-sound-ripples"
      fill="none"
      stroke="${colors.river.highlight}"
      stroke-opacity="0.62"
    >
      <ellipse
        cx="${ferryVisual.x}"
        cy="${ferryVisual.y}"
        rx="28"
        ry="7"
        stroke-width="1.4"
      />
      <ellipse
        cx="${ferryVisual.x}"
        cy="${ferryVisual.y}"
        rx="48"
        ry="12"
        stroke-width="1.2"
      />
      <ellipse
        cx="${ferryVisual.x}"
        cy="${ferryVisual.y}"
        rx="70"
        ry="18"
        stroke-width="1"
      />
    </g>

    <!-- 极小渡船，仅作太平渡空间氛围装饰 -->
    <g
      id="taiping-ferry-boat"
      transform="translate(${ferryVisual.x - 26} ${ferryVisual.y - 6})"
    >
      <path
        d="M0 0 C15 -6 36 -6 51 0 C36 8 15 8 0 0 Z"
        fill="${colors.mountain.deep}"
        opacity="0.72"
      />
      <path
        d="M25 -2 V-26"
        stroke="${colors.mountain.deep}"
        stroke-width="2"
        opacity="0.75"
      />
      <path
        d="M25 -24 L42 -4 L25 -4 Z"
        fill="${colors.background.mistWhite}"
        opacity="0.82"
      />
    </g>
  </g>
`

/* =====================================================
   七、地图图层：太平古镇真实轮廓
   ===================================================== */

/*
  古镇不再使用矩形底块。

  新边界参考：
  - 北侧靠近古习路、河岸；
  - 西北侧连接北门；
  - 东侧向停车区、渡口方向延展；
  - 南侧为道路、绿地和街巷过渡；
  - 采用不规则的真实导览级边界。
*/
const townBoundaryLayer = `
  <g id="04-town-boundary">
    <path
      id="taiping-old-town-boundary"
      d="
        M222 398
        C296 365 375 352 457 368
        C540 384 603 422 683 427
        C758 432 818 400 894 413
        C975 428 1042 450 1116 434
        C1186 419 1250 447 1324 462
        C1414 480 1480 528 1512 596
        C1536 650 1505 708 1450 733
        C1380 765 1320 790 1242 810
        C1150 834 1063 820 970 842
        C875 864 785 838 699 857
        C603 878 512 850 426 835
        C330 818 247 783 198 714
        C158 658 162 596 181 542
        C199 490 183 442 222 398
        Z
      "
      fill="${colors.town.area}"
      opacity="0.86"
    />

    <!-- 北侧古镇边界细线 -->
    <path
      d="
        M222 398
        C296 365 375 352 457 368
        C540 384 603 422 683 427
        C758 432 818 400 894 413
        C975 428 1042 450 1116 434
        C1186 419 1250 447 1324 462
        C1414 480 1480 528 1512 596
      "
      fill="none"
      stroke="#D2CABC"
      stroke-width="1.5"
      opacity="0.72"
    />
  </g>
`

/* =====================================================
   八、地图图层：古镇街区肌理
   ===================================================== */

/*
  建筑改造原则：

  1. 不再使用密密麻麻的小房屋；
  2. 大部分使用不同尺寸、不同方向的低密度街区块；
  3. 仅突出极少数重点建筑；
  4. 不把具体场馆名称写死在建筑上；
  5. 后续点位 Marker 与详情卡负责说明。
*/
const townTextureLayer = `
  <g id="05-town-texture">
    <!-- 西北入口与北部门街区 -->
    ${block(265, 460, 74, 38, colors.town.blockLight, 0.54, -8)}
    ${block(350, 436, 92, 34, colors.town.blockMiddle, 0.58, 3)}
    ${block(462, 454, 72, 42, colors.town.blockLight, 0.56, -4)}
    ${block(550, 440, 88, 36, colors.town.blockDeep, 0.48, 5)}

    <!-- 古镇中部街区 -->
    ${block(386, 528, 98, 52, colors.town.blockMiddle, 0.48, -10)}
    ${block(506, 510, 64, 78, colors.town.blockLight, 0.55, 8)}
    ${block(595, 528, 102, 44, colors.town.blockMiddle, 0.5, -2)}
    ${block(725, 498, 72, 66, colors.town.blockLight, 0.47, 6)}
    ${block(824, 522, 108, 48, colors.town.blockMiddle, 0.52, -5)}
    ${block(958, 500, 74, 58, colors.town.blockLight, 0.46, 4)}
    ${block(1060, 523, 96, 42, colors.town.blockMiddle, 0.52, -6)}

    <!-- 东侧与停车区附近建筑 -->
    ${block(1175, 510, 78, 45, colors.town.blockLight, 0.44, 5)}
    ${block(1272, 538, 96, 52, colors.town.blockMiddle, 0.46, -8)}
    ${block(1366, 578, 58, 76, colors.town.blockLight, 0.42, 8)}

    <!-- 中南部街区 -->
    ${block(312, 630, 80, 45, colors.town.blockLight, 0.46, 4)}
    ${block(425, 651, 94, 48, colors.town.blockMiddle, 0.48, -7)}
    ${block(548, 620, 72, 70, colors.town.blockLight, 0.45, 3)}
    ${block(652, 655, 108, 45, colors.town.blockMiddle, 0.5, -4)}
    ${block(798, 625, 82, 58, colors.town.blockLight, 0.44, 6)}
    ${block(910, 660, 96, 44, colors.town.blockMiddle, 0.46, -5)}
    ${block(1035, 635, 72, 62, colors.town.blockLight, 0.42, 7)}
    ${block(1140, 666, 110, 44, colors.town.blockMiddle, 0.45, -4)}

    <!-- 南部稀疏街区 -->
    ${block(430, 736, 88, 42, colors.town.blockLight, 0.38, -6)}
    ${block(548, 755, 70, 55, colors.town.blockMiddle, 0.4, 4)}
    ${block(665, 728, 98, 42, colors.town.blockLight, 0.38, -2)}
    ${block(802, 748, 78, 48, colors.town.blockMiddle, 0.4, 7)}
    ${block(930, 730, 104, 40, colors.town.blockLight, 0.38, -5)}
    ${block(1080, 752, 82, 50, colors.town.blockMiddle, 0.4, 5)}

    <!-- 仅突出三处重点建筑 -->
    ${landmarkBuilding(
      526,
      584,
      78,
      64,
      colors.town.wall,
      colors.town.roof
    )}

    ${landmarkBuilding(
      790,
      570,
      86,
      68,
      colors.town.wall,
      colors.town.roof
    )}

    ${landmarkBuilding(
      1128,
      602,
      76,
      60,
      colors.town.wall,
      colors.town.roof
    )}
  </g>
`

/* =====================================================
   九、地图图层：道路与街巷
   ===================================================== */

/*
  道路等级：

  1. 古习路：北侧主要道路，浅金底 + 棕金细线；
  2. 北门进入道路：白色道路面 + 灰色中心线；
  3. 古镇主道路：白色道路面 + 灰色中心线；
  4. 东侧停车区连接道路；
  5. 次级街巷：低对比细线；
  6. 河岸观察步行线：低调虚线。

  已按要求去除：
  - 红军街文字；
  - 红军街红色路线。
*/
const roadLayer = `
  <g id="06-roads" fill="none" stroke-linecap="round">
    <!-- 古习路底色 -->
    <path
      id="guxi-road-shadow"
      d="
        M118 352
        C248 314 364 320 468 333
        C598 350 699 323 820 328
        C944 334 1058 306 1170 312
        C1303 320 1412 300 1526 270
      "
      stroke="#F3E6C5"
      stroke-width="16"
      opacity="0.92"
    />

    <!-- 古习路中心线 -->
    <path
      id="guxi-road"
      d="
        M118 352
        C248 314 364 320 468 333
        C598 350 699 323 820 328
        C944 334 1058 306 1170 312
        C1303 320 1412 300 1526 270
      "
      stroke="#BF9E70"
      stroke-width="3"
      opacity="0.9"
    />

    <!-- 北门进入古镇道路 -->
    <path
      id="north-gate-road-base"
      d="
        M190 344
        C236 384 260 417 290 465
        C325 520 350 565 378 618
      "
      stroke="#FBFAF4"
      stroke-width="11"
      opacity="0.96"
    />

    <path
      id="north-gate-road"
      d="
        M190 344
        C236 384 260 417 290 465
        C325 520 350 565 378 618
      "
      stroke="#A39B8E"
      stroke-width="2"
      opacity="0.76"
    />

    <!-- 古镇中部主道路 -->
    <path
      id="town-main-road-base"
      d="
        M274 478
        C400 500 492 492 590 510
        C694 529 776 548 872 542
        C992 535 1110 554 1240 584
        C1330 605 1400 632 1450 678
      "
      stroke="#FBFAF4"
      stroke-width="12"
      opacity="0.97"
    />

    <path
      id="town-main-road"
      d="
        M274 478
        C400 500 492 492 590 510
        C694 529 776 548 872 542
        C992 535 1110 554 1240 584
        C1330 605 1400 632 1450 678
      "
      stroke="#A9A194"
      stroke-width="2.1"
      opacity="0.72"
    />

    <!-- 博物馆、纪念馆周边道路 -->
    <path
      id="museum-area-road-base"
      d="
        M626 512
        C628 568 646 620 676 670
        C704 715 726 754 742 807
      "
      stroke="#FBFAF4"
      stroke-width="10"
      opacity="0.96"
    />

    <path
      id="museum-area-road"
      d="
        M626 512
        C628 568 646 620 676 670
        C704 715 726 754 742 807
      "
      stroke="#AAA196"
      stroke-width="2"
      opacity="0.68"
    />

    <!-- 东侧停车场连接道路 -->
    <path
      id="east-parking-road-base"
      d="
        M1452 330
        C1420 378 1402 430 1384 478
        C1362 538 1364 592 1398 646
      "
      stroke="#FBFAF4"
      stroke-width="11"
      opacity="0.96"
    />

    <path
      id="east-parking-road"
      d="
        M1452 330
        C1420 378 1402 430 1384 478
        C1362 538 1364 592 1398 646
      "
      stroke="#AAA196"
      stroke-width="2"
      opacity="0.7"
    />

    <!-- 古镇内部次级街巷 -->
    <g
      id="town-secondary-streets"
      stroke="#BEB5A9"
      stroke-width="1.5"
      opacity="0.58"
    >
      <path d="M430 468 C430 540 420 603 439 680" />
      <path d="M520 490 C540 546 527 624 540 702" />
      <path d="M740 526 C730 586 741 648 727 716" />
      <path d="M842 540 C846 596 830 666 852 730" />
      <path d="M956 542 C958 605 949 667 968 741" />
      <path d="M1072 556 C1060 616 1072 684 1054 752" />
      <path d="M1188 570 C1194 632 1180 694 1205 760" />

      <path d="M336 580 C476 560 590 582 704 600 C830 620 946 588 1100 612" />
      <path d="M370 675 C516 646 650 668 790 655 C932 641 1050 662 1220 646" />
      <path d="M465 748 C606 724 738 743 888 724 C1005 708 1110 729 1186 716" />
    </g>

    <!-- 河岸慢行观察线 -->
    <path
      id="riverbank-walking-line"
      d="
        M242 389
        C382 367 500 383 620 372
        C750 360 868 378 990 360
        C1124 341 1248 350 1384 328
      "
      stroke="${colors.service.base}"
      stroke-width="2"
      stroke-dasharray="8 9"
      opacity="0.56"
    />
  </g>
`

/* =====================================================
   十、地图图层：文字标注
   ===================================================== */

/*
  仅保留必要地理文字：

  - 赤水河；
  - 太平古镇；
  - 古习路。

  不保留：
  - 红军街；
  - 北门入口区域；
  - 停车服务区；
  - 公共服务区域。

  这些信息将由后续动态服务点图标和详情面板提供。
*/
const landmarkLayer = `
  <g
    id="07-landmark-labels"
    font-family="Noto Sans SC, Microsoft YaHei, sans-serif"
  >
    <text
      x="820"
      y="410"
      text-anchor="middle"
      font-size="26"
      letter-spacing="7"
      fill="${colors.text.secondary}"
      opacity="0.6"
    >
      太平古镇
    </text>

    <text
      x="1040"
      y="82"
      text-anchor="middle"
      font-size="20"
      letter-spacing="10"
      fill="${colors.river.deep}"
      opacity="0.78"
    >
      赤水河
    </text>

    <text
      x="1028"
      y="294"
      text-anchor="middle"
      font-size="13"
      letter-spacing="4"
      fill="#8F7C60"
      opacity="0.72"
    >
      古习路
    </text>
  </g>
`

/* =====================================================
   十一、地图图层：装饰与指北针
   ===================================================== */

const decorationLayer = `
  <g id="08-decorations">
    <!-- 河岸与古镇之间的极淡雾化过渡 -->
    <path
      d="
        M178 372
        C360 354 487 372 622 360
        C785 345 920 368 1055 350
        C1200 332 1334 350 1468 323
      "
      fill="none"
      stroke="${colors.background.mistWhite}"
      stroke-width="18"
      stroke-linecap="round"
      opacity="0.16"
      filter="url(#soft-blur)"
    />

    <!-- 古镇北部边缘的轻柔高光 -->
    <path
      d="
        M220 398
        C297 365 374 353 457 368
        C545 385 600 423 682 428
      "
      fill="none"
      stroke="${colors.background.mistWhite}"
      stroke-width="8"
      opacity="0.18"
      filter="url(#soft-blur)"
    />
  </g>
`

const compass = `
  <g
    id="compass"
    transform="translate(1460 920)"
    fill="none"
    stroke-linecap="round"
  >
    <circle
      cx="0"
      cy="0"
      r="27"
      stroke="${colors.text.secondary}"
      stroke-width="1"
      opacity="0.55"
    />

    <path
      d="M0 -20 L6 4 L0 0 L-6 4 Z"
      fill="${colors.brand.chishuiRed}"
      stroke="${colors.brand.chishuiRed}"
      stroke-width="1"
    />

    <path
      d="M0 20 L5 -4 L0 0 L-5 -4 Z"
      fill="${colors.background.mistWhite}"
      stroke="${colors.text.secondary}"
      stroke-width="1"
      opacity="0.72"
    />

    <text
      x="-5"
      y="-35"
      fill="${colors.text.secondary}"
      stroke="none"
      font-family="Cormorant Garamond, serif"
      font-size="16"
      font-weight="600"
    >
      N
    </text>
  </g>
`

/* =====================================================
   十二、生成完整 SVG
   ===================================================== */

const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  fill="none"
>
  <title>赤水回声｜太平古镇艺术导览地图</title>
  <desc>
    赤水回声数字声音地图底图。
    地图采用北朝上布局，包含赤水河、太平古镇、
    古习路、主要道路、街巷、河岸步行线、街区肌理、
    太平渡渡口声音水纹和指北针。
    核心点位、服务设施、路线状态与用户交互由 Vue 动态叠加。
  </desc>
  <defs>
    <!-- 页面晨雾背景渐变 -->
    <linearGradient
      id="background-gradient"
      x1="0"
      y1="0"
      x2="${width}"
      y2="${height}"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="#FAF9F3" />
      <stop offset="0.48" stop-color="#EEF2E9" />
      <stop offset="1" stop-color="#DDE7DC" />
    </linearGradient>
    <!-- 赤水河主体渐变 -->
    <linearGradient
      id="river-gradient"
      x1="0"
      y1="80"
      x2="${width}"
      y2="300"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="${colors.river.mist}" />
      <stop offset="0.52" stop-color="${colors.river.base}" />
      <stop offset="1" stop-color="${colors.river.deep}" />
    </linearGradient>
    <!-- 河面反光渐变 -->
    <linearGradient
      id="river-highlight-gradient"
      x1="0"
      y1="100"
      x2="${width}"
      y2="250"
      gradientUnits="userSpaceOnUse"
    >
      <stop
        stop-color="${colors.river.highlight}"
        stop-opacity="0.12"
      />
      <stop
        offset="0.46"
        stop-color="${colors.river.highlight}"
        stop-opacity="0.72"
      />
      <stop
        offset="1"
        stop-color="${colors.river.highlight}"
        stop-opacity="0.1"
      />
    </linearGradient>
    <!-- 柔雾 -->
    <filter
      id="soft-blur"
      x="-20%"
      y="-20%"
      width="140%"
      height="140%"
    >
      <feGaussianBlur stdDeviation="14" />
    </filter>
    <!-- 极淡纸张纹理 -->
    <pattern
      id="paper-grain"
      width="8"
      height="8"
      patternUnits="userSpaceOnUse"
    >
      <circle
        cx="1"
        cy="2"
        r="0.5"
        fill="${colors.mountain.middle}"
        opacity="0.12"
      />
      <circle
        cx="6"
        cy="5"
        r="0.45"
        fill="${colors.mountain.deep}"
        opacity="0.08"
      />
    </pattern>
  </defs>
  <!-- 背景 -->
  <g id="01-background">
    <rect
      width="${width}"
      height="${height}"
      fill="${colors.background.paperIvory}"
    />
    <rect
      width="${width}"
      height="${height}"
      fill="url(#background-gradient)"
      opacity="0.78"
    />
    <rect
      width="${width}"
      height="${height}"
      fill="url(#paper-grain)"
      opacity="0.2"
    />
  </g>
  <!-- 极淡地貌与绿地 -->
  ${terrainLayer}
  <!-- 赤水河 -->
  ${riverLayer}
  <!-- 太平古镇边界 -->
  ${townBoundaryLayer}
  <!-- 古镇街区肌理 -->
  ${townTextureLayer}
  <!-- 道路与街巷 -->
  ${roadLayer}
  <!-- 地理名称 -->
  ${landmarkLayer}
  <!-- 雾化与细节装饰 -->
  ${decorationLayer}
  <!-- 指北针 -->
  ${compass}
</svg>
`

/* =====================================================
   十三、输出坐标文件
   ===================================================== */

const coordinateGuide = {
  map: {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    northUp: true,
    inputCoordinateSystem: 'BD-09 / Baidu Map',
    outputCoordinateSystem: 'SVG Relative Coordinate',
    bounds: {
      west,
      east,
      south,
      north
    },
    note: [
      'map_x / map_y 为点位相对于 SVG 画布的百分比。',
      '后续 Vue 可通过 left: map_x%; top: map_y%; 动态叠加 Marker。',
      '该地图底图不包含核心点位 Marker、服务设施 Marker 或推荐路线状态。',
      '最终坐标建议在 Figma 中结合百度地图参考图进行人工校正。'
    ]
  },

  coreSpots: projectedCoreSpots,
  servicePoints: projectedServicePoints
}

/* =====================================================
   十四、写入文件
   ===================================================== */

const svgOutputPath = path.join(
  outputDirectory,
  'taiping-map-base-draft.svg'
)

const jsonOutputPath = path.join(
  outputDirectory,
  'map-coordinate-guide.json'
)

fs.writeFileSync(
  svgOutputPath,
  svg.trim(),
  'utf8'
)

fs.writeFileSync(
  jsonOutputPath,
  JSON.stringify(coordinateGuide, null, 2),
  'utf8'
)

console.log('')
console.log('==============================================')
console.log('赤水回声 V2 真实轮廓 SVG 地图生成成功')
console.log('==============================================')
console.log(`SVG 文件：${svgOutputPath}`)
console.log(`坐标文件：${jsonOutputPath}`)
console.log('')

console.table(
  projectedCoreSpots.map((item) => ({
    id: item.id,
    name: item.name,
    longitude: item.longitude,
    latitude: item.latitude,
    map_x: item.map_x,
    map_y: item.map_y
  }))
)