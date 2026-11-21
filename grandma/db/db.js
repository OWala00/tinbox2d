const DB_NAME = 'grandma-filing-cabinet';
const STORE = 'records';
const TABS = ['A', 'B', 'C', 'D'];

let activeTab = TABS[0];
const dbReady = openDb();

function openDb() {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => {
      const store = open.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      store.createIndex('byTab', 'tab');
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}

async function withStore(mode, work) {
  const db = await dbReady;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = work(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

const addRecord = (tab, text) =>
  withStore('readwrite', (store) => store.add({ tab, text, done: false, filedAt: Date.now() }));

const listTab = (tab) =>
  withStore('readonly', (store) => store.index('byTab').getAll(IDBKeyRange.only(tab)));

const setDone = (record, done) => withStore('readwrite', (store) => store.put({ ...record, done }));

const removeRecord = (id) => withStore('readwrite', (store) => store.delete(id));

const tabsEl = document.getElementById('tabs');
const listEl = document.getElementById('records');
const emptyEl = document.getElementById('empty');
const errorEl = document.getElementById('error');

function showError(err) {
  errorEl.textContent = `Could not use the browser database: ${err?.message ?? err}`;
  errorEl.hidden = false;
}

function renderTabs() {
  tabsEl.replaceChildren(
    ...TABS.map((tab) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = tab;
      button.setAttribute('aria-pressed', String(tab === activeTab));
      button.addEventListener('click', () => {
        activeTab = tab;
        refresh();
      });
      return button;
    })
  );
}

function rowFor(record) {
  const row = document.createElement('li');
  row.className = record.done ? 'done' : '';

  const done = document.createElement('input');
  done.type = 'checkbox';
  done.checked = record.done;
  done.addEventListener('change', () => run(() => setDone(record, done.checked)));

  const text = document.createElement('span');
  text.textContent = record.text;

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.textContent = 'remove';
  remove.addEventListener('click', () => run(() => removeRecord(record.id)));

  row.append(done, text, remove);
  return row;
}

async function refresh() {
  renderTabs();
  try {
    const records = (await listTab(activeTab)).sort((a, b) => a.filedAt - b.filedAt);
    listEl.replaceChildren(...records.map(rowFor));
    emptyEl.hidden = records.length > 0;
    errorEl.hidden = true;
  } catch (err) {
    showError(err);
  }
}

async function run(action) {
  try {
    await action();
    await refresh();
  } catch (err) {
    showError(err);
  }
}

document.getElementById('add').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.getElementById('text');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  run(() => addRecord(activeTab, text));
});

refresh();
