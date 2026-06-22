// ═══════════════════════════════════════
//  GASTRO POS — db.js
//  IndexedDB: apertura, CRUD genérico
// ═══════════════════════════════════════

const DB_NAME = 'GastroPOS';
const DB_VER  = 1;

function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VER);

    req.onupgradeneeded = e => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains('products'))
        db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });

      if (!db.objectStoreNames.contains('categories'))
        db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });

      if (!db.objectStoreNames.contains('orders'))
        db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });

      if (!db.objectStoreNames.contains('inventory'))
        db.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });

      if (!db.objectStoreNames.contains('suppliers'))
        db.createObjectStore('suppliers', { keyPath: 'id', autoIncrement: true });

      if (!db.objectStoreNames.contains('expenses'))
        db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });

      if (!db.objectStoreNames.contains('cashlog'))
        db.createObjectStore('cashlog', { keyPath: 'id', autoIncrement: true });
    };

    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}

async function dbGetAll(store) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}

async function dbGet(store, id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(id);
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}

async function dbPut(store, data) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).put(data);
    req.onsuccess = e => res(e.target.result); // retorna el id generado
    req.onerror   = e => rej(e.target.error);
  });
}

async function dbDelete(store, id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).delete(id);
    req.onsuccess = () => res();
    req.onerror   = e => rej(e.target.error);
  });
}

async function dbClear(store) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).clear();
    req.onsuccess = () => res();
    req.onerror   = e => rej(e.target.error);
  });
}

// Insertar múltiples registros de una vez
async function dbPutMany(store, items) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readwrite');
    const os  = tx.objectStore(store);
    items.forEach(item => os.put(item));
    tx.oncomplete = () => res();
    tx.onerror    = e => rej(e.target.error);
  });
}