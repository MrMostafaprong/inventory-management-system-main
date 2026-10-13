// SQLite persistence layer (server-only). Singleton + schema + seed.
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'
import {
  mockItems,
  mockSuppliers,
  mockIncomingTransactions,
  mockOutgoingTransactions,
  mockExpenses,
  mockChecklists,
} from '@/lib/mock-data'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'db.sqlite')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

type Db = Database.Database
const g = globalThis as unknown as { __wmsDb?: Db }

export function getDb(): Db {
  if (g.__wmsDb) return g.__wmsDb
  ensureDir()
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  seed(db)
  g.__wmsDb = db
  return db
}

function migrate(db: Db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'custom',
      permissions TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit_of_measure TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      reorder_level REAL NOT NULL DEFAULT 1,
      last_updated TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS incoming_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      invoice_number TEXT NOT NULL DEFAULT '',
      receipt_date TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS outgoing_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      sale_date TEXT NOT NULL,
      destination TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      expense_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      due_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS alert_state (
      alert_key TEXT PRIMARY KEY,
      is_read INTEGER NOT NULL DEFAULT 0,
      dismissed INTEGER NOT NULL DEFAULT 0
    );
  `)
}

// ─── Seed (first run only) ────────────────────────────────────────────────────
function tableEmpty(db: Db, table: string): boolean {
  const row = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }
  return row.c === 0
}

const SEED_USERS = [
  { name: 'مصطفى أحمد', username: 'مصطفى', password: 'Mustafa-2024-Secure!', role: 'owner',
    permissions: ['dashboard','manage_items','manage_suppliers','manage_transactions','manage_expenses','view_daily_balance','view_reports','view_stock_status','view_alerts','manage_checklists','manage_users'] },
  { name: 'أحمد محمد', username: 'admin', password: 'Admin-2024-Secure!', role: 'admin',
    permissions: ['dashboard','manage_items','manage_suppliers','manage_transactions','manage_expenses','view_daily_balance','view_reports','view_stock_status','view_alerts','manage_checklists','manage_users'] },
  { name: 'محمد علي', username: 'warehouse', password: 'Warehouse-2024-Secure!', role: 'warehouse',
    permissions: ['dashboard','manage_items','manage_suppliers','manage_transactions','view_alerts','view_stock_status'] },
  { name: 'سارة إبراهيم', username: 'cashier', password: 'Cashier-2024-Secure!', role: 'cashier',
    permissions: ['dashboard','manage_transactions','manage_expenses','view_daily_balance'] },
]

function seed(db: Db) {
  const now = new Date().toISOString()
  if (tableEmpty(db, 'users')) {
    const stmt = db.prepare(
      'INSERT INTO users (name, username, password_hash, role, permissions, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    const tx = db.transaction(() => {
      for (const u of SEED_USERS) {
        stmt.run(u.name, u.username, bcrypt.hashSync(u.password, 12), u.role, JSON.stringify(u.permissions), now)
      }
    })
    tx()
  }
  if (tableEmpty(db, 'items')) {
    const stmt = db.prepare(
      'INSERT INTO items (name, category, unit_of_measure, quantity, reorder_level, last_updated) VALUES (?, ?, ?, ?, ?, ?)'
    )
    const tx = db.transaction(() => {
      for (const i of mockItems) stmt.run(i.name, i.category, i.unit_of_measure, i.quantity, i.reorder_level, i.last_updated)
    })
    tx()
  }
  if (tableEmpty(db, 'suppliers')) {
    const stmt = db.prepare(
      'INSERT INTO suppliers (name, contact_person, phone, email, address, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    const tx = db.transaction(() => {
      for (const s of mockSuppliers) stmt.run(s.name, s.contact_person, s.phone, s.email, s.address, s.status, s.created_at)
    })
    tx()
  }
  if (tableEmpty(db, 'incoming_transactions')) {
    const stmt = db.prepare(
      'INSERT INTO incoming_transactions (supplier_id, item_id, quantity, unit_price, total_price, invoice_number, receipt_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    const tx = db.transaction(() => {
      for (const t of mockIncomingTransactions) stmt.run(t.supplier_id, t.item_id, t.quantity, t.unit_price, t.total_price, t.invoice_number, t.receipt_date, t.notes, t.created_at)
    })
    tx()
  }
  if (tableEmpty(db, 'outgoing_transactions')) {
    const stmt = db.prepare(
      'INSERT INTO outgoing_transactions (item_id, quantity, unit_price, total_price, sale_date, destination, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    const tx = db.transaction(() => {
      for (const t of mockOutgoingTransactions) stmt.run(t.item_id, t.quantity, t.unit_price, t.total_price, t.sale_date, t.destination, t.notes, t.created_at)
    })
    tx()
  }
  if (tableEmpty(db, 'expenses')) {
    const stmt = db.prepare(
      'INSERT INTO expenses (category, amount, description, expense_date, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    const tx = db.transaction(() => {
      for (const e of mockExpenses) stmt.run(e.category, e.amount, e.description, e.expense_date, e.created_at)
    })
    tx()
  }
  if (tableEmpty(db, 'checklists')) {
    const stmt = db.prepare(
      'INSERT INTO checklists (title, description, status, due_date, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    const tx = db.transaction(() => {
      for (const c of mockChecklists) stmt.run(c.title, c.description, c.status, c.due_date, c.created_at)
    })
    tx()
  }
}

// ─── Row mappers ──────────────────────────────────────────────────────────────
export interface UserRow {
  id: number; name: string; username: string; password_hash: string;
  role: string; permissions: string; created_at: string
}

export function publicUser(u: UserRow) {
  let permissions: string[] = []
  try { permissions = JSON.parse(u.permissions) } catch {}
  return { id: u.id, name: u.name, username: u.username, role: u.role, permissions, created_at: u.created_at }
}
