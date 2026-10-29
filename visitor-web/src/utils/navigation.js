/**
 * 打开百度地图搜索页面。
 *
 * MVP 阶段采用“名称搜索链接”，最稳定，
 * 不依赖浏览器或设备对坐标 URI 的兼容性。
 */
export function openBaiduNavigation(spotOrService) {
  const name = spotOrService?.name

  if (!name) {
    window.alert('暂未找到该点位的导航信息。')
    return
  }

  const url = `https://map.baidu.com/search/${encodeURIComponent(name)}`

  window.open(url, '_blank', 'noopener,noreferrer')
}