function getMeta(metaName) {
  const metas = document.getElementsByTagName('meta');
  for (let i = 0; i < metas.length; i++) {
    if (metas[i].getAttribute('name') === metaName) {
      return metas[i].getAttribute('content');
    }
  }
  return '';
}

const elementCreator = tag => (parent, className) => {
  const element = document.createElement(tag);
  if (className) element.classList.add(`surf-${className}`);
  if (parent) parent.append(element);
  return element;
};
const createImg = elementCreator('img');
const createDiv = elementCreator('div');
const createA = elementCreator('a');

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

let hrefs = [];

const createLink = (parent, rank, key) => {
  const link = createA(parent, 'link');
  link.href = rank.web.url;
  link.target = '_self';

  const header = createDiv(link, 'header');
  const shortcut = createDiv(header, 'shortcut');
  shortcut.textContent = key;
  const icon = createImg(header, 'icon');
  icon.src = rank.web.favicon;
  const title = createDiv(header, 'title');
  title.textContent = rank.web.title;

  const body = createDiv(link, 'body');
  const description = createDiv(body, 'description');
  description.textContent = rank.web.description;
  const visited = createDiv(body, 'visited');
  visited.textContent = `Visited ${rank.count} times last week.`;
};

const fixed = createDiv(toolbar, 'fixed');
const collapsable = createDiv(toolbar, 'collapsable');

let prevHref = null;
const updateRanks = () => {
  const { href } = window.location;
  if (prevHref !== href) {
    prevHref = href;
    chrome.extension.sendMessage(href, ranks => {
      toolbar.classList.add('surf-new');
      window.setTimeout(() => toolbar.classList.remove('surf-new'), 500);
      const [primary, secondary, tertiary] = ranks;
      hrefs = ranks.map(rank => rank.web.url);
      const elements = document.getElementsByClassName('surf-link');
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
      createLink(fixed, primary, '⌘+1');
      createLink(collapsable, secondary, '⌘+2');
      createLink(collapsable, tertiary, '⌘+3');
    });
  }
};

updateRanks();

window.setInterval(updateRanks, 500);

document.onkeydown = e => {
  if (e.metaKey) {
    switch (e.key) {
      case '1':
      case '2':
      case '3':
        e.preventDefault();
        window.location.href = hrefs[e.key - '1'];
        break;
    }
  }
};
