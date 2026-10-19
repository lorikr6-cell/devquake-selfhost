// Texts of the shop on DevQuake (ADR 0059) in English: connecting a DevQuake account, buyers'
// saved delivery details and the DevQuake promotion for visitors. The source the other
// languages follow (platform.ts).

export const platformEn = {
  account: {
    connectTitle: 'Already on DevQuake?',
    connectBody:
      'Continue as {name}: your account here is filled in from your DevQuake profile (your name and email address; DevQuake asks you once). Orders made with that address show up here.',
    connect: 'Continue with DevQuake',
    orEmail: 'Or sign in with any email address',
    linked: 'Connected with your DevQuake account.',
    devquakeTitle: 'From your DevQuake account',
    devquakeName: 'Name',
    devquakeEmail: 'Email',
    manageOnDevQuake: 'Change on DevQuake',
    statFavorites: 'Favourites',
    statPurchases: 'Purchases',
    statCart: 'In the cart',
    memberPrivacyNote:
      'Your name and email address come from your DevQuake account. This shop keeps your delivery details, your messages and your orders (as the law asks); deleting the account here removes everything but the orders.',
    deliveryTitle: 'Delivery details',
    deliveryHint: 'Saved in your account here, they fill in the checkout for you.',
    phone: 'Phone',
    addressLine: 'Street and number',
    city: 'City',
    postalCode: 'Postal code',
    country: 'Country',
    noCountry: 'Not set',
    saveDetails: 'Save details',
    detailsSaved: 'Details saved',
  },
  checkout: {
    remember: 'Save these delivery details in my account',
    filledIn: 'Filled in from your account.',
  },
  shop: {
    theme: { label: 'Theme', adaptive: 'Adaptive', light: 'Light', dark: 'Dark' },
    currency: 'Currency',
    newsletterToggle: 'Send me this shop’s newsletter',
    newsletterToggleHint: 'To {email}. Untick to stop it any time.',
    newsletterOn: 'Newsletter switched on.',
    newsletterOff: 'Newsletter switched off.',
    newsletterFailed: 'The newsletter setting could not be saved. Please try again.',
    fxNote:
      'Prices in {currency} are approximate, at the European Central Bank’s rates of {date}. You pay in {base}; your bank or card converts it.',
  },
  promo: {
    title: 'Made by DevQuake',
    body: 'This shop belongs to DevQuake, a developer’s workshop of web apps for everyday problems. One free account signs you in to all of them, and to this shop.',
    apps: 'Apps for shared expenses, the household, CVs, darts clubs and more',
    ideas: 'Suggest and vote for the next app',
    selfHost: 'Several apps also run on your own server, open source',
    join: 'Join DevQuake free',
    explore: 'Explore the apps',
  },
  errors: {
    shopsClosed: 'Only the site’s administrators can open a shop here.',
  },
};
