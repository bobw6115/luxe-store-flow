import { useState } from 'react';
import { getSales, getRefunds } from '@/lib/store';
import { Receipt, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

export default function SalesHistoryPage() {
  const sales = getSales().slice().reverse();
  const refunds = getRefunds() as any[];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(prev => (prev === id ? null : id));

  // Build a map: saleId -> refunded items
  const refundsBySale: Record<string, any[]> = {};
  refunds.forEach(r => {
    if (!refundsBySale[r.saleId]) refundsBySale[r.saleId] = [];
    refundsBySale[r.saleId].push(r);
  });

  const isItemRefunded = (saleId: string, productId: string, size: string) => {
    return refundsBySale[saleId]?.some(r => r.productId === productId && r.size === size);
  };

  const getItemRefund = (saleId: string, productId: string, size: string) => {
    return refundsBySale[saleId]?.find(r => r.productId === productId && r.size === size);
  };

  const hasAnyRefund = (saleId: string) => !!refundsBySale[saleId]?.length;

  return (
    <div className="p-6 max-w-3xl animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-6">Sales History</h1>

      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Receipt className="w-12 h-12 mb-3 opacity-30" />
          <p>No sales yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sales.map(sale => (
            <div key={sale.id} className="glass-card rounded-xl overflow-hidden animate-fade-in">
              <button
                onClick={() => toggle(sale.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    hasAnyRefund(sale.id) ? 'bg-destructive/15' : 'bg-primary/10'
                  }`}>
                    {hasAnyRefund(sale.id) ? (
                      <RotateCcw className="w-4 h-4 text-destructive" />
                    ) : (
                      <Receipt className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-semibold text-foreground">{sale.invoiceNumber}</p>
                      {hasAnyRefund(sale.id) && (
                        <span className="px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold uppercase tracking-wider">
                          Refunded
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleDateString()} · {new Date(sale.createdAt).toLocaleTimeString()} · {sale.employeeName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">
                    {sale.currency === 'LBP'
                      ? `${sale.totalAmount.toLocaleString()} LBP`
                      : `$${sale.totalAmount.toFixed(2)}`}
                  </span>
                  {expandedId === sale.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedId === sale.id && (
                <div className="border-t border-border px-4 pb-4 pt-3 space-y-1 animate-fade-in">
                  {sale.items.map((item, i) => {
                    const refunded = isItemRefunded(sale.id, item.productId, item.size);
                    const refundData = getItemRefund(sale.id, item.productId, item.size);
                    return (
                      <div key={i} className={`flex justify-between text-sm py-1.5 rounded px-2 ${refunded ? 'bg-destructive/10' : ''}`}>
                        <div className="flex-1">
                          <span className={`${refunded ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                            {item.productName} ({item.size}) × {item.quantity}
                          </span>
                          {refunded && refundData && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <RotateCcw className="w-3 h-3 text-destructive" />
                              <span className="text-[11px] text-destructive font-medium">
                                Refunded on {new Date(refundData.createdAt).toLocaleDateString()} at {new Date(refundData.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className={`${refunded ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-sm text-destructive pt-1 px-2">
                      <span>Discount</span>
                      <span>-${sale.discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
