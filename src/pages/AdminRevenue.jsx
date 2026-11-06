import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { motion } from "framer-motion";
import { TrendingUp, Download, FileSpreadsheet, FileText, CheckCircle, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const COLORS = ['#d70f64', '#0056b3', '#00b894', '#fdcb6e', '#6c5ce7'];

const AdminRevenue = () => {
  const { orders, restaurants } = useApp();
  const [dateRange, setDateRange] = useState("All Time");

  // 1. Calculations
  const completedOrders = useMemo(() => orders.filter(o => o.status === "Delivered"), [orders]);
  
  const gmv = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const deliveryFeesCollected = completedOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  
  // Calculate platform commission
  let platformCommission = 0;
  const restaurantStats = {};

  completedOrders.forEach(order => {
    const rest = restaurants.find(r => String(r.id) === String(order.restaurantId));
    const commRate = rest?.commissionRate ?? 20; // Default to 20%
    const orderSubtotal = order.subtotal || order.total || 0;
    const commissionEarned = (orderSubtotal * commRate) / 100;
    
    platformCommission += commissionEarned;

    if (!restaurantStats[order.restaurantId]) {
      restaurantStats[order.restaurantId] = {
        id: order.restaurantId,
        name: rest?.name || "Unknown Restaurant",
        ordersCount: 0,
        grossSales: 0,
        commissionRate: commRate,
        commissionDeducted: 0,
        netPayable: 0
      };
    }
    
    restaurantStats[order.restaurantId].ordersCount += 1;
    restaurantStats[order.restaurantId].grossSales += orderSubtotal;
    restaurantStats[order.restaurantId].commissionDeducted += commissionEarned;
    restaurantStats[order.restaurantId].netPayable += (orderSubtotal - commissionEarned);
  });

  const settlementData = Object.values(restaurantStats).sort((a, b) => b.grossSales - a.grossSales);

  // Chart Data
  const topRestaurantsChart = settlementData.slice(0, 5).map(r => ({ name: r.name, revenue: r.grossSales, commission: r.commissionDeducted }));
  
  // AI Insights text
  const topRest = settlementData[0]?.name || "N/A";
  const topRestRevenue = settlementData[0]?.grossSales || 0;
  const aov = completedOrders.length > 0 ? (gmv / completedOrders.length).toFixed(0) : 0;

  // 2. Export Functions
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      { Metric: "Total GMV", Value: `Rs ${gmv}` },
      { Metric: "Platform Commission", Value: `Rs ${platformCommission.toFixed(2)}` },
      { Metric: "Delivery Fees Collected", Value: `Rs ${deliveryFeesCollected}` },
      { Metric: "Average Order Value (AOV)", Value: `Rs ${aov}` },
      { Metric: "Completed Orders", Value: completedOrders.length },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary KPIs");

    // Sheet 2: Restaurant Settlements
    const wsSettlements = XLSX.utils.json_to_sheet(settlementData);
    XLSX.utils.book_append_sheet(wb, wsSettlements, "Restaurant Settlements");

    // Sheet 3: Orders List
    const orderList = completedOrders.map(o => ({
      OrderID: o.displayId || o.id,
      Customer: o.customer,
      Restaurant: restaurants.find(r => r.id === o.restaurantId)?.name,
      Total: o.total,
      Date: new Date(o.createdAt?.seconds * 1000).toLocaleDateString()
    }));
    const wsOrders = XLSX.utils.json_to_sheet(orderList);
    XLSX.utils.book_append_sheet(wb, wsOrders, "Completed Orders");

    XLSX.writeFile(wb, "GB_Panda_Financial_Report.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(215, 15, 100);
    doc.text("GB Panda - Executive Financial Report", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total GMV: Rs ${gmv.toLocaleString()}`, 14, 40);
    doc.text(`Platform Net Commission: Rs ${platformCommission.toFixed(2)}`, 14, 48);

    const tableData = settlementData.map(r => [
      r.name, 
      r.ordersCount, 
      `Rs ${r.grossSales}`, 
      `${r.commissionRate}%`,
      `Rs ${r.netPayable.toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 60,
      head: [['Restaurant', 'Orders', 'Gross Sales', 'Comm %', 'Net Payable']],
      body: tableData,
    });

    doc.save("GB_Panda_Financial_Report.pdf");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ color: "#1a1a2e", margin: 0 }}>Revenue & Settlements</h1>
          <p style={{ color: "#666", marginTop: "5px" }}>Financial analytics, platform commissions, and restaurant payouts.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={exportPDF} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 15px", background: "#d63031", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            <FileText size={18} /> Export PDF
          </button>
          <button onClick={exportExcel} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 15px", background: "#00b894", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            <FileSpreadsheet size={18} /> Export Excel
          </button>
        </div>
      </div>

      {/* AI Insights */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", padding: "25px", borderRadius: "16px", color: "#fff", marginBottom: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
        <h2 style={{ margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "10px", color: "#fdcb6e" }}>
          <TrendingUp size={24} /> AI Executive Insights
        </h2>
        <p style={{ fontSize: "16px", lineHeight: "1.6", margin: 0, color: "#eee" }}>
          GB Panda has processed <strong>{completedOrders.length} completed orders</strong> generating a total GMV of <strong>Rs {gmv.toLocaleString()}</strong>. 
          The top-performing partner is <strong>{topRest}</strong> bringing in <strong>Rs {topRestRevenue.toLocaleString()}</strong> in gross sales. 
          The platform has earned <strong>Rs {platformCommission.toFixed(2)}</strong> in net commissions after deductions. Average Order Value is currently <strong>Rs {aov}</strong>.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <motion.div whileHover={{ y: -4 }} style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", borderLeft: "5px solid #0056b3" }}>
          <h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>Gross Merchandise Value</h3>
          <p style={{ fontSize: "28px", fontWeight: "bold", margin: "10px 0 0 0", color: "#0056b3" }}>Rs {gmv.toLocaleString()}</p>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", borderLeft: "5px solid #00b894" }}>
          <h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>Platform Commission</h3>
          <p style={{ fontSize: "28px", fontWeight: "bold", margin: "10px 0 0 0", color: "#00b894" }}>Rs {platformCommission.toFixed(2)}</p>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", borderLeft: "5px solid #fdcb6e" }}>
          <h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>Delivery Fees</h3>
          <p style={{ fontSize: "28px", fontWeight: "bold", margin: "10px 0 0 0", color: "#fdcb6e" }}>Rs {deliveryFeesCollected.toLocaleString()}</p>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", borderLeft: "5px solid #d70f64" }}>
          <h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>Avg Order Value (AOV)</h3>
          <p style={{ fontSize: "28px", fontWeight: "bold", margin: "10px 0 0 0", color: "#d70f64" }}>Rs {aov}</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Top Restaurants (Revenue vs Commission)</h2>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRestaurantsChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#0056b3" name="Gross Sales" radius={[0, 5, 5, 0]} />
                <Bar dataKey="commission" fill="#00b894" name="Commission" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Platform Revenue Share</h2>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={settlementData.slice(0, 5)} cx="50%" cy="50%" outerRadius={100} dataKey="grossSales" nameKey="name" label={({ name }) => name}>
                  {settlementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Settlement Table */}
      <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Restaurant Payout Settlements</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee", textAlign: "left", color: "#666", fontSize: "14px" }}>
              <th style={{ paddingBottom: "12px" }}>Restaurant Name</th>
              <th style={{ paddingBottom: "12px" }}>Orders</th>
              <th style={{ paddingBottom: "12px" }}>Gross Sales</th>
              <th style={{ paddingBottom: "12px" }}>Comm %</th>
              <th style={{ paddingBottom: "12px" }}>Net Payable</th>
              <th style={{ paddingBottom: "12px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {settlementData.map((rest) => (
              <tr key={rest.id} style={{ borderBottom: "1px solid #eee", fontSize: "14px" }}>
                <td style={{ padding: "15px 0", fontWeight: "bold" }}>{rest.name}</td>
                <td style={{ padding: "15px 0" }}>{rest.ordersCount}</td>
                <td style={{ padding: "15px 0" }}>Rs {rest.grossSales.toLocaleString()}</td>
                <td style={{ padding: "15px 0" }}>{rest.commissionRate}%</td>
                <td style={{ padding: "15px 0", color: "#0056b3", fontWeight: "bold" }}>Rs {rest.netPayable.toFixed(2)}</td>
                <td style={{ padding: "15px 0" }}>
                  <button style={{ background: "#e6fced", color: "green", border: "none", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                    <CheckCircle size={16} /> Mark Paid
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRevenue;