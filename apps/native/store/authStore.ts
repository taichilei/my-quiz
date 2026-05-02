// 登录态全局 store。
// JWT 持久化到 expo-secure-store；userId 派生自 user.id（后端答题记录用 string 形式）。

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import {
  authApi,
  userApi,
  setAuthToken,
  setUnauthorizedHandler,
} from '../api/client';
import type { User } from '../types';

const TOKEN_KEY = 'my_quiz_jwt';

interface AuthState {
  token: string | null;
  user: User | null;
  /** 启动时从 SecureStore 恢复 token 的过程 */
  bootstrapping: boolean;

  /** App 启动时调用一次：恢复 token + 拉取 user，绑定 401 回调 */
  bootstrap: () => Promise<void>;

  login: (username: string, password: string) => Promise<void>;
  register: (params: {
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;

  /** 401 时由 client 触发；外部通常不直接调 */
  handleUnauthorized: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  bootstrapping: true,

  bootstrap: async () => {
    setUnauthorizedHandler(() => get().handleUnauthorized());

    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      set({ bootstrapping: false });
      return;
    }

    setAuthToken(token);
    set({ token });

    try {
      const user = await userApi.me();
      set({ user, bootstrapping: false });
    } catch {
      // token 失效或网络错误：保持登录页
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setAuthToken(null);
      set({ token: null, user: null, bootstrapping: false });
    }
  },

  login: async (username, password) => {
    const { token, user } = await authApi.login({ username, password });
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAuthToken(token);
    set({ token, user });
  },

  register: async (params) => {
    await authApi.register(params);
    // 注册成功不立即登录，需要先验证邮箱
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    set({ token: null, user: null });
  },

  handleUnauthorized: () => {
    SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setAuthToken(null);
    set({ token: null, user: null });
  },
}));
