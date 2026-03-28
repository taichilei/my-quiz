const CACHE_NAME = 'my-quiz-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 请求拦截 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 缓存命中，直接返回
      if (cachedResponse) {
        return cachedResponse;
      }

      // 缓存未命中，从网络获取
      return fetch(event.request).then((response) => {
        // 不缓存非成功响应
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 克隆响应并缓存
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // 网络失败，返回离线页面（可选）
        return caches.match('/index.html');
      });
    })
  );
});
