import { useState } from 'react';
import { getProductByBarcode, getSales, restockProduct, addRefund } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Sale, SaleItem } from '@/types/pos';
import { ScanBarcode, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface MatchedItem {
  sale: Sale;
  item: SaleItem;
}

export default function RefundsPage() {
  const { user } = useAuth();
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = barcodeSearch.trim();
    if (!barcode) return;

    const product = getProductByBarcode(barcode);
    if (!product) {
      toast.error('Product not found');
      setMatchedItems([]);
      return;
    }

    const sales = getSales();
    const matches: MatchedItem[] = [];
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.productId === product.id) {
          matches.push({ sale, item });
        }
      });
    });

    if (matches.length === 0) {
      toast.error('No sales found for this product');
    }
    setMatchedItems(matches.reverse()); // most recent first
  };

  const handleRefund = (match: MatchedItem) => {
    restockProduct(match.item.productId, match.item.size, match.item.quantity);
    addRefund({
      saleId: match.sale.id,
      productId: match.item.productId,
      productName: match.item.productName,
      size: match.item.size,
      quantity: match.item.quantity,
      refundAmount: match.item.price * match.item.quantity,
      employeeId: user?.id || '',
    });
    toast.success(`Refunded ${match.item.productName} (${match.item.size})`);
    setMatchedItems(prev => prev.filter(m => m !== match));
    setBarcodeSearch('');
  };

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-6">Refunds</h1>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={barcodeSearch}
            onChange={e => setBarcodeSearch(e.target.value)}
            placeholder="Scan or enter product barcode..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            autoFocus
          />
        </div>
      </form>

      {matchedItems.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-2">
            Found {matchedItems.length} sale(s) for this product
          </p>
          {matchedItems.map((match, i) => (
            <div key={i} className="glass-card rounded-xl p-4 animate-fade-in">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-foreground">{match.item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    Size: {match.item.size} · Qty: {match.item.quantity} · ${match.item.price.toFixed(2)} each
                  </p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{match.sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-muted-foreground">
                  {new Date(match.sale.createdAt).toLocaleString()} · {match.sale.employeeName}
                </p>
                <button
                  onClick={() => handleRefund(match)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive text-sm hover:bg-destructive/30 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Refund
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
