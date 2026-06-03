import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";

// Component imports
import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import Toast from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";

// Page imports
import AddWord from "./pages/AddWord";
import CurrentlyLearning from "./pages/CurrentlyLearning";
import TopPics from "./pages/TopPics";
import EditWord from "./pages/EditWord";
import AllWords from "./pages/AllWords";
import AuthPage from "./pages/AuthPage";
import WordDetails from "./pages/WordDetails";

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-zinc-50 flex flex-col justify-between pb-24 md:pb-6">
          {/* Main Layout Area */}
          <div className="w-full">
            {/* Sticky Floating Premium Glass Navbar */}
            <Navbar />

            {/* Viewport content */}
            <main className="w-full">
              <Routes>
                <Route path="/" element={<AllWords />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/signup" element={<AuthPage mode="signup" />} />
                <Route
                  path="/add"
                  element={
                    <ProtectedRoute>
                      <AddWord />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/learning"
                  element={
                    <ProtectedRoute>
                      <CurrentlyLearning />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/top-pics"
                  element={
                    <ProtectedRoute>
                      <TopPics />
                    </ProtectedRoute>
                  }
                />
                <Route path="/vault" element={<AllWords />} />
                <Route path="/words/:id" element={<WordDetails />} />
                <Route
                  path="/words/:id/edit"
                  element={
                    <ProtectedRoute>
                      <EditWord />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback route redirection */}
                <Route path="*" element={<AllWords />} />
              </Routes>
            </main>
          </div>

          {/* Sticky Bottom bar reachable comfort thumb navigation on mobile viewport */}
          <MobileNav />

          {/* Global Animated Action Toasts Feed Drawer */}
          <Toast />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
