import { useState } from 'react';
import { getSales } from '@/lib/store';
import { Sale } from '@/types/pos';
import { Receipt, ChevronDown, ChevronUp } from 'lucide-react';

export default function SalesHistoryPage() {
  const sales = getSales().slice().reverse();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(prev => (prev === id ? null : id));

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
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-semibold text-foreground">{sale.invoiceNumber}</p>
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
                  {sale.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">
                        {item.productName} ({item.size}) × {item.quantity}
                      </span>
                      <span className="text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-sm text-destructive pt-1">
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
