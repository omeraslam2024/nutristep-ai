/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "b53c486d767f4fd32f3a8eded9e0ba80"
  }, {
    "url": "pwa-512x512.png",
    "revision": "b53c486d767f4fd32f3a8eded9e0ba80"
  }, {
    "url": "pwa-192x192.png",
    "revision": "5ef7532712c7f40909409ec28f843ed2"
  }, {
    "url": "index.html",
    "revision": "423185a3e0598e6a34b3aed593204c53"
  }, {
    "url": "icon.svg",
    "revision": "0620fe101297efd4ef6d9c6be300f8dd"
  }, {
    "url": "favicon.ico",
    "revision": "9028c8293af4afa7395d80fe6d28c0ba"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "3fbbdd2128a709d50c5fc331aa4651f5"
  }, {
    "url": "assets/index-DYn0_IZn.js",
    "revision": null
  }, {
    "url": "assets/index-Bc4_3ZTI.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "3fbbdd2128a709d50c5fc331aa4651f5"
  }, {
    "url": "favicon.ico",
    "revision": "9028c8293af4afa7395d80fe6d28c0ba"
  }, {
    "url": "icon.svg",
    "revision": "0620fe101297efd4ef6d9c6be300f8dd"
  }, {
    "url": "pwa-192x192.png",
    "revision": "5ef7532712c7f40909409ec28f843ed2"
  }, {
    "url": "pwa-512x512.png",
    "revision": "b53c486d767f4fd32f3a8eded9e0ba80"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "b53c486d767f4fd32f3a8eded9e0ba80"
  }, {
    "url": "manifest.webmanifest",
    "revision": "3ff6724fbe40e38b5b87c8e053e21b4e"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/images\.unsplash\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "food-images-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
