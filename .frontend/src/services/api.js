const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let authToken = localStorage.getItem('vocademy_token') || '';

export const setAuthToken = (token) => {
  authToken = token || '';
  if (authToken) {
    localStorage.setItem('vocademy_token', authToken);
  } else {
    localStorage.removeItem('vocademy_token');
  }
};

// Fetch helper to call backend
const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Something went wrong');
    }

    return result;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
};

export const api = {
  // Auth
  signup: (credentials) => {
    return request('/auth/signup', {
      method: 'POST',
      body: credentials
    });
  },

  login: (credentials) => {
    return request('/auth/login', {
      method: 'POST',
      body: credentials
    });
  },

  me: () => request('/auth/me'),

  // Words
  getWords: (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        query.append(key, params[key]);
      }
    });
    const queryString = query.toString();
    return request(`/words?${queryString}`);
  },

  getWord: (id) => {
    return request(`/words/${id}`);
  },

  getTestQuestion: (type, { seenIds } = {}) => {
    const query = new URLSearchParams();
    query.append("type", type);
    if (seenIds && seenIds.length) {
      query.append("seenIds", seenIds.join(","));
    }
    return request(`/words/test-question?${query.toString()}`);
  },

  createWord: (wordData) => {
    return request('/words', {
      method: 'POST',
      body: wordData
    });
  },

  updateWord: (id, wordData) => {
    return request(`/words/${id}`, {
      method: 'PUT',
      body: wordData
    });
  },

  getLearningWords: () => {
    return request('/learning');
  },

  addLearningWord: (wordId) => {
    return request('/learning', {
      method: 'POST',
      body: { wordId }
    });
  },

  markLearningWordLearned: (wordId) => {
    return request(`/learning/${wordId}/learned`, {
      method: 'DELETE'
    });
  },
  recordTestAnswer: ({ wordId, isCorrect }) => {
    return request("/words/test-answer", {
      method: "POST",
      body: { wordId, isCorrect },
    });
  },
};
