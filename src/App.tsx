/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from './store';
import React, { useEffect } from 'react';
import { ShoppingCart, Package, LayoutDashboard, FileText, User, BookOpen } from 'lucide-react';
import SalesPage from './pages/Sales';
import InventoryPage from './pages/Inventory';
import DashboardPage from './pages/Dashboard';
import InvoicesPage from './pages/Invoices';
import SummaryPage from './pages/Summary';
import DebtBookPage from './pages/DebtBook';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useStore((state) => state.user);

  const navItems = [
    { path: '/sales', label: 'المبيعات', icon: ShoppingCart },
    { path: '/inventory', label: 'المخزون', icon: Package },
    { path: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, managerOnly: true },
    { path: '/invoices', label: 'الفواتير', icon: FileText },
    { path: '/debts', label: 'الديون', icon: BookOpen },
    { path: '/summary', label: 'الملخص', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 px-2 z-50">
      {navItems.map((item) => {
        if (item.managerOnly && user.role !== 'manager') return null;
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-full h-full ${
              isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
            }`}
          >
            <item.icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-16" dir="rtl">
      {children}
      <BottomNav />
    </div>
  );
}

export default function App() {
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);

  useEffect(() => {
    const keepAlive = setInterval(() => {
      fetch('/api/keep-alive', { method: 'POST', body: JSON.stringify({ ping: true }), headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    }, 120000);
    return () => clearInterval(keepAlive);
  }, []);

  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/summary" replace />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/debts" element={<DebtBookPage />} />
          <Route path="/summary" element={<SummaryPage />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}
