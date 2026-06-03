import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/useApp";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle,
  ArrowLeft,
  Eye,
  Volume2,
  Bookmark,
  Sparkles,
  BookOpen,
} from "lucide-react";

export const AddWord = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [formData, setFormData] = useState({
    word: "",
    pronunciation: "",
    meaning: "",
    banglaMeaning: "",
    exampleSentence: "",
    synonyms: "",
    antonyms: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const validate = () => {
    const tempErrors = {};
    if (!formData.word.trim()) {
      tempErrors.word = "English word is required";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Trigger Confirmation Modal instead of immediate submit
  const handleAddClick = (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast("English word is required", "error");
      return;
    }
    setShowConfirmModal(true);
  };

  // Perform actual database submission
  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      const response = await api.createWord(formData);
      if (response.success) {
        showToast(response.message || "Word added successfully!", "success");
        navigate("/vault");
      }
    } catch (err) {
      showToast(err.message || "Failed to add word", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-8 pb-16 space-y-6 animate-fade-in relative">
      {/* Return Back Link */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-950 font-semibold transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 font-display">
          Add New Vocabulary
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Record a new word manually. All fields except English Word are
          optional.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Form Inputs */}
        <form
          onSubmit={handleAddClick}
          className="lg:col-span-7 space-y-6 p-6 md:p-8 rounded-3xl border border-zinc-200 bg-white shadow-premium"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Word Input (Only required field) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                English Word <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="word"
                className={`w-full px-4 py-2.5 rounded-xl border bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                  errors.word
                    ? "border-rose-300 focus:ring-rose-100 focus:border-rose-400"
                    : "border-zinc-200 focus:ring-indigo-100 focus:border-indigo-400"
                }`}
                placeholder="e.g. Meticulous"
                value={formData.word}
                onChange={handleChange}
              />
              {errors.word && (
                <p className="text-[11px] text-rose-500 font-medium">
                  {errors.word}
                </p>
              )}
            </div>

            {/* Pronunciation Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Pronunciation Symbol
              </label>
              <input
                type="text"
                name="pronunciation"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                placeholder="e.g. /məˈtɪkjələs/"
                value={formData.pronunciation}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Bangla Meaning Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Bangla Meaning (বাংলা অর্থ)
            </label>
            <input
              type="text"
              name="banglaMeaning"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
              placeholder="e.g. অতি যত্নবান বা খুঁতখুঁতে"
              value={formData.banglaMeaning}
              onChange={handleChange}
            />
          </div>

          {/* Definition Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-display">
              English Definition
            </label>
            <textarea
              name="meaning"
              rows="3"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all resize-none"
              placeholder="e.g. Showing great attention to detail; very careful and precise."
              value={formData.meaning}
              onChange={handleChange}
            ></textarea>
          </div>

          {/* Example Sentence Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Example Sentence
            </label>
            <textarea
              name="exampleSentence"
              rows="2.5"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all resize-none"
              placeholder="Include the word in a sentence..."
              value={formData.exampleSentence}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Synonyms Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Synonyms (Comma separated)
              </label>
              <input
                type="text"
                name="synonyms"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                placeholder="e.g. painstaking, precise"
                value={formData.synonyms}
                onChange={handleChange}
              />
            </div>

            {/* Antonyms Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Antonyms (Comma separated)
              </label>
              <input
                type="text"
                name="antonyms"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                placeholder="e.g. careless, sloppy"
                value={formData.antonyms}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              {submitting ? "Creating Word Record..." : "Add to Vocademy Vault"}
            </button>
          </div>
        </form>

        {/* Right Side: Live Interactive Card Preview (Simplified without tags) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">
            <Eye className="w-4 h-4" />
            Live Card Preview
          </div>

          <div className="p-6 md:p-8 rounded-3xl border border-zinc-200 bg-white shadow-premium relative space-y-6 min-h-[300px] flex flex-col justify-between transition-all">
            <div className="space-y-4">
              {/* Preview Header (Tagless minimal row) */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  Minimalist Card
                </span>

                <button
                  type="button"
                  className="p-1.5 rounded-lg border border-zinc-100 text-zinc-300"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>

              {/* Preview Main Word Titles */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-zinc-900 break-words max-w-[220px]">
                    {formData.word.trim() || "Word Title"}
                  </h3>
                  <div className="p-1.5 rounded-lg bg-zinc-50 text-zinc-400">
                    <Volume2 className="w-4 h-4" />
                  </div>
                </div>

                {formData.pronunciation.trim() && (
                  <p className="text-xs font-semibold font-mono text-zinc-400 leading-none">
                    {formData.pronunciation}
                  </p>
                )}

                {/* English Definition Box */}
                <div className="mt-4 p-3 bg-indigo-50/30 rounded-xl space-y-1">
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide leading-none">
                    Definition
                  </p>
                  <p className="text-xs text-zinc-700 font-medium">
                    {formData.meaning.trim() || "Type definition details..."}
                  </p>
                </div>

                {/* Bangla Meaning Box */}
                {formData.banglaMeaning.trim() && (
                  <div className="p-3 bg-amber-50/20 rounded-xl space-y-1">
                    <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wide leading-none">
                      Bangla Meaning
                    </p>
                    <p className="bangla-meaning text-xs text-zinc-700 font-bold">
                      {formData.banglaMeaning.trim()}
                    </p>
                  </div>
                )}
              </div>

              {/* Preview Sentence */}
              {formData.exampleSentence.trim() && (
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    Example Sentence
                  </p>
                  <blockquote className="p-2.5 border-l-2 border-indigo-500 bg-zinc-50 rounded-r-lg text-[11px] text-zinc-500 italic">
                    "{formData.exampleSentence}"
                  </blockquote>
                </div>
              )}
            </div>

            {/* Preview Synonyms & Antonyms */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-zinc-400 uppercase">
                  Synonyms
                </p>
                <div className="flex flex-wrap gap-1">
                  {formData.synonyms.trim() ? (
                    formData.synonyms.split(",").map((s, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100/20"
                      >
                        {s.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-zinc-300 italic">
                      Empty
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] font-bold text-zinc-400 uppercase">
                  Antonyms
                </p>
                <div className="flex flex-wrap gap-1">
                  {formData.antonyms.trim() ? (
                    formData.antonyms.split(",").map((a, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-100/20"
                      >
                        {a.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-zinc-300 italic">
                      Empty
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION OVERLAY GLASS MODAL */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="w-full max-w-sm p-6 rounded-3xl border border-zinc-100 bg-white shadow-2xl space-y-5 text-center"
            >
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-zinc-900 font-display">
                  Confirm Word Entry
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Are you sure you want to add **"{formData.word}"** to your
                  Vocademy vocabulary vault?
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-500 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-xs font-bold text-white shadow-md shadow-indigo-500/10 hover:shadow-lg active:scale-98 transition-all cursor-pointer"
                >
                  Yes, Add Word
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default AddWord;
