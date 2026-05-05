import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ComparePage from './pages/ComparePage.jsx';
import ComparisonPage from './pages/ComparisonPage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const App = () => (
  <div className="min-h-screen text-slate-950 dark:text-slate-50">
    <Navbar />
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<ComparePage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: '16px',
          background: 'rgb(15 15 18)',
          color: '#f8fafc',
        },
      }}
    />
  </div>
);

export default App;
