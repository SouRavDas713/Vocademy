const mongoose = require('mongoose');
const Word = require('../models/Word');
const connectDB = require('../config/db');
require('dotenv').config();

const dummyWords = [
  {
    word: 'Abundant',
    pronunciation: '/əˈbʌndənt/',
    meaning: 'Existing or available in large quantities; overflowing.',
    banglaMeaning: 'প্রচুর বা উপচে পড়া',
    exampleSentence: 'The lush forest provides an abundant supply of fresh water and berries.',
    synonyms: ['plentiful', 'copious', 'ample', 'profuse'],
    antonyms: ['scarce', 'sparse', 'limited', 'meager'],
    category: 'Adjective',
    difficulty: 'Easy'
  },
  {
    word: 'Benevolent',
    pronunciation: '/bəˈnevələnt/',
    meaning: 'Well meaning and kindly; showing goodwill.',
    banglaMeaning: 'দয়ালু বা পরোপকারী',
    exampleSentence: 'A benevolent neighbor offered to look after the children while their mother was away.',
    synonyms: ['kindly', 'charitable', 'generous', 'magnanimous'],
    antonyms: ['malevolent', 'spiteful', 'mean', 'cruel'],
    category: 'Adjective',
    difficulty: 'Medium'
  },
  {
    word: 'Candid',
    pronunciation: '/ˈkændɪd/',
    meaning: 'Truthful and straightforward; frank.',
    banglaMeaning: 'অকপট বা সরল',
    exampleSentence: 'In private conversations, advisor offered a candid assessment of the situation.',
    synonyms: ['frank', 'outspoken', 'honest', 'forthright'],
    antonyms: ['evasive', 'insincere', 'deceptive', 'guarded'],
    category: 'Adjective',
    difficulty: 'Easy'
  },
  {
    word: 'Diligent',
    pronunciation: '/ˈdɪlɪdʒənt/',
    meaning: 'Having or showing care and conscientiousness in one\'s work.',
    banglaMeaning: 'পরিশ্রমী বা অধ্যবসায়ী',
    exampleSentence: 'She was a diligent student, working late into the night to finish her research paper.',
    synonyms: ['industrious', 'hardworking', 'assiduous', 'conscientious'],
    antonyms: ['lazy', 'negligent', 'idle', 'slothful'],
    category: 'Adjective',
    difficulty: 'Easy'
  },
  {
    word: 'Eloquent',
    pronunciation: '/ˈeləkwənt/',
    meaning: 'Fluent or persuasive in speaking or writing.',
    banglaMeaning: 'বাগ্মী বা সুবক্তা',
    exampleSentence: 'The president delivered an eloquent speech that moved the entire nation.',
    synonyms: ['silver-tongued', 'articulate', 'expressive', 'persuasive'],
    antonyms: ['inarticulate', 'incoherent', 'mute', 'hesitant'],
    category: 'Adjective',
    difficulty: 'Medium'
  },
  {
    word: 'Frugal',
    pronunciation: '/ˈfruːɡl/',
    meaning: 'Sparing or economical with regard to money or food.',
    banglaMeaning: 'মিতব্যয়ী বা হিসেবী',
    exampleSentence: 'Growing up in a large family taught him to lead a frugal lifestyle and avoid waste.',
    synonyms: ['thrifty', 'economical', 'saving', 'provident'],
    antonyms: ['extravagant', 'wasteful', 'lavish', 'prodigal'],
    category: 'Adjective',
    difficulty: 'Easy'
  },
  {
    word: 'Garrulous',
    pronunciation: '/ˈɡærələs/',
    meaning: 'Excessively talkative, especially on trivial matters.',
    banglaMeaning: 'বাচাল বা অতিরিক্ত কথাবলা',
    exampleSentence: 'The garrulous barber shared every piece of neighborhood gossip while cutting my hair.',
    synonyms: ['talkative', 'loquacious', 'chatty', 'verbose'],
    antonyms: ['taciturn', 'reserved', 'silent', 'quiet'],
    category: 'Adjective',
    difficulty: 'Hard'
  },
  {
    word: 'Hypocrisy',
    pronunciation: '/hɪˈpɒkrəsi/',
    meaning: 'The practice of claiming to have moral standards or beliefs to which one\'s own behavior does not conform.',
    banglaMeaning: 'ভণ্ডামি বা কপটতা',
    exampleSentence: 'It was sheer hypocrisy for the politician to preach family values while hiding his secret.',
    synonyms: ['insincerity', 'double-dealing', 'duplicity', 'pretense'],
    antonyms: ['sincerity', 'honesty', 'integrity', 'truthfulness'],
    category: 'Noun',
    difficulty: 'Medium'
  },
  {
    word: 'Inevitable',
    pronunciation: '/ɪnˈevɪtəbl/',
    meaning: 'Certain to happen; unavoidable.',
    banglaMeaning: 'অনিবার্য বা অবশ্যম্ভাবী',
    exampleSentence: 'As the dark clouds gathered overhead, it became clear that rain was inevitable.',
    synonyms: ['unavoidable', 'inescapable', 'fated', 'inexorable'],
    antonyms: ['avoidable', 'uncertain', 'preventable', 'evitable'],
    category: 'Adjective',
    difficulty: 'Easy'
  },
  {
    word: 'Jubilant',
    pronunciation: '/ˈdʒuːbɪlənt/',
    meaning: 'Feeling or expressing great happiness and triumph.',
    banglaMeaning: 'উল্লাসিত বা বিজয়ের আনন্দে আনন্দিত',
    exampleSentence: 'The jubilant crowd rushed onto the field when the local team scored the winning goal.',
    synonyms: ['overjoyed', 'triumphant', 'exultant', 'ecstatic'],
    antonyms: ['despondent', 'depressed', 'sorrowful', 'sad'],
    category: 'Adjective',
    difficulty: 'Medium'
  },
  {
    word: 'Lethargic',
    pronunciation: '/ləˈθɑːdʒɪk/',
    meaning: 'Affected by lethargy; sluggish and apathetic.',
    banglaMeaning: 'অলস বা অবসাদগ্রস্ত',
    exampleSentence: 'The heavy lunch made me feel lethargic and unable to concentrate on my work.',
    synonyms: ['sluggish', 'listless', 'lazy', 'torpid'],
    antonyms: ['energetic', 'active', 'vigorous', 'dynamic'],
    category: 'Adjective',
    difficulty: 'Medium'
  },
  {
    word: 'Meticulous',
    pronunciation: '/məˈtɪkjələs/',
    meaning: 'Showing great attention to detail; very careful and precise.',
    banglaMeaning: 'খুঁতখুঁতে বা অতি যত্নবান',
    exampleSentence: 'The museum curator was meticulous in preparing the ancient manuscripts for display.',
    synonyms: ['painstaking', 'scrupulous', 'precise', 'fastidious'],
    antonyms: ['careless', 'sloppy', 'negligent', 'imprecise'],
    category: 'Adjective',
    difficulty: 'Hard'
  },
  {
    word: 'Nostalgia',
    pronunciation: '/nɒˈstældʒə/',
    meaning: 'A sentimental longing or wistful affection for the past.',
    banglaMeaning: 'অতীতের জন্য ব্যাকুলতা বা গৃহকাতরতা',
    exampleSentence: 'Listening to old songs filled her with nostalgia for her childhood in the village.',
    synonyms: ['reminiscence', 'wistfulness', 'longing', 'homesickness'],
    antonyms: ['indifference', 'anticipation', 'forward-looking'],
    category: 'Noun',
    difficulty: 'Medium'
  },
  {
    word: 'Obsolete',
    pronunciation: '/ˈɒbsəliːt/',
    meaning: 'No longer produced or used; out of date.',
    banglaMeaning: 'অপ্রচলিত বা সেকেলে',
    exampleSentence: 'Floppy disks became obsolete once high-capacity flash drives were introduced.',
    synonyms: ['outdated', 'outmoded', 'antiquated', 'archaic'],
    antonyms: ['modern', 'current', 'state-of-the-art', 'new'],
    category: 'Adjective',
    difficulty: 'Easy'
  },
  {
    word: 'Pragmatic',
    pronunciation: '/præɡˈmætɪk/',
    meaning: 'Dealing with things sensibly and realistically in a way that is based on practical considerations.',
    banglaMeaning: 'বাস্তবধর্মী বা বাস্তববাদী',
    exampleSentence: 'Rather than dreaming of an ideal solution, the team took a pragmatic approach to solve the bug.',
    synonyms: ['practical', 'matter-of-fact', 'realistic', 'utilitarian'],
    antonyms: ['idealistic', 'impractical', 'visionary', 'unrealistic'],
    category: 'Adjective',
    difficulty: 'Medium'
  },
  {
    word: 'Resilient',
    pronunciation: '/rɪˈzɪliənt/',
    meaning: 'Able to withstand or recover quickly from difficult conditions.',
    banglaMeaning: 'স্থিতিস্থাপক বা বাধাবিপত্তি কাটিয়ে উঠতে সক্ষম',
    exampleSentence: 'Despite the setbacks, the resilient young entrepreneur rebuilt her business from scratch.',
    synonyms: ['tough', 'hardy', 'buoyant', 'adaptable'],
    antonyms: ['fragile', 'vulnerable', 'weak', 'delicate'],
    category: 'Adjective',
    difficulty: 'Medium'
  },
  {
    word: 'Scrutinize',
    pronunciation: '/ˈskruːtənaɪz/',
    meaning: 'Examine or inspect closely and thoroughly.',
    banglaMeaning: 'খুঁতিয়ে পরীক্ষা করা',
    exampleSentence: 'The bank auditors will scrutinize every transaction made during the last six months.',
    synonyms: ['inspect', 'examine', 'analyze', 'probe'],
    antonyms: ['ignore', 'neglect', 'glance-at', 'disregard'],
    category: 'Verb',
    difficulty: 'Medium'
  },
  {
    word: 'Transient',
    pronunciation: '/ˈtrænziənt/',
    meaning: 'Lasting only for a short time; impermanent.',
    banglaMeaning: 'ক্ষণস্থায়ী বা অস্থায়ী',
    exampleSentence: 'Youth is a transient phase of life, so enjoy its vigor while it lasts.',
    synonyms: ['fleeting', 'temporary', 'ephemeral', 'evanescent'],
    antonyms: ['permanent', 'lasting', 'eternal', 'perpetual'],
    category: 'Adjective',
    difficulty: 'Hard'
  },
  {
    word: 'Ubiquitous',
    pronunciation: '/juːˈbɪkwɪtəs/',
    meaning: 'Present, appearing, or found everywhere.',
    banglaMeaning: 'সর্বব্যাপী বা সর্বত্র বিদ্যমান',
    exampleSentence: 'In the modern age, smartphones have become ubiquitous in almost every society.',
    synonyms: ['omnipresent', 'ever-present', 'pervasive', 'rife'],
    antonyms: ['rare', 'scarce', 'uncommon', 'infrequent'],
    category: 'Adjective',
    difficulty: 'Hard'
  },
  {
    word: 'Vibrant',
    pronunciation: '/ˈvaɪbrənt/',
    meaning: 'Full of energy and life; bright and striking.',
    banglaMeaning: 'প্রাণবন্ত বা দীপ্তিময়',
    exampleSentence: 'The local market was a vibrant bazaar filled with exotic fruits, flowers, and fabrics.',
    synonyms: ['lively', 'energetic', 'vivacious', 'colorful'],
    antonyms: ['dull', 'lifeless', 'drab', 'sluggish'],
    category: 'Adjective',
    difficulty: 'Easy'
  },
  {
    word: 'Wary',
    pronunciation: '/ˈweəri/',
    meaning: 'Feeling or showing caution about possible dangers or problems.',
    banglaMeaning: 'সতর্ক বা সাবধানী',
    exampleSentence: 'The forest rangers warned tourists to be wary of wild animals active during the night.',
    synonyms: ['cautious', 'careful', 'chary', 'circumspect'],
    antonyms: ['foolhardy', 'reckless', 'trusting', 'careless'],
    category: 'Adjective',
    difficulty: 'Easy'
  },
  {
    word: 'Zenith',
    pronunciation: '/ˈzenɪθ/',
    meaning: 'The time at which something is most powerful or successful.',
    banglaMeaning: 'শীর্ষবিন্দু বা চরম শিখর',
    exampleSentence: 'The Roman Empire reached its zenith during the reign of Emperor Augustus.',
    synonyms: ['peak', 'pinnacle', 'acme', 'climax'],
    antonyms: ['nadir', 'bottom', 'lowest-point'],
    category: 'Noun',
    difficulty: 'Medium'
  },
  {
    word: 'Aesthetic',
    pronunciation: '/iːsˈθetɪk/',
    meaning: 'Concerned with beauty or the appreciation of beauty.',
    banglaMeaning: 'নান্দনিক বা সৌন্দর্যবিষয়ক',
    exampleSentence: 'The design of the application has a clean and premium aesthetic inspired by minimalism.',
    synonyms: ['artistic', 'tasteful', 'beautiful', 'graceful'],
    antonyms: ['unappealing', 'grotesque', 'ugly', 'inelegant'],
    category: 'Adjective',
    difficulty: 'Medium'
  },
  {
    word: 'Capricious',
    pronunciation: '/kəˈprɪʃəs/',
    meaning: 'Given to sudden and unaccountable changes of mood or behavior.',
    banglaMeaning: 'খেয়ালী বা অস্থিরমতি',
    exampleSentence: 'The capricious winds made it extremely difficult for the sailors to steer the yacht.',
    synonyms: ['fickle', 'unpredictable', 'whimsical', 'mercurial'],
    antonyms: ['stable', 'consistent', 'reliable', 'constant'],
    category: 'Adjective',
    difficulty: 'Hard'
  },
  {
    word: 'Ephemeral',
    pronunciation: '/ɪˈfemərəl/',
    meaning: 'Lasting for a very short time.',
    banglaMeaning: 'ক্ষণস্থায়ী',
    exampleSentence: 'Fame in the digital era is often ephemeral, disappearing as quickly as it arrives.',
    synonyms: ['transient', 'brief', 'fleeting', 'short-lived'],
    antonyms: ['eternal', 'permanent', 'perennial', 'long-lived'],
    category: 'Adjective',
    difficulty: 'Hard'
  },
  {
    word: 'Fastidious',
    pronunciation: '/fæˈstɪdiəs/',
    meaning: 'Very attentive to and concerned about accuracy and detail; very concerned about matters of cleanliness.',
    banglaMeaning: 'খুঁতখুঁতে',
    exampleSentence: 'She was fastidious about keeping her room organized, dusting every shelf twice a day.',
    synonyms: ['fussy', 'particular', 'meticulous', 'critical'],
    antonyms: ['undemanding', 'easygoing', 'careless', 'indifferent'],
    category: 'Adjective',
    difficulty: 'Hard'
  },
  {
    word: 'Gregarious',
    pronunciation: '/ɡrɪˈɡeəriəs/',
    meaning: 'Fond of company; sociable.',
    banglaMeaning: 'মিশুক বা সামাজিক',
    exampleSentence: 'Dolphins are gregarious animals, traveling and playing in large family groups.',
    synonyms: ['sociable', 'friendly', 'companionable', 'convivial'],
    antonyms: ['unsociable', 'reclusive', 'taciturn', 'hermit-like'],
    category: 'Adjective',
    difficulty: 'Hard'
  },
  {
    word: 'Impeccable',
    pronunciation: '/ɪmˈpekəbl/',
    meaning: 'In accordance with the highest standards; faultless.',
    banglaMeaning: 'ত্রুটিহীন বা নিখুঁত',
    exampleSentence: 'The pianist gave an impeccable performance, hitting every note with perfect timing.',
    synonyms: ['faultless', 'flawless', 'spotless', 'exemplary'],
    antonyms: ['imperfect', 'flawed', 'faulty', 'defective'],
    category: 'Adjective',
    difficulty: 'Medium'
  },
  {
    word: 'Mitigate',
    pronunciation: '/ˈmɪtɪɡeɪt/',
    meaning: 'Make less severe, serious, or painful.',
    banglaMeaning: 'প্রশমিত করা বা কমানো',
    exampleSentence: 'Good drainage systems help to mitigate the risk of severe flooding during monsoons.',
    synonyms: ['alleviate', 'reduce', 'diminish', 'assuage'],
    antonyms: ['aggravate', 'intensify', 'exacerbate', 'worsen'],
    category: 'Verb',
    difficulty: 'Medium'
  },
  {
    word: 'Novice',
    pronunciation: '/ˈnɒvɪs/',
    meaning: 'A person new to and inexperienced in a job or situation.',
    banglaMeaning: 'নবীশ বা শিক্ষানবিস',
    exampleSentence: 'Even a complete novice can learn to build responsive web pages in a few weeks.',
    synonyms: ['beginner', 'learner', 'neophyte', 'tyro'],
    antonyms: ['expert', 'veteran', 'professional', 'master'],
    category: 'Noun',
    difficulty: 'Easy'
  }
];

const seedDB = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('Seeding database...');

    const wordCount = await Word.countDocuments();
    if (wordCount === 0) {
      await Word.insertMany(dummyWords);
      console.log(`Seeded ${dummyWords.length} vocabulary words successfully!`);
    } else {
      console.log(`Database already has ${wordCount} words. Skipping word seeding.`);
    }

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

// Check if run directly
if (require.main === module) {
  seedDB();
}

module.exports = seedDB;
