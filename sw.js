// Oude service worker van Slimmer Wonen opruimen: de app staat nu op /maatklaar/.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k.startsWith('slimmer-wonen')).map((k) => caches.delete(k)))
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: 'window' })
      for (const c of clients) c.navigate(c.url)
    })(),
  )
})
