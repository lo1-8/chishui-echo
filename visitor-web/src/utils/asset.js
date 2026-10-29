/**
 * 获取后端文件服务基础地址。
 *
 * 开发环境：
 * VITE_FILE_BASE_URL=http://localhost:3000
 *
 * 正式部署时：
 * 可改为同域名，也可以留空。
 */
const fileBaseUrl = import.meta.env.VITE_FILE_BASE_URL || ''

/**
 * 将后端返回的相对资源地址转换为完整地址。
 *
 * 例如：
 * /uploads/images/spots/spot-01.jpg
 *
 * 开发环境转换为：
 * http://localhost:3000/uploads/images/spots/spot-01.jpg
 */
export function getAssetUrl(filePath) {
  if (!filePath) {
    return ''
  }

  /*
    如果本身就是 http / https 地址，
    则不再重复拼接。
  */
  if (
    filePath.startsWith('http://') ||
    filePath.startsWith('https://')
  ) {
    return filePath
  }

  return `${fileBaseUrl}${filePath}`
}