import { useState, useMemo } from 'react';
import { getProducts, addProduct, deleteProduct, updateProduct } from '@/lib/store';
import { Product } from '@/types/pos';
import { Search, Plus, Trash2, Edit2, AlertTriangle, X, Package } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Shirts', 'Pants', 'Blazers', 'Sweaters', 'Accessories', 'Shoes', 'Outerwear'];
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(getProducts());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
      const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, search, categoryFilter]);

  const refreshProducts = () => setProducts(getProducts());

  const handleDelete = (id: string) => {
    deleteProduct(id);
    refreshProducts();
    toast.success('Product deleted');
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">{products.length} products</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products or barcodes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-card border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-xs uppercase text-muted-foreground font-semibold">Product</th>
              <th className="text-left p-4 text-xs uppercase text-muted-foreground font-semibold">Barcode</th>
              <th className="text-left p-4 text-xs uppercase text-muted-foreground font-semibold">Category</th>
              <th className="text-left p-4 text-xs uppercase text-muted-foreground font-semibold">Price</th>
              <th className="text-left p-4 text-xs uppercase text-muted-foreground font-semibold">Stock</th>
              <th className="text-right p-4 text-xs uppercase text-muted-foreground font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => {
              const totalStock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
              const hasLowStock = product.sizes.some(s => s.stock <= s.lowStockThreshold && s.stock > 0);
              const hasOutOfStock = product.sizes.some(s => s.stock === 0);
              return (
                <tr key={product.id} className="border-b border-border/50 hover:bg-surface-hover/30 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-foreground">{product.name}</p>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground font-mono">{product.barcode}</td>
                  <td className="p-4">
                    <span className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">{product.category}</span>
                  </td>
                  <td className="p-4">
                    <p className="text-foreground font-medium">${product.sellingPrice.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Cost: ${product.costPrice.toFixed(2)}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {product.sizes.map(s => (
                        <span key={s.size} className={`text-xs px-2 py-0.5 rounded ${
                          s.stock === 0 ? 'bg-destructive/20 text-destructive' :
                          s.stock <= s.lowStockThreshold ? 'bg-warning/20 text-warning' :
                          'bg-secondary text-secondary-foreground'
                        }`}>
                          {s.size}: {s.stock}
                        </span>
                      ))}
                      {(hasLowStock || hasOutOfStock) && (
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditProduct(product)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No products found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {(showAddModal || editProduct) && (
        <ProductFormModal
          product={editProduct}
          onClose={() => { setShowAddModal(false); setEditProduct(null); }}
          onSave={() => { refreshProducts(); setShowAddModal(false); setEditProduct(null); }}
        />
      )}
    </div>
  );
}

function ProductFormModal({ product, onClose, onSave }: { product: Product | null; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState(product?.name || '');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [category, setCategory] = useState(product?.category || 'Shirts');
  const [costPrice, setCostPrice] = useState(product?.costPrice?.toString() || '');
  const [sellingPrice, setSellingPrice] = useState(product?.sellingPrice?.toString() || '');
  const [sizes, setSizes] = useState(product?.sizes || [{ size: 'M', stock: 0, lowStockThreshold: 3 }]);

  const CATEGORIES = ['Shirts', 'Pants', 'Blazers', 'Sweaters', 'Accessories', 'Shoes', 'Outerwear'];
  const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const addSize = () => {
    const available = ALL_SIZES.filter(s => !sizes.find(sz => sz.size === s));
    if (available.length > 0) {
      setSizes([...sizes, { size: available[0], stock: 0, lowStockThreshold: 3 }]);
    }
  };

  const handleSubmit = () => {
    if (!name || !barcode) { toast.error('Name and barcode required'); return; }
    const data = {
      name, barcode, category,
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      sizes,
    };
    if (product) {
      updateProduct(product.id, data);
      toast.success('Product updated');
    } else {
      addProduct(data as any);
      toast.success('Product added');
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-card rounded-2xl p-6 w-[480px] max-h-[80vh] overflow-y-auto animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-lg font-bold text-foreground">{product ? 'Edit' : 'Add'} Product</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Product Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Barcode</label>
              <input value={barcode} onChange={e => setBarcode(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Cost Price ($)</label>
              <input type="number" value={costPrice} onChange={e => setCostPrice(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Selling Price ($)</label>
              <input type="number" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
          </div>

          {/* Sizes */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-muted-foreground">Sizes & Stock</label>
              <button onClick={addSize} className="text-xs text-primary hover:underline">+ Add Size</button>
            </div>
            <div className="space-y-2">
              {sizes.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={s.size}
                    onChange={e => setSizes(sizes.map((sz, j) => j === i ? { ...sz, size: e.target.value } : sz))}
                    className="bg-secondary border border-border rounded-lg px-2 py-2 text-sm text-foreground w-20"
                  >
                    {ALL_SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                  </select>
                  <input
                    type="number"
                    value={s.stock}
                    onChange={e => setSizes(sizes.map((sz, j) => j === i ? { ...sz, stock: parseInt(e.target.value) || 0 } : sz))}
                    placeholder="Stock"
                    className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  />
                  <input
                    type="number"
                    value={s.lowStockThreshold}
                    onChange={e => setSizes(sizes.map((sz, j) => j === i ? { ...sz, lowStockThreshold: parseInt(e.target.value) || 0 } : sz))}
                    placeholder="Low"
                    className="w-16 bg-secondary border border-border rounded-lg px-2 py-2 text-sm text-foreground"
                  />
                  <button
                    onClick={() => setSizes(sizes.filter((_, j) => j !== i))}
                    className="p-1 text-destructive hover:bg-destructive/20 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-surface-hover transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl gold-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            {product ? 'Update' : 'Add'} Product
          </button>
        </div>
      </div>
    </div>
  );
}
