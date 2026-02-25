import { useState } from 'react';
import { getProductByBarcode, getSales, restockProduct, addRefund, getRefunds } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Sale, SaleItem } from '@/types/pos';
import { ScanBarcode, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface MatchedItem {
  sale: Sale;
  item: SaleItem;
}

export default function RefundsPage() {
  const { user } = useAuth();
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([]);
  const [confirmRefund, setConfirmRefund] = useState<MatchedItem | null>(null);

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
    const refunds = getRefunds() as any[];
    const matches: MatchedItem[] = [];

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.productId === product.id) {
          // Check if this specific item+size+sale is already refunded
          const alreadyRefunded = refunds.some(
            r => r.saleId === sale.id && r.productId === item.productId && r.size === item.size
          );
          if (!alreadyRefunded) {
            matches.push({ sale, item });
          }
        }
      });
    });

    if (matches.length === 0) {
      toast.error('No refundable sales found for this product');
    }
    setMatchedItems(matches.reverse());
  };

  const executeRefund = (match: MatchedItem) => {
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
    setConfirmRefund(null);
    setBarcodeSearch('');
  };

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      {/* REFUND MODE Banner */}
      <div className="mb-6 rounded-xl border-2 border-destructive/40 bg-destructive/10 p-4 flex items-center gap-3">
        <ShieldAlert className="w-6 h-6 text-destructive flex-shrink-0" />
        <div>
          <h1 className="font-serif text-xl font-bold text-destructive">⚠ REFUND MODE</h1>
          <p className="text-sm text-destructive/80">
            Scan a barcode to find and refund sold items. All refunds are logged and reflected in analytics.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
          <input
            type="text"
            value={barcodeSearch}
            onChange={e => setBarcodeSearch(e.target.value)}
            placeholder="Scan or enter product barcode to refund..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border-2 border-destructive/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
            autoFocus
          />
        </div>
      </form>

      {matchedItems.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            Found {matchedItems.length} refundable sale(s) for this product
          </p>
          {matchedItems.map((match, i) => (
            <div key={i} className="rounded-xl border border-destructive/20 bg-card p-4 animate-fade-in">
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
                  onClick={() => setConfirmRefund(match)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Refund ${(match.item.price * match.item.quantity).toFixed(2)}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmRefund && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 w-96 animate-scale-in border-2 border-destructive/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">Confirm Refund</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              Are you sure you want to refund the following item?
            </p>
            <div className="rounded-lg bg-destructive/10 p-3 my-4 text-sm">
              <p className="font-medium text-foreground">{confirmRefund.item.productName}</p>
              <p className="text-muted-foreground text-xs">
                Size: {confirmRefund.item.size} · Qty: {confirmRefund.item.quantity} · Invoice: {confirmRefund.sale.invoiceNumber}
              </p>
              <p className="text-destructive font-semibold mt-1">
                Refund amount: ${(confirmRefund.item.price * confirmRefund.item.quantity).toFixed(2)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRefund(null)}
                className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-surface-hover transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => executeRefund(confirmRefund)}
                className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90 transition-colors"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
