# Lumière — Shopify Jewelry Theme

A luxury jewelry storefront theme built in Liquid, following Shopify's Online Store 2.0 (JSON template) architecture.

## What's included

- **Layouts**: `theme.liquid` (main layout with a branded loading splash) and `password.liquid` (coming-soon page).
- **Homepage** (`templates/index.json`): hero banner, brand promises (USPs), featured collection, shop-by-category grid, brand story split, testimonials.
- **Product page**: gallery with thumbnails, variant picker, quantity selector, accordion for details/shipping/materials, related products.
- **Collection page**: responsive product grid with pagination.
- **Cart page**: line item table, quantity editor, subtotal, checkout button.
- **Search page**, **404 page**, **generic page template**, **Contact page** (with contact form), **Blog/Journal + Article** templates.
- **Customer account** templates: login, register, account, addresses, order, password reset/activation.
- **i18n**: `locales/en.default.json` plus `fr.json` and `es.json` translations. All customer-facing strings route through Liquid's `{{ 'key' | t }}` translation filter.
- **Theme settings**: colors, fonts (Playfair Display for headings, Jost for body), page width, social links — all editable in the Shopify Theme Editor.

## Building your 5–6 page site in Shopify admin

1. Upload this theme (zip the repo contents, or connect via Shopify CLI / GitHub integration) in **Online Store → Themes**.
2. In **Online Store → Pages**, create pages such as **About**, **Contact** (assign the `page.contact` template), **Shipping & Returns**, **FAQ** — each will render with `templates/page.json` (or `page.contact.json` for Contact).
3. Create a few **Collections** (e.g. Rings, Necklaces, Earrings) and add products; the homepage's "Shop by category" and "Bestsellers" sections let you pick collections directly in the Theme Editor.
4. Optionally enable the **Blog** ("Journal") from Online Store → Blog posts for editorial content.
5. Add your logo, hero imagery, and product photography via the Theme Editor — all image slots use `image_picker` settings.
6. To add more storefront languages, duplicate `locales/en.default.json` (e.g. `de.json`) and enable the language under **Settings → Languages**.

## Local development

This theme follows standard Shopify theme folder conventions (`layout/`, `templates/`, `sections/`, `snippets/`, `assets/`, `config/`, `locales/`), so it works directly with the [Shopify CLI](https://shopify.dev/docs/api/shopify-cli):

```
shopify theme dev --store your-store.myshopify.com
```
