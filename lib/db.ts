// lib/db.ts (VERSION VERCEL avec Turso)
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

const isTurso = dbUrl && dbUrl.trim() !== "" && !dbUrl.startsWith("file:");

if (isTurso) {
    console.log("Using Turso Database:", dbUrl);
} else {
    console.log("Using Local SQLite Database (file:database.sqlite)");
}

const db = createClient({
    url: isTurso ? dbUrl : "file:database.sqlite",
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

    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      is_available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
            ['base_price_pizza', '300'],
            ['base_price_sandwich', '150'],
            ['base_price_burger', '200'],
            ['base_price_tacos', '200'],
            ['base_price_crepe', '250'],
        ];
        for (const [key, value] of defaults) {
            await db.execute({
                sql: 'INSERT INTO settings (key, value) VALUES (?, ?)',
                args: [key, value],
            });
        }
    }

    // Assurer que les prix de base des catégories existent dans settings
    const defaultBasePrices = [
        ['base_price_pizza', '300'],
        ['base_price_sandwich', '150'],
        ['base_price_burger', '200'],
        ['base_price_tacos', '200'],
        ['base_price_crepe', '250'],
    ];
    for (const [key, value] of defaultBasePrices) {
        await db.execute({
            sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
            args: [key, value],
        });
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

    // Ingrédients par défaut pour le Customizer 3D (/composer)
    const ingsCount = await db.execute('SELECT COUNT(*) as count FROM ingredients');
    if ((ingsCount.rows[0] as any).count === 0) {
        const defaultIngredients = [
            // Sandwich
            ['Pain Baguette', 100, 'sandwich', 'base', 1],
            ['Pain Rond', 120, 'sandwich', 'base', 1],
            ['Pain Ciabatta', 150, 'sandwich', 'base', 1],
            ['Escalope de Poulet', 250, 'sandwich', 'viande', 1],
            ['Poulet Mariné', 300, 'sandwich', 'viande', 1],
            ['Viande Hachée', 350, 'sandwich', 'viande', 1],
            ['Merguez', 300, 'sandwich', 'viande', 1],
            ['Fromage Fondant', 50, 'sandwich', 'supplement', 1],
            ['Cheddar', 80, 'sandwich', 'supplement', 1],
            ['Mozzarella', 100, 'sandwich', 'supplement', 1],
            ['Frites', 50, 'sandwich', 'supplement', 1],
            ['Oeuf', 40, 'sandwich', 'supplement', 1],
            ['Sauce Algérienne', 0, 'sandwich', 'sauce', 1],
            ['Sauce Harissa', 0, 'sandwich', 'sauce', 1],
            ['Sauce Mayonnaise', 0, 'sandwich', 'sauce', 1],
            ['Sauce Samouraï', 0, 'sandwich', 'sauce', 1],

            // Pizza
            ['Pâte Classique', 300, 'pizza', 'base', 1],
            ['Pâte Fine', 300, 'pizza', 'base', 1],
            ['Pâte Pan', 450, 'pizza', 'base', 1],
            ['Pâte Stuffed Crust (Fromage)', 550, 'pizza', 'base', 1],
            ['Poulet Grillé', 200, 'pizza', 'viande', 1],
            ['Viande Hachée', 250, 'pizza', 'viande', 1],
            ['Pepperoni', 250, 'pizza', 'viande', 1],
            ['Thon', 200, 'pizza', 'viande', 1],
            ['Extra Mozzarella', 150, 'pizza', 'supplement', 1],
            ['Champignons', 100, 'pizza', 'supplement', 1],
            ['Olives Noires', 50, 'pizza', 'supplement', 1],
            ['Poivrons', 50, 'pizza', 'supplement', 1],
            ['Sauce Tomate Maison', 0, 'pizza', 'sauce', 1],
            ['Sauce Crème Fraîche', 0, 'pizza', 'sauce', 1],
            ['Sauce BBQ', 0, 'pizza', 'sauce', 1],

            // Burger
            ['Bun Brioché', 150, 'burger', 'base', 1],
            ['Bun Sésame', 120, 'burger', 'base', 1],
            ['Double Bun', 200, 'burger', 'base', 1],
            ['Steak Haché 150g', 300, 'burger', 'viande', 1],
            ['Double Steak Haché', 550, 'burger', 'viande', 1],
            ['Crispy Chicken', 350, 'burger', 'viande', 1],
            ['Tranche Cheddar', 80, 'burger', 'supplement', 1],
            ['Bacon de Dinde', 120, 'burger', 'supplement', 1],
            ['Oignons Caramelisés', 60, 'burger', 'supplement', 1],
            ['Cornichons & Salade', 40, 'burger', 'supplement', 1],
            ['Sauce Burger Special', 0, 'burger', 'sauce', 1],
            ['Sauce Cheesy', 0, 'burger', 'sauce', 1],

            // Tacos
            ['Galette Tacos Simple', 150, 'tacos', 'base', 1],
            ['Galette Tacos Double', 250, 'tacos', 'base', 1],
            ['Escalope', 250, 'tacos', 'viande', 1],
            ['Poulet Pané', 300, 'tacos', 'viande', 1],
            ['Viande Hachée', 350, 'tacos', 'viande', 1],
            ['Cordon Bleu', 300, 'tacos', 'viande', 1],
            ['Sauce Fromagère Maison', 100, 'tacos', 'supplement', 1],
            ['Extra Cheddar', 80, 'tacos', 'supplement', 1],
            ['Frites Intérieures', 50, 'tacos', 'supplement', 1],
            ['Sauce Algérienne', 0, 'tacos', 'sauce', 1],
            ['Sauce Blanche', 0, 'tacos', 'sauce', 1],
            ['Sauce Biggy', 0, 'tacos', 'sauce', 1],

            // Crêpe
            ['Pâte Crêpe Salée', 0, 'crepe', 'base', 1],
            ['Pâte Crêpe Sucrée', 0, 'crepe', 'base', 1],
            ['Poulet Mariné', 200, 'crepe', 'viande', 1],
            ['Viande Hachée', 250, 'crepe', 'viande', 1],
            ['Nutella', 150, 'crepe', 'viande', 1],
            ['Fromage Râpé', 80, 'crepe', 'supplement', 1],
            ['Banane', 100, 'crepe', 'supplement', 1],
            ['Kinder', 150, 'crepe', 'supplement', 1],
            ['Sauce Chocolat', 0, 'crepe', 'sauce', 1],
            ['Sauce Blanche', 0, 'crepe', 'sauce', 1]
        ];

        for (const [name, price, category, subcategory, is_available] of defaultIngredients) {
            await db.execute({
                sql: 'INSERT INTO ingredients (name, price, category, subcategory, is_available) VALUES (?, ?, ?, ?, ?)',
                args: [name, price, category, subcategory, is_available],
            });
        }
    }

    // Mise à jour du prix de base Pâte Classique si besoin
    await db.execute({
        sql: "UPDATE ingredients SET price = 300 WHERE name = 'Pâte Classique' AND price = 400",
        args: []
    });
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
    // Supprimer d'abord tous les plats liés à cette catégorie
    await db.execute({ sql: 'DELETE FROM menu_items WHERE category_id = ?', args: [id] });
    
    // Ensuite, supprimer la catégorie
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

// Ingredients Management
export async function getIngredients(category?: string) {
    let sql = 'SELECT * FROM ingredients';
    const args: any[] = [];
    if (category) {
        sql += ' WHERE category = ?';
        args.push(category);
    }
    sql += ' ORDER BY category, subcategory, name';
    const result = await db.execute({ sql, args });
    return result.rows;
}

export async function createIngredient(data: any) {
    return await db.execute({
        sql: 'INSERT INTO ingredients (name, price, category, subcategory, is_available) VALUES (?, ?, ?, ?, ?)',
        args: [data.name, data.price, data.category, data.subcategory, data.is_available ?? 1],
    });
}

export async function updateIngredient(id: number, data: any) {
    const allowedFields = ['name', 'price', 'category', 'subcategory', 'is_available'];
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
    return await db.execute({ sql: `UPDATE ingredients SET ${fields.join(', ')} WHERE id = ?`, args });
}

export async function deleteIngredient(id: number) {
    return await db.execute({ sql: 'DELETE FROM ingredients WHERE id = ?', args: [id] });
}