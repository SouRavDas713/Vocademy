/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/useApp";
import { api } from "../services/api";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Search,
  Layers,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Plus,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import { ListSkeleton, CardSkeleton } from "../components/Skeleton";

const examModes = [
  {
    id: "english-bangla",
    label: "English to Bangla",
    hint: "Pick the Bangla meaning.",
  },
  {
    id: "bangla-english",
    label: "Bangla to English",
    hint: "Pick the English word.",
  },
  {
    id: "english-synonym",
    label: "English to Synonym",
    hint: "Pick the synonym.",
  },
  {
    id: "english-antonym",
    label: "English to Antonym",
    hint: "Pick the antonym.",
  },
  {
    id: "english-meaning",
    label: "English to Definition",
    hint: "Pick the definition.",
  },
  {
    id: "meaning-english",
    label: "Definition to English",
    hint: "Pick the word.",
  },
  {
    id: "synonym-english",
    label: "Synonym to English",
    hint: "Pick the matching word.",
  },
  {
    id: "antonym-english",
    label: "Antonym to English",
    hint: "Pick the matching word.",
  },
];

const EXAM_SESSION_SIZE = 15;

export const AllWords = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, showToast } = useApp();

  // Primary states
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalWords, setTotalWords] = useState(0);

  // Filters & sorting states
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [sortBy, setSortBy] = useState("word"); // 'word', 'createdAt'
  const [order, setOrder] = useState("asc"); // 'asc', 'desc'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [examMode, setExamMode] = useState("");
  const [examQuestion, setExamQuestion] = useState(null);
  const [examLoading, setExamLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [examQuestionsAsked, setExamQuestionsAsked] = useState([]);
  const [examFinished, setExamFinished] = useState(false);

  const sessionSeenIds = examQuestionsAsked.map((q) => q.wordId);
  const correctCount = examQuestionsAsked.filter((q) => q.isCorrect).length;
  const accuracy = examQuestionsAsked.length
    ? correctCount / examQuestionsAsked.length
    : 0;
  const progressCount = Math.min(
    examFinished ? examQuestionsAsked.length : examQuestionsAsked.length + 1,
    EXAM_SESSION_SIZE,
  );
  const missedWords = examQuestionsAsked.filter((q) => !q.isCorrect);

  // Debounced input search binding
  useEffect(() => {
    const qSearch = searchParams.get("search");
    if (qSearch !== null) {
      setSearchTerm(qSearch);
    }
  }, [searchParams]);

  const fetchWords = useCallback(
    async ({ page, activeSortBy, activeOrder, activeSearchTerm }) => {
      setLoading(true);
      try {
        const response = await api.getWords({
          page,
          limit: 12,
          sortBy: activeSortBy,
          order: activeOrder,
          search: activeSearchTerm,
        });

        if (response.success) {
          setWords(response.data);
          setTotalPages(response.totalPages);
          setTotalWords(response.totalWords);
        }
      } catch (err) {
        console.error(err);
        // showToast removed: do not show error toast when cannot fetch data
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    fetchWords({
      page: currentPage,
      activeSortBy: sortBy,
      activeOrder: order,
      activeSearchTerm: searchTerm,
    });
  }, [currentPage, sortBy, order, searchTerm, fetchWords]);

  // Debounce search submissions
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      // Sync URL if searching
      if (searchTerm.trim()) {
        setSearchParams({ search: searchTerm.trim() });
      } else {
        setSearchParams({});
      }
      setCurrentPage(1); // reset to page 1 on new search
      fetchWords({
        page: 1,
        activeSortBy: sortBy,
        activeOrder: order,
        activeSearchTerm: searchTerm,
      });
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, sortBy, order, setSearchParams, fetchWords]);

  const loadExamQuestion = async (mode = examMode, seenIds = []) => {
    if (!mode) return;

    setExamLoading(true);
    setSelectedAnswer("");
    try {
      const response = await api.getTestQuestion(mode, { seenIds });
      setExamQuestion(response.data);
    } catch (error) {
      setExamQuestion(null);
      setExamFinished(true);
      showToast(error.message || "Could not load test question", "error");
    } finally {
      setExamLoading(false);
    }
  };

  const startExam = (mode) => {
    setExamMode(mode);
    setScore(0);
    setAnsweredCount(0);
    setExamQuestionsAsked([]);
    setExamFinished(false);
    loadExamQuestion(mode, []);
  };

  const handleAnswer = (answer) => {
    if (selectedAnswer || !examQuestion) return;

    setSelectedAnswer(answer);
    const isCorrect = answer === examQuestion.correctAnswer;
    setAnsweredCount((prev) => prev + 1);
    setScore((prev) => Math.max(0, prev + (isCorrect ? 1 : -1)));

    if (isAuthenticated) {
      api
        .recordTestAnswer({ wordId: examQuestion.wordId, isCorrect })
        .catch(() => {});
    }

    setExamQuestionsAsked((prev) => {
      const next = [
        ...prev,
        {
          wordId: examQuestion.wordId,
          word: examQuestion.word,
          prompt: examQuestion.prompt,
          isCorrect,
        },
      ];
      if (next.length >= EXAM_SESSION_SIZE) {
        setExamFinished(true);
      }
      return next;
    });
  };

  const quitExam = () => {
    setExamMode("");
    setExamQuestion(null);
    setExamLoading(false);
    setSelectedAnswer("");
    setScore(0);
    setAnsweredCount(0);
    setExamQuestionsAsked([]);
    setExamFinished(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-8 pb-16 space-y-8 animate-fade-in">
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-premium">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-12">
          <div className="lg:col-span-7 p-6 md:p-8 space-y-5">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              <Sparkles className="h-3.5 w-3.5" />
              Vocabulary Home
            </span>
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 font-display">
                Build words into memory.
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-zinc-500">
                Search the full vault, collect today&apos;s target words, revise
                them with focused tests, and grow your vocabulary one clean
                session at a time.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => navigate("/learning")}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-zinc-800"
                >
                  <Target className="h-4 w-4" />
                  Current Learning
                </button>
              )}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => navigate("/add")}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-600"
                >
                  <Plus className="h-4 w-4" />
                  Add Word
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 bg-zinc-950 text-white p-6 md:p-8 flex flex-col justify-between gap-8">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <BookOpen className="h-5 w-5 text-indigo-200" />
                <p className="mt-4 text-2xl font-extrabold">{totalWords}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Vault Words
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <Brain className="h-5 w-5 text-emerald-200" />
                <p className="mt-4 text-2xl font-extrabold">4</p>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Test Modes
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Today&apos;s rhythm
              </p>
              <div className="flex flex-wrap gap-2">
                {["Search", "Collect", "Revise", "Learned"].map((step) => (
                  <span
                    key={step}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-zinc-100"
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
              Full Vault Exam
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 font-display">
              Test Yourself
            </h2>
            <p className="text-sm text-zinc-500">
              Competitive questions from the whole word storage. Correct answers
              add 1 point, wrong answers subtract 1.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-bold text-zinc-500 shadow-premium">
            <Trophy className="h-4 w-4 text-amber-500" />
            Score {score} / {answeredCount}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {examModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => startExam(mode.id)}
              className={`rounded-2xl border p-4 text-left shadow-premium transition-all ${
                examMode === mode.id
                  ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              }`}
            >
              <span className="block text-sm font-extrabold font-display">
                {mode.label}
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                {mode.hint}
              </span>
            </button>
          ))}
        </div>

        {examMode && (
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-premium space-y-5">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {examModes.find((mode) => mode.id === examMode)?.label}
              </span>
              <button
                type="button"
                onClick={quitExam}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-500 transition-all hover:bg-zinc-50 hover:text-zinc-900"
              >
                <XCircle className="h-4 w-4" />
                Quit
              </button>
            </div>

            {examLoading ? (
              <div className="rounded-3xl bg-zinc-50 p-10 text-center text-sm font-bold text-zinc-400">
                Loading question...
              </div>
            ) : examQuestion ? (
              <>
                <div className="rounded-3xl bg-zinc-50 p-8 text-center space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                    Choose the correct answer
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Question {progressCount} / {EXAM_SESSION_SIZE}
                  </span>
                  <h3 className="wrap-break-word text-3xl font-extrabold text-zinc-950 md:text-4xl font-display">
                    {examQuestion.prompt}
                  </h3>
                  {examQuestion.word && (
                    <Link
                      to={`/words/${examQuestion.wordId}`}
                      className="text-xs font-bold text-zinc-400 hover:text-indigo-600"
                    >
                      View source word
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {examQuestion.options.map((option) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrect = examQuestion.correctAnswer === option;
                    const showCorrect = selectedAnswer && isCorrect;
                    const showWrong = isSelected && !isCorrect;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleAnswer(option)}
                        disabled={Boolean(selectedAnswer)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all ${
                          showCorrect
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : showWrong
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-200 hover:bg-indigo-50"
                        } disabled:cursor-default`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {selectedAnswer && (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                      selectedAnswer === examQuestion.correctAnswer
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {selectedAnswer === examQuestion.correctAnswer
                      ? "+1 Correct."
                      : `-1 Wrong. Answer: ${examQuestion.correctAnswer}`}
                  </div>
                )}

                {selectedAnswer && !examFinished && (
                  <button
                    type="button"
                    onClick={() => loadExamQuestion(examMode, sessionSeenIds)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800"
                  >
                    Next Question
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {selectedAnswer && examFinished && (
                  <div className="rounded-3xl bg-zinc-50 p-6 space-y-4">
                    <div className="space-y-1 text-center">
                      <h3 className="text-xl font-extrabold text-zinc-950 font-display">
                        Session complete
                      </h3>
                      <p className="text-sm text-zinc-600">
                        Final score <span className="font-bold">{score}</span> /{" "}
                        {EXAM_SESSION_SIZE} · Accuracy{" "}
                        <span className="font-bold">{correctCount}</span>/
                        {answeredCount} ({Math.round(accuracy * 100)}%)
                      </p>
                    </div>

                    {missedWords.length === 0 ? (
                      <div className="text-center text-sm font-bold text-emerald-700">
                        Perfect run.
                      </div>
                    ) : (
                      <div className="text-center text-sm font-medium text-zinc-600">
                        You missed{" "}
                        <span className="font-bold">{missedWords.length}</span>{" "}
                        word(s).
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => startExam(examMode)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800"
                    >
                      Start Again
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-3xl bg-zinc-50 p-10 text-center text-sm font-bold text-zinc-400">
                Pick another test type or add more complete word data.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
            Vocabulary Vault
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 font-display">
            Vault Dictionary ({totalWords})
          </h1>
          <p className="text-xs text-zinc-400">
            All saved and seeded English vocabulary.
          </p>
        </div>

        {/* View Switches & Create shortcut */}
        <div className="flex items-center gap-2">
          {/* Grid/List switches */}
          <div className="flex rounded-xl border border-zinc-200 p-0.5 bg-zinc-50 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white text-zinc-800 shadow-sm" : "text-zinc-400 hover:text-zinc-600"}`}
              title="Grid Layout"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-white text-zinc-800 shadow-sm" : "text-zinc-400 hover:text-zinc-600"}`}
              title="List Layout"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {isAuthenticated && (
            <button
              onClick={() => navigate("/add")}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 shadow-md shadow-indigo-500/10 transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              Add Word
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Action bar */}
      <section className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-premium space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-800 placeholder-zinc-400 bg-zinc-50/30 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm"
            placeholder="Search keywords or definitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dropdowns filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Sort By Dropdown */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Sort By
            </span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-600 focus:outline-none focus:bg-white transition-all"
            >
              <option value="word">Alphabetical</option>
              <option value="createdAt">Date Created</option>
            </select>
          </div>

          {/* Order Dropdown */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Order
            </span>
            <select
              value={order}
              onChange={(e) => {
                setOrder(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-600 focus:outline-none focus:bg-white transition-all"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Results Listing Container */}
      <section>
        {loading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <ListSkeleton />
          )
        ) : words.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50 space-y-4">
            <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400">
              <Layers className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-800">
                No words match search
              </h3>
              <p className="text-xs text-zinc-400">
                Try a different keyword or clear the search field.
              </p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* GRID TEMPLATE */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {words.map((word) => (
              <Link
                to={`/words/${word._id}`}
                key={word._id}
                className="group p-6 rounded-2xl border border-zinc-150 bg-white hover:border-zinc-300 shadow-premium hover:shadow-premium-hover transition-all flex flex-col justify-between min-h-48 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-zinc-950 group-hover:text-indigo-600 transition-colors">
                      {word.word}
                    </h3>
                  </div>

                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {word.meaning}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-50 mt-4">
                  <span className="bangla-meaning text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                    {word.banglaMeaning}
                  </span>

                  {word.pronunciation && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {word.pronunciation}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* LIST TEMPLATE */
          <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-white shadow-premium">
            <div className="divide-y divide-zinc-100">
              {words.map((word) => (
                <Link
                  to={`/words/${word._id}`}
                  key={word._id}
                  className="group flex items-center justify-between p-4 hover:bg-zinc-50/50 transition-colors focus:outline-none focus:bg-indigo-50/40"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors text-sm md:text-base">
                          {word.word}
                        </span>
                        <span className="text-xs font-semibold text-zinc-400 font-mono hidden md:inline">
                          {word.pronunciation}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate max-w-lg">
                        {word.meaning}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pr-2">
                    <span className="bangla-meaning text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 whitespace-nowrap">
                      {word.banglaMeaning}
                    </span>

                    {word.pronunciation && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        {word.pronunciation}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Nav Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-600" />
            </button>

            <span className="text-xs font-bold text-zinc-500 px-3">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
export default AllWords;
