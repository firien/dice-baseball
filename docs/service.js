const tag = 1;
const prefix = 'DICEBB';
const cacheName = `${prefix}-${tag}`

const urls = [
  '/dice-baseball/javascripts/die.js',
  '/dice-baseball/javascripts/game.js',
  '/dice-baseball/javascripts/index.js',
  '/dice-baseball/javascripts/inning.js',
  '/dice-baseball/javascripts/organ.js',
  '/dice-baseball/javascripts/peer.js',
  '/dice-baseball/javascripts/player.js',
  '/dice-baseball/javascripts/team.js',
  '/dice-baseball/javascripts/utils.js',
  '/dice-baseball/javascripts/worker.js',
  '/dice-baseball/stylesheets/index.css',
  '/dice-baseball/images/icon-152.png',
  '/dice-baseball/images/icon-167.png',
  '/dice-baseball/images/icon-180.png',
  '/dice-baseball/images/icon-192.png',
  '/dice-baseball/images/icon-512.png',
  '/dice-baseball/fonts/font.ttf',
  '/dice-baseball/fonts/font.woff2',
  '/dice-baseball/fonts/font.svg',
  '/dice-baseball/sheet.pdf',
  '/dice-baseball/index.html',
  '/dice-baseball/',
]

self.addEventListener('install', (event) => {
  return event.waitUntil(caches.open(cacheName).then((cache) => {
    return cache.addAll(urls)
  }))
})

const clearPreviousCaches = () => {
  return caches.keys().then((keys) => {
    return Promise.all(keys.filter((key) => {
      return (key != cacheName) && key.startsWith(prefix)
    }).map(key => caches.delete(key)))
  })
}

self.addEventListener('activate', (event) => {
  return event.waitUntil(clearPreviousCaches())
})

self.addEventListener('fetch', (event) => {
  return event.respondWith(
    caches.open(cacheName).then((cache) => {
      return cache.match(event.request, {ignoreSearch: true})
    }).then((response) => {
      return response || fetch(event.request)
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    return self.skipWaiting()
  }
})
