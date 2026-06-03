import { NavLink, Link } from "react-router-dom";
import { useState } from "react";
import { BookOpen, LogIn, LogOut, Sparkles, Menu, X } from "lucide-react";
import { useApp } from "../context/useApp";

export const Navbar = () => {
  const { isAuthenticated, logout, user } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-4 pb-2 bg-zinc-50/50 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5 rounded-2xl glass-panel shadow-premium">
        {/* Branding Logo */}
        <Link to="/vault" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-all">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent">
            Vocademy
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1.5 font-medium">
          <NavLink
            to="/vault"
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                isActive
                  ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10"
                  : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
              }`
            }
          >
            All Word Vault
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to="/learning"
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                }`
              }
            >
              Currently Learning
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink
              to="/top-pics"
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                }`
              }
            >
              Your Top Pics
            </NavLink>
          )}
        </div>

        {/* Quick Add CTA */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <span className="hidden lg:inline text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {user.role}
            </span>
          )}

          {isAuthenticated && (
            <Link
              to="/add"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Add Word</span>
            </Link>
          )}

          {isAuthenticated ? (
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-zinc-600 rounded-xl hover:text-zinc-950 hover:bg-zinc-100 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 shadow-md shadow-zinc-900/10 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-zinc-600 hover:bg-zinc-100"
            onClick={() => setOpen((s) => !s)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu (small screens) */}
        {open && (
          <div className="absolute left-4 right-4 top-full mt-3 bg-white rounded-2xl shadow-lg p-3 md:hidden z-50">
            <div className="flex flex-col gap-2">
              <NavLink
                to="/vault"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg text-sm ${
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`
                }
              >
                All Word Vault
              </NavLink>
              {isAuthenticated && (
                <NavLink
                  to="/learning"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg text-sm ${
                      isActive
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-700 hover:bg-zinc-50"
                    }`
                  }
                >
                  Currently Learning
                </NavLink>
              )}
              {isAuthenticated && (
                <NavLink
                  to="/top-pics"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg text-sm ${
                      isActive
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-700 hover:bg-zinc-50"
                    }`
                  }
                >
                  Your Top Pics
                </NavLink>
              )}

              {/* Add / Auth actions */}
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
export default Navbar;
