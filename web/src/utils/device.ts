/**
 * 设备标识工具
 * 生成唯一的设备 ID 并持久化到 localStorage
 */

const DEVICE_ID_KEY = 'my_quiz_device_id';

/**
 * 生成 UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 获取当前设备 ID（没有则生成）
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

/**
 * 应用版本号
 */
export const APP_VERSION = '1.0.0';

/**
 * 客户端类型
 */
export const CLIENT_TYPE = 'web';
