// lib/db.ts (VERSION VERCEL avec Turso)
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url: (dbUrl && dbUrl.trim() !== "") ? dbUrl : "file:database.sqlite",
    authToken: dbToken || undefined,
});

// Initialisation
async function initDB() {
    await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT '🍽️',
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image TEXT,
      category_id INTEGER NOT NULL,
      is_available INTEGER DEFAULT 1,
      is_popular INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

    // Initialiser les settings par défaut
    const settingsCount = await db.execute('SELECT COUNT(*) as count FROM settings');
    if ((settingsCount.rows[0] as any).count === 0) {
        const defaults = [
            ['site_name', process.env.NEXT_PUBLIC_SITE_NAME || '300FOOD'],
            ['phone', process.env.NEXT_PUBLIC_PHONE || ''],
            ['address', process.env.NEXT_PUBLIC_ADDRESS || ''],
            ['whatsapp', process.env.NEXT_PUBLIC_WHATSAPP || ''],
            ['facebook', process.env.NEXT_PUBLIC_FACEBOOK || ''],
            ['instagram', process.env.NEXT_PUBLIC_INSTAGRAM || ''],
            ['tiktok', process.env.NEXT_PUBLIC_TIKTOK || ''],
        ];
        for (const [key, value] of defaults) {
            await db.execute({
                sql: 'INSERT INTO settings (key, value) VALUES (?, ?)',
                args: [key, value],
            });
        }
    }

    // Vérifier si les catégories existent
    const cats = await db.execute('SELECT COUNT(*) as count FROM categories');
    if ((cats.rows[0] as any).count === 0) {
        const categories = [
            ['Burgers', '🍔', 1], ['Pizzas', '🍕', 2], ['Tacos', '🌮', 3],
            ['Sandwiches', '🥪', 4], ['Poulet', '🍗', 5], ['Salades', '🥗', 6],
            ['Boissons', '🥤', 7], ['Desserts', '🍰', 8],
        ];
        for (const [name, icon, order] of categories) {
            await db.execute({
                sql: 'INSERT INTO categories (name, icon, order_index) VALUES (?, ?, ?)',
                args: [name, icon, order],
            });
        }
    }

    // Admin par défaut
    const admins = await db.execute('SELECT COUNT(*) as count FROM admin_users');
    if ((admins.rows[0] as any).count === 0) {
        const hash = bcrypt.hashSync('admin123', 10);
        await db.execute({
            sql: 'INSERT INTO admin_users (username, password) VALUES (?, ?)',
            args: ['admin', hash],
        });
    }
}

// Appeler l'init au démarrage
initDB().catch(console.error);

export async function getMenuItems(categoryId?: number, search?: string) {
    let sql = `SELECT m.*, c.name as category_name, c.icon as category_icon 
             FROM menu_items m JOIN categories c ON m.category_id = c.id WHERE 1=1`;
    const args: any[] = [];

    if (categoryId) { sql += ' AND m.category_id = ?'; args.push(categoryId); }
    if (search) { sql += ' AND (m.name LIKE ? OR m.description LIKE ?)'; args.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY c.order_index, m.is_popular DESC, m.name';

    const result = await db.execute({ sql, args });
    return result.rows;
}

export async function getCategories() {
    const result = await db.execute('SELECT * FROM categories ORDER BY order_index');
    return result.rows;
}

export async function getMenuItem(id: number) {
    const result = await db.execute({
        sql: 'SELECT m.*, c.name as category_name FROM menu_items m JOIN categories c ON m.category_id = c.id WHERE m.id = ?',
        args: [id],
    });
    return result.rows[0] || null;
}

export async function createMenuItem(data: any) {
    const result = await db.execute({
        sql: 'INSERT INTO menu_items (name, description, price, category_id, image, is_available, is_popular) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [data.name, data.description, data.price, data.category_id, data.image || null, data.is_available ?? 1, data.is_popular ?? 0],
    });
    return result;
}

export async function updateMenuItem(id: number, data: any) {
    const allowedFields = ['name', 'description', 'price', 'category_id', 'image', 'is_available', 'is_popular'];
    const fields: string[] = [];
    const args: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
        if (allowedFields.includes(key) && value !== undefined) {
            fields.push(`${key} = ?`);
            args.push(value);
        }
    });

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    args.push(id);
    return db.execute({ sql: `UPDATE menu_items SET ${fields.join(', ')} WHERE id = ?`, args });
}

export async function deleteMenuItem(id: number) {
    return db.execute({ sql: 'DELETE FROM menu_items WHERE id = ?', args: [id] });
}

export async function getPopularItems() {
    const result = await db.execute(
        'SELECT m.*, c.name as category_name, c.icon as category_icon FROM menu_items m JOIN categories c ON m.category_id = c.id WHERE m.is_popular = 1 AND m.is_available = 1 ORDER BY m.name LIMIT 8'
    );
    return result.rows;
}

export async function verifyAdmin(username: string, password: string) {
    const result = await db.execute({ sql: 'SELECT * FROM admin_users WHERE username = ?', args: [username] });
    const admin = result.rows[0] as any;
    if (!admin) return null;
    return bcrypt.compareSync(password, admin.password) ? admin : null;
}

// Category Management
export async function createCategory(data: any) {
    return await db.execute({
        sql: 'INSERT INTO categories (name, icon, order_index) VALUES (?, ?, ?)',
        args: [data.name, data.icon || '🍽️', data.order_index || 0],
    });
}

export async function updateCategory(id: number, data: any) {
    const allowedFields = ['name', 'icon', 'order_index'];
    const fields: string[] = [];
    const args: any[] = [];
    Object.entries(data).forEach(([key, value]) => {
        if (allowedFields.includes(key) && value !== undefined) {
            fields.push(`${key} = ?`);
            args.push(value);
        }
    });
    if (fields.length === 0) return;
    args.push(id);
    return await db.execute({ sql: `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, args });
}

export async function deleteCategory(id: number) {
    // Note: This might fail if items are linked to this category (Foreign Key)
    // We should decide if we want to delete items too or just prevent deletion.
    return await db.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [id] });
}

// Settings
export async function getSettings() {
    const result = await db.execute('SELECT * FROM settings');
    const settings: any = {};
    result.rows.forEach((row: any) => {
        settings[row.key] = row.value;
    });
    return settings;
}

export async function updateSettings(settings: any) {
    for (const [key, value] of Object.entries(settings)) {
        await db.execute({
            sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
            args: [key, value as string],
        });
    }
}