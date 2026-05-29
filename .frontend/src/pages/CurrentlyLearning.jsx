/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookMarked,
  Brain,
  CheckCircle2,
  Layers,
  Plus,
  Search,
  Target,
  Volume2,
  X,
  XCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/useApp';

const speakWord = (word, showToast) => {
  if (!word || !window.speechSynthesis) {
    showToast('Pronunciation is not available in this browser', 'error');
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
};

const shuffleArray = (items) => {
  const arr = Array.isArray(items) ? [...items] : [];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const testModes = [
  { id: 'english', label: 'English Word', description: 'See English cards one by one.' },
  { id: 'bangla', label: 'Bangla Word', description: 'See Bangla cards one by one.' },
  { id: 'synonym', label: 'Guess Synonym', description: 'Choose the right synonym.' },
  { id: 'antonym', label: 'Guess Antonym', description: 'Choose the right antonym.' }
];

const fallbackOptionWords = [
  'similar',
  'different',
  'careful',
  'simple',
  'strong',
  'weak',
  'clear',
  'hidden'
];

const LEARNING_TEST_SESSION_SIZE = 12;

const getWordWeight = (word) => {
  const stat = word?.stats || null;
  if (!stat) return 1.2;

  const correct = stat.correctCount || 0;
  const incorrect = stat.incorrectCount || 0;
  const total = correct + incorrect;
  const accuracy = total > 0 ? correct / total : 0;
  const incorrectRate = total > 0 ? 1 - accuracy : 1;

  const now = Date.now();
  const lastSeenAt = stat.lastSeenAt ? new Date(stat.lastSeenAt).getTime() : null;
  const hoursSince = lastSeenAt ? (now - lastSeenAt) / (1000 * 60 * 60) : 72;
  const recencyBoost = 1 + Math.min(4, hoursSince / 24);

  let weight = 0.2 + incorrectRate * recencyBoost;
  if (incorrect > correct) weight *= 1.25;
  return Math.max(0.01, weight);
};

const weightedSampleWithoutReplacement = (items, weights, k) => {
  const scored = items.map((item, i) => ({
    item,
    // Efraimidis-Spirakis: sample w/o replacement with weights.
    key: -Math.log(Math.random()) / (weights[i] || 0.0001),
  }));
  scored.sort((a, b) => a.key - b.key);
  return scored.slice(0, k).map((s) => s.item);
};

const weightedPick = (items, weights) => {
  const total = weights.reduce((acc, w) => acc + w, 0);
  const r = Math.random() * (total || 1);
  let running = 0;
  for (let i = 0; i < items.length; i += 1) {
    running += weights[i] || 0;
    if (r <= running) return items[i];
  }
  return items[0];
};

const buildSessionDeck = (pool, sessionSize = LEARNING_TEST_SESSION_SIZE) => {
  if (!pool || !pool.length) return [];

  const weights = pool.map((w) => getWordWeight(w));

  // Unique session when the pool is large enough.
  if (pool.length >= sessionSize) {
    return weightedSampleWithoutReplacement(pool, weights, sessionSize);
  }

  // Otherwise allow repeats, prioritizing weaker words.
  const deck = [];
  let lastWordId = null;
  while (deck.length < sessionSize) {
    let chosen = weightedPick(pool, weights);
    if (
      lastWordId &&
      chosen?._id &&
      chosen._id === lastWordId &&
      deck.length < sessionSize - 1
    ) {
      // Try once to avoid immediate repeats.
      chosen = weightedPick(pool, weights);
    }
    deck.push(chosen);
    lastWordId = chosen?._id || null;
  }
  return deck;
};

export const CurrentlyLearning = () => {
  const { showToast } = useApp();
  const [learningItems, setLearningItems] = useState([]);
  const [learningLoading, setLearningLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [busyWordId, setBusyWordId] = useState('');
  const [testMode, setTestMode] = useState('');
  const [testDeck, setTestDeck] = useState([]);
  const [testIndex, setTestIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [testFinished, setTestFinished] = useState(false);
  const [quizAnsweredCount, setQuizAnsweredCount] = useState(0);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizResults, setQuizResults] = useState([]);

  const learningWordIds = useMemo(
    () => new Set(learningItems.map((item) => item.word?._id).filter(Boolean)),
    [learningItems],
  );

  const learningWords = useMemo(
    () => learningItems.map((item) => item.word).filter(Boolean),
    [learningItems],
  );

  const currentTestWord = testDeck[testIndex] || null;

  const currentQuestion = useMemo(() => {
    if (!currentTestWord || !['synonym', 'antonym'].includes(testMode)) {
      return null;
    }

    const answerList = testMode === 'synonym' ? currentTestWord.synonyms : currentTestWord.antonyms;
    const answerCandidates = Array.from(
      new Set((answerList || []).map((s) => (s || '').trim()).filter(Boolean))
    );

    if (!answerCandidates.length) return null;

    const shuffledAnswers = shuffleArray(answerCandidates);
    const correctAnswer = shuffledAnswers[testIndex % shuffledAnswers.length];

    const sameTypePool = testDeck
      .flatMap((word) => (testMode === 'synonym' ? word.synonyms : word.antonyms) || [])
      .map((s) => (s || '').trim())
      .filter(Boolean)
      .filter((item) => item !== correctAnswer);

    const fallbackPool = learningWords
      .flatMap((word) => (testMode === 'synonym' ? word.synonyms : word.antonyms) || [])
      .map((s) => (s || '').trim())
      .filter(Boolean)
      .filter((item) => item !== correctAnswer);

    const distractorCandidates = Array.from(
      new Set([...sameTypePool, ...fallbackPool, ...fallbackOptionWords])
    ).filter((item) => item && item !== correctAnswer);

    const distractors = shuffleArray(distractorCandidates).slice(0, 3);
    const options = Array.from(new Set(shuffleArray([correctAnswer, ...distractors]))).slice(0, 4);

    return {
      correctAnswer,
      options,
    };
  }, [currentTestWord, learningWords, testDeck, testMode, testIndex]);

  const loadLearningItems = useCallback(async () => {
    setLearningLoading(true);
    try {
      const response = await api.getLearningWords();
      setLearningItems(response.data || []);
    } catch (error) {
      showToast(error.message || 'Could not load learning list', 'error');
    } finally {
      setLearningLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadLearningItems();
  }, [loadLearningItems]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await api.getWords({
          page: 1,
          limit: 8,
          sortBy: 'word',
          order: 'asc',
          search: searchTerm.trim()
        });
        setSearchResults(response.data || []);
      } catch (error) {
        showToast(error.message || 'Could not search vault', 'error');
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, showToast]);

  const handleAddWord = async (wordId) => {
    setBusyWordId(wordId);
    try {
      const response = await api.addLearningWord(wordId);
      setLearningItems(prev => {
        if (prev.some(item => item.word?._id === response.data.word._id)) {
          return prev;
        }
        return [response.data, ...prev];
      });
      showToast(response.message || 'Word added to Currently Learning', 'success');
    } catch (error) {
      showToast(error.message || 'Could not add word', 'error');
    } finally {
      setBusyWordId('');
    }
  };

  const handleLearned = async (wordId) => {
    setBusyWordId(wordId);
    try {
      const response = await api.markLearningWordLearned(wordId);
      setLearningItems(prev => prev.filter(item => item.word?._id !== wordId));
      showToast(response.message || 'Marked as learned', 'success');
    } catch (error) {
      showToast(error.message || 'Could not mark learned', 'error');
    } finally {
      setBusyWordId('');
    }
  };

  const startTest = (mode) => {
    const modeWords = (() => {
      if (mode === 'synonym') {
        return learningWords.filter((word) => word.synonyms?.length);
      }
      if (mode === 'antonym') {
        return learningWords.filter((word) => word.antonyms?.length);
      }
      if (mode === 'bangla') {
        return learningWords.filter((word) => word.banglaMeaning);
      }
      return learningWords;
    })();

    setTestMode(mode);
    setTestDeck(buildSessionDeck(modeWords));
    setTestIndex(0);
    setSelectedOption('');
    setTestFinished(false);
    setQuizAnsweredCount(0);
    setQuizCorrectCount(0);
    setQuizResults([]);
  };

  const quitTest = () => {
    setTestMode('');
    setTestDeck([]);
    setTestIndex(0);
    setSelectedOption('');
    setTestFinished(false);
    setQuizAnsweredCount(0);
    setQuizCorrectCount(0);
    setQuizResults([]);
  };

  const handleNextQuestion = () => {
    if (testDeck.length === 0) {
      return;
    }

    const nextIndex = testIndex + 1;
    if (nextIndex >= testDeck.length) {
      setTestFinished(true);
      setSelectedOption('');
      return;
    }

    setTestIndex(nextIndex);
    setSelectedOption('');
  };

  const isQuizMode = testMode === 'synonym' || testMode === 'antonym';
  const selectedIsCorrect = selectedOption && currentQuestion?.correctAnswer === selectedOption;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-8 pb-16 space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Focused Revision</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 font-display">
            Currently Learning ({learningItems.length})
          </h1>
          <p className="text-sm text-zinc-500 max-w-2xl">
            Build today&apos;s target list from the vault, revise only these words, then mark them learned when they are done.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-bold text-zinc-500 shadow-premium border border-zinc-200">
          <Target className="h-4 w-4 text-indigo-500" />
          Your private list
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-zinc-900 font-display">Test Your Current Words</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {testModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => startTest(mode.id)}
              disabled={learningWords.length === 0}
              className={`rounded-2xl border p-4 text-left transition-all disabled:opacity-50 ${
                testMode === mode.id
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-900 shadow-premium'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 shadow-premium'
              }`}
            >
              <span className="block text-sm font-extrabold font-display">{mode.label}</span>
              <span className="mt-1 block text-xs text-zinc-500">{mode.description}</span>
            </button>
          ))}
        </div>

        {testMode && (
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-premium space-y-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Active Test
              </span>
              <button
                type="button"
                onClick={quitTest}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-500 transition-all hover:bg-zinc-50 hover:text-zinc-900"
              >
                <X className="h-4 w-4" />
                Quit Test
              </button>
            </div>

            {testFinished ? (
              <div className="py-8 text-center space-y-4">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                <h3 className="font-bold text-zinc-900">Session complete</h3>
                {isQuizMode ? (
                  <>
                    <p className="text-sm text-zinc-600">
                      Accuracy <span className="font-bold">{quizCorrectCount}</span>/{quizAnsweredCount}{" "}
                      ({quizAnsweredCount ? Math.round((quizCorrectCount / quizAnsweredCount) * 100) : 0}%)
                    </p>

                    {Array.from(new Set(quizResults.filter((r) => !r.isCorrect).map((r) => r.wordId))).length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Words to review
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {Array.from(new Set(quizResults.filter((r) => !r.isCorrect).map((r) => r.wordId))).slice(0, 10).map((wordId) => (
                            <Link
                              key={`${wordId}-learning-review`}
                              to={`/words/${wordId}`}
                              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                            >
                              Review
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm font-bold text-emerald-700">Perfect run.</div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-zinc-600">
                    Revised <span className="font-bold">{testDeck.length}</span> words.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => startTest(testMode)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800"
                >
                  Start Again
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : testDeck.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <XCircle className="mx-auto h-8 w-8 text-zinc-300" />
                <h3 className="font-bold text-zinc-800">No words ready for this test</h3>
                <p className="text-xs text-zinc-400">
                  Add words with {testMode === 'synonym' ? 'synonyms' : testMode === 'antonym' ? 'antonyms' : 'Bangla meanings'} first.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {testIndex + 1} / {testDeck.length}
                  </span>
                  {currentTestWord?.word && (
                    <button
                      type="button"
                      onClick={() => speakWord(currentTestWord.word, showToast)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 transition-all hover:bg-indigo-100 hover:text-indigo-700"
                      title={`Pronounce ${currentTestWord.word}`}
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="rounded-3xl bg-zinc-50 p-8 text-center space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                    {testMode === 'english' && 'Read the English word'}
                    {testMode === 'bangla' && 'Read the Bangla meaning'}
                    {testMode === 'synonym' && 'Pick the synonym'}
                    {testMode === 'antonym' && 'Pick the antonym'}
                  </span>
                  <h3 className="wrap-break-word text-4xl font-extrabold text-zinc-950 font-display">
                    {testMode === 'bangla' ? currentTestWord.banglaMeaning : currentTestWord.word}
                  </h3>
                  {testMode === 'english' && currentTestWord.pronunciation && (
                    <p className="font-mono text-sm font-bold text-zinc-400">{currentTestWord.pronunciation}</p>
                  )}
                </div>

                {isQuizMode && currentQuestion && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {currentQuestion.options.map((option) => {
                      const isSelected = selectedOption === option;
                      const isCorrect = currentQuestion.correctAnswer === option;
                      const showCorrect = selectedOption && isCorrect;
                      const showWrong = isSelected && !isCorrect;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            if (!currentTestWord || !currentQuestion) return;
                            const isCorrectChoice = option === currentQuestion.correctAnswer;
                            setSelectedOption(option);
                            setQuizAnsweredCount((prev) => prev + 1);
                            setQuizCorrectCount((prev) => prev + (isCorrectChoice ? 1 : 0));
                            setQuizResults((prev) => [
                              ...prev,
                              {
                                wordId: currentTestWord._id,
                                word: currentTestWord.word,
                                isCorrect: isCorrectChoice,
                              },
                            ]);
                            api.recordTestAnswer({ wordId: currentTestWord._id, isCorrect: isCorrectChoice }).catch(() => {});
                          }}
                          disabled={Boolean(selectedOption)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all ${
                            showCorrect
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : showWrong
                                ? 'border-rose-200 bg-rose-50 text-rose-700'
                                : 'border-zinc-200 bg-white text-zinc-700 hover:border-indigo-200 hover:bg-indigo-50'
                          } disabled:cursor-default`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedOption && isQuizMode && (
                  <div className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                    selectedIsCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {selectedIsCorrect
                      ? 'Correct.'
                      : `Wrong. Answer: ${currentQuestion.correctAnswer}`}
                  </div>
                )}

                {(!isQuizMode || selectedOption) && (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-zinc-900 font-display">Revise List</h2>
          </div>

          {learningLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-36 rounded-2xl bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : learningItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center space-y-3">
              <Layers className="mx-auto h-8 w-8 text-zinc-400" />
              <h3 className="font-bold text-zinc-800">No words in your focus list</h3>
              <p className="text-xs text-zinc-400">Search the vault and add words you want to revise.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {learningItems.map((item) => {
                const word = item.word;
                return (
                  <article key={item._id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-premium space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <Link to={`/words/${word._id}`} className="text-xl font-extrabold text-zinc-950 transition-colors hover:text-indigo-600 font-display">
                          {word.word}
                        </Link>
                        <button
                          type="button"
                          onClick={() => speakWord(word.word, showToast)}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 transition-all hover:bg-indigo-100 hover:text-indigo-700"
                          title={`Pronounce ${word.word}`}
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                      {word.pronunciation && (
                        <p className="font-mono text-xs font-bold text-zinc-400">{word.pronunciation}</p>
                      )}
                      <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600">
                        {word.meaning || 'No definition added'}
                      </p>
                      {word.banglaMeaning && (
                        <span className="inline-flex rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600">
                          {word.banglaMeaning}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLearned(word._id)}
                      disabled={busyWordId === word._id}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {busyWordId === word._id ? 'Updating...' : 'Learned'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="lg:col-span-5 lg:sticky lg:top-24 self-start space-y-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-premium space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-zinc-900 font-display">Add From Vault</h2>
              <p className="text-xs text-zinc-400">Search saved words and add them to this private list.</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-sm text-zinc-800 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="Search vault words..."
              />
            </div>

            <div className="space-y-2">
              {searchLoading ? (
                <div className="rounded-2xl bg-zinc-50 p-4 text-center text-xs font-bold text-zinc-400">
                  Searching...
                </div>
              ) : searchTerm.trim() && searchResults.length === 0 ? (
                <div className="rounded-2xl bg-zinc-50 p-4 text-center text-xs font-bold text-zinc-400">
                  No vault words found
                </div>
              ) : (
                searchResults.map((word) => {
                  const alreadyAdded = learningWordIds.has(word._id);
                  return (
                    <div key={word._id} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3">
                      <div className="min-w-0">
                        <Link to={`/words/${word._id}`} className="truncate font-bold text-zinc-900 transition-colors hover:text-indigo-600">
                          {word.word}
                        </Link>
                        <p className="truncate text-xs text-zinc-500">{word.meaning || word.banglaMeaning}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddWord(word._id)}
                        disabled={alreadyAdded || busyWordId === word._id}
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                          alreadyAdded
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-indigo-500 text-white hover:bg-indigo-600'
                        } disabled:opacity-80`}
                        title={alreadyAdded ? 'Already added' : `Add ${word.word}`}
                      >
                        {alreadyAdded ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default CurrentlyLearning;
