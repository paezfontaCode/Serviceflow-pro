import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import Layout from './layouts/Layout';
import PermissionGuard from './components/PermissionGuard';

import POS from './pages/POS';
import Repairs from './pages/Repairs';
import Inventory from './pages/Inventory';
import Finance from './pages/Finance';
import Customers from './pages/Customers';
import CustomerDetail from './pages/Customers/CustomerDetail';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Expenses from './pages/Expenses';
import Logistics from './pages/Logistics';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes Wrapper */}
      <Route path="/" element={
        <PermissionGuard fallback={<Navigate to="/login" replace />}>
          <Layout />
        </PermissionGuard>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route path="dashboard" element={
            <PermissionGuard allowedRoles={['admin', 'vendedor', 'tecnico']}>
                <Dashboard />
            </PermissionGuard>
        } />
        
        <Route path="pos" element={
            <PermissionGuard allowedRoles={['admin', 'vendedor']}>
                <POS />
            </PermissionGuard>
        } />

        <Route path="repairs" element={
            <PermissionGuard allowedRoles={['admin', 'tecnico']}>
                <Repairs />
            </PermissionGuard>
        } />

        <Route path="inventory" element={
            <PermissionGuard allowedRoles={['admin', 'vendedor']}>
                <Inventory />
            </PermissionGuard>
        } />
        <Route path="finance" element={
            <PermissionGuard allowedRoles={['admin']}>
                <Finance />
            </PermissionGuard>
        } />
        <Route path="expenses" element={
            <PermissionGuard allowedRoles={['admin', 'vendedor']}>
                <Expenses />
            </PermissionGuard>
        } />
        <Route path="logistics" element={
            <PermissionGuard allowedRoles={['admin', 'vendedor']}>
                <Logistics />
            </PermissionGuard>
        } />
        <Route path="customers" element={
            <PermissionGuard allowedRoles={['admin', 'vendedor']}>
                <Customers />
            </PermissionGuard>
        } />
        <Route path="customers/:id" element={
            <PermissionGuard allowedRoles={['admin', 'vendedor']}>
                <CustomerDetail />
            </PermissionGuard>
        } />

        <Route path="reports" element={
            <PermissionGuard allowedRoles={['admin']}>
                <Reports />
            </PermissionGuard>
        } />
        <Route path="settings" element={
            <PermissionGuard allowedRoles={['admin']}>
                <Settings />
            </PermissionGuard>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
