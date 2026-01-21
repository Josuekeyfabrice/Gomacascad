import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { CompareProvider } from "@/components/compare/CompareContext";
import { CompareBar } from "@/components/compare/CompareBar";
import { IncomingCallDialogNew } from "@/components/calls/IncomingCallDialogNew";
import { OfflineIndicator } from "@/components/layout/OfflineIndicator";
import { PerformanceMonitor } from "@/components/common/PerformanceMonitor";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useNotifications } from "./hooks/useNotifications";
import { usePushNotifications } from "./hooks/usePushNotifications";

// Lazy loading pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Sell = lazy(() => import("./pages/Sell"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const Call = lazy(() => import("./pages/Call"));
const CallHistory = lazy(() => import("./pages/CallHistory"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const MyProducts = lazy(() => import("./pages/MyProducts"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Search = lazy(() => import("./pages/Search"));
const EditProduct = lazy(() => import("./pages/EditProduct"));
const Admin = lazy(() => import("./pages/Admin"));
const SellerProfile = lazy(() => import("./pages/SellerProfile"));
const Compare = lazy(() => import("./pages/Compare"));
const Install = lazy(() => import("./pages/Install"));
const LiveTV = lazy(() => import("./pages/LiveTV"));
const VerifySeller = lazy(() => import("./pages/VerifySeller"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Transactions = lazy(() => import("./pages/Transactions"));
const ProximityMap = lazy(() => import("./pages/ProximityMap"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const LiveShopping = lazy(() => import("./pages/LiveShopping"));
const SellerPublicProfile = lazy(() => import("./pages/SellerPublicProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const OnlineStatusTracker = () => {
  useOnlineStatus();
  useNotifications();
  usePushNotifications();
  return null;
};

const CallHandler = () => {
  return <IncomingCallDialogNew />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <CompareProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <PerformanceMonitor />
              <OfflineIndicator />
              <OnlineStatusTracker />
              <CallHandler />
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-background">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              }>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/sell" element={<Sell />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/call/:userId" element={<Call />} />
                  <Route path="/call-history" element={<CallHistory />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/my-products" element={<MyProducts />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/edit-product/:id" element={<EditProduct />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/proximity-map" element={<ProximityMap />} />
                  <Route path="/seller-dashboard" element={<SellerDashboard />} />
                  <Route path="/live-shopping" element={<LiveShopping />} />
                  <Route path="/seller-public/:sellerId" element={<SellerPublicProfile />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/seller/:sellerId" element={<SellerProfile />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/install" element={<Install />} />
                  <Route path="/live-tv" element={<LiveTV />} />
                  <Route path="/verify-seller" element={<VerifySeller />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <CompareBar />
            </AuthProvider>
          </BrowserRouter>
        </CompareProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
