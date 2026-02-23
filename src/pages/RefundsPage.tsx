import { useState } from 'react';
import { getSaleByInvoice, restockProduct, addRefund, getSales } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Sale } from '@/types/pos';
import { Search, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function RefundsPage() {
  const { user } = useAuth();
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [sale, setSale] = useState<Sale | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = getSaleByInvoice(invoiceSearch.trim());
    if (found) {
      setSale(found);
    } else {
      toast.error('Invoice not found');
      setSale(null);
    }
  };

  const handleRefund = (item: any) => {
    if (!sale) return;
    restockProduct(item.productId, item.size, item.quantity);
    addRefund({
      saleId: sale.id,
      productId: item.productId,
      productName: item.productName,
      size: item.size,
      quantity: item.quantity,
      refundAmount: item.price * item.quantity,
      employeeId: user?.id || '',
    });
    toast.success(`Refunded ${item.productName} (${item.size})`);
    setSale(null);
    setInvoiceSearch('');
  };

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-6">Refunds</h1>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={invoiceSearch}
            onChange={e => setInvoiceSearch(e.target.value)}
            placeholder="Enter invoice number (e.g. INV-00001)"
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </form>

      {sale && (
        <div className="glass-card rounded-xl p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-serif font-bold text-foreground">{sale.invoiceNumber}</h3>
              <p className="text-sm text-muted-foreground">{new Date(sale.createdAt).toLocaleString()}</p>
            </div>
            <span className="text-sm text-muted-foreground">Total: ${sale.totalAmount.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            {sale.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                <div>
                  <p className="text-foreground text-sm font-medium">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">Size: {item.size} · Qty: {item.quantity} · ${item.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => handleRefund(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive text-sm hover:bg-destructive/30 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Refund
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
