import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import Phase0 from './pages/Phase0';
import WeekPage from './pages/WeekPage';
import TalksPage from './pages/TalksPage';

// Loaded on demand: the roadmap's week content and architecture map ship in their own chunk,
// so a visitor who never opens the secret address never downloads them.
const AdminPage = lazy(() => import('./pages/AdminPage'));
const StaffPage = lazy(() => import('./pages/StaffPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  // Only the leading segment counts: selecting a week inside the roadmap changes the
  // path without leaving the page, and should not throw the reader back to the top.
  const page = pathname.split('/')[1] ?? '';
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <TopBar />
      <Suspense fallback={null}>
        <Routes>
          {/* یک صفحه و یک آدرس: فاز صفر، صورت پروژه، و نُه هفته زیر هم. */}
          <Route path="/" element={<Navigate to="/phase-0" replace />} />
          <Route path="/phase-0" element={<Phase0 />} />
          <Route path="/phase-0/:weekSlug" element={<Phase0 />} />
          {/* آدرس‌های قدیمیِ نقشه به همان صفحه برمی‌گردند. */}
          <Route path="/roadmap" element={<Navigate to="/phase-0" replace />} />
          <Route path="/roadmap/:key" element={<Navigate to="/phase-0" replace />} />
          <Route path="/roadmap/:key/:weekSlug" element={<Navigate to="/phase-0" replace />} />
          <Route path="/week/:n" element={<WeekPage />} />
          {/* کنسول ادمین فقط وقتی معنا دارد که سایت با بک‌اند بالا آمده باشد. */}
          <Route path="/admin" element={<AdminPage />} />
          {/* منتورها و مسئول برنامه — یک در، دو میز، بسته به نقشِ کسی که وارد شده. */}
          <Route path="/panel" element={<StaffPage />} />
          <Route path="/talks" element={<TalksPage />} />
          <Route path="*" element={<Navigate to="/phase-0" replace />} />
        </Routes>
      </Suspense>
      <div className="divider" />
      <Footer />
    </>
  );
}
