export const BASE = '/grandma/routes';

export const ROOMS = {
  'living-room': { title: 'Living room', text: 'Two chairs, one lamp, and a radio that only gets the news.' },
  kitchen: { title: 'Kitchen', text: 'The kettle is on. It is always on.' },
  porch: { title: 'Porch', text: 'Shoes off here, dear.' },
};

export function matchRoute(pathname) {
  const rest = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : '';
  const slug = rest.replace(/^\/+|\/+$/g, '');
  if (slug === '') return { name: 'home' };
  if (Object.hasOwn(ROOMS, slug)) return { name: 'room', slug };
  return { name: 'missing' };
}

function viewFor(route) {
  if (route.name === 'room') return ROOMS[route.slug];
  if (route.name === 'home') return { title: 'Grandma’s house', text: 'Pick a room. Nothing slams shut when you move between them.' };
  return { title: 'Hmph.', text: 'There is no room called that.' };
}

function render(route) {
  const { title, text } = viewFor(route);
  const view = document.getElementById('view');
  const heading = document.createElement('h1');
  heading.textContent = title;
  const body = document.createElement('p');
  body.textContent = text;
  view.replaceChildren(heading, body);
  document.title = `${title} · Grandma’s house`;
  for (const link of document.querySelectorAll('nav a')) {
    if (link.pathname === location.pathname) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

if (typeof document !== 'undefined') {
  document.querySelector('nav').addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    history.pushState(null, '', link.pathname);
    render(matchRoute(location.pathname));
  });
  window.addEventListener('popstate', () => render(matchRoute(location.pathname)));
  render(matchRoute(location.pathname));
}
