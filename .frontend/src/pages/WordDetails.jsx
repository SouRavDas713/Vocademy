/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useApp } from '../context/useApp';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Pencil,
  Mail,
  MessageSquareQuote,
  Tag,
  Volume2
} from 'lucide-react';

const DetailBlock = ({ title, children }) => (
  <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-premium space-y-2">
    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">{title}</h2>
    <div className="text-sm leading-relaxed text-zinc-700">{children}</div>
  </section>
);

const WordChipList = ({ items, tone }) => {
  if (!items?.length) {
    return <span className="text-xs italic text-zinc-400">No entries yet</span>;
  }

  const colorClass = tone === 'rose'
    ? 'bg-rose-50 text-rose-700 border-rose-100'
    : 'bg-emerald-50 text-emerald-700 border-emerald-100';

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${colorClass}`}>
          {item}
        </span>
      ))}
    </div>
  );
};

export const WordDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, showToast } = useApp();
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);

  const playPronunciation = () => {
    if (!word?.word || !window.speechSynthesis) {
      showToast('Pronunciation is not available in this browser', 'error');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const fetchWord = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getWord(id);
      setWord(response.data);
    } catch (error) {
      showToast(error.message || 'Could not load word details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchWord();
  }, [fetchWord]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-16 animate-fade-in">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-premium">
          <div className="h-7 w-48 rounded bg-zinc-100 animate-pulse" />
          <div className="mt-5 h-32 rounded-2xl bg-zinc-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-16 text-center animate-fade-in">
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-10 space-y-4">
          <BookOpen className="mx-auto h-8 w-8 text-zinc-400" />
          <h1 className="text-xl font-bold text-zinc-900">Word not found</h1>
          <button
            type="button"
            onClick={() => navigate('/vault')}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white"
          >
            Back to Vault
          </button>
        </div>
      </div>
    );
  }

  const createdDate = word.createdAt
    ? new Date(word.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Unknown date';

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 pb-16 space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <section className="space-y-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              <BookOpen className="h-3.5 w-3.5" />
              Word Details
            </span>
            <div className="space-y-2">
              <h1 className="wrap-break-word text-4xl font-extrabold tracking-tight text-zinc-950 md:text-5xl font-display">
                {word.word}
              </h1>
              {word.pronunciation && (
                <p className="inline-flex items-center gap-2 font-mono text-sm font-bold text-zinc-400">
                  <button
                    type="button"
                    onClick={playPronunciation}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 transition-all hover:bg-indigo-100 hover:text-indigo-700"
                    title={`Play pronunciation for ${word.word}`}
                    aria-label={`Play pronunciation for ${word.word}`}
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                  {word.pronunciation}
                </p>
              )}
              {!word.pronunciation && (
                <button
                  type="button"
                  onClick={playPronunciation}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-100 hover:text-indigo-700"
                  title={`Play pronunciation for ${word.word}`}
                >
                  <Volume2 className="h-4 w-4" />
                  Pronounce
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-2 text-xs font-bold text-zinc-500">
            {isAuthenticated ? (
              <Link
                to={`/words/${id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/10 transition-all hover:bg-indigo-600"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            ) : (
              <Link
                to="/login"
                state={{ from: `/words/${id}/edit` }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white shadow-md shadow-zinc-900/10 transition-all hover:bg-zinc-800"
              >
                <Pencil className="h-4 w-4" />
                Sign in to edit
              </Link>
            )}
            <span className="inline-flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2">
              <CalendarDays className="h-4 w-4 text-zinc-400" />
              {createdDate}
            </span>
            {word.addedByEmail && (
              <span className="inline-flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2">
                <Mail className="h-4 w-4 text-zinc-400" />
                {word.addedByEmail}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailBlock title="English Definition">
            {word.meaning || <span className="italic text-zinc-400">No definition added</span>}
          </DetailBlock>

          <DetailBlock title="Bangla Meaning">
            <span className="font-bold text-zinc-800">
              {word.banglaMeaning || <span className="italic font-normal text-zinc-400">No Bangla meaning added</span>}
            </span>
          </DetailBlock>
        </div>

        <DetailBlock title="Example Sentence">
          <div className="flex gap-3">
            <MessageSquareQuote className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />
            <p className="italic">
              {word.exampleSentence || <span className="italic text-zinc-400">No example sentence added</span>}
            </p>
          </div>
        </DetailBlock>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailBlock title="Synonyms">
            <div className="flex gap-3">
              <Tag className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <WordChipList items={word.synonyms} />
            </div>
          </DetailBlock>

          <DetailBlock title="Antonyms">
            <div className="flex gap-3">
              <Tag className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              <WordChipList items={word.antonyms} tone="rose" />
            </div>
          </DetailBlock>
        </div>
      </section>
    </div>
  );
};

export default WordDetails;
