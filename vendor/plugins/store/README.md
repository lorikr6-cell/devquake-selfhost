# Store

A lightweight shop, run **standalone** by the self-host shell (ADR 0054) and on
**`store.devquake.com`** for DevQuake's own merch (ADR 0059: registered offline by platform
migration 0055; the owner opens it in /admin-cp/projects). Own MySQL database (ADR 0007);
decisions in [ADR 0057](../../docs/adr/0057-store.md),
[ADR 0058](../../docs/adr/0058-store-growth.md) and
[ADR 0059](../../docs/adr/0059-store-on-devquake.md).

The owner (a signed-in member, one store each) adds **products** with **options** (size,
colour…: price, code, optional stock, an optional **sale price** with a start and an end) and up
to eight **photos**; sets the **payment methods** (Stripe Checkout, PayPal Orders v2, bank
transfer, cash on delivery — straight to the owner's own accounts), **shipping zones** (countries,
flat rate, free from an amount), **seller details** and **terms**; and follows **orders**
(awaiting payment → paid → shipped → delivered, or cancelled; courier and tracking number).

Growing the shop (ADR 0058):

- **Catalogue**: product **types** with their own fields (text, number with unit, yes/no,
  choices, colour, date, link), eleven translated templates (electronics, clothing, shoes,
  books, food, cosmetics, furniture, jewellery, toys, sports, handmade); **vendors** (contacts,
  shown as the brand); search, filters, bulk publish/unpublish/delete and copying products.
- **Marketing**: **campaigns** (percentage off everything, a category or chosen products, for a
  while), **vouchers** at checkout (percent, amount, free shipping; minimum, uses, once per
  buyer), **announcements** (bar or front-page banner, with a voucher code or a campaign link),
  **newsletters** to confirmed subscribers with product cards (on offer, new), preview, test and
  batched sending.
- **Buyers**: optional **accounts** by emailed link (orders, messages with the shop, newsletter,
  deleting the account), **reviews** (moderated, or verified buyers at once), **comparison** of
  up to four products, **sharing** and a **QR code** per product, order confirmation emails.
- **Look and reach**: the shop's own **design** (logo, banner, colours, fonts, corners, cards,
  header, columns), **SEO** texts with previews and a score per product, richer JSON-LD, site
  verification, and owner-only **tracking tags** (GA4, Google Ads, Tag Manager, Meta pixel, own
  snippets) loaded after the buyer's consent.
- **Running it**: a **team** invited by link, each member with one or more roles (manager,
  products, marketing, support, shipping and delivery, maintenance) and an Overview **task
  board** for those roles with quick actions; **statistics** (sales, orders, views, conversion
  per product); **maintenance mode** with a message for buyers.
- **Automatic discounts and free shipping**: from an amount or a number of items, shown with
  hints in the cart and at checkout, before a voucher.
- **On DevQuake** (ADR 0059): members **continue with DevQuake** (their account in the shop
  from their profile: name and the consented, read-only `email` field) and are recognised on
  later visits; buyers save **delivery details** that fill in the checkout; admin settings
  `membersOpenShops` (off: only administrators open shops, members shop like visitors) and
  `promoteDevQuake` (off: a DevQuake promotion for visitors above the shop footer); the shops'
  pages and sitemap are `searchable` for robots.txt.
- **Languages**: the owner copies the labels buyers see as JSON, translates them anywhere and
  pastes them back as a new language or changes to a built-in one; buyers pick it in the shop.

Buyers need no account to order: the **shop** (`/s/:slug`, products, cart kept in the browser,
checkout, the order's page behind a secret code, seller and terms) is made of open routes;
checkout, paying, the providers' returns and webhooks, reviews, vouchers, the newsletter and
the buyers' accounts are key routes that check everything themselves. Shop and product pages are
indexable (canonical URLs, Open Graph, schema.org `Product`/`Offer`/`AggregateRating`), listed in
`/api/sitemap.xml`. At the instance's root, visitors see the first open shop.

## Routes

Owner and team pages need a member with a role allowing the page's area (`lib/roles.ts`).

| Type | Pattern                                                              | Access                | File                                                            |
| ---- | -------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------- |
| Page | `/`                                                                  | open (see top)        | `src/pages/home.tsx`                                            |
| Page | `/products`, `/products/new`, `/products/:id`                        | products              | `src/pages/products.tsx`, `src/pages/product.tsx`               |
| Page | `/products/types`                                                    | products              | `src/pages/types.tsx`                                           |
| Page | `/vendors`                                                           | products              | `src/pages/vendors.tsx`                                         |
| Page | `/orders`, `/orders/:id`                                             | orders                | `src/pages/orders.tsx`, `src/pages/order.tsx`                   |
| Page | `/messages`, `/messages/:id`                                         | messages              | `src/pages/messages.tsx`, `src/pages/message.tsx`               |
| Page | `/reviews`                                                           | reviews               | `src/pages/reviews.tsx`                                         |
| Page | `/marketing`                                                         | marketing             | `src/pages/marketing.tsx`                                       |
| Page | `/newsletters`, `/newsletters/new`, `/newsletters/:id`               | marketing             | `src/pages/newsletters.tsx`, `src/pages/newsletter.tsx`         |
| Page | `/stats`                                                             | stats                 | `src/pages/stats.tsx`                                           |
| Page | `/settings`                                                          | settings              | `src/pages/settings.tsx`                                        |
| Page | `/settings/design`                                                   | design                | `src/pages/design.tsx`                                          |
| Page | `/settings/seo`                                                      | seo (tracking: owner) | `src/pages/seo.tsx`                                             |
| Page | `/settings/languages`                                                | settings              | `src/pages/languages.tsx`                                       |
| Page | `/settings/payments`                                                 | payments              | `src/pages/payments.tsx`                                        |
| Page | `/settings/shipping`                                                 | shipping              | `src/pages/shipping.tsx`                                        |
| Page | `/team`                                                              | team (owner)          | `src/pages/team.tsx`                                            |
| Page | `/join/:code`                                                        | member                | `src/pages/join.tsx`                                            |
| Page | `/help`                                                              | public                | `src/pages/help.tsx`                                            |
| Page | `/s/:slug`                                                           | open                  | `src/pages/shop.tsx`                                            |
| Page | `/s/:slug/p/:product`                                                | open                  | `src/pages/shop-product.tsx`                                    |
| Page | `/s/:slug/cart`                                                      | open                  | `src/pages/shop-cart.tsx`                                       |
| Page | `/s/:slug/checkout`                                                  | open                  | `src/pages/shop-checkout.tsx`                                   |
| Page | `/s/:slug/orders/:code`                                              | open (secret)         | `src/pages/shop-order.tsx`                                      |
| Page | `/s/:slug/info`                                                      | open                  | `src/pages/shop-info.tsx`                                       |
| Page | `/s/:slug/compare`                                                   | open                  | `src/pages/shop-compare.tsx`                                    |
| Page | `/s/:slug/account`, `/s/:slug/account/messages/:id`                  | open (buyer cookie)   | `src/pages/shop-account.tsx`, `src/pages/shop-thread.tsx`       |
| Page | `/s/:slug/newsletter`                                                | open                  | `src/pages/shop-newsletter.tsx`                                 |
| API  | `/health`                                                            | member                | `src/api/health.ts`                                             |
| API  | `/store` GET, POST, PUT                                              | member / settings     | `src/api/store.ts`                                              |
| API  | `/store/legal` PUT                                                   | settings              | `src/api/store-legal.ts`                                        |
| API  | `/store/payments` PUT                                                | payments              | `src/api/store-payments.ts`                                     |
| API  | `/store/shipping` PUT                                                | shipping              | `src/api/store-shipping.ts`                                     |
| API  | `/store/seo` PUT                                                     | seo                   | `src/api/store-seo.ts`                                          |
| API  | `/store/theme` PUT                                                   | design                | `src/api/store-theme.ts`                                        |
| API  | `/store/assets/:kind` GET, POST, DELETE                              | design                | `src/api/store-asset.ts`                                        |
| API  | `/store/reviews` PUT                                                 | reviews               | `src/api/store-reviews.ts`                                      |
| API  | `/store/tracking` PUT                                                | owner                 | `src/api/store-tracking.ts`                                     |
| API  | `/store/maintenance` PUT                                             | settings              | `src/api/store-maintenance.ts`                                  |
| API  | `/store/languages` GET (export), POST, PUT                           | settings              | `src/api/store-languages.ts`                                    |
| API  | `/store/languages/:code` GET, DELETE                                 | settings              | `src/api/store-language.ts`                                     |
| API  | `/rules` POST, `/rules/:id` PUT, DELETE                              | marketing             | `src/api/rules.ts`, `src/api/rule.ts`                           |
| API  | `/products` POST, `/products/bulk` POST                              | products              | `src/api/products.ts`, `src/api/products-bulk.ts`               |
| API  | `/products/:id` PUT, DELETE; `/:id/duplicate` POST                   | products              | `src/api/product.ts`, `src/api/product-duplicate.ts`            |
| API  | `/products/:id/photos` POST                                          | products              | `src/api/product-photos.ts`                                     |
| API  | `/products/:id/photos/:photoId` GET, PATCH, DELETE                   | products              | `src/api/product-photo.ts`                                      |
| API  | `/types` POST, `/types/:id` PUT, DELETE                              | products              | `src/api/types.ts`, `src/api/type.ts`                           |
| API  | `/vendors` POST, `/vendors/:id` PUT, DELETE                          | products              | `src/api/vendors.ts`, `src/api/vendor.ts`                       |
| API  | `/orders/:id` PATCH                                                  | orders                | `src/api/order.ts`                                              |
| API  | `/messages/:id` POST, PATCH                                          | messages              | `src/api/message.ts`                                            |
| API  | `/reviews/:id` PATCH, DELETE                                         | reviews               | `src/api/review.ts`                                             |
| API  | `/campaigns`, `/vouchers`, `/announcements` POST; `/:id` PUT, DELETE | marketing             | `src/api/campaign(s).ts`, `voucher(s).ts`, `announcement(s).ts` |
| API  | `/newsletters` POST, `/newsletters/:id` PUT, DELETE                  | marketing             | `src/api/newsletters.ts`, `src/api/newsletter.ts`               |
| API  | `/newsletters/:id/send`, `/batch`, `/test` POST                      | marketing             | `src/api/newsletter-send.ts`, `-batch.ts`, `-test.ts`           |
| API  | `/subscribers` GET (CSV), `/subscribers/:id` DELETE                  | marketing             | `src/api/subscribers.ts`, `src/api/subscriber.ts`               |
| API  | `/team/invites` POST, `/team/invites/:id` DELETE                     | team                  | `src/api/team-invites.ts`, `src/api/team-invite.ts`             |
| API  | `/team/:userId` PATCH, DELETE; `/team/leave` POST                    | team / member         | `src/api/team-member.ts`, `src/api/team-leave.ts`               |
| API  | `/join` POST                                                         | member                | `src/api/join.ts`                                               |
| API  | `/s/:slug/photos/:photoId` GET                                       | open                  | `src/api/shop-photo.ts`                                         |
| API  | `/s/:slug/assets/:kind` GET                                          | open                  | `src/api/shop-asset.ts`                                         |
| API  | `/s/:slug/p/:product/qr` GET                                         | open                  | `src/api/shop-qr.ts`                                            |
| API  | `/s/:slug/cart` GET                                                  | open                  | `src/api/shop-cart.ts`                                          |
| API  | `/sitemap.xml` GET                                                   | open                  | `src/api/sitemap.ts`                                            |
| API  | `/s/:slug/checkout` POST                                             | key route             | `src/api/shop-checkout.ts`                                      |
| API  | `/s/:slug/voucher` POST                                              | key route             | `src/api/shop-voucher.ts`                                       |
| API  | `/s/:slug/orders/:code/pay` POST                                     | key route             | `src/api/shop-pay.ts`                                           |
| API  | `/s/:slug/orders/:code/paypal` GET                                   | key route             | `src/api/shop-paypal.ts`                                        |
| API  | `/s/:slug/orders/:code/reviews` POST                                 | key route             | `src/api/shop-order-review.ts`                                  |
| API  | `/s/:slug/p/:product/reviews` POST                                   | key route             | `src/api/shop-review.ts`                                        |
| API  | `/s/:slug/stripe` POST (Stripe webhook)                              | key route             | `src/api/shop-stripe.ts`                                        |
| API  | `/s/:slug/newsletter` POST, `/confirm` POST                          | key route             | `src/api/shop-newsletter.ts`, `-confirm.ts`                     |
| API  | `/s/:slug/newsletter/unsubscribe` POST (one-click), GET              | key route             | `src/api/shop-unsubscribe.ts`                                   |
| API  | `/s/:slug/account/signin` POST, GET (email link)                     | key route             | `src/api/shop-signin.ts`                                        |
| API  | `/s/:slug/account` PATCH, PUT (details), DELETE, POST (sign out)     | key route             | `src/api/shop-account.ts`                                       |
| API  | `/s/:slug/account/connect` POST (Continue with DevQuake)             | key route             | `src/api/shop-connect.ts`                                       |
| API  | `/s/:slug/account/messages` POST, `/:id` POST                        | key route             | `src/api/shop-threads.ts`, `src/api/shop-thread.ts`             |

## Configuration

| Variable           | What                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `STORE_DB_*`       | The app's own database (the self-host shell sets it up).                                                                                                                                                                                                                                                                             |
| `STORE_MASTER_KEY` | 32 random bytes, base64: encrypts the owners' Stripe and PayPal secrets (AES-256-GCM). The shell generates it. Without it, Stripe and PayPal cannot be set up.                                                                                                                                                                       |
| `SMTP_*`           | The instance's mail server (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`), shared with the shell. On devquake.com the platform's `SMTP_USER`, `SMTP_PWD` and `MAIL_FROM` work too (Hostinger's server). Without a mail server there are no email sign-ups, newsletters or order confirmations. |

## Database

`db/migrations/0001_store.sql`, `0002_growth.sql` and `0003_platform_buyers.sql` (buyers'
`platform_user_id` and saved details) on the app's own database: `stores`,
`products`, `variants`, `product_photos`, `shipping_zones`, `orders`, `order_items`;
`store_assets`, `store_staff`, `store_invites`, `vendors`, `product_types`, `product_fields`,
`product_values`, `campaigns`, `campaign_products`, `vouchers`, `price_rules`, `announcements`,
`store_languages`, `reviews`,
`product_views`, `buyers`, `buyer_tokens`, `threads`, `messages`, `subscribers`, `newsletters`,
`newsletter_products`, `newsletter_deliveries`. Money in whole cents; times in UTC.

```bash
pnpm db:migrate --plugin store
```

## Development

```bash
pnpm dev   # from the repo root, then open http://store.localhost:3000
```
