const webData = {
  'https://facebook.com': {
    'url': 'http://facebook.com',
    'title': 'Facebook',
    'favicon': 'https://static.xx.fbcdn.net/rsrc.php/yr/r/9HGsoCeRtRY.ico',
    'description': 'Create an account or log into Facebook. Connect with friends, family and other people you know. Share photos and videos, send messages and get updates.',
  },
  'https://github.com': {
    'url': 'https://github.com',
    'title': 'GitHub',
    'favicon': 'https://github.githubassets.com/favicon.ico',
    'description': 'GitHub is where people build software. More than 31 million people use GitHub to discover, fork, and contribute to over 100 million projects.',
  },
  'https://google.com': {
    'url': 'https://google.com',
    'title': 'Google',
    'favicon': 'https://www.google.com/favicon.ico',
    'description': 'Search the world\'s information, including webpages, images, videos and more. Google has many special features to help you find exactly what you\'re looking for.',
  },
  'https://github.com/': {
    'favicon': 'https://github.githubassets.com/favicon.ico',
    'url': 'https://github.com/',
    'title': 'GitHub',
    'description': 'GitHub is where people build software. More than 31 million people use GitHub to discover, fork, and contribute to over 100 million projects.',
  },
  'https://github.com/algorithm-visualizer/algorithm-visualizer/issues/237': {
    'url': 'https://github.com/algorithm-visualizer/algorithm-visualizer/issues/237',
    'favicon': 'https://github.githubassets.com/favicon.ico',
    'title': 'Advice on suitability for HMM algorithms · Issue #237 · algorithm-visualizer/algorithm-visualizer',
    'description': 'Do you think it would be very doable to develop a visualization of the Viterbi algorithm under the provided API? https://www.youtube.com/watch?v=0dVUfYF8ko0',
  },
  'https://github.com/algorithm-visualizer/algorithm-visualizer': {
    'url': 'https://github.com/algorithm-visualizer/algorithm-visualizer',
    'title': 'algorithm-visualizer/algorithm-visualizer: Interactive Online Platform that Visualizes Algorithms from Code',
    'favicon': 'https://github.githubassets.com/favicon.ico',
    'description': ':fireworks:Interactive Online Platform that Visualizes Algorithms from Code - algorithm-visualizer/algorithm-visualizer',
  },
  'https://github.com/algorithm-visualizer/tracers.js': {
    'url': 'https://github.com/algorithm-visualizer/tracers.js',
    'title': 'algorithm-visualizer/tracers.js: Visualization Library for JavaScript',
    'favicon': 'https://github.githubassets.com/favicon.ico',
    'description': 'Visualization Library for JavaScript. Contribute to algorithm-visualizer/tracers.js development by creating an account on GitHub.',
  },
  'https://github.com/parkjs814/gt-schedule-crawler': {
    'url': 'https://github.com/parkjs814/gt-schedule-crawler',
    'title': 'parkjs814/gt-schedule-crawler',
    'favicon': 'https://github.githubassets.com/favicon.ico',
    'description': 'Contribute to parkjs814/gt-schedule-crawler development by creating an account on GitHub.',
  },
  'https://github.com/parkjs814/gt-scheduler': {
    'url': 'https://github.com/parkjs814/gt-scheduler',
    'title': 'parkjs814/gt-scheduler: GT Scheduler',
    'favicon': 'https://github.githubassets.com/favicon.ico',
    'description': ':calendar: GT Scheduler. Contribute to parkjs814/gt-scheduler development by creating an account on GitHub.',
  },
  'https://github.com/Homebrew/brew': {
    'url': 'https://github.com/Homebrew/brew',
    'title': 'Homebrew/brew: 🍺 The missing package manager for macOS (or Linux)',
    'favicon': 'https://github.githubassets.com/favicon.ico',
    'description': '🍺 The missing package manager for macOS (or Linux) - Homebrew/brew',
  },
};
const ranksMap = {};
for (const web1 of Object.values(webData)) {
  ranksMap[web1.url] = [];
  for (const web2 of Object.values(webData)) {
    if (web1 === web2) continue;
    const sameDomain = web1.url.split('/')[2] === web2.url.split('/')[2];
    ranksMap[web1.url].push({
      web: web2,
      count: 1 + (sameDomain ? Math.random() * 15 : Math.random() * 2) | 0,
      duration: 5000 + (sameDomain ? Math.random() * 1000 * 60 * 60 : Math.random() * 1000 * 60 * 8) | 0,
    });
  }
}

const sanitize = url => url && (~url.indexOf('youtube') ? url.split('&')[0] : url.split('?')[0]);

const tabUrls = {};
const tabTimestamps = {};
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if ('favIconUrl' in changeInfo) {
    const url = sanitize(tab.url);
    if (!webData[url]) webData[url] = {};
    webData[url].favicon = changeInfo.favIconUrl;
  }
  if ('title' in changeInfo) {
    const url = sanitize(tab.url);
    if (!webData[url]) webData[url] = {};
    webData[url].title = changeInfo.title;
  }
  if ('url' in changeInfo) {
    const now = Number(new Date());
    const fromUrl = tabUrls[tabId];
    const toUrl = sanitize(changeInfo.url);
    const duration = tabId in tabTimestamps ? now - tabTimestamps[tabId] : 0;

    setTimeout(() =>
      chrome.tabs.executeScript(tab.id, { code: 'getMeta(\'description\');' }, description => {
        if (!webData[toUrl]) webData[toUrl] = {};
        webData[toUrl].description = Array.isArray(description) ? description[0] : description;
      }), 1000);

    if (fromUrl) {
      if (!ranksMap[fromUrl]) ranksMap[fromUrl] = [];
      const rank = ranksMap[fromUrl].find(rank => rank.web.url === toUrl);
      if (rank) {
        rank.count++;
        rank.duration += duration;
      } else {
        webData[toUrl] = {
          ...(webData[toUrl] || {}),
          url: toUrl,
          title: tab.title,
          favicon: tab.favIconUrl,
          description: '',
        };
        ranksMap[fromUrl].push({
          web: webData[toUrl],
          count: 1,
          duration,
        });
      }
    }

    tabUrls[tabId] = toUrl;
    tabTimestamps[tabId] = now;
  }
});

chrome.extension.onMessage.addListener((url, sender, sendResponse) => {
  if (!ranksMap[sanitize(url)]) ranksMap[sanitize(url)] = [];
  const ranks = ranksMap[sanitize(url)];
  while (ranks.length < 3) {
    const web = Object.values(webData).find(web => ranks.every(rank => rank.web !== web));
    ranks.push({
      web,
      count: (Math.random() * 2 | 0) + 1,
      duration: (Math.random() * 1000 * 60 * 60 | 0) + 2000,
    });
  }
  sendResponse(ranks.sort((r1, r2) => r2.count - r1.count));
});
