import { fetchEarthquakes } from './lib/earthquakes';
import { el, element, formatDate } from './lib/utils';
import { init, createPopup, clearMarkers } from './lib/map';

function addLoading() {
  const loading = document.querySelector('.loading');
  if (loading.classList.contains('hidden')) {
    loading.classList.toggle('hidden');
  }
}
function removeLoading() {
  // Fjarlægjum loading skilaboð eftir að við höfum sótt gögn
  const loading = document.querySelector('.loading');
  if (!loading.classList.contains('hidden')) {
    loading.classList.add('hidden');
  }
}

function checkError(earthquakes) {
  const loading = document.querySelector('.loading');
  const parent = loading.parentNode;
  if (!earthquakes) {
    parent.appendChild(
      el('p', { class: 'error' }, 'Villa við að sækja gögn'),
    );
    return false;
  }
  return true;
}

function clearDOM() {
  clearMarkers();
  const h1 = document.querySelector('h1');
  while (h1.firstChild) {
    h1.removeChild(h1.firstChild);
  }

  const cache = document.querySelector('.cache');
  while (cache.firstChild) {
    cache.removeChild(cache.firstChild);
  }
  const earthquakes = document.querySelector('.earthquakes');
  while (earthquakes.firstChild) {
    earthquakes.removeChild(earthquakes.firstChild);
  }
  const error = document.querySelector('.error');
  if (error) {
    error.parent.removeChild(error);
  }
}

function populateList(earthquakes, desc) {
  const h1 = document.querySelector('h1');
  const cache = document.querySelector('.cache');
  const isCached = earthquakes.info.cached ? '' : 'not';
  h1.append(desc);
  cache.append(`Data has ${isCached} been cached. Request took ${earthquakes.info.time} seconds.`);
  const ul = document.querySelector('.earthquakes');
  earthquakes.data.features.forEach((quake) => {
    const {
      title, mag, time, url,
    } = quake.properties;

    const link = element('a', { href: url, target: '_blank' }, null, 'Skoða nánar');

    const markerContent = el('div',
      el('h3', title),
      el('p', formatDate(time)),
      el('p', link));
    const marker = createPopup(quake.geometry, markerContent.outerHTML);

    const onClick = () => {
      marker.openPopup();
    };

    const li = el('li');

    li.appendChild(
      el('div',
        el('h2', title),
        el('dl',
          el('dt', 'Tími'),
          el('dd', formatDate(time)),
          el('dt', 'Styrkur'),
          el('dd', `${mag} á richter`),
          el('dt', 'Nánar'),
          el('dd', url.toString())),
        element('div', { class: 'buttons' }, null,
          element('button', null, { click: onClick }, 'Sjá á korti'),
          link)),
    );

    ul.appendChild(li);
  });
}

async function updateSearchDOM() {
  const nav = document.querySelector('.nav');
  const list = nav.querySelectorAll('.list');

  list.forEach((li) => {
    const h2 = li.querySelector('h2');
    const as = li.querySelectorAll('a');

    as.forEach((a) => {
      a.addEventListener('click', async (event) => {
        event.preventDefault();
        clearDOM();
        addLoading();
        const url = new URL(event.target.href);
        const query = url.searchParams;
        const type = query.has('type') ? query.get('type') : 'all';
        const period = query.has('period') ? query.get('period') : 'hour';

        const earthquakes = await fetchEarthquakes(type, period);
        removeLoading();
        if (checkError(earthquakes)) {
          populateList(earthquakes, `${event.target.innerText}, ${h2.textContent.toLocaleLowerCase()}`);
        }
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // TODO
  // Bæta við virkni til að sækja úr lista
  // Nota proxy
  // Hreinsa header og upplýsingar þegar ný gögn eru sótt
  // Sterkur leikur að refactora úr virkni fyrir event handler í sér fall
  const map = document.querySelector('.map');

  init(map);

  addLoading();
  await updateSearchDOM();
  const earthquakes = await fetchEarthquakes('all', 'hour');

  // Fjarlægjum loading skilaboð eftir að við höfum sótt gögn
  removeLoading();
  if (checkError(earthquakes)) {
    populateList(earthquakes, 'Allir jarðskjálftar, seinustu klukkustund');
  }
});
