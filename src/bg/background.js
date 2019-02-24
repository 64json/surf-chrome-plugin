chrome.extension.onMessage.addListener((url, sender, sendResponse) => {
  if(!ranksMap[sanitize(url)]) ranksMap[sanitize(url)] = [];
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

const ranksMap = {};
const webData = {
  'https://facebook.com': {
    url: 'http://facebook.com',
    title: 'Facebook',
    favicon: 'https://static.xx.fbcdn.net/rsrc.php/yr/r/9HGsoCeRtRY.ico',
    description: 'Create an account or log into Facebook. Connect with friends, family and other people you know. Share photos and videos, send messages and get updates.',
  },
  'https://github.com': {
    url: 'https://github.com',
    title: 'GitHub',
    favicon: 'https://github.githubassets.com/favicon.ico',
    description: 'GitHub is where people build software. More than 31 million people use GitHub to discover, fork, and contribute to over 100 million projects.',
  },
  'https://google.com': {
    url: 'https://google.com',
    title: 'Google',
    favicon: 'https://www.google.com/favicon.ico',
    description: 'Search the world\'s information, including webpages, images, videos and more. Google has many special features to help you find exactly what you\'re looking for.',
  },
};

const sanitize = url => url;

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
        webData[toUrl].description = description;
      }), 500);

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
