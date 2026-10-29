export const mapMeta = {
  /*
    SVG 固定画布尺寸。
    后续所有 Vue Marker 坐标均以此 viewBox 为基准。
  */
  width: 1600,
  height: 1100,

  /*
    地图内部绘制区域边距。
    保留空间给北侧赤水河、西侧道路、东侧停车区、
    指北针、未来 Marker 标签和地图缩放。
  */
  padding: {
    left: 88,
    right: 82,
    top: 72,
    bottom: 78
  },

  /*
    固定地理边界：
    北朝上。
    坐标均为百度地图 BD-09 坐标。
  */
  bounds: {
    west: 106.042800,
    east: 106.053600,
    south: 28.139500,
    north: 28.145300
  }
}

/*
  说明：

  - 所有坐标来自百度地图，统一为 BD-09。
  - 本阶段仅用于相对位置计算，不做地图投影转换。
  - 后续外部导航时，可保留此经纬度和百度点位名称。
*/

export const coreSpots = [
  {
    id: 1,
    order: '01',
    name: '四渡赤水太平渡纪念馆',
    category: '红色场馆',
    longitude: 106.046888,
    latitude: 28.141424,
    baiduMapName: '四渡赤水太平渡纪念馆'
  },
  {
    id: 2,
    order: '02',
    name: '地下党活动旧址',
    category: '红色旧址',
    longitude: 106.044860,
    latitude: 28.143128,
    baiduMapName: '地下党活动旧址'
  },
  {
    id: 3,
    order: '03',
    name: '古蔺县红军长征四渡赤水博物馆',
    category: '红色博物馆',
    longitude: 106.046580,
    latitude: 28.141864,
    baiduMapName: '古蔺县红军长征四渡赤水博物馆'
  },
  {
    id: 4,
    order: '04',
    name: '毛泽东四渡赤水纪念馆',
    category: '红色纪念馆',
    longitude: 106.045510,
    latitude: 28.142350,
    baiduMapName: '毛泽东四渡赤水纪念馆'
  },
  {
    id: 5,
    order: '05',
    name: '太平渡渡口',
    category: '渡口遗址',
    longitude: 106.050240,
    latitude: 28.143705,
    baiduMapName: '太平渡渡口'
  }
]

export const servicePoints = [
  {
    id: 'north-gate',
    name: '太平古镇-北门',
    category: '北门',
    icon: 'gate',
    longitude: 106.044747,
    latitude: 28.143174,
    baiduMapName: '太平古镇-北门'
  },
  {
    id: 'parking-east',
    name: '太平古镇-东侧地上停车场',
    category: '停车场',
    icon: 'parking',
    longitude: 106.050661,
    latitude: 28.143565,
    baiduMapName: '太平古镇-东侧地上停车场'
  },
  {
    id: 'toilet-public',
    name: '公共厕所',
    category: '厕所',
    icon: 'toilet',
    longitude: 106.045081,
    latitude: 28.142371,
    baiduMapName: '公共厕所'
  }
]