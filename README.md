# SplitBill

A privacy-first restaurant bill splitter that runs entirely in the browser — no server, no account, no data ever leaves your device.

Take or upload a photo of your receipt, let the in-browser OCR extract the items, then split the bill exactly how you want: assign individual items to people, or split by percentage.

## Features

- **In-browser OCR** via [Tesseract.js](https://tesseract.js.org/) — text recognition happens locally, your receipt is never uploaded anywhere
- **HEIC support** — iPhone photos work directly (native decoding on Chrome/Safari, fallback via heic2any)
- **Image crop** — trim the receipt before scanning for better OCR accuracy
- **Smart parsing** — detects item names, quantities, unit prices and totals; understands the `2 × 4,50 = 9,00` pattern
- **Two split modes**
  - *Per item* — assign each unit to a person (3 beers → one each to three people)
  - *Percentage* — slider-based split with equal-distribution shortcut
- **Tip** — add a tip as a fixed amount or percentage; distributed proportionally
- **Summary** — every person sees their total and a full itemized breakdown
- **Persistent state** — refreshing the page restores your session (localStorage)
- **No install needed** — works in any modern browser, mobile-friendly

## Stack

| Layer | Library |
|---|---|
| UI | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| OCR | Tesseract.js v7 |
| Image crop | react-image-crop |
| HEIC decode | heic2any (fallback) |

## Getting started

```bash
git clone <repo-url>
cd bill-splitter
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build for production

```bash
npm run build
npm run preview
```

## Usage

1. **Scan** — drag a receipt photo onto the app, click to open the file picker, or tap *Kamera öffnen* on mobile. HEIC, JPG and PNG are supported.
2. **Crop** *(optional)* — drag a selection to crop out background clutter before OCR runs. Click *Überspringen* to use the full image.
3. **Review** — edit the parsed items, store name, and add a tip if needed.
4. **People** — add everyone who is splitting the bill by name.
5. **Split** — choose a mode:
   - *Pro Position*: tap each item line and pick who pays for it. Multi-quantity items (e.g. `3× Bier`) are expanded into individual units that can be assigned separately.
   - *Prozentual*: use the sliders or *Gleich aufteilen* for an equal share.
6. **Summary** — see what each person owes, with an itemized breakdown.

## OCR tips

- Good lighting and a flat receipt improve accuracy significantly.
- Use the crop tool to include only the itemized section — skip the store header and payment footer.
- After scanning, all fields are editable. OCR is a starting point, not the final word.
- If HEIC files don't appear in the file picker dialog, change the filter to "All Files" (top-right of the dialog on macOS).

## License

MIT
