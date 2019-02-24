chrome.extension.sendMessage({}, function (response) {
  var readyStateCheckInterval = setInterval(function () {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);

      // ----------------------------------------------------------
      // This part of the script triggers when page is done loading
      console.log('Hello. This message was sent from scripts/inject.js');
      // ----------------------------------------------------------

    }
  }, 10);
});

const elementCreator = tag => (parent, className) => {
  const element = document.createElement(tag);
  if (className) element.classList.add(`surf-${className}`);
  if (parent) parent.append(element);
  return element;
};
const createImg = elementCreator('img');
const createDiv = elementCreator('div');
const createSpan = elementCreator('span');

const script = document.createElement('script');
script.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
script.onload = () => WebFont.load({ google: { families: ['Roboto', 'Roboto+Mono'] } });

const body = document.body;
body.classList.add('surf-body');

const toolbar = createDiv(null, 'toolbar');
body.prepend(toolbar);

const handle = createDiv(toolbar, 'handle');

const logo = createImg(toolbar, 'logo');
logo.src = chrome.extension.getURL('images/logo.png');

const createLink = parent => {
  const link = createDiv(parent, 'link');

  const header = createDiv(link, 'header');
  const shortcut = createDiv(header, 'shortcut');
  shortcut.textContent = `⌘+1`;
  const icon = createImg(header, 'icon');
  icon.src = 'https://image.flaticon.com/icons/svg/124/124010.svg';
  const title = createDiv(header, 'title');
  title.textContent = 'Varisa Sarah Gumpangkum';

  const body = createDiv(link, 'body');
  const description = createDiv(body, 'description');
  description.textContent = 'Facebook, Inc. is an American online social media and social networking service company. It is based in Menlo Park, California. Its was founded by Mark Zuckerberg, along with fellow Harvard College students and roommates Eduardo Saverin, Andrew McCollum, Dustin Moskovitz and Chris Hughes.';
  const visited = createDiv(body, 'visited');
  visited.textContent = 'Visited 32 times last week.';
};

createLink(toolbar);
const collapsable = createDiv(toolbar, 'collapsable');
for (let i = 0; i < 3; i++) {
  createLink(collapsable);
}
