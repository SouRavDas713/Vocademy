const Word = require("../models/Word");
const UserWordStat = require("../models/UserWordStat");
const { verify } = require("../utils/token");

const processList = (list) => {
  if (!list) return [];
  if (Array.isArray(list)) return list.map((s) => s.trim()).filter(Boolean);
  return list
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const formatWordPayload = (body) => {
  const {
    word,
    pronunciation,
    meaning,
    banglaMeaning,
    exampleSentence,
    synonyms,
    antonyms,
  } = body;

  const formattedWord = word.trim().charAt(0).toUpperCase() + word.trim().slice(1);

  return {
    word: formattedWord,
    pronunciation: pronunciation ? pronunciation.trim() : "",
    meaning: meaning ? meaning.trim() : "",
    banglaMeaning: banglaMeaning ? banglaMeaning.trim() : "",
    exampleSentence: exampleSentence ? exampleSentence.trim() : "",
    synonyms: processList(synonyms),
    antonyms: processList(antonyms),
  };
};

const shuffleArray = (items) => {
  const arr = Array.isArray(items) ? [...items] : [];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const getNestedAnswers = (word, type) => {
  const pools = {
    "english-bangla": [word.banglaMeaning],
    "bangla-english": [word.word],
    "english-meaning": [word.meaning],
    "meaning-english": [word.word],
    "english-synonym": word.synonyms || [],
    "synonym-english": [word.word],
    "english-antonym": word.antonyms || [],
    "antonym-english": [word.word],
  };

  return (pools[type] || []).filter(Boolean);
};

const getPrompt = (word, type, answer) => {
  if (type === "bangla-english") return word.banglaMeaning;
  if (type === "meaning-english") return word.meaning;
  if (type === "synonym-english") return answer;
  if (type === "antonym-english") return answer;
  return word.word;
};

const getQuestionFilter = (type) => {
  if (["english-bangla", "bangla-english"].includes(type)) {
    return { banglaMeaning: { $exists: true, $ne: "" } };
  }
  if (["english-meaning", "meaning-english"].includes(type)) {
    return { meaning: { $exists: true, $ne: "" } };
  }
  if (["english-synonym", "synonym-english"].includes(type)) {
    return { "synonyms.0": { $exists: true } };
  }
  if (["english-antonym", "antonym-english"].includes(type)) {
    return { "antonyms.0": { $exists: true } };
  }
  return null;
};

const getOptionPool = (words, type, correctAnswer) => {
  const pools = {
    "english-bangla": words.map((word) => word.banglaMeaning),
    "bangla-english": words.map((word) => word.word),
    "english-meaning": words.map((word) => word.meaning),
    "meaning-english": words.map((word) => word.word),
    "english-synonym": words.flatMap((word) => word.synonyms || []),
    "synonym-english": words.map((word) => word.word),
    "english-antonym": words.flatMap((word) => word.antonyms || []),
    "antonym-english": words.map((word) => word.word),
  };

  return [...new Set((pools[type] || []).filter((item) => item && item !== correctAnswer))];
};

// @desc    Get all words with pagination, filtering & sorting
// @route   GET /api/words
// @access  Public
exports.getAllWords = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || "word"; // 'word', 'createdAt'
    const order = req.query.order === "desc" ? -1 : 1;
    const search = req.query.search || "";

    // Build filter query
    const filterQuery = {};
    if (search) {
      const regex = new RegExp(search, "i");
      filterQuery.$or = [
        { word: { $regex: regex } },
        { banglaMeaning: { $regex: regex } },
        { meaning: { $regex: regex } },
      ];
    }

    // Sort order
    let sortOptions = {};
    if (sortBy === "word") {
      sortOptions.word = order;
    } else if (sortBy === "createdAt") {
      sortOptions.createdAt = order;
    } else {
      sortOptions.word = 1;
    }

    const total = await Word.countDocuments(filterQuery);
    const words = await Word.find(filterQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: words.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalWords: total,
      data: words,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch words",
      error: error.message,
    });
  }
};

// @desc    Get a random competitive test question from all words
// @route   GET /api/words/test-question?type=english-bangla
// @access  Public
exports.getTestQuestion = async (req, res) => {
  try {
    const type = req.query.type || "english-bangla";
    const filter = getQuestionFilter(type);

    if (!filter) {
      return res.status(400).json({
        success: false,
        message: "Invalid test type.",
      });
    }

    const seenIdsRaw = req.query.seenIds;
    const seenIds =
      typeof seenIdsRaw === "string" && seenIdsRaw.trim()
        ? seenIdsRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    const baseQuery = seenIds.length ? { ...filter, _id: { $nin: seenIds } } : filter;
    let eligibleWords = await Word.find(baseQuery).limit(500);

    // If the session already covered all unique words, allow repeats by falling back.
    if (!eligibleWords.length && seenIds.length) {
      eligibleWords = await Word.find(filter).limit(500);
    }

    if (!eligibleWords.length) {
      return res.status(404).json({
        success: false,
        message: "No words are ready for this test type.",
      });
    }

    // If the request is authenticated, bias selection toward weaker / older words.
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const payload = verify(token);
    const userId = payload?.sub;

    let questionWord;
    if (userId) {
      const candidateIds = eligibleWords.map((w) => w._id);
      const statsDocs = await UserWordStat.find({
        user: userId,
        word: { $in: candidateIds },
      });

      const statsMap = new Map(
        statsDocs.map((doc) => [doc.word.toString(), doc])
      );

      const weights = eligibleWords.map((word) => {
        const stat = statsMap.get(word._id.toString());
        // Unseen words should appear sooner.
        if (!stat) return 3;

        const total = (stat.correctCount || 0) + (stat.incorrectCount || 0);
        const accuracy = total > 0 ? (stat.correctCount || 0) / total : 0;
        const incorrectRate = total > 0 ? 1 - accuracy : 1;

        const now = Date.now();
        const lastSeenAt = stat.lastSeenAt ? new Date(stat.lastSeenAt).getTime() : null;
        const hoursSince = lastSeenAt ? (now - lastSeenAt) / (1000 * 60 * 60) : 72;
        const recencyBoost = 1 + Math.min(4, hoursSince / 24);

        let weight = 0.2 + incorrectRate * recencyBoost;
        if ((stat.incorrectCount || 0) > (stat.correctCount || 0)) weight *= 1.25;
        return Math.max(0.01, weight);
      });

      const totalWeight = weights.reduce((acc, w) => acc + w, 0);
      let r = Math.random() * totalWeight;
      let idx = 0;
      for (; idx < weights.length; idx += 1) {
        r -= weights[idx];
        if (r <= 0) break;
      }
      questionWord = eligibleWords[idx] || eligibleWords[0];
    } else {
      questionWord = shuffleArray(eligibleWords)[0];
    }

    if (!questionWord) {
      return res.status(404).json({
        success: false,
        message: "No words are ready for this test type.",
      });
    }

    // Some types need custom prompt/correctAnswer mapping.
    let prompt;
    let correctAnswer;

    if (type === "synonym-english") {
      const synonyms = (questionWord.synonyms || []).map((s) => (s || "").trim()).filter(Boolean);
      prompt = shuffleArray(synonyms)[0];
      correctAnswer = questionWord.word;
    } else if (type === "antonym-english") {
      const antonyms = (questionWord.antonyms || []).map((s) => (s || "").trim()).filter(Boolean);
      prompt = shuffleArray(antonyms)[0];
      correctAnswer = questionWord.word;
    } else {
      const answers = getNestedAnswers(questionWord, type).filter(Boolean);
      correctAnswer = shuffleArray(answers)[0];
      prompt = getPrompt(questionWord, type, correctAnswer);
    }

    if (!correctAnswer || !prompt) {
      return res.status(404).json({
        success: false,
        message: "No words are ready for this test type.",
      });
    }

    const optionPool = getOptionPool(eligibleWords, type, correctAnswer);
    const fallbackOptions = [
      "similar",
      "different",
      "clear",
      "hidden",
      "careful",
      "simple",
      "strong",
      "weak",
    ];

    const distractorCandidates = shuffleArray([...optionPool, ...fallbackOptions]).filter(
      (item) => item && item !== correctAnswer
    );

    const optionsSet = new Set([correctAnswer]);
    for (const candidate of distractorCandidates) {
      if (optionsSet.size >= 4) break;
      optionsSet.add(candidate);
    }

    const options = shuffleArray([...optionsSet]);

    res.status(200).json({
      success: true,
      data: {
        type,
        wordId: questionWord._id,
        prompt,
        word: questionWord.word,
        correctAnswer,
        options,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create test question",
      error: error.message,
    });
  }
};

// @desc    Get a single word by id
// @route   GET /api/words/:id
// @access  Public
exports.getWordById = async (req, res) => {
  try {
    const word = await Word.findById(req.params.id);

    if (!word) {
      return res.status(404).json({
        success: false,
        message: "Word not found",
      });
    }

    res.status(200).json({
      success: true,
      data: word,
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 404 : 500).json({
      success: false,
      message: error.name === "CastError" ? "Word not found" : "Failed to fetch word",
      error: error.message,
    });
  }
};

// @desc    Create a new word
// @route   POST /api/words
// @access  Registered users
exports.createWord = async (req, res) => {
  try {
    const {
      word,
      pronunciation,
      meaning,
      banglaMeaning,
      exampleSentence,
      synonyms,
      antonyms,
    } = req.body;

    // ONLY check if English word is provided
    if (!word || !word.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least the English word.",
      });
    }

    const formattedWord = word.trim().charAt(0).toUpperCase() + word.trim().slice(1);

    // Check if duplicate
    const existing = await Word.findOne({ word: formattedWord });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `The word "${formattedWord}" already exists in Vocademy.`,
      });
    }

    const newWord = await Word.create({
      ...formatWordPayload(req.body),
      addedByEmail: req.user.email,
    });

    res.status(201).json({
      success: true,
      message: "Word successfully added!",
      data: newWord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding word",
      error: error.message,
    });
  }
};

// @desc    Update a word
// @route   PUT /api/words/:id
// @access  Registered users
exports.updateWord = async (req, res) => {
  try {
    const { word } = req.body;

    if (!word || !word.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least the English word.",
      });
    }

    const existingWord = await Word.findById(req.params.id);
    if (!existingWord) {
      return res.status(404).json({
        success: false,
        message: "Word not found",
      });
    }

    const updateData = formatWordPayload(req.body);
    const duplicate = await Word.findOne({
      word: updateData.word,
      _id: { $ne: req.params.id },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `The word "${updateData.word}" already exists in Vocademy.`,
      });
    }

    const updatedWord = await Word.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Word updated successfully!",
      data: updatedWord,
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 404 : 500).json({
      success: false,
      message: error.name === "CastError" ? "Word not found" : "Error updating word",
      error: error.message,
    });
  }
};

// @desc    Record test answers for adaptive question selection
// @route   POST /api/words/test-answer
// @access  Registered users
exports.recordTestAnswer = async (req, res) => {
  try {
    const { wordId, isCorrect } = req.body || {};

    if (!wordId) {
      return res.status(400).json({
        success: false,
        message: "wordId is required.",
      });
    }

    if (typeof isCorrect !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isCorrect must be a boolean.",
      });
    }

    const update = {
      $inc: isCorrect ? { correctCount: 1 } : { incorrectCount: 1 },
      $set: { lastSeenAt: new Date() },
    };

    const stat = await UserWordStat.findOneAndUpdate(
      { user: req.user._id, word: wordId },
      update,
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Test answer recorded.",
      data: stat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to record test answer",
      error: error.message,
    });
  }
};
