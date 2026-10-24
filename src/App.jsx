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
import NotFound from "./pages/NotFound"; // <-- Imported 404 Page

// Components
import Navbar from "./components/Navbar";

// Contexts
import { CartProvider } from "./context/CartContext";
import { AppProvider } from "./context/AppContext";

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
    <AppProvider>
      <CartProvider>
        <BrowserRouter>
          <AnimatePresence mode="wait">
            <Routes>
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
              
              {/* Dashboard Routes (No Customer Navbar) */}
              <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/rider-dashboard" element={<RiderDashboard />} />
              
              {/* 404 Route - Must be at the very bottom */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
      </CartProvider>
    </AppProvider>
  );
}

export default App;