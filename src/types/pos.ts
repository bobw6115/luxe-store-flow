export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface ProductSize {
  size: string;
  stock: number;
  lowStockThreshold: number;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  sizes: ProductSize[];
  image?: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  items: SaleItem[];
  totalAmount: number;
  currency: 'USD' | 'LBP';
  discount: number;
  discountType: 'percentage' | 'fixed';
  employeeId: string;
  employeeName: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  price: number;
}

export interface Refund {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  refundAmount: number;
  employeeId: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  receiptLogo: string;
  receiptFooter: string;
  usdToLbpRate: number;
  enableLbp: boolean;
}
