// Single Card Loader skeleton
export const CardSkeleton = () => {
  return (
    <div className="p-6 rounded-2xl border border-zinc-100 bg-white shadow-premium animate-pulse flex flex-col justify-between h-48">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="h-6 w-32 bg-zinc-200 rounded-lg"></div>
          <div className="h-5 w-16 bg-zinc-100 rounded-full"></div>
        </div>
        <div className="h-4 w-full bg-zinc-200 rounded-md mb-2"></div>
        <div className="h-4 w-3/4 bg-zinc-100 rounded-md"></div>
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <div className="h-6 w-20 bg-zinc-100 rounded-lg"></div>
        <div className="flex gap-2">
          <div className="h-7 w-7 bg-zinc-100 rounded-lg"></div>
          <div className="h-7 w-7 bg-zinc-100 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

// Vault word row lists skeleton loader
export const ListSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-white animate-pulse">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-5 w-5 bg-zinc-200 rounded-lg"></div>
            <div className="space-y-1.5 flex-1">
              <div className="h-4.5 w-32 bg-zinc-200 rounded-md"></div>
              <div className="h-3.5 w-48 bg-zinc-100 rounded-md"></div>
            </div>
          </div>
          <div className="h-6 w-16 bg-zinc-100 rounded-full"></div>
        </div>
      ))}
    </div>
  );
};
