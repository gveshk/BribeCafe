import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Dashboard from './pages/Dashboard/Dashboard';
import TableDetail from './pages/TableDetail/TableDetail';
import { theme } from './design-system/tokens';

const AppContent: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: theme.colors.neutral[50],
      fontFamily: theme.typography.fontFamily.sans,
    }}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/table/:id" element={<TableDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
