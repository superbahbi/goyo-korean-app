interface Scenario {
  id: string;
  place: string;
  prompt: string;
  cardId: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "greeting",
    place: "Meeting someone",
    prompt: "You meet someone for the first time. Greet them politely.",
    cardId: "surv_001",
  },
  {
    id: "thanks",
    place: "Receiving help",
    prompt: "Someone helps you. What do you say?",
    cardId: "surv_002",
  },
  {
    id: "sorry",
    place: "Apologizing",
    prompt: "You are late to an appointment. Apologize politely.",
    cardId: "surv_003",
  },
  {
    id: "bathroom",
    place: "Finding a place",
    prompt: "You are in a café and need to ask where the bathroom is.",
    cardId: "surv_008",
  },
  {
    id: "price",
    place: "Shopping",
    prompt: "You want to ask the price of an item.",
    cardId: "surv_009",
  },
  {
    id: "repair",
    place: "Conversation repair",
    prompt: "You did not understand someone. Tell them you do not know.",
    cardId: "surv_006",
  },
];
