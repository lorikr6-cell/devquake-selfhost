// Texts of the interest votes (ADR 0060) in English: the vote buyers see instead of a price, the
// owner's settings for a product and the report on Statistics. The source the other languages
// follow (interest.ts).

export const interestEn = {
  interest: {
    badge: 'Vote',
    cardHint: 'Not on sale yet: vote for it',
    notSold: 'Not on sale yet',
    title: 'Would you buy this?',
    intro:
      'We make it only if enough people want it. Tell us, and if you like, which version you want and what you would pay.',
    count: { one: '{count} person wants it', other: '{count} people want it' },
    any: 'Any',
    priceRange: 'What would you pay? Optional, in {currency}',
    priceMin: 'From',
    priceMax: 'Up to',
    yes: 'Yes, I want it',
    update: 'Update my vote',
    no: 'Not for me',
    withdraw: 'Take my vote back',
    votedYes: 'You said you want it. You can change your answer.',
    votedNo: 'You said it is not for you. You can change your answer.',
    thanks: 'Thanks, your vote counts',
    withdrawn: 'Your vote was taken back',
    signIn: 'One vote per person:',
    signInLink: 'sign in to vote',
  },
  interestAdmin: {
    title: 'Interest vote',
    intro:
      'Show a vote instead of the price: buyers say whether they want it, what they would pay and which version (the multiple-choice fields of its type, such as colours and sizes). It cannot be ordered while this is on.',
    toggle: 'Ask for votes instead of selling',
    unitCost: 'Cost per piece ({currency})',
    unitCostHint: 'Materials, printing and packaging, for the return estimate.',
    setupCost: 'One-time investment ({currency})',
    setupCostHint: 'Design, print screens, samples.',
    save: 'Save',
    saved: 'Interest vote saved',
    results: 'See the votes',
  },
  interestStats: {
    title: 'Interest votes',
    intro:
      'Products that ask for votes, with the demand and an estimate from what voters said they would pay. Prices include VAT; revenue and profit are without VAT and before shipping.',
    empty: 'No product asks for votes yet. Turn it on for a product on its page.',
    total:
      'All voted products: {interested} interested, up to {revenue} revenue and {profit} profit at the suggested prices.',
    votes: '{yes} want it · {no} not',
    range: 'What they would pay (median)',
    priced: { one: '{count} gave a price', other: '{count} gave a price' },
    suggested: 'Suggested price',
    units: 'Expected buyers',
    revenue: 'Revenue (without VAT)',
    costs: 'Costs',
    addCosts: 'Add the costs',
    costLine: '{unit} a piece, {setup} once',
    investment: 'Investment',
    profit: 'Profit',
    roi: 'Return (ROI)',
    breakEven: 'Break-even',
    pieces: { one: '{count} piece', other: '{count} pieces' },
    never: 'never at this price',
    preferences: 'Wanted versions',
    verdict: {
      early: 'Too early: fewer than {min} people want it.',
      noCosts: 'Add the cost per piece to see profit and return.',
      loss: 'It would lose money at the price voters accept.',
      thin: 'A small return: below {roi} % at the price voters accept.',
      good: 'Worth making: a good return at the price voters accept.',
    },
    note: 'The suggested price earns the most from the voters’ own upper limits; voters without a price count in the same share. Real sales are usually lower than votes.',
  },
  errors: {
    interestOff: 'Interest votes are switched off for this shop.',
    voteSignIn: 'Sign in to vote: one vote per person.',
  },
  fields: {
    unitCost: 'The cost per piece',
    setupCost: 'The one-time investment',
    price: 'The price',
  },
};
