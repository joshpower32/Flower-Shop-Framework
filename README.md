# Flower Shop Framework — "Bloom & Co."

A complete, sellable small-business **e-commerce template**: product catalogue, category
filters, persistent cart, and a checkout flow that ends in PayPal/Stripe or Interac
e-Transfer instructions. Pure HTML/CSS/JS — no build step, hosts free on GitHub Pages.

Doubles as the **shared design-system starter kit** for the other frameworks: the CSS
tokens and components (buttons, cards, nav, drawer, modal, toast) are reusable as-is.

## Personalising for a client (the sellable workflow)

1. **Brand & colours** — edit the tokens in `:root` at the top of `styles.css`
   (`--brand`, `--accent`, fonts, radius). Change `Bloom & Co.` text in `index.html`.
2. **Products** — edit the `PRODUCTS` array in `app.js` (name, price, category, stock,
   description). To use real photos instead of the generated SVG placeholders, add an
   `image:` field, e.g. `image: "assets/rose-bouquet.jpg"` — shoot these with the camera.
3. **Copy** — hero, about, delivery areas/fees, hours, and contact info live in
   `index.html`.
4. **Payments** — in `app.js`, `SHOP.paypalLink` and `SHOP.etransferEmail`. For real card
   payments, follow the `placeOrder()` comment to drop in a **Stripe Payment Link** or
   **PayPal** redirect (recommended over building card handling yourself).

## Local preview

```bash
python3 -m http.server 5510   # then open http://localhost:5510
```

## Notes / next steps when sold

- Cart persists in `localStorage`; no backend required for the demo.
- For real orders + inventory, wire the catalogue and orders to **Firebase** (Firestore),
  mirroring the YMCA dashboard project's pattern.
- Hosting upgrade path for paying clients: Netlify / Cloudflare Pages + a custom domain.

## Selling this site to a client (order delivery)

When an order is placed, the full order (items, options, customer details, total) emails the client via **Web3Forms**, alongside the existing PayPal / e-Transfer instructions.

1. Get a FREE key at [web3forms.com](https://web3forms.com) using the **client's email**.
2. Paste it into `SHOP.web3formsKey` in `app.js`; set `SHOP.ownerEmail` and `SHOP.etransferEmail` to the client's details too.
3. Set `SHOP.paypalLink` to the client's PayPal.Me / Stripe Payment Link for real payments.
4. Place a test order on the live site and confirm the `🛒 NEW ORDER` email arrives.

Free tier = 250 submissions/month per key.
