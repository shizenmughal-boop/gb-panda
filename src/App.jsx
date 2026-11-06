import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { CartProvider } from "./context/CartContext";
import { AppProvider } from "./context/AppContext";

// Components
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import OfflineBanner from "./components/OfflineBanner";

// Auth Page
import AuthPage from "./pages/AuthPage";

// Customer Pages
import Home from "./pages/Home";
import Restaurants from "./pages/Restaurants";
import RestaurantMenu from "./pages/RestaurantMenu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import TrackOrder from "./pages/TrackOrder";
import MyOrders from "./pages/MyOrders";
import CustomerProfile from "./pages/CustomerProfile";
import Favorites from "./pages/Favorites";

// Restaurant Pages
import RestaurantDashboard from "./pages/RestaurantDashboard";

// Rider Pages
import RiderDashboard from "./pages/RiderDashboard";

// Admin Pages
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import ManageRestaurants from "./pages/ManageRestaurants";
import AdminOrders from "./pages/AdminOrders";
import AdminRiders from "./pages/AdminRiders";
import AdminUsers from "./pages/AdminUsers";
import AdminPromotions from "./pages/AdminPromotions";
import AdminRevenue from "./pages/AdminRevenue";
import AdminSupport from "./pages/AdminSupport";

import "./index.css";

// Layout that shows the Customer Navbar
const CustomerLayout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

// Catch-all route logic: Redirects to role dashboard or auth
const CatchAllRedirect = () => {
  const { userProfile, loading } = useAuth();
  if (loading) return <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>Loading...</div>;
  if (!userProfile) return <Navigate to="/auth" replace />;
  
  if (userProfile.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (userProfile.role === "restaurant") return <Navigate to="/restaurant-dashboard" replace />;
  if (userProfile.role === "rider") return <Navigate to="/rider-dashboard" replace />;
  return <Navigate to="/" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC ROUTE */}
      <Route path="/auth" element={<AuthPage />} />

      {/* CUSTOMER ROUTES (Wrapped in Navbar Layout) */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/restaurant/:id" element={<RestaurantMenu />} />
        
        {/* Protected Customer Routes */}
        <Route path="/cart" element={<ProtectedRoute allowedRoles={["customer", "admin"]}><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute allowedRoles={["customer", "admin"]}><Checkout /></ProtectedRoute>} />
        <Route path="/track/:id" element={<ProtectedRoute allowedRoles={["customer", "admin"]}><TrackOrder /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute allowedRoles={["customer", "admin"]}><MyOrders /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={["customer", "admin"]}><CustomerProfile /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute allowedRoles={["customer", "admin"]}><Favorites /></ProtectedRoute>} />
      </Route>

      {/* RESTAURANT ROUTE */}
      <Route path="/restaurant-dashboard" element={
        <ProtectedRoute allowedRoles={["restaurant"]}>
          <RestaurantDashboard />
        </ProtectedRoute>
      } />

      {/* RIDER ROUTE */}
      <Route path="/rider-dashboard" element={
        <ProtectedRoute allowedRoles={["rider"]}>
          <RiderDashboard />
        </ProtectedRoute>
      } />

      {/* ADMIN ROUTES (Nested under /admin) */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="manage-restaurants" element={<ManageRestaurants />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="riders" element={<AdminRiders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="promotions" element={<AdminPromotions />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="support" element={<AdminSupport />} />
      </Route>

      {/* CATCH-ALL */}
      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <CartProvider>
          <ToastProvider>
            <BrowserRouter>
              <OfflineBanner />
              <AppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </CartProvider>
      </AppProvider>
    </AuthProvider>
  );
}