# Jewl — Shopify theme

The Jewl storefront, built on Shopify's Horizon theme. The theme files sit at the repository root (`assets`, `blocks`, `config`, `layout`, `locales`, `sections`, `snippets`, `templates`), so this branch can be connected directly with Shopify's GitHub integration or zipped and uploaded.

- `concepts/jewl.html` is the original single-file design concept.
- `catalog/jewl-products.csv` is a 20-product import for Products → Import.

## Pages the footer links to

Create these in Online Store → Pages. The footer finds them by handle, so the handle (under "Search engine listing" → URL) must match exactly.

| Title | Handle |
|---|---|
| Ring Size Guide | `ring-size-guide` |
| Lifetime Resizing | `lifetime-resizing` |
| Shipping & Returns | `shipping-returns` |
| Jewelry Care | `jewelry-care` |
| Contact | `contact` (already exists) |

Until a page exists its link is hidden, except Ring Size Guide, which falls back to the engraving studio on the home page.
