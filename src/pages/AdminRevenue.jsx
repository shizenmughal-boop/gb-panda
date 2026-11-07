import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { TrendingUp, FileSpreadsheet, FileText, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useToast } from "../context/ToastContext";

const COLORS = ['#d70f64', '#0056b3', '#00b894', '#fdcb6e', '#6c5ce7'];

const AdminRevenue = () => {
  const { orders, restaurants } = useApp();
  const { showToast } = useToast();
  const [paidRestaurants, setPaidRestaurants] = useState([]);

  const completedOrders = useMemo(() => orders.filter(o => o.status === "Delivered"), [orders]);
  
  const gmv = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const deliveryFeesCollected = completedOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  
  let platformCommission = 0;
  const restaurantStats = {};

  completedOrders.forEach(order => {
    const rest = restaurants.find(r => String(r.id) === String(order.restaurantId));
    const commRate = rest?.commissionRate ?? 20;
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
  const topRestaurantsChart = settlementData.slice(0, 5).map(r => ({ name: r.name, revenue: r.grossSales, commission: r.commissionDeducted }));
  
  const topRest = settlementData[0]?.name || "N/A";
  const topRestRevenue = settlementData[0]?.grossSales || 0;
  const aov = completedOrders.length > 0 ? (gmv / completedOrders.length).toFixed(0) : 0;

  // --- ACTIONS ---
  const handleMarkPaid = async (rest) => {
    if (window.confirm(`Confirm payout of Rs ${rest.netPayable.toFixed(2)} to ${rest.name}?`)) {
      try {
        await addDoc(collection(db, "payouts"), {
          targetType: "restaurant",
          targetId: rest.id,
          targetName: rest.name,
          amount: rest.netPayable,
          settledAt: serverTimestamp(),
          status: "settled"
        });
        setPaidRestaurants(prev => [...prev, rest.id]);
        showToast(`Payout of Rs ${rest.netPayable.toFixed(2)} marked as paid!`, "success");
      } catch (error) {
        showToast("Failed to record payout", "error");
      }
    }
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const summaryData = [
      { Metric: "Total GMV", Value: `Rs ${gmv}` },
      { Metric: "Platform Commission", Value: `Rs ${platformCommission.toFixed(2)}` },
      { Metric: "Delivery Fees Collected", Value: `Rs ${deliveryFeesCollected}` },
      { Metric: "Average Order Value (AOV)", Value: `Rs ${aov}` },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Summary KPIs");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(settlementData), "Restaurant Settlements");
    XLSX.writeFile(wb, "GB_Panda_Financial_Report.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(215, 15, 100);
    doc.text("GB Panda - Executive Financial Report", 14, 20);
    doc.setFontSize(12); doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total GMV: Rs ${gmv.toLocaleString()}`, 14, 40);
    doc.text(`Platform Net Commission: Rs ${platformCommission.toFixed(2)}`, 14, 48);

    const tableData = settlementData.map(r => [r.name, r.ordersCount, `Rs ${r.grossSales}`, `${r.commissionRate}%`, `Rs ${r.netPayable.toFixed(2)}`]);
    autoTable(doc, { startY: 60, head: [['Restaurant', 'Orders', 'Gross Sales', 'Comm %', 'Net Payable']], body: tableData });
    doc.save("GB_Panda_Financial_Report.pdf");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ color: "#1a1a2e", margin: 0 }}>Revenue & Settlements</h1>
          <p style={{ color: "#666", marginTop: "5px" }}>Financial analytics and restaurant payouts.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={exportPDF} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 15px", background: "#d63031", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}><FileText size={18} /> Export PDF</button>
          <button onClick={exportExcel} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 15px", background: "#00b894", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}><FileSpreadsheet size={18} /> Export Excel</button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", padding: "25px", borderRadius: "16px", color: "#fff", marginBottom: "30px" }}>
        <h2 style={{ margin: "0 0 10px 0", color: "#fdcb6e" }}><TrendingUp size={24} /> AI Executive Insights</h2>
        <p style={{ fontSize: "16px", lineHeight: "1.6", margin: 0, color: "#eee" }}>
          GB Panda has processed <strong>{completedOrders.length} completed orders</strong> generating a GMV of <strong>Rs {gmv.toLocaleString()}</strong>. 
          Top partner: <strong>{topRest}</strong> (Rs {topRestRevenue.toLocaleString()}). 
          Platform net commission: <strong>Rs {platformCommission.toFixed(2)}</strong>.
        </p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", borderLeft: "5px solid #0056b3" }}><h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>GMV</h3><p style={{ fontSize: "28px", fontWeight: "bold", margin: "10px 0 0 0" }}>Rs {gmv.toLocaleString()}</p></div>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", borderLeft: "5px solid #00b894" }}><h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>Commission</h3><p style={{ fontSize: "28px", fontWeight: "bold", margin: "10px 0 0 0", color: "#00b894" }}>Rs {platformCommission.toFixed(2)}</p></div>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", borderLeft: "5px solid #fdcb6e" }}><h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>Delivery Fees</h3><p style={{ fontSize: "28px", fontWeight: "bold", margin: "10px 0 0 0" }}>Rs {deliveryFeesCollected}</p></div>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", borderLeft: "5px solid #d70f64" }}><h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>Avg Order Value</h3><p style={{ fontSize: "28px", fontWeight: "bold", margin: "10px 0 0 0" }}>Rs {aov}</p></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "20px", marginBottom: "30px" }}>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Top Restaurants</h2>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRestaurantsChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" /><YAxis dataKey="name" type="category" width={120} />
                <Tooltip /><Legend />
                <Bar dataKey="revenue" fill="#0056b3" name="Gross Sales" />
                <Bar dataKey="commission" fill="#00b894" name="Commission" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Revenue Share</h2>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={settlementData.slice(0, 5)} cx="50%" cy="50%" outerRadius={100} dataKey="grossSales" nameKey="name" label={({ name }) => name}>
                  {settlementData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", padding: "20px", borderRadius: "12px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Restaurant Payout Settlements</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee", textAlign: "left", color: "#666", fontSize: "14px" }}>
              <th style={{ paddingBottom: "12px" }}>Restaurant</th><th style={{ paddingBottom: "12px" }}>Orders</th>
              <th style={{ paddingBottom: "12px" }}>Gross Sales</th><th style={{ paddingBottom: "12px" }}>Comm %</th>
              <th style={{ paddingBottom: "12px" }}>Net Payable</th><th style={{ paddingBottom: "12px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {settlementData.map((rest) => {
              const isPaid = paidRestaurants.includes(rest.id);
              return (
                <tr key={rest.id} style={{ borderBottom: "1px solid #eee", fontSize: "14px" }}>
                  <td style={{ padding: "15px 0", fontWeight: "bold" }}>{rest.name}</td>
                  <td style={{ padding: "15px 0" }}>{rest.ordersCount}</td>
                  <td style={{ padding: "15px 0" }}>Rs {rest.grossSales.toLocaleString()}</td>
                  <td style={{ padding: "15px 0" }}>{rest.commissionRate}%</td>
                  <td style={{ padding: "15px 0", color: "#0056b3", fontWeight: "bold" }}>Rs {rest.netPayable.toFixed(2)}</td>
                  <td style={{ padding: "15px 0" }}>
                    <button 
                      onClick={() => handleMarkPaid(rest)}
                      disabled={isPaid}
                      style={{ background: isPaid ? "#e0e0e0" : "#e6fced", color: isPaid ? "#888" : "green", border: "none", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", cursor: isPaid ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                    >
                      <CheckCircle size={16} /> {isPaid ? "Paid" : "Mark Paid"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRevenue;