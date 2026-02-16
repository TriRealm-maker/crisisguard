import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { MapPage } from './pages/MapPage';
import { PredictionPage } from './pages/PredictionPage';
import { MedicalPage } from './pages/MedicalPage';
import { GuidesPage } from './pages/GuidesPage';
import { LoginPage } from './pages/LoginPage';
import { SharedProfilePage } from './pages/SharedProfilePage';
import { Coordinates } from './types';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [coords, setCoords] = useState<Coordinates | null>(null);

  useEffect(() => {
    if (user && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {
          setCoords({ lat: 37.7749, lng: -122.4194 });
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pb-20 md:pb-0">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-4 md:pt-20">
        <Routes>
          <Route path="/" element={<Dashboard coords={coords} />} />
          <Route path="/map" element={<MapPage coords={coords} />} />
          <Route path="/prediction" element={<PredictionPage coords={coords} />} />
          <Route path="/medical" element={<MedicalPage />} />
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/shared/:token" element={<SharedProfilePage />} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
