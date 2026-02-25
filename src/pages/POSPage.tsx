import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CartItem, Product } from '@/types/pos';
import { getProductByBarcode, getProducts, deductStock, addSale, getSettings } from '@/lib/store';
import { ScanBarcode, Trash2, Minus, Plus, Receipt, X } from 'lucide-react';
import { toast } from 'sonner';

export default function POSPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [sizeModal, setSizeModal] = useState<Product | null>(null);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [currency, setCurrency] = useState<'USD' | 'LBP'>('USD');
  const [showReceiptPrompt, setShowReceiptPrompt] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const settings = getSettings();

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  const handleBarcodeScan = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const product = getProductByBarcode(barcodeInput.trim());
    if (!product) {
      toast.error('Product not found');
      setBarcodeInput('');
      return;
    }
    if (product.sizes.length === 1) {
      addToCart(product, product.sizes[0].size);
    } else {
      setSizeModal(product);
    }
    setBarcodeInput('');
  }, [barcodeInput]);

  const addToCart = (product: Product, size: string) => {
    const sizeInfo = product.sizes.find(s => s.size === size);
    if (!sizeInfo || sizeInfo.stock <= 0) {
      toast.error(`${size} is out of stock`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id && i.size === size);
      if (existing) {
        if (existing.quantity >= sizeInfo.stock) {
          toast.error(`Only ${sizeInfo.stock} in stock`);
          return prev;
        }
        return prev.map(i =>
          i.productId === product.id && i.size === size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        size,
        quantity: 1,
        unitPrice: product.sellingPrice,
      }];
    });
    setSizeModal(null);
    toast.success(`Added ${product.name} (${size})`);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      // Check stock limit
      const allProducts = getProducts();
      const prod = allProducts.find(p => p.id === item.productId);
      if (prod && delta > 0) {
        const sizeInfo = prod.sizes.find(s => s.size === item.size);
        if (sizeInfo && newQty > sizeInfo.stock) {
          toast.error(`Only ${sizeInfo.stock} in stock`);
          return item;
        }
      }
      return { ...item, quantity: newQty };
    }));
  };

  const removeItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountAmount = discountType === 'percentage' ? subtotal * (discount / 100) : discount;
  const total = Math.max(0, subtotal - discountAmount);
  const rate = settings.usdToLbpRate || 89500;
  const displayTotal = currency === 'LBP' ? total * rate : total;

  const completeSale = () => {
    if (cart.length === 0) return;
    // Deduct stock
    cart.forEach(item => deductStock(item.productId, item.size, item.quantity));
    // Create sale
    const sale = addSale({
      items: cart.map(i => ({
        productId: i.productId,
        productName: i.productName,
        size: i.size,
        quantity: i.quantity,
        price: i.unitPrice,
      })),
      totalAmount: total,
      currency,
      discount: discountAmount,
      discountType,
      employeeId: user?.id || '',
      employeeName: user?.username || '',
    });
    setLastSale(sale);
    setCart([]);
    setDiscount(0);
    setShowReceiptPrompt(true);
    toast.success('Sale completed!');
  };

  const formatPrice = (amount: number) => {
    if (currency === 'LBP') {
      return `${(amount * rate).toLocaleString()} LBP`;
    }
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="flex h-screen">
      {/* Main POS Area */}
      <div className="flex-1 flex flex-col p-6">
        {/* Barcode Input */}
        <form onSubmit={handleBarcodeScan} className="mb-6">
          <div className="relative">
            <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            <input
              ref={barcodeRef}
              type="text"
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              placeholder="Scan barcode or enter code..."
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-card border border-border text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              autoFocus
            />
          </div>
        </form>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ScanBarcode className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">Scan a product to begin</p>
              <p className="text-sm">Barcode input is auto-focused</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.productId}-${item.size}`} className="glass-card rounded-xl p-4 flex items-center gap-4 animate-fade-in">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">Size: {item.size} · {formatPrice(item.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(index, -1)} className="p-1.5 rounded-lg bg-secondary hover:bg-surface-hover text-foreground transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold text-foreground">{item.quantity}</span>
                  <button onClick={() => updateQuantity(index, 1)} className="p-1.5 rounded-lg bg-secondary hover:bg-surface-hover text-foreground transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="w-24 text-right font-semibold text-foreground">{formatPrice(item.unitPrice * item.quantity)}</p>
                <button onClick={() => removeItem(index)} className="p-1.5 rounded-lg hover:bg-destructive/20 text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Summary */}
      <div className="w-96 bg-card border-l border-border flex flex-col p-6">
        <h2 className="font-serif text-xl font-bold text-foreground mb-6">Order Summary</h2>

        {/* Currency Toggle */}
        {settings.enableLbp && (
          <div className="flex gap-2 mb-4">
            {(['USD', 'LBP'] as const).map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  currency === c
                    ? 'gold-gradient text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal ({cart.length} items)</span>
            <span className="text-foreground">{currency === 'LBP' ? `${(subtotal * rate).toLocaleString()} LBP` : `$${subtotal.toFixed(2)}`}</span>
          </div>

          {/* Discount */}
          <div className="flex gap-2 items-center">
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value as any)}
              className="bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-foreground"
            >
              <option value="percentage">%</option>
              <option value="fixed">$</option>
            </select>
            <input
              type="number"
              value={discount || ''}
              onChange={e => { const v = parseFloat(e.target.value) || 0; setDiscount(Math.max(0, v)); }}
              placeholder="Discount"
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-destructive">
              <span>Discount</span>
              <span>-{currency === 'LBP' ? `${(discountAmount * rate).toLocaleString()} LBP` : `$${discountAmount.toFixed(2)}`}</span>
            </div>
          )}

          <div className="border-t border-border pt-3 flex justify-between">
            <span className="text-lg font-bold text-foreground">Total</span>
            <span className="text-lg font-bold gold-text">
              {currency === 'LBP' ? `${displayTotal.toLocaleString()} LBP` : `$${total.toFixed(2)}`}
            </span>
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <button
            onClick={completeSale}
            disabled={cart.length === 0}
            className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Complete Sale
          </button>
          <button
            onClick={() => { setCart([]); setDiscount(0); }}
            className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-surface-hover transition-colors"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Size Selection Modal */}
      {sizeModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 w-96 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-bold text-foreground">Select Size</h3>
              <button onClick={() => setSizeModal(null)} className="p-1 hover:bg-secondary rounded-lg">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-muted-foreground text-sm mb-4">{sizeModal.name}</p>
            <div className="grid grid-cols-3 gap-2">
              {sizeModal.sizes.map(s => (
                <button
                  key={s.size}
                  onClick={() => addToCart(sizeModal, s.size)}
                  disabled={s.stock <= 0}
                  className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                    s.stock <= 0
                      ? 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
                      : 'bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground'
                  }`}
                >
                  <span className="block">{s.size}</span>
                  <span className="text-xs opacity-70">{s.stock} left</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Prompt Modal */}
      {showReceiptPrompt && lastSale && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 w-96 animate-scale-in text-center">
            <h3 className="font-serif text-lg font-bold text-foreground mb-2">Sale Complete!</h3>
            <p className="text-muted-foreground text-sm mb-6">Would the customer like a printable receipt?</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowReceiptPrompt(false); }}
                className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-surface-hover transition-colors font-semibold"
              >
                No, Skip
              </button>
              <button
                onClick={() => { setShowReceiptPrompt(false); setShowReceipt(true); }}
                className="flex-1 py-3 rounded-xl gold-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                Yes, Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-foreground text-background rounded-2xl p-8 w-80 animate-scale-in font-mono text-sm">
            <div className="text-center border-b border-dashed border-muted pb-4 mb-4">
              <h3 className="font-serif text-lg font-bold">{settings.storeName}</h3>
              <p className="text-xs opacity-60">{lastSale.invoiceNumber}</p>
              <p className="text-xs opacity-60">{new Date(lastSale.createdAt).toLocaleString()}</p>
            </div>
            {lastSale.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-xs mb-1">
                <span>{item.productName} ({item.size}) x{item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-muted mt-4 pt-4">
              {lastSale.discount > 0 && (
                <div className="flex justify-between text-xs mb-1">
                  <span>Discount</span>
                  <span>-${lastSale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>TOTAL</span>
                <span>
                  {lastSale.currency === 'LBP'
                    ? `${(lastSale.totalAmount * rate).toLocaleString()} LBP`
                    : `$${lastSale.totalAmount.toFixed(2)}`}
                </span>
              </div>
            </div>
            <p className="text-center text-xs opacity-50 mt-4">{settings.receiptFooter}</p>
            <button
              onClick={() => setShowReceipt(false)}
              className="w-full mt-4 py-2 rounded-lg bg-background text-foreground text-sm font-medium hover:opacity-80"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
