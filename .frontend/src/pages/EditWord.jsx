/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/useApp';

const emptyForm = {
  word: '',
  pronunciation: '',
  meaning: '',
  banglaMeaning: '',
  exampleSentence: '',
  synonyms: '',
  antonyms: ''
};

export const EditWord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchWord = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getWord(id);
      const word = response.data;
      setFormData({
        word: word.word || '',
        pronunciation: word.pronunciation || '',
        meaning: word.meaning || '',
        banglaMeaning: word.banglaMeaning || '',
        exampleSentence: word.exampleSentence || '',
        synonyms: word.synonyms?.join(', ') || '',
        antonyms: word.antonyms?.join(', ') || ''
      });
    } catch (error) {
      showToast(error.message || 'Could not load word', 'error');
      navigate('/vault', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchWord();
  }, [fetchWord]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.word.trim()) {
      nextErrors.word = 'English word is required';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      showToast('English word is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.updateWord(id, formData);
      showToast(response.message || 'Word updated successfully!', 'success');
      navigate(`/words/${id}`);
    } catch (error) {
      showToast(error.message || 'Failed to update word', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-16 animate-fade-in">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-premium">
          <div className="h-7 w-48 rounded bg-zinc-100 animate-pulse" />
          <div className="mt-6 grid gap-4">
            <div className="h-11 rounded-xl bg-zinc-100 animate-pulse" />
            <div className="h-28 rounded-xl bg-zinc-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-16 space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="space-y-1">
        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Edit Word</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 font-display">
          Update Vocabulary
        </h1>
        <p className="text-sm text-zinc-500">Change any field and save it back to the vault.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 md:p-8 shadow-premium">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              English Word <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="word"
              value={formData.word}
              onChange={handleChange}
              className={`w-full rounded-xl border bg-zinc-50/50 px-4 py-2.5 text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:bg-white focus:ring-2 ${
                errors.word
                  ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                  : 'border-zinc-200 focus:border-indigo-400 focus:ring-indigo-100'
              }`}
            />
            {errors.word && <p className="text-[11px] font-medium text-rose-500">{errors.word}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pronunciation</label>
            <input
              type="text"
              name="pronunciation"
              value={formData.pronunciation}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Bangla Meaning</label>
          <input
            type="text"
            name="banglaMeaning"
            value={formData.banglaMeaning}
            onChange={handleChange}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">English Definition</label>
          <textarea
            name="meaning"
            rows="3"
            value={formData.meaning}
            onChange={handleChange}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Example Sentence</label>
          <textarea
            name="exampleSentence"
            rows="2"
            value={formData.exampleSentence}
            onChange={handleChange}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Synonyms</label>
            <input
              type="text"
              name="synonyms"
              value={formData.synonyms}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Comma separated"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Antonyms</label>
            <input
              type="text"
              name="antonyms"
              value={formData.antonyms}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Comma separated"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3.5 font-semibold text-white shadow-md shadow-indigo-500/10 transition-all hover:bg-indigo-600 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {submitting ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditWord;
