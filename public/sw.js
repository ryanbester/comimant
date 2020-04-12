/*
Copyright (C) 2019-2020 Bester Intranet
*/

const staticCacheName = 'static-v1';

const expectedCaches = [
    staticCacheName
];

// URLs that can be fetched without access control restrictions
const safeUrls = [
    'https://www.besterintranet.',
    'https://static.besterintranet.',
    'https://ajax.googleapis.com',
    'https://cdnjs.cloudflare.com'
];

// URLs that will (usually) never change
// Cache then cache (then cache)
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
    'https://static.besterintranet.com/assets/images/error.svg',
    'https://static.besterintranet.com/assets/images/error20x20.png',
    'https://static.besterintranet.com/assets/images/loading196x196.gif',
    '/stylesheets/style.css'
];

// URLs that hold dynamic content. These are basically the skeletons.
// Cache then fetch (network on next reload)
const dynamicUrls = [
    '/',
    '/scripts/grid.js',
    '/scripts/dialog.js', 
    '/scripts/main.js',
    '/api/internal/widgets/'
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
                // Delete irrelevant caches
                if (!expectedCaches.includes(key)) {
                    return caches.delete(key);
                }
            })
        ))
    )
});

self.addEventListener('fetch', event => {
    // Only use service worker for GET requests
    if(event.request.method == 'GET') {
        if(event.request.mode == 'cors' || event.request.mode == 'no-cors') {
            if(event.request.url.endsWith('nc=1')) {
                var newUrl = event.request.url.substr(0, event.request.url.length - 5);
                event.respondWith(
                    fetch(newUrl).catch(_ => {
                        return caches.match('/offline-page.html');
                    }).then(response => {
                        caches.open(staticCacheName).then(cache => {
                            cache.put(newUrl, response.clone());
                        });

                        return response.clone();
                    })
                );
            }
        } else if(event.request.mode === 'navigate' || (event.request.method == 'GET' && event.request.headers.get('accept').includes('text/html'))) {
            if(event.request.url.startsWith("https://" + self.location.hostname + "/")) {
                if(event.request.url.endsWith('nc=1')) {
                    var newUrl = event.request.url.substr(0, event.request.url.length - 5);
                    event.respondWith(
                        fetch(newUrl).catch(_ => {
                            return caches.match('/offline-page.html');
                        }).then(response => {
                            caches.open(staticCacheName).then(cache => {
                                cache.put(newUrl, response.clone());
                            });

                            return response.clone();
                        })
                    );
                } else {
                    var urlFound = false;

                    var urls = staticUrls.concat(dynamicUrls);

                    for(var i = 0; i < urls.length; i++) {
                        url = urls[i];
                        if(url.startsWith('/')) {
                            url = "https://" + self.location.hostname + url;
                        }

                        if(url == event.request.url) {
                            urlFound = true;

                            event.respondWith(
                                caches.open(staticCacheName).then(cache => {
                                    return cache.match(event.request).then(response => {
                                        if(arrayIncludesPrefix(event.request.url, safeUrls)){
                                            var fetchPromise = fetch(event.request).then(networkResponse => {
                                                cache.put(event.request, networkResponse.clone());
                                                return networkResponse;
                                            });
                                            return response || fetchPromise;
                                        }
                                        
                                        return response;
                                    });
                                }
                            ));
                        }
                    }

                    event.respondWith(
                        // Handle no internet page
                        fetch(event.request.url).catch(error => {
                            return caches.match('/offline-page.html');
                        }).then(res => {
                            return res;
                        })
                    );
                }
            } else {
                event.respondWith(
                    // Handle no internet page
                    fetch(event.request.url).catch(error => {
                        return caches.match('/offline-page.html');
                    })
                );
            }
        } else {
            var urlFound = false;

            var urls = staticUrls.concat(dynamicUrls);

            for(var i = 0; i < urls.length; i++) {
                url = urls[i];
                if(url.startsWith('/')) {
                    url = "https://" + self.location.hostname + url;
                }

                if(url == event.request.url) {
                    urlFound = true;
                    event.respondWith(
                        caches.open(staticCacheName).then(cache => {
                            return cache.match(event.request).then(response => {
                                if(arrayIncludesPrefix(event.request.url, safeUrls)){

                                    var fetchPromise = fetch(event.request).then(networkResponse => {
                                        cache.put(event.request, networkResponse.clone());
                                        return networkResponse;
                                    });
                                    return response || fetchPromise;
                                }
                                
                                return response;
                            });
                        }
                    ));
                }
            }

            if(!urlFound) {
                return false;
            }
        }
    }
});