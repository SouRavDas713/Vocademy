import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useApp } from "../context/useApp";
import { Volume2, Bookmark } from "lucide-react";

const TOP_PICS_KEY = "vocademy_top_pics";

const TopPics = () => {
  const { showToast } = useApp();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topIds, setTopIds] = useState([]);
  const [topWords, setTopWords] = useState([]);

  // Load top pics from backend
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.getTopPics();
        if (!mounted) return;
        const items = res.data || [];
        const ids = items.map((it) => it.word._id);
        setTopIds(ids);
        setTopWords(items);
      } catch (err) {
        // ignore
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = async (searchQuery) => {
    if (typeof searchQuery === "string") {
      // called programmatically
    } else {
      // called from form submit event
      searchQuery = query;
    }

    if (!searchQuery || !searchQuery.trim()) return setResults([]);
    setLoading(true);
    try {
      const res = await api.getWords({ q: searchQuery.trim(), limit: 20 });
      setResults(res.data || []);
    } catch (err) {
      showToast(err.message || "Search failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Debounce dynamic search while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && query.trim()) {
        handleSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const addToTop = async (word) => {
    if (!word || !word._id) return;
    try {
      const res = await api.addTopPic(word._id);
      setTopWords((prev) => [res.data, ...prev]);
      setTopIds((prev) => [res.data.word._id, ...prev]);
      showToast("Added to Your Top Pics", "success");
    } catch (err) {
      showToast(err.message || "Could not add", "error");
    }
  };

  const removeFromTop = async (id) => {
    try {
      await api.removeTopPic(id);
      setTopWords((prev) => prev.filter((it) => it.word._id !== id));
      setTopIds((prev) => prev.filter((x) => x !== id));
      showToast("Removed from Your Top Pics", "success");
    } catch (err) {
      showToast(err.message || "Could not remove", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-8 pb-16 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-zinc-900">Your Top Pics</h1>
        <p className="text-xs text-zinc-500">
          Keep quick access to words you struggle with.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search words..."
              className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-semibold"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          <div className="space-y-3">
            {results.length === 0 ? (
              <div className="text-sm text-zinc-400">No search results</div>
            ) : (
              results.map((word) => (
                <div
                  key={word._id}
                  className="rounded-xl border border-zinc-100 bg-white p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-zinc-900">{word.word}</div>
                    <div className="text-xs text-zinc-500">{word.meaning}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {word.pronunciation && (
                      <button
                        onClick={() => {
                          window.speechSynthesis.cancel();
                          const u = new SpeechSynthesisUtterance(word.word);
                          u.lang = "en-US";
                          u.rate = 0.9;
                          window.speechSynthesis.speak(u);
                        }}
                        className="p-2 rounded-lg bg-indigo-50 text-indigo-600"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => addToTop(word)}
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="lg:col-span-1 space-y-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-premium space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">My Top Pics</h2>
              <button
                onClick={async () => {
                  try {
                    await Promise.all(topIds.map((id) => api.removeTopPic(id)));
                  } catch (err) {
                    // ignore individual errors
                  }
                  setTopWords([]);
                  setTopIds([]);
                  showToast("Cleared Top Pics", "success");
                }}
                className="text-xs text-zinc-400"
              >
                Clear
              </button>
            </div>

            {topWords.length === 0 ? (
              <div className="text-sm text-zinc-400">
                No words yet — add from search.
              </div>
            ) : (
              <div className="space-y-2">
                {topWords.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between gap-3"
                  >
                    <Link
                      to={`/words/${item.word._id}`}
                      className="font-semibold text-zinc-900"
                    >
                      {item.word.word}
                    </Link>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const u = new SpeechSynthesisUtterance(
                            item.word.word,
                          );
                          u.lang = "en-US";
                          u.rate = 0.9;
                          window.speechSynthesis.speak(u);
                        }}
                        className="p-1 rounded-md bg-indigo-50 text-indigo-600"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFromTop(item.word._id)}
                        className="p-1 rounded-md bg-rose-50 text-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TopPics;
