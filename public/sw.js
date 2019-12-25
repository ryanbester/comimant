/*
Copyright (C) 2019 Bester Intranet
*/

const staticCacheName = 'static-v1';

const expectedCaches = [
    staticCacheName
];

const safeUrls = [
    'https://www.besterintranet.',
    'https://static.besterintranet.',
    'https://ajax.googleapis.com',
    'https://cdnjs.cloudflare.com'
];

const staticUrls = [
    '/offline-page.html',
    'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js',
    'https://static.besterintranet.com/assets/images/logo_white.png',
    'https://static.besterintranet.com/assets/images/logo_white96x96.png',
    'https://static.besterintranet.com/assets/images/logo.png',
    'https://static.besterintranet.com/favicon.ico',
    'https://static.besterintranet.com/assets/images/logo96x96.png',
    'https://static.besterintranet.com/assets/images/downarrow16x16.png',
    'https://static.besterintranet.com/assets/images/downarrow32x32.png',
    '/stylesheets/style.css'
];

const dynamicUrls = [
    '/',
    '/scripts/grid.js',
    '/scripts/dialog.js',
    '/scripts/main.js'
];

const arrayIncludesPrefix = (url, safeUrls) => {
    for(var i = 0; i < safeUrls.length; i++) {
        if(url.startsWith(safeUrls[i])) {
            return true;
        }
    }

    return false;
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(staticCacheName).then(cache => {
            return cache.addAll(staticUrls.concat(dynamicUrls));
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (!expectedCaches.includes(key)) {
                    return caches.delete(key);
                }
            })
        ))
    )
});

self.addEventListener('fetch', event => {
    if(event.request.mode === 'navigate' || (event.request.method == 'GET' && event.request.headers.get('accept').includes('text/html'))) {
        if(event.request.url == "https://" + self.location.hostname + "/") {
            event.respondWith(
                caches.open(staticCacheName).then(cache => {
                    return cache.match(event.request).then(response => {
                        var fetchPromise = fetch(event.request).then(networkResponse => {
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        });
                        return response || fetchPromise;        
                    });
                })
            ); 
        } else {
            event.respondWith(
                fetch(event.request.url).catch(error => {
                    return caches.match('/offline-page.html');
                })
            );
        }
    } else {
        event.respondWith(
            caches.open(staticCacheName).then(cache => {
                return cache.match(event.request).then(response => {
                    for(var i = 0; i < dynamicUrls.length; i++) {
                        url = dynamicUrls[i];
                        if(url.startsWith('/')) {
                            url = "https://" + self.location.hostname + url;
                        }

                        if(url == event.request.url) {
                            if(arrayIncludesPrefix(event.request.url, safeUrls)){
                                var fetchPromise = fetch(event.request).then(networkResponse => {
                                    cache.put(event.request, networkResponse.clone());
                                    return networkResponse;
                                });
                                return response || fetchPromise;
                            }
                        }
                    }
                        
                    return response;
                });
            })
        );
    }
});