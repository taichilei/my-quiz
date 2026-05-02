import { Redirect, Tabs, type Href } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/authStore';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const bootstrapping = useAuthStore((s) => s.bootstrapping);
  const token = useAuthStore((s) => s.token);

  // 启动期还在恢复 token：什么都不渲染，避免短暂闪登录页
  if (bootstrapping) return null;

  // 没 token 就跳登录页；登录成功后 store 更新会重新渲染并放行
  // typed routes 需要等 expo dev server 启动后才能生成 /login 的字面量类型，
  // 此处先用 Href 强转绕过冷启动期类型缺失。
  if (!token) return <Redirect href={'/login' as Href} />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
