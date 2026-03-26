import { Routes, Route } from "react-router-dom";
import "./App.css";
import Success from "./pages/Success";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Register from "./pages/Register";
import Orders from "./pages/Orders";
import Notifications from "./pages/Notifications";
import Account from "./pages/Account";
import Wishlist from "./pages/Wishlist";
import Login from "./pages/Login";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import MainLayout from "./layout/MainLayout";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedUserRoute from "./components/ProtectedUserRoute";
import NewAdminDashboard from "./pages/NewAdminDashboard";
import Categories from "./pages/Categories";
import Restaurants from "./pages/Restaurants";
import RestaurantDetails from "./pages/RestaurantDetails";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import AdminForgotPassword from "./pages/AdminForgotPassword";
import AdminResetPassword from "./pages/AdminResetPassword";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import RestaurantAdminLogin from "./pages/RestaurantAdminLogin";
import RestaurantAdminRegister from "./pages/RestaurantAdminRegister";
import RestaurantAdminDashboard from "./pages/RestaurantAdminDashboard";
import RiderAdminLogin from "./pages/RiderAdminLogin";
import RiderAdminRegister from "./pages/RiderAdminRegister";
import RiderAdminDashboard from "./pages/RiderAdminDashboard";
import ProtectedRiderRoute from "./components/ProtectedRiderRoute";


function App() {
  return (
    <Routes>
      {/* Rider Admin Routes */}
      <Route path="/rideradmin-register" element={<RiderAdminRegister />} />
      <Route path="/rideradmin-login" element={<RiderAdminLogin />} />
      <Route
        path="/rideradmin"
        element={
          <ProtectedRiderRoute>
            <RiderAdminDashboard />
          </ProtectedRiderRoute>
        }
      />

      {/* Restaurant Admin Routes */}
      <Route path="/restaurantadmin-register" element={<RestaurantAdminRegister />} />
      <Route path="/restaurantadmin-login" element={<RestaurantAdminLogin />} />
      <Route path="/restaurantadmin" element={<RestaurantAdminDashboard />} />

      {/* Admin Routes */}
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin-register" element={<AdminRegister />} />
      <Route path="/admin-forgot-password" element={<AdminForgotPassword />} />
      <Route path="/admin-reset-password/:token" element={<AdminResetPassword />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <NewAdminDashboard />
          </ProtectedAdminRoute>
        }
      />

      {/* User Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/restaurants" element={<Restaurants />} />
      <Route path="/restaurant/:restaurantId" element={<RestaurantDetails />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={
          <ProtectedUserRoute>
            <Home />
          </ProtectedUserRoute>
        } />

        {/* 🔥 Products → Menu */}
        <Route path="/products" element={<Products />} />

        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment/:orderId"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route path="/success" element={<Success />} />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
