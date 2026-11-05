/**
 * TOPIK I grammar, in the order a beginner meets it in the deck: the copula
 * and particles first, then the polite verb endings, then connected clauses,
 * and finally tense, aspect and negation.
 *
 * Every example is a full sentence with a stable clip id (see
 * `GRAMMAR_SENTENCE_LINES` and the `--sentences --grammar` pass of the audio
 * generator). Lesson audio ships in batches, so the UI only shows playback
 * where a clip exists.
 *
 * Content is model-written and must pass a Korean-speaker review before it is
 * treated as trusted, like the imported deck in Phase 3.
 */

export interface GrammarPoint {
  heading: string;
  body: string;
}

export interface GrammarExample {
  ko: string;
  en: string;
}

export interface GrammarQuizQuestion {
  /** The sentence or transformation being asked about. */
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface GrammarLesson {
  id: string;
  /** 1-based position in the course. */
  order: number;
  title: string;
  subtitle: string;
  summary: string;
  points: GrammarPoint[];
  examples: GrammarExample[];
  /** One mistake learners actually make with this pattern. */
  mistake: string;
  quiz: GrammarQuizQuestion[];
}

export const GRAMMAR_LESSONS: GrammarLesson[] = [
  {
    id: "copula",
    order: 1,
    title: "이에요 / 예요",
    subtitle: "Saying what something is",
    summary:
      "Attach 이에요 or 예요 to a noun to say “it is X.” Choose the form by the last sound of the noun.",
    points: [
      {
        heading: "After a final consonant",
        body: "Use 이에요. A noun with a 받침 (final consonant) takes the 이: 학생이에요, 책이에요.",
      },
      {
        heading: "After a vowel",
        body: "Use 예요. A noun that ends in a vowel drops the 이: 커피예요, 의사예요.",
      },
      {
        heading: "Questions",
        body: "The form does not change for a question; only the intonation rises: 학생이에요?",
      },
    ],
    examples: [
      { ko: "저는 학생이에요.", en: "I am a student." },
      { ko: "이건 커피예요.", en: "This is coffee." },
      { ko: "여기는 학교예요?", en: "Is this a school?" },
    ],
    mistake:
      "학생 ends in a consonant, so it is 학생이에요. “학생예요” is the usual slip.",
    quiz: [
      {
        prompt: "의사___",
        options: ["예요", "이에요"],
        answerIndex: 0,
        explanation: "의사 ends in a vowel (사), so it takes 예요.",
      },
      {
        prompt: "Which sentence is correct?",
        options: ["책예요.", "책이에요."],
        answerIndex: 1,
        explanation: "책 ends in the consonant ㄱ, so it needs 이에요.",
      },
    ],
  },
  {
    id: "topic-subject",
    order: 2,
    title: "은/는 vs 이/가",
    subtitle: "Topic and subject",
    summary:
      "은/는 sets the topic (“as for X”); 이/가 marks the subject, often the new or answering information.",
    points: [
      {
        heading: "The shapes",
        body: "After a consonant use 은 or 이; after a vowel use 는 or 가. 저는, 학생이, 커피는, 친구가.",
      },
      {
        heading: "은/는 for the topic",
        body: "Introduce or contrast: 저는 학생이에요. 오늘은 비가 와요. It can sit on a time or place too.",
      },
      {
        heading: "이/가 for the subject",
        body: "Answers 누가/무엇이 and introduces new information: 누가 왔어요? — 친구가 왔어요.",
      },
    ],
    examples: [
      { ko: "저는 한국 사람이에요.", en: "I am Korean." },
      { ko: "오늘은 비가 와요.", en: "It is raining today." },
      { ko: "누가 왔어요? 제 친구가 왔어요.", en: "Who came? My friend came." },
    ],
    mistake:
      "Answering 누가 with 는 sounds like a contrast: “친구는 왔어요” implies “the friend, at least.” Use 친구가.",
    quiz: [
      {
        prompt: "저___ 학생이에요.",
        options: ["는", "은"],
        answerIndex: 0,
        explanation: "저 ends in a vowel, so the topic marker is 는.",
      },
      {
        prompt: "누가 왔어요? — ___",
        options: ["친구가 왔어요.", "친구는 왔어요."],
        answerIndex: 0,
        explanation:
          "The answer to 누가 takes 이/가, and 친구 ends in a vowel, so it is 친구가.",
      },
    ],
  },
  {
    id: "object-marker",
    order: 3,
    title: "을/를",
    subtitle: "Marking the object",
    summary:
      "을/를 marks the direct object of a verb and comes right before that verb.",
    points: [
      {
        heading: "The shapes",
        body: "After a consonant use 을: 밥을. If the noun ends in a vowel, use 를: 커피를.",
      },
      {
        heading: "Word order",
        body: "Korean puts the object before the verb: 저는 밥을 먹어요, not 먹어요 밥을.",
      },
      {
        heading: "In speech",
        body: "With 하다 verbs the marker is often dropped in casual speech: 한국어(를) 공부해요. Keep it in writing.",
      },
    ],
    examples: [
      { ko: "저는 밥을 먹어요.", en: "I eat rice." },
      { ko: "커피를 마셔요.", en: "I drink coffee." },
      { ko: "한국어를 공부해요.", en: "I study Korean." },
    ],
    mistake:
      "밥 먹어요 is fine in speech, but “밥를 먹어요” is never right: 밥 ends in a consonant, so it is 밥을.",
    quiz: [
      {
        prompt: "커피___ 마셔요.",
        options: ["를", "을"],
        answerIndex: 0,
        explanation: "커피 ends in a vowel, so the object marker is 를.",
      },
      {
        prompt: "책___ 읽어요.",
        options: ["을", "를"],
        answerIndex: 0,
        explanation: "책 ends in the consonant ㄱ, so the object marker is 을.",
      },
    ],
  },
  {
    id: "place-particles",
    order: 4,
    title: "에 / 에서",
    subtitle: "Where and when",
    summary:
      "에 marks a destination, a time, or where something exists. 에서 marks where an action happens.",
    points: [
      {
        heading: "에: destination, time, existence",
        body: "학교에 가요 (go to school), 세 시에 만나요 (meet at three), 집에 있어요 (be at home).",
      },
      {
        heading: "에서: where the action happens",
        body: "도서관에서 공부해요 (study at the library), 한국에서 왔어요 (came from Korea).",
      },
      {
        heading: "The test",
        body: "Going to or being at a place uses 에; doing something there uses 에서.",
      },
    ],
    examples: [
      { ko: "아침에 커피를 마셔요.", en: "I drink coffee in the morning." },
      { ko: "도서관에서 공부해요.", en: "I study at the library." },
      { ko: "내일 학교에 가요.", en: "I go to school tomorrow." },
    ],
    mistake:
      "“학교에서 가요” describes doing the going at school. For the destination use 학교에 가요.",
    quiz: [
      {
        prompt: "도서관___ 공부해요.",
        options: ["에서", "에"],
        answerIndex: 0,
        explanation: "Studying is an action that happens there, so use 에서.",
      },
      {
        prompt: "내일 학교___ 가요.",
        options: ["에", "에서"],
        answerIndex: 0,
        explanation: "학교 is the destination of 가요, so use 에.",
      },
    ],
  },
  {
    id: "existence",
    order: 5,
    title: "있어요 / 없어요",
    subtitle: "There is, and I have",
    summary:
      "있어요 means “there is” or “I have.” 없어요 means “there isn’t” or “I don’t have.”",
    points: [
      {
        heading: "What exists takes 이/가",
        body: "시간이 있어요? 책이 없어요. The thing present or missing is the subject.",
      },
      {
        heading: "Location uses 에",
        body: "화장실이 어디에 있어요? The place is marked with 에, the thing with 이/가.",
      },
      {
        heading: "The negative is a word",
        body: "없어요 is already negative; do not add 안. “안 있어요” is not Korean.",
      },
    ],
    examples: [
      { ko: "시간이 있어요?", en: "Do you have time?" },
      { ko: "화장실이 어디에 있어요?", en: "Where is the bathroom?" },
      { ko: "저는 차가 없어요.", en: "I don’t have a car." },
    ],
    mistake:
      "For “I don’t have it,” say 없어요. “안 있어요” is the usual slip.",
    quiz: [
      {
        prompt: "시간___ 있어요?",
        options: ["이", "가"],
        answerIndex: 0,
        explanation:
          "시간 ends in the consonant ㄴ, so the subject marker is 이.",
      },
      {
        prompt: "I don’t have a car.",
        options: ["차가 없어요.", "차가 안 있어요."],
        answerIndex: 0,
        explanation: "없어요 is the negative of 있어요; it never takes 안.",
      },
    ],
  },
  {
    id: "polite-present",
    order: 6,
    title: "-아요 / -어요",
    subtitle: "The polite present",
    summary:
      "The default polite ending for verbs and adjectives. Drop 다 from the dictionary form and add 아요 or 어요.",
    points: [
      {
        heading: "Pick by the stem vowel",
        body: "If the last vowel is ㅏ or ㅗ, add 아요: 가다 → 가요, 좋다 → 좋아요. Otherwise add 어요: 먹다 → 먹어요, 읽다 → 읽어요.",
      },
      {
        heading: "하다 verbs",
        body: "하다 becomes 해요: 공부하다 → 공부해요, 좋아하다 → 좋아해요.",
      },
      {
        heading: "Contractions",
        body: "오다 → 와요, 주다 → 줘요, 보다 → 봐요. The vowel merge is normal, not slang.",
      },
    ],
    examples: [
      { ko: "저는 매일 한국어를 공부해요.", en: "I study Korean every day." },
      { ko: "아침을 먹어요.", en: "I eat breakfast." },
      { ko: "이 영화는 재미있어요.", en: "This movie is interesting." },
    ],
    mistake:
      "먹다 has ㅓ, not ㅏ, so it is 먹어요. “먹아요” sounds wrong to every native ear.",
    quiz: [
      {
        prompt: "읽다 → ___",
        options: ["읽어요", "읽아요"],
        answerIndex: 0,
        explanation: "The stem vowel is ㅣ, so the ending is 어요: 읽어요.",
      },
      {
        prompt: "공부하다 → ___",
        options: ["공부해요", "공부아요"],
        answerIndex: 0,
        explanation: "하다 verbs always become 해요.",
      },
    ],
  },
  {
    id: "want-to",
    order: 7,
    title: "-고 싶어요",
    subtitle: "Wanting to do something",
    summary: "Verb stem + 고 싶어요 means “want to do.”",
    points: [
      {
        heading: "The shape",
        body: "Drop 다 and add 고 싶어요: 가다 → 가고 싶어요, 먹다 → 먹고 싶어요.",
      },
      {
        heading: "Who wants",
        body: "The wanter is the subject: 저는 한국에 가고 싶어요. The thing wanted takes 을/를.",
      },
      {
        heading: "Negative",
        body: "Use -고 싶지 않아요: 오늘은 일하고 싶지 않아요.",
      },
    ],
    examples: [
      { ko: "한국에 가고 싶어요.", en: "I want to go to Korea." },
      { ko: "뭐 먹고 싶어요?", en: "What do you want to eat?" },
      { ko: "오늘은 집에서 쉬고 싶어요.", en: "I want to rest at home today." },
    ],
    mistake:
      "Use 싶어요 for your own wish. 싶어해요 describes someone else: 동생은 가고 싶어해요.",
    quiz: [
      {
        prompt: "자다 → ___",
        options: ["자고 싶어요", "잤고 싶어요"],
        answerIndex: 0,
        explanation:
          "싶어요 carries the tense, so the first verb stays in its stem form.",
      },
      {
        prompt: "I don’t want to go.",
        options: ["가고 싶지 않아요.", "안 가고 싶어요."],
        answerIndex: 0,
        explanation: "The standard negative of -고 싶어요 is -고 싶지 않아요.",
      },
    ],
  },
  {
    id: "can-do",
    order: 8,
    title: "-(으)ㄹ 수 있어요",
    subtitle: "Can and cannot",
    summary:
      "Stem + (으)ㄹ 수 있어요 says something is possible or that you can do it. 수 없어요 is the negative.",
    points: [
      {
        heading: "After a consonant",
        body: "Add 을 수 있어요: 먹다 → 먹을 수 있어요, 읽다 → 읽을 수 있어요.",
      },
      {
        heading: "After a vowel",
        body: "Add ㄹ 수 있어요: 가다 → 갈 수 있어요, 하다 → 할 수 있어요.",
      },
      {
        heading: "Cannot",
        body: "Replace 있어요 with 없어요: 갈 수 없어요. In speech, 못 가요 is the short form.",
      },
    ],
    examples: [
      { ko: "한국어를 할 수 있어요.", en: "I can speak Korean." },
      { ko: "내일은 갈 수 없어요.", en: "I can’t go tomorrow." },
      { ko: "여기 앉을 수 있어요?", en: "Can I sit here?" },
    ],
    mistake:
      "Do not stack two negatives: “못 갈 수 없어요” is wrong. Pick 못 가요 or 갈 수 없어요.",
    quiz: [
      {
        prompt: "먹다 → ___ 수 있어요",
        options: ["먹을", "먹ㄹ"],
        answerIndex: 0,
        explanation: "먹 ends in a consonant, so it takes 을 수 있어요.",
      },
      {
        prompt: "I can’t swim.",
        options: ["수영할 수 없어요.", "수영 못 할 수 없어요."],
        answerIndex: 0,
        explanation: "One negative is enough: 수영할 수 없어요.",
      },
    ],
  },
  {
    id: "and-then",
    order: 9,
    title: "-고",
    subtitle: "And then",
    summary:
      "Stem + 고 joins two actions in order, or two statements: “do A and then B.”",
    points: [
      {
        heading: "Sequence",
        body: "밥을 먹고 커피를 마셔요: eat, then drink coffee. The order is the order of the clauses.",
      },
      {
        heading: "Tense at the end",
        body: "Put the tense on the final verb: 밥을 먹고 잤어요. The first verb stays in its stem form.",
      },
      {
        heading: "Also joins descriptions",
        body: "저는 학생이고 동생은 의사예요. The same ending links nouns and adjectives.",
      },
    ],
    examples: [
      { ko: "밥을 먹고 커피를 마셔요.", en: "I eat and then drink coffee." },
      {
        ko: "저는 학생이고 동생은 의사예요.",
        en: "I’m a student and my younger sibling is a doctor.",
      },
      { ko: "책을 읽고 잤어요.", en: "I read a book and then slept." },
    ],
    mistake:
      "-고 is a simple “and then.” For a reason (“because I ate, I’m full”) use -아서/어서 instead.",
    quiz: [
      {
        prompt: "밥을 ___ 커피를 마셔요.",
        options: ["먹고", "먹어서"],
        answerIndex: 0,
        explanation:
          "This is a sequence, so -고 is right. -어서 would give a reason.",
      },
      {
        prompt: "저는 학생___ 동생은 의사예요.",
        options: ["이고", "이서"],
        answerIndex: 0,
        explanation: "Linking two nouns uses 이고 after a consonant.",
      },
    ],
  },
  {
    id: "but",
    order: 10,
    title: "-지만",
    subtitle: "But",
    summary: "Stem + 지만 joins a clause to a contrasting one: “A, but B.”",
    points: [
      {
        heading: "The shape",
        body: "Attach 지만 straight to the stem: 어렵다 → 어렵지만, 비싸다 → 비싸지만.",
      },
      {
        heading: "Tense stays on the first verb",
        body: "Past is allowed before 지만: 비가 왔지만 갔어요 (it rained, but I went).",
      },
      {
        heading: "하지만 is different",
        body: "하지만 starts a new sentence as “however.” Inside one clause, use -지만.",
      },
    ],
    examples: [
      {
        ko: "한국어는 어렵지만 재미있어요.",
        en: "Korean is hard but interesting.",
      },
      { ko: "비가 왔지만 갔어요.", en: "It rained, but I went." },
      {
        ko: "커피는 좋아하지만 차는 안 마셔요.",
        en: "I like coffee, but I don’t drink tea.",
      },
    ],
    mistake:
      "“어렵어요 하지만 재미있어요” is two sentences. Inside one clause it is 어렵지만 재미있어요.",
    quiz: [
      {
        prompt: "비가 ___ 갔어요.",
        options: ["왔지만", "오지만"],
        answerIndex: 0,
        explanation:
          "The rain already happened, so the past form comes before 지만.",
      },
      {
        prompt: "Which means “It’s small but expensive”?",
        options: ["작지만 비싸요.", "작고 비싸요."],
        answerIndex: 0,
        explanation:
          "지만 marks the contrast; -고 would simply list both facts.",
      },
    ],
  },
  {
    id: "polite-request",
    order: 11,
    title: "-(으)세요",
    subtitle: "Please do",
    summary:
      "Stem + (으)세요 is a polite request or instruction: ask someone to do something.",
    points: [
      {
        heading: "After a consonant",
        body: "Add 으세요: 앉다 → 앉으세요, 읽다 → 읽으세요.",
      },
      {
        heading: "After a vowel",
        body: "Add 세요: 가다 → 가세요, 하다 → 하세요.",
      },
      {
        heading: "ㄹ-final stems drop ㄹ",
        body: "살다 → 사세요, 만들다 → 만드세요. Do not write 살으세요.",
      },
    ],
    examples: [
      { ko: "천천히 말씀해 주세요.", en: "Please speak slowly." },
      { ko: "여기 앉으세요.", en: "Please sit here." },
      { ko: "물 좀 주세요.", en: "Please give me some water." },
    ],
    mistake:
      "가다 ends in a vowel, so it is 가세요. “가으세요” adds an ending that has nothing to attach to.",
    quiz: [
      {
        prompt: "앉다 → ___",
        options: ["앉으세요", "앉세요"],
        answerIndex: 0,
        explanation: "앉 ends in a consonant, so it takes 으세요.",
      },
      {
        prompt: "살다 → ___",
        options: ["사세요", "살으세요"],
        answerIndex: 0,
        explanation: "A ㄹ-final stem drops ㄹ before 세요.",
      },
    ],
  },
  {
    id: "past",
    order: 12,
    title: "-았/었어요",
    subtitle: "The polite past",
    summary:
      "Stem + 았어요 or 었어요 puts a verb or adjective in the polite past tense.",
    points: [
      {
        heading: "Pick by the stem vowel",
        body: "Last vowel ㅏ or ㅗ takes 았어요: 가다 → 갔어요, 좋다 → 좋았어요. Otherwise take 었어요: 먹다 → 먹었어요.",
      },
      {
        heading: "하다 verbs",
        body: "하다 becomes 했어요: 공부하다 → 공부했어요, 하다 → 했어요.",
      },
      {
        heading: "Contractions",
        body: "가다 → 갔어요, 오다 → 왔어요, 보다 → 봤어요, 주다 → 줬어요.",
      },
    ],
    examples: [
      { ko: "어제 영화를 봤어요.", en: "I watched a movie yesterday." },
      { ko: "아침을 먹었어요.", en: "I ate breakfast." },
      { ko: "주말에 공부했어요.", en: "I studied on the weekend." },
    ],
    mistake:
      "먹다 has ㅓ, so the past is 먹었어요. “먹았어요” is the usual vowel slip.",
    quiz: [
      {
        prompt: "가다 → ___",
        options: ["갔어요", "갔었어요"],
        answerIndex: 0,
        explanation:
          "가 + 았어요 contracts to 갔어요. 갔었어요 is the double past.",
      },
      {
        prompt: "공부하다 → ___",
        options: ["공부했어요", "공부핬어요"],
        answerIndex: 0,
        explanation: "하다 becomes 했어요 in the past.",
      },
    ],
  },
  {
    id: "progressive",
    order: 13,
    title: "-고 있어요",
    subtitle: "Right now",
    summary:
      "Stem + 고 있어요 says an action is in progress right now. The past form, 고 있었어요, describes what was happening at a past moment.",
    points: [
      {
        heading: "The shape",
        body: "Drop 다 and add 고 있어요: 먹다 → 먹고 있어요, 공부하다 → 공부하고 있어요.",
      },
      {
        heading: "Habit or right now",
        body: "-아요/어요 can describe a habit: 저는 매일 한국어를 공부해요. The progressive puts the action in progress: 지금 한국어를 공부하고 있어요.",
      },
      {
        heading: "The past progressive",
        body: "Replace 있어요 with 있었어요: 어제 밤에는 비가 오고 있었어요 (it was raining last night).",
      },
    ],
    examples: [
      { ko: "지금 뭐 하고 있어요?", en: "What are you doing now?" },
      { ko: "저는 책을 읽고 있어요.", en: "I am reading a book." },
      {
        ko: "어제 밤에는 비가 오고 있었어요.",
        en: "It was raining last night.",
      },
    ],
    mistake:
      "Put the tense on 있어요, not on the first verb: “읽었고 있어요” is wrong. For the past, say 읽고 있었어요.",
    quiz: [
      {
        prompt: "지금 커피를 ___.",
        options: ["마시고 있어요", "마셨어요"],
        answerIndex: 0,
        explanation:
          "The action is happening now, so the progressive is 마시고 있어요.",
      },
      {
        prompt: "Which means “I was sleeping at ten last night”?",
        options: ["어제 열 시에 자고 있었어요.", "어제 열 시에 자고 있어요."],
        answerIndex: 0,
        explanation: "The past progressive uses 있었어요.",
      },
    ],
  },
  {
    id: "reason",
    order: 14,
    title: "-아서 / -어서",
    subtitle: "Because, and so",
    summary:
      "Stem + 아서/어서 links a reason to its result, or joins two actions that lead into each other.",
    points: [
      {
        heading: "The shapes",
        body: "The vowel rule matches -아요/어요: 좋다 → 좋아서, 먹다 → 먹어서, 하다 → 해서.",
      },
      {
        heading: "Reason and result",
        body: "비가 와서 집에 있었어요 (it rained, so I stayed home). 배가 아서 약을 먹었어요 (my stomach hurt, so I took medicine).",
      },
      {
        heading: "Sequence",
        body: "먼저 만나서 같이 갔어요 (we met and then went together). Use -고 for a plain “and then,” and -아서/어서 when the first action leads into the second.",
      },
    ],
    examples: [
      { ko: "비가 와서 집에 있었어요.", en: "It rained, so I stayed home." },
      {
        ko: "배가 아서 약을 먹었어요.",
        en: "My stomach hurt, so I took medicine.",
      },
      {
        ko: "친구를 만나서 같이 갔어요.",
        en: "I met a friend and we went together.",
      },
    ],
    mistake:
      "Keep the tense on the final verb: “비가 왔어서” is wrong. Say 비가 와서 집에 있었어요.",
    quiz: [
      {
        prompt: "비가 ___ 집에 있었어요.",
        options: ["와서", "왔어서"],
        answerIndex: 0,
        explanation:
          "The reason clause stays in its base form; the tense belongs on the final verb.",
      },
      {
        prompt: "배가 ___ 약을 먹었어요.",
        options: ["아파서", "아프고"],
        answerIndex: 0,
        explanation:
          "The stomachache is the reason for the medicine, so use 아파서.",
      },
    ],
  },
  {
    id: "if-when",
    order: 15,
    title: "-(으)면",
    subtitle: "If and when",
    summary:
      "Stem + (으)면 sets a condition or occasion: “if” or “when” the first clause happens, the second follows.",
    points: [
      {
        heading: "After a consonant",
        body: "Add 으면: 먹다 → 먹으면, 시간이 있으면.",
      },
      {
        heading: "After a vowel",
        body: "Add 면: 가다 → 가면, 비가 오면.",
      },
      {
        heading: "Present form for a future condition",
        body: "Korean keeps the present before -면 even when the condition is in the future: 내일 비가 오면 안 갈 거예요 (if it rains tomorrow, I won't go).",
      },
    ],
    examples: [
      {
        ko: "시간이 있으면 같이 가요.",
        en: "If you have time, let's go together.",
      },
      {
        ko: "비가 오면 집에 있을 거예요.",
        en: "If it rains, I'll stay home.",
      },
      {
        ko: "버튼을 누르면 문이 열려요.",
        en: "When you press the button, the door opens.",
      },
    ],
    mistake:
      "-면 is for a condition, not a one-time event in the past. For “when I arrived,” use 도착했을 때, not 도착하면.",
    quiz: [
      {
        prompt: "시간이 ___ 같이 가요.",
        options: ["있으면", "있어면"],
        answerIndex: 0,
        explanation: "있 ends in a consonant, so it takes 으면.",
      },
      {
        prompt: "비가 ___ 집에 있을 거예요.",
        options: ["오면", "왔으면"],
        answerIndex: 0,
        explanation:
          "A future condition uses the present form before -면: 오면.",
      },
    ],
  },
  {
    id: "negation",
    order: 16,
    title: "안 / -지 않아요",
    subtitle: "Saying no",
    summary:
      "Put 안 before a verb for the short negative, or attach -지 않아요 to the stem for the long negative. Both mean “do not.”",
    points: [
      {
        heading: "Short negative",
        body: "안 goes right before the verb: 저는 고기를 안 먹어요. With 하다 verbs it goes before 하다: 공부를 안 해요.",
      },
      {
        heading: "Long negative",
        body: "Stem + 지 않아요: 먹지 않아요, 가지 않아요. It is a little more formal and softer than 안.",
      },
      {
        heading: "못 is different",
        body: "못 means “cannot,” not “do not”: 매운 것을 못 먹어요 (I can't eat spicy food).",
      },
    ],
    examples: [
      { ko: "저는 고기를 안 먹어요.", en: "I don't eat meat." },
      {
        ko: "오늘은 학교에 가지 않아요.",
        en: "I'm not going to school today.",
      },
      { ko: "저는 매운 것을 못 먹어요.", en: "I can't eat spicy food." },
    ],
    mistake:
      "Do not put 안 before a noun to negate it: “안 학생이에요” is wrong. For “not a student,” say 학생이 아니에요.",
    quiz: [
      {
        prompt: "저는 고기를 ___.",
        options: ["안 먹어요", "먹지 안아요"],
        answerIndex: 0,
        explanation: "The short negative puts 안 before the verb.",
      },
      {
        prompt: "I can't swim.",
        options: ["수영을 못 해요.", "수영을 안 해요."],
        answerIndex: 0,
        explanation: "못 expresses inability; 안 would mean “I don't swim.”",
      },
    ],
  },
  {
    id: "future",
    order: 17,
    title: "-(으)ㄹ 거예요",
    subtitle: "Plans and the future",
    summary:
      "Stem + (으)ㄹ 거예요 states a plan, an intention, or a prediction about the future.",
    points: [
      {
        heading: "After a consonant",
        body: "Add 을 거예요: 먹다 → 먹을 거예요, 읽다 → 읽을 거예요.",
      },
      {
        heading: "After a vowel",
        body: "Add ㄹ 거예요: 가다 → 갈 거예요, 하다 → 할 거예요.",
      },
      {
        heading: "ㄹ-final stems do not double",
        body: "살다 → 살 거예요, 만들다 → 만들 거예요. The ㄹ already in the stem does the work.",
      },
    ],
    examples: [
      { ko: "내일 부산에 갈 거예요.", en: "I'm going to Busan tomorrow." },
      {
        ko: "저녁에 김치를 만들 거예요.",
        en: "I'm going to make kimchi tonight.",
      },
      {
        ko: "시험은 어려울 거예요.",
        en: "The exam will probably be difficult.",
      },
    ],
    mistake:
      "가다 ends in a vowel, so the future is 갈 거예요. “가을 거예요” splits the ending in the wrong place.",
    quiz: [
      {
        prompt: "먹다 → ___ 거예요",
        options: ["먹을", "먹ㄹ"],
        answerIndex: 0,
        explanation: "먹 ends in a consonant, so it takes 을 거예요.",
      },
      {
        prompt: "내일 학교에 ___.",
        options: ["갈 거예요", "가을 거예요"],
        answerIndex: 0,
        explanation:
          "가 ends in a vowel, so the ending is ㄹ 거예요: 갈 거예요.",
      },
    ],
  },
  {
    id: "before-after",
    order: 18,
    title: "-기 전에 / -(으)ㄴ 후에",
    subtitle: "Before and after",
    summary:
      "Stem + 기 전에 means “before doing.” A past-modifier form + 후에 means “after doing.”",
    points: [
      {
        heading: "Before",
        body: "Attach 기 전에 to the stem: 먹다 → 먹기 전에, 가다 → 가기 전에. The tense stays in the main clause: 자기 전에 책을 읽었어요.",
      },
      {
        heading: "After",
        body: "Use the past modifier before 후에: 먹다 → 먹은 후에, 가다 → 간 후에, 하다 → 한 후에. It only marks the first action as finished, not the whole sentence as past.",
      },
      {
        heading: "Clause order",
        body: "The -기 전에 clause comes first in Korean even though English often reverses it: 밥을 먹기 전에 손을 씻어요 (I wash my hands before eating).",
      },
    ],
    examples: [
      { ko: "자기 전에 책을 읽어요.", en: "I read a book before sleeping." },
      {
        ko: "밥을 먹은 후에 약을 먹어요.",
        en: "I take medicine after eating.",
      },
      {
        ko: "수업이 끝난 후에 친구를 만나요.",
        en: "I meet a friend after class ends.",
      },
    ],
    mistake:
      "“먹은 전에” is wrong. Before uses the stem + 기 전에 (먹기 전에); after uses the past modifier + 후에 (먹은 후에).",
    quiz: [
      {
        prompt: "자기 ___ 책을 읽어요.",
        options: ["전에", "후에"],
        answerIndex: 0,
        explanation: "Reading happens before sleeping, so use -기 전에.",
      },
      {
        prompt: "밥을 ___ 약을 먹어요.",
        options: ["먹은 후에", "먹기 후에"],
        answerIndex: 0,
        explanation: "After eating uses the past modifier: 먹은 후에.",
      },
    ],
  },
];

export const GRAMMAR_LESSON_COUNT = GRAMMAR_LESSONS.length;

export function findGrammarLesson(id: string): GrammarLesson | undefined {
  return GRAMMAR_LESSONS.find(lesson => lesson.id === id);
}

/** Stable sentence id for an example, shared with the audio generator. */
export function grammarExampleId(lessonId: string, index: number): string {
  return `grammar_${lessonId}_${index + 1}`;
}

/** Every example line the sentence-audio pass should speak. */
export const GRAMMAR_SENTENCE_LINES: { id: string; text: string }[] =
  GRAMMAR_LESSONS.flatMap(lesson =>
    lesson.examples.map((example, index) => ({
      id: grammarExampleId(lesson.id, index),
      text: example.ko,
    }))
  );
