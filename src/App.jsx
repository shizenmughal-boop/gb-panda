import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Pages
import Home from "./pages/Home";
import Restaurants from "./pages/Restaurants";
import RestaurantMenu from "./pages/RestaurantMenu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import TrackOrder from "./pages/TrackOrder";
import MyOrders from "./pages/MyOrders";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RiderDashboard from "./pages/RiderDashboard";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

// Components
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute"; // <-- Imported

// Contexts
import { CartProvider } from "./context/CartContext";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";

// Styles
import "./index.css";

const CustomerLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <CartProvider>
          <BrowserRouter>
            <AnimatePresence mode="wait">
              <Routes>
                {/* Auth Route */}
                <Route path="/auth" element={<AuthPage />} />

                {/* Customer Routes */}
                <Route path="/" element={<CustomerLayout><Home /></CustomerLayout>} />
                <Route path="/restaurants" element={<CustomerLayout><Restaurants /></CustomerLayout>} />
                <Route path="/restaurant/:id" element={<CustomerLayout><RestaurantMenu /></CustomerLayout>} />
                <Route path="/cart" element={<CustomerLayout><Cart /></CustomerLayout>} />
                <Route path="/checkout" element={<CustomerLayout><Checkout /></CustomerLayout>} />
                
                {/* Order Routes */}
                <Route path="/my-orders" element={<CustomerLayout><MyOrders /></CustomerLayout>} />
                <Route path="/track/:id" element={<CustomerLayout><TrackOrder /></CustomerLayout>} />
                <Route path="/track" element={<CustomerLayout><TrackOrder /></CustomerLayout>} />
                
                {/* Secured Dashboard Routes */}
                <Route path="/restaurant-dashboard" element={
                  <ProtectedRoute allowedRoles={["restaurant"]}>
                    <RestaurantDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin-dashboard" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/rider-dashboard" element={
                  <ProtectedRoute allowedRoles={["rider"]}>
                    <RiderDashboard />
                  </ProtectedRoute>
                } />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </BrowserRouter>
        </CartProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;