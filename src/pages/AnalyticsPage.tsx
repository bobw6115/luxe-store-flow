import { useMemo } from 'react';
import { getSales, getProducts, getRefunds } from '@/lib/store';
import { TrendingUp, DollarSign, ShoppingBag, RotateCcw } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AnalyticsPage() {
  const sales = getSales();
  const products = getProducts();
  const refunds = getRefunds();

  const stats = useMemo(() => {
    // Calculate refunded quantities and revenue per product
    const refundedQty: Record<string, number> = {};
    const refundedRevenue: Record<string, number> = {};
    // Refunds by date for chart adjustment
    const refundsByDate: Record<string, number> = {};
    // Refunds by category
    const refundsByCategory: Record<string, number> = {};

    refunds.forEach((r: any) => {
      const key = r.productId;
      refundedQty[key] = (refundedQty[key] || 0) + (r.quantity || 0);
      refundedRevenue[key] = (refundedRevenue[key] || 0) + (r.refundAmount || 0);

      // Find the original sale date to reverse revenue on that date
      const sale = sales.find(s => s.id === r.saleId);
      if (sale) {
        const day = new Date(sale.createdAt).toLocaleDateString();
        refundsByDate[day] = (refundsByDate[day] || 0) + (r.refundAmount || 0);
      }

      // Category performance adjustment
      const product = products.find(p => p.id === r.productId);
      if (product) {
        refundsByCategory[product.category] = (refundsByCategory[product.category] || 0) + (r.refundAmount || 0);
      }
    });

    const totalRefunds = refunds.reduce((sum: number, r: any) => sum + (r.refundAmount || 0), 0);
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0) - totalRefunds;
    const totalCost = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => {
        const product = products.find(p => p.id === item.productId);
        return itemSum + (product?.costPrice || 0) * item.quantity;
      }, 0);
    }, 0);
    // Subtract cost of refunded items
    const refundedCost = refunds.reduce((sum: number, r: any) => {
      const product = products.find(p => p.id === r.productId);
      return sum + (product?.costPrice || 0) * (r.quantity || 0);
    }, 0);
    const netProfit = totalRevenue - (totalCost - refundedCost);

    // Daily sales adjusted for refunds on original dates
    const dailySales: Record<string, number> = {};
    sales.forEach(s => {
      const day = new Date(s.createdAt).toLocaleDateString();
      dailySales[day] = (dailySales[day] || 0) + s.totalAmount;
    });
    // Subtract refunds from their original sale dates
    Object.entries(refundsByDate).forEach(([date, amount]) => {
      if (dailySales[date] !== undefined) {
        dailySales[date] = Math.max(0, dailySales[date] - amount);
      }
    });
    const chartData = Object.entries(dailySales).map(([date, amount]) => ({ date, amount: parseFloat(amount.toFixed(2)) }));

    // Best sellers (adjusted for refunds)
    const productSales: Record<string, { name: string; count: number }> = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        if (!productSales[item.productId]) productSales[item.productId] = { name: item.productName, count: 0 };
        productSales[item.productId].count += item.quantity;
      });
    });
    Object.keys(refundedQty).forEach(pid => {
      if (productSales[pid]) {
        productSales[pid].count = Math.max(0, productSales[pid].count - refundedQty[pid]);
      }
    });
    const bestSellers = Object.values(productSales).sort((a, b) => b.count - a.count).slice(0, 5);

    // Category performance adjusted for refunds
    const catPerf: Record<string, number> = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) catPerf[product.category] = (catPerf[product.category] || 0) + item.price * item.quantity;
      });
    });
    // Subtract refunds from category revenue
    Object.entries(refundsByCategory).forEach(([cat, amount]) => {
      if (catPerf[cat] !== undefined) {
        catPerf[cat] = Math.max(0, catPerf[cat] - amount);
      }
    });
    const categoryData = Object.entries(catPerf).map(([category, revenue]) => ({ category, revenue }));

    return { totalRevenue, netProfit, totalRefunds, salesCount: sales.length, chartData, bestSellers, categoryData };
  }, [sales, products, refunds]);

  const statCards = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-primary' },
    { label: 'Net Profit', value: `$${stats.netProfit.toFixed(2)}`, icon: TrendingUp, color: 'text-success' },
    { label: 'Total Sales', value: stats.salesCount.toString(), icon: ShoppingBag, color: 'text-primary' },
    { label: 'Refunds', value: `$${stats.totalRefunds.toFixed(2)}`, icon: RotateCcw, color: 'text-destructive' },
  ];

  return (
    <div className="p-6 animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-6">Analytics Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-sm text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-serif text-lg font-semibold text-foreground mb-4">Revenue Over Time</h3>
          {stats.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 18%)" />
                <XAxis dataKey="date" stroke="hsl(220 10% 55%)" fontSize={12} />
                <YAxis stroke="hsl(220 10% 55%)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'hsl(220 14% 11%)', border: '1px solid hsl(220 12% 18%)', borderRadius: '8px', color: 'hsl(40 10% 95%)' }} />
                <Line type="monotone" dataKey="amount" stroke="hsl(43 80% 55%)" strokeWidth={2} dot={{ fill: 'hsl(43 80% 55%)' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-12">No sales data yet</p>
          )}
        </div>

        {/* Category Performance */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-serif text-lg font-semibold text-foreground mb-4">Category Performance</h3>
          {stats.categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 18%)" />
                <XAxis dataKey="category" stroke="hsl(220 10% 55%)" fontSize={12} />
                <YAxis stroke="hsl(220 10% 55%)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'hsl(220 14% 11%)', border: '1px solid hsl(220 12% 18%)', borderRadius: '8px', color: 'hsl(40 10% 95%)' }} />
                <Bar dataKey="revenue" fill="hsl(43 80% 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-12">No sales data yet</p>
          )}
        </div>

        {/* Best Sellers */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-serif text-lg font-semibold text-foreground mb-4">Best Sellers</h3>
          {stats.bestSellers.length > 0 ? (
            <div className="space-y-3">
              {stats.bestSellers.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full gold-gradient text-primary-foreground text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="text-foreground text-sm">{p.name}</span>
                  </div>
                  <span className="text-muted-foreground text-sm">{p.count} sold</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No sales yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
