import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ContentList from './pages/ContentList';
import NewContent from './pages/NewContent';
import ContentViewer from './pages/ContentViewer';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="content" element={<ContentList />} />
          <Route path="content/new" element={<NewContent />} />
          <Route path="content/:id" element={<ContentViewer />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
