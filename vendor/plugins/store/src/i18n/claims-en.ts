// Texts of claims (ADR 0079) in English: the email with the link and the secret code, the claim
// page, and the NPS point packages DevQuake staff keep in the shop. The source the other languages
// follow (claims.ts).

export const claimsEn = {
  claims: {
    email: {
      subject: 'Something for you from DevQuake: {title}',
      heading: 'You have something to claim',
      how: 'Open the link below, sign in to DevQuake as yourself and type this secret code. It is yours alone: do not share it.',
      code: 'Your secret code: {code}',
      expires: 'You can claim it within {days} days.',
      button: 'Claim it',
    },
    page: {
      title: 'Claim your reward',
      what: '{title}: {points} DevQuake NPS points',
      signIn: 'Sign in to DevQuake as the member this was made for, then open this link again.',
      signInButton: 'Sign in',
      notYours: 'This was made for another DevQuake member.',
      codeLabel: 'Secret code from the email',
      submit: 'Claim',
      wrong: 'That code is not right. Tries left: {left}.',
      locked: 'Too many wrong codes: this claim is locked. Write to DevQuake to have it reopened.',
      expired: 'This claim has expired.',
      cancelled: 'This claim was withdrawn.',
      claimed: 'This was already claimed.',
      done: 'Done: {points} NPS points were added to your DevQuake account.',
      unknown: 'This link is not valid.',
      failed: 'It could not be claimed right now. Please try again later.',
    },
    packages: {
      title: 'NPS point packages',
      intro:
        'Packages of DevQuake NPS points that DevQuake gives as prizes and rewards through claims. They are never shown in the shop or sold: NPS points cannot be bought.',
      name: 'Name',
      points: 'Points',
      add: 'Add the package',
      archive: 'Remove',
      empty: 'No packages yet.',
      errorName: 'Give it a name of 2 to 120 characters.',
      errorPoints: 'Choose 1 to 100 points.',
      saved: 'Saved.',
      failed: 'Not saved. Please try again.',
    },
  },
  errors: {
    packageName: 'Give it a name of 2 to 120 characters.',
    packagePoints: 'Choose 1 to 100 points.',
  },
  subNav: { packages: 'NPS point packages' },
};
