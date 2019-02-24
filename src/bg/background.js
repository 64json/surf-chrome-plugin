const sanitize = url => url && (
  (~url.indexOf('youtube') || ~url.indexOf('facebook.com/profile.php')) ? url.split('&')[0] : url.split('?')[0]
);
const isSameDomain = (url1, url2) => url1.split('/')[2] === url2.split('/')[2];
const generateId = () => {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < 8; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};
const getId = url => {
  const sanitizedUrl = sanitize(url);
  return Object.keys(webs).find(key => webs[key].url === sanitizedUrl);
};
const shuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const webs = {};

const tabUrls = {};
const tabTimestamps = {};
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if ('url' in changeInfo) {
    const { url } = changeInfo;
    const sanitizedUrl = sanitize(url);
    let id = getId(url);
    if (!id) {
      id = generateId();

      const possibleWebIds = shuffle(Object.keys(webs).filter(id => webs[id].url && isSameDomain(url, webs[id].url)));
      webs[id] = {
        url: sanitizedUrl,
        title: tab.title || '',
        favicon: tab.favIconUrl || '',
        description: '',
        ranks: possibleWebIds.slice(0, Math.min(3, possibleWebIds.length)).map(webId => ({
          web: webId,
          count: Math.random() * 3 + 1 | 0,
          duration: Math.random() * 1000 * 60 * 10 + 5000 | 0,
        })),
      };
      websRef.child(id).set(webs[id]);

      setTimeout(() =>
        chrome.tabs.executeScript(tab.id, { code: ~sanitizedUrl.indexOf('youtube') ? 'document.getElementsByClassName(\'content\')[0].textContent;' : 'getMeta(\'description\');' }, res => {
          webs[id].description = (Array.isArray(res) ? res[0] : res) || '';
          websRef.child(id).child('description').set(webs[id].description);
        }), 1000);
    }
  }
  if ('favIconUrl' in changeInfo) {
    const id = getId(tab.url);
    if (id) {
      webs[id].favicon = changeInfo.favIconUrl || '';
      websRef.child(id).child('favicon').set(webs[id].favicon);
    }
  }
  if ('title' in changeInfo) {
    const id = getId(tab.url);
    if (id) {
      webs[id].title = changeInfo.title || '';
      websRef.child(id).child('title').set(webs[id].title);
    }
  }
  if ('url' in changeInfo) {
    const now = Number(new Date());
    const fromUrl = tabUrls[tabId];
    const toUrl = tab.url;
    const fromId = getId(fromUrl);
    const toId = getId(toUrl);
    const duration = tabId in tabTimestamps ? now - tabTimestamps[tabId] : 0;

    if (fromId) {
      const rank = webs[fromId].ranks.find(rank => rank.web === toId);
      if (rank) {
        rank.count++;
        rank.duration += duration;
      } else {
        webs[fromId].ranks.push({
          web: toId,
          count: 1,
          duration,
        });
      }
      webs[fromId].ranks.sort((r1, r2) => r2.count - r1.count);
      websRef.child(fromId).child('ranks').set(webs[fromId].ranks);
    }

    tabUrls[tabId] = toUrl;
    tabTimestamps[tabId] = now;
  }
});

var config = {
  apiKey: 'AIzaSyC-ZPHINrBMVShY-5jvD-DGt-9pCa9TLwE',
  authDomain: 'surf-4fabd.firebaseapp.com',
  databaseURL: 'https://surf-4fabd.firebaseio.com',
  projectId: 'surf-4fabd',
  storageBucket: 'surf-4fabd.appspot.com',
  messagingSenderId: '875763902595',
};
const app = firebase.initializeApp(config);
const db = app.database();
const websRef = db.ref('webs');
const currentIdRef = db.ref('currentId');
const currentUrlRef = db.ref('currentUrl');
websRef.once('value', function (snap) {
  snap.forEach(child => {
    const key = child.key;
    const value = child.val();
    webs[key] = {
      url: '',
      title: '',
      favicon: '',
      description: '',
      ranks: [],
      ...value,
    };
  });
});

chrome.extension.onMessage.addListener((request, sender, sendResponse) => {
  if (!request) return;
  if (request.method === 'getRanks') {
    const { url } = request;
    let id = getId(url);
    if (!id) {
      let ids = Object.keys(webs).filter(id => webs[id].url && isSameDomain(url, webs[id].url));
      if (!ids.length) ids = Object.keys(webs);
      id = ids[Math.random() * ids.length | 0];
    }
    sendResponse(webs[id].ranks.map(rank => ({ ...rank, web: webs[rank.web] })));
    currentIdRef.set(id);
    currentUrlRef.set(url);
  } else if (request.method === 'getWebs') {
    sendResponse(webs);
  }
});
