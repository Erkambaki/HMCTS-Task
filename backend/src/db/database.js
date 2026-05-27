const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/tasks.db');

let db = null;
let SQL = null;

async function getDb() {
  if (db) return db;

  SQL = await initSqlJs();

  if (process.env.NODE_ENV !== 'test' && fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  initialise(db);
  return db;
}

function initialise(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL DEFAULT 'pending',
      due_date    TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
  `);
  persist(db);
}

function persist(db) {
  if (process.env.NODE_ENV === 'test') return;
  const data = db.export();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Helper: run a statement and persist
function run(db, sql, params = []) {
  db.run(sql, params);
  persist(db);
}

// Helper: get one row
function getOne(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

// Helper: get all rows
function getAll(db, sql, params = []) {
  const results = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function closeDb() {
  if (db) { db.close(); db = null; }
}

module.exports = { getDb, closeDb, run, getOne, getAll, persist };
