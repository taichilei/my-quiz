// 同步源: apps/web/src/utils/device.ts
// 修改时请保持两端一致。
//
// RN 版差异：
// - DeviceID 用 expo-secure-store 持久化（Web 用 localStorage）
// - APP_VERSION 从 expo-constants 读取（Web 写死）
// - PLATFORM 用 react-native Platform 判断（Web 没有此概念）

import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
 * 获取当前设备 ID（异步，没有则生成并持久化）
 *
 * 注意：与 Web 端 sync API 不同，RN 端 SecureStore 是异步的。
 * 调用方需要 await。
 */
export async function getDeviceId(): Promise<string> {
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * 应用版本号（从 app.json 读）
 */
export const APP_VERSION: string =
  Constants.expoConfig?.version ?? '1.0.0';

/**
 * 客户端类型
 */
export const CLIENT_TYPE = 'mobile' as const;

/**
 * 平台：ios / android / web（Expo 也支持跑 web）
 */
export const PLATFORM: 'ios' | 'android' | 'web' =
  Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
