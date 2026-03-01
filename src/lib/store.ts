import { Product, Sale, StoreSettings, User } from '@/types/pos';

const STORAGE_KEYS = {
  USERS: 'pos_users',
  PRODUCTS: 'pos_products',
  SALES: 'pos_sales',
  SETTINGS: 'pos_settings',
  REFUNDS: 'pos_refunds',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Simple hash for demo - in production use bcrypt
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function getItem<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Default data
const defaultSettings: StoreSettings = {
  storeName: 'MAISON HOMME',
  receiptLogo: '',
  receiptFooter: 'Thank you for shopping with us!',
  usdToLbpRate: 89500,
  enableLbp: true,
};

const defaultUsers: User[] = [
  { id: '1', username: 'admin', passwordHash: simpleHash('admin123'), role: 'admin', createdAt: new Date().toISOString() },
  { id: '2', username: 'cashier', passwordHash: simpleHash('cashier123'), role: 'employee', createdAt: new Date().toISOString() },
];

const defaultProducts: Product[] = [
  {
    id: '1', name: 'Classic Oxford Shirt', barcode: '1001', category: 'Shirts',
    costPrice: 25, sellingPrice: 59.99,
    sizes: [
      { size: 'S', stock: 12, lowStockThreshold: 3 },
      { size: 'M', stock: 18, lowStockThreshold: 3 },
      { size: 'L', stock: 15, lowStockThreshold: 3 },
      { size: 'XL', stock: 8, lowStockThreshold: 3 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2', name: 'Slim Fit Chinos', barcode: '1002', category: 'Pants',
    costPrice: 30, sellingPrice: 79.99,
    sizes: [
      { size: 'S', stock: 10, lowStockThreshold: 2 },
      { size: 'M', stock: 14, lowStockThreshold: 2 },
      { size: 'L', stock: 11, lowStockThreshold: 2 },
      { size: 'XL', stock: 6, lowStockThreshold: 2 },
      { size: 'XXL', stock: 4, lowStockThreshold: 2 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: '3', name: 'Merino Wool Blazer', barcode: '1003', category: 'Blazers',
    costPrice: 80, sellingPrice: 199.99,
    sizes: [
      { size: 'M', stock: 5, lowStockThreshold: 2 },
      { size: 'L', stock: 7, lowStockThreshold: 2 },
      { size: 'XL', stock: 3, lowStockThreshold: 2 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: '4', name: 'Premium Leather Belt', barcode: '1004', category: 'Accessories',
    costPrice: 15, sellingPrice: 45,
    sizes: [
      { size: 'M', stock: 20, lowStockThreshold: 5 },
      { size: 'L', stock: 15, lowStockThreshold: 5 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: '5', name: 'Cashmere V-Neck Sweater', barcode: '1005', category: 'Sweaters',
    costPrice: 45, sellingPrice: 120,
    sizes: [
      { size: 'S', stock: 6, lowStockThreshold: 2 },
      { size: 'M', stock: 9, lowStockThreshold: 2 },
      { size: 'L', stock: 7, lowStockThreshold: 2 },
      { size: 'XL', stock: 4, lowStockThreshold: 2 },
    ],
    createdAt: new Date().toISOString(),
  },
];

// Initialize
export function initializeStore(): void {
  const existingUsers = getItem<User[]>(STORAGE_KEYS.USERS, []);
  if (!Array.isArray(existingUsers) || existingUsers.length === 0) {
    setItem(STORAGE_KEYS.USERS, defaultUsers);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    setItem(STORAGE_KEYS.PRODUCTS, defaultProducts);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    setItem(STORAGE_KEYS.SETTINGS, defaultSettings);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
    setItem(STORAGE_KEYS.SALES, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.REFUNDS)) {
    setItem(STORAGE_KEYS.REFUNDS, []);
  }
}

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

// Users
export function getUsers(): User[] { return getItem(STORAGE_KEYS.USERS, defaultUsers); }
export function authenticateUser(username: string, password: string): User | null {
  const users = getUsers() as Array<User & { password?: string }>;

  const rawUsername = username ?? '';
  const rawPassword = password ?? '';
  const trimmedPassword = rawPassword.trim();

  const normalizedInputUsername = normalizeUsername(rawUsername);
  const passwordCandidates = new Set([
    simpleHash(rawPassword),
    simpleHash(trimmedPassword),
    rawPassword,
    trimmedPassword,
  ]);

  return users.find((u) => {
    const normalizedStoredUsername = normalizeUsername(u.username ?? '');
    if (normalizedStoredUsername !== normalizedInputUsername) return false;

    const legacyPlainPassword = typeof u.password === 'string' ? u.password : '';
    return passwordCandidates.has(u.passwordHash) || passwordCandidates.has(legacyPlainPassword);
  }) || null;
}
export function addUser(username: string, password: string, role: 'admin' | 'employee'): User {
  const users = getUsers();
  const newUser: User = {
    id: generateId(),
    username: username.trim(),
    passwordHash: simpleHash(password.trim()),
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  setItem(STORAGE_KEYS.USERS, users);
  return newUser;
}
export function deleteUser(id: string): void {
  const users = getUsers().filter(u => u.id !== id);
  setItem(STORAGE_KEYS.USERS, users);
}
export function resetUserPassword(id: string, newPassword: string): void {
  const users = getUsers().map(u => u.id === id ? { ...u, passwordHash: simpleHash(newPassword.trim()) } : u);
  setItem(STORAGE_KEYS.USERS, users);
}

// Products
export function getProducts(): Product[] { return getItem(STORAGE_KEYS.PRODUCTS, defaultProducts); }
export function getProductByBarcode(barcode: string): Product | undefined {
  return getProducts().find(p => p.barcode === barcode);
}
export function addProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
  const products = getProducts();
  const newProduct: Product = { ...product, id: generateId(), createdAt: new Date().toISOString() };
  products.push(newProduct);
  setItem(STORAGE_KEYS.PRODUCTS, products);
  return newProduct;
}
export function updateProduct(id: string, updates: Partial<Product>): void {
  const products = getProducts().map(p => p.id === id ? { ...p, ...updates } : p);
  setItem(STORAGE_KEYS.PRODUCTS, products);
}
export function deleteProduct(id: string): void {
  setItem(STORAGE_KEYS.PRODUCTS, getProducts().filter(p => p.id !== id));
}
export function deductStock(productId: string, size: string, quantity: number): void {
  const products = getProducts().map(p => {
    if (p.id === productId) {
      return { ...p, sizes: p.sizes.map(s => s.size === size ? { ...s, stock: Math.max(0, s.stock - quantity) } : s) };
    }
    return p;
  });
  setItem(STORAGE_KEYS.PRODUCTS, products);
}
export function restockProduct(productId: string, size: string, quantity: number): void {
  const products = getProducts().map(p => {
    if (p.id === productId) {
      return { ...p, sizes: p.sizes.map(s => s.size === size ? { ...s, stock: s.stock + quantity } : s) };
    }
    return p;
  });
  setItem(STORAGE_KEYS.PRODUCTS, products);
}

// Sales
export function getSales(): Sale[] { return getItem(STORAGE_KEYS.SALES, []); }
export function addSale(sale: Omit<Sale, 'id' | 'invoiceNumber' | 'createdAt'>): Sale {
  const sales = getSales();
  const invoiceNum = `INV-${String(sales.length + 1).padStart(5, '0')}`;
  const newSale: Sale = { ...sale, id: generateId(), invoiceNumber: invoiceNum, createdAt: new Date().toISOString() };
  sales.push(newSale);
  setItem(STORAGE_KEYS.SALES, sales);
  return newSale;
}
export function getSaleByInvoice(invoiceNumber: string): Sale | undefined {
  return getSales().find(s => s.invoiceNumber === invoiceNumber);
}

// Settings
export function getSettings(): StoreSettings { return getItem(STORAGE_KEYS.SETTINGS, defaultSettings); }
export function updateSettings(updates: Partial<StoreSettings>): void {
  setItem(STORAGE_KEYS.SETTINGS, { ...getSettings(), ...updates });
}

// Refunds
export function getRefunds() { return getItem(STORAGE_KEYS.REFUNDS, []); }
export function addRefund(refund: any) {
  const refunds = getRefunds();
  refunds.push({ ...refund, id: generateId(), createdAt: new Date().toISOString() });
  setItem(STORAGE_KEYS.REFUNDS, refunds);
}
