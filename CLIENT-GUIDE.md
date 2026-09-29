# Managing your store

Everything on the website comes from **one Google Sheet**. Add a row, type a price,
paste a photo link — the website updates by itself within about **5 minutes**. No
developer, no waiting, no extra cost.

---

## 1. The Sheet

The sheet has two tabs:

| Tab | What it is for |
| --- | --- |
| **Products** | One row per product — this is the main tab |
| **Categories** | Optional. Only used to set the picture shown on a category tile |

### Products tab columns

Keep the first row (headings) exactly as it is. Add your products from row 2 onwards.

| Column | Example | Notes |
| --- | --- | --- |
| **Name** | `STEEL GUARD SL MODEL (2032)` | The product name shown on the site |
| **Category** | `EV Iron Parts & Guards` | Type any name — a **new category is created automatically** if it does not exist yet. Spelling must match exactly between products you want grouped together |
| **Price** | `529.9` | Numbers only, no ₹ sign. This is the price **excluding GST** |
| **Unit** | `SET` | `PCS`, `SET`, `PAIR`, `KG`… whatever you sell it in |
| **MOQ** | `5` | Minimum order quantity. The site will not let a customer order less |
| **Part No** | `2032` | Optional but recommended — customers search by part number |
| **Stock** | `120` | Put `0` to show **Out of stock** |
| **Image 1** | photo link | See “Photo links” below |
| **Image 2** | photo link | Optional second photo (the product page shows a gallery) |
| **Description** | `Steel guard for SL model…` | Plain text, or use the simple formatting below |
| **Tags** | `Discounted` | Optional. `Discounted` adds a green “Deal” badge |

### Formatting inside Description

You can use very simple formatting — just type it:

```
# Big heading

Normal paragraph text.

- bullet point
- another point

**bold text**
```

---

## 2. Photo links

**Best and easiest: Google Drive.**

1. Upload the photo to Google Drive.
2. Right-click the file → **Share** → **General access** → change to **Anyone with the link**.
3. Click **Copy link** and paste it in the Image column.

That link works on the site — the store converts it automatically. You can also paste any
normal image link from another website.

> Photos taken on a phone are fine. A square or slightly-wide photo looks best.

---

## 3. Common jobs

### Add a new product
1. Open the sheet → **Products** tab.
2. Scroll to the last row and type the details in the next empty row.
3. Done — it appears on the site in about 5 minutes.

### Change a price
Find the product row, type the new number in the **Price** column. Save — Google Sheets
saves automatically.

### Change a description or photo
Same row, edit the **Description** or **Image** column.

### Add a new category
Type the new category name in the **Category** column of any product. That is it — the
category appears on the homepage and in the menu on its own.

To give it a nice tile picture, open the **Categories** tab and add a row:
`category name` + the photo link.

### Hide a product (do not delete the row)
Set **Stock** to `0`. It will show as *Out of stock* and customers cannot order it.
If you want it gone completely, delete the whole row.

### Change the order products appear in
Products are listed category-wise. To push something up, put it higher in the sheet —
the order inside a category follows the sheet order.

---

## 4. Good to know

- **How long do changes take?** About 5 minutes. The site refreshes itself.
- **Do not change the heading row** or rename columns — that breaks the sync.
- **Prices** are shown excluding GST. GST (18%, or 5% on chargers) is added at checkout.
- **Orders** currently come to you on **WhatsApp** — the customer fills the checkout page
  and taps “Send order on WhatsApp”, which opens a chat with the full order details.
- **One photo per product is enough** to start. Add more later.
- Keep the sheet **shared with the website** (the person who set this up needs edit access).

---

## 5. If something looks wrong

| Problem | What to check |
| --- | --- |
| Product not showing | Is the Name filled? Is the Price a number? Is Stock more than 0? |
| Photo not showing | Open the photo link in a private/incognito window — if it does not open, the sharing is still private |
| Two categories with the same meaning | Spelling must be **exactly** the same, e.g. `Chargers` and `charger` are two different categories |
| Nothing updated after 10 minutes | Contact the developer who set this up |

---

**Need a hand?** WhatsApp the developer who set up the store — he can add a feature or fix
the sheet for you.
