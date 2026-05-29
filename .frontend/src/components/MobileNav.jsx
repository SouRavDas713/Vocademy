import { NavLink } from 'react-router-dom';
import { BookMarked, Layers, LogIn, PlusCircle } from 'lucide-react';
import { useApp } from '../context/useApp';

export const MobileNav = () => {
  const { isAuthenticated } = useApp();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-50/80 backdrop-blur-lg border-t border-zinc-200/60 px-4 py-2 pb-safe-bottom shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <NavLink
          to="/vault"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
              isActive 
                ? 'text-indigo-600 bg-indigo-50/80 font-semibold' 
                : 'text-zinc-500 hover:text-zinc-900'
            }`
          }
        >
          <Layers className="w-5.5 h-5.5" />
          <span className="text-[10px] tracking-wide">Vault</span>
        </NavLink>

        {isAuthenticated ? (
          <>
          <NavLink
            to="/learning"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
                isActive 
                  ? 'text-indigo-600 bg-indigo-50/80 font-semibold' 
                  : 'text-zinc-500 hover:text-zinc-900'
              }`
            }
          >
            <BookMarked className="w-5.5 h-5.5" />
            <span className="text-[10px] tracking-wide">Learning</span>
          </NavLink>

          <NavLink
            to="/add"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
                isActive 
                  ? 'text-indigo-600 bg-indigo-50/80 font-semibold' 
                  : 'text-zinc-500 hover:text-zinc-900'
              }`
            }
          >
            <PlusCircle className="w-5.5 h-5.5" />
            <span className="text-[10px] tracking-wide">Add</span>
          </NavLink>
          </>
        ) : !isAuthenticated && (
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
                isActive 
                  ? 'text-indigo-600 bg-indigo-50/80 font-semibold' 
                  : 'text-zinc-500 hover:text-zinc-900'
              }`
            }
          >
            <LogIn className="w-5.5 h-5.5" />
            <span className="text-[10px] tracking-wide">Sign In</span>
          </NavLink>
        )}
      </div>
    </div>
  );
};
export default MobileNav;
