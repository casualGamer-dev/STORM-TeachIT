import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { useAuthStore } from './lib/store';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { NotesPage } from './pages/NotesPage';
import { LecturesPage } from './pages/LecturesPage';
import { FriendsPage } from './pages/FriendsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { CreditsPage } from './pages/CreditsPage';
import { TutorPage } from './pages/TutorPage';
import { ProfilePage } from './pages/ProfilePage';
import QuizPage from './pages/QuizPage'; // Import the new QuizPage
import { LoginPage } from './pages/LoginPage'; // Import the updated LoginPage
import { Spinner } from './components/Spinner'; // Import the Spinner component

export function App() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <Spinner />;
  }

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }
    return <>{children}</>;
  };

  return (
    <Router>
      <div className="min-h-screen bg-black">
        <Sidebar />
        <main className={`pt-16 ${user ? 'md:pl-64' : ''}`}>
          <div className="min-h-[calc(100vh-64px)]">
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/notes" /> : <LoginPage />} />
              <Route path="/" element={<LandingPage />} />
              <Route path="/notes" element={
                <ProtectedRoute>
                  <NotesPage />
                </ProtectedRoute>
              } />
              <Route path="/lectures" element={
                <ProtectedRoute>
                  <LecturesPage />
                </ProtectedRoute>
              } />
              <Route path="/tutor" element={
                <ProtectedRoute>
                  <TutorPage />
                </ProtectedRoute>
              } />
              <Route path="/friends" element={
                <ProtectedRoute>
                  <FriendsPage />
                </ProtectedRoute>
              } />
              <Route path="/leaderboard" element={
                <ProtectedRoute>
                  <LeaderboardPage />
                </ProtectedRoute>
              } />
              <Route path="/credits" element={
                <ProtectedRoute>
                  <CreditsPage />
                </ProtectedRoute>
              } />
              <Route path="/quiz" element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
          <Footer />
        </main>
      </div>
    </Router>
  );
}

export default App;