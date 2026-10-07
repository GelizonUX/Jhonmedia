/* ============================================================
   JHON MEDIA · WORK GRID
   ============================================================
   HOW TO UPDATE YOUR WORK (2 minutes):

   1. THUMBNAIL
      Export a vertical frame from the ad. 9:16. 1080x1920 is ideal
      (720x1280 is fine). JPG, under 250KB.
      Name it 01.jpg, 02.jpg ... and drop it in /assets/thumbs/.
      No image yet? Leave the path. The site shows a gray numbered
      placeholder until the file exists.

   2. TIKTOK LINK
      Open the video on TikTok > Share > Copy link.
      Paste the full link into "tiktok". It should look like:
      https://www.tiktok.com/@jhonmedia/video/7351234567890123456
      (Short links like vm.tiktok.com work in "newtab" mode but NOT
      in "lightbox" mode. Open them once in a browser and copy the
      long link from the address bar.)

   3. DETAILS
      title    : short name of the ad. 2 to 5 words.
      brand    : client name. Use "Confidential" if under NDA.
      category : must be one of "UGC", "Product Demo",
                 "Talking Head", "Motion". This drives the filters.
      format   : length + ratio, e.g. "0:24 · 9:16".
      metric   : the one result you can share, e.g. "2.4x ROAS",
                 "41% hook rate", "$0.92 CPC". Leave "" to hide it.

   4. ORDER
      The grid shows items in the order below. Put your best first.

   5. ADD OR REMOVE
      Copy a { ... } block, paste it, change the values.
      Keep the comma between blocks. Delete a block to remove it.
      8 or 12 items look best on desktop (4 columns).
   ============================================================ */

window.WORK_CONFIG = {
  // "newtab"  : clicking a card opens TikTok in a new tab (recommended)
  // "lightbox": clicking plays the TikTok embed on the page
  mode: "newtab",
  profile: "https://www.tiktok.com/@jhonmedia" // placeholder — replace
};

window.WORK = [
  {
    title: "The 3-second skin reveal",
    brand: "Kinfolk Skin",            // placeholder — replace
    category: "UGC",
    format: "0:24 · 9:16",
    metric: "2.4x ROAS",              // placeholder — replace
    thumbnail: "assets/thumbs/01.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000001" // placeholder — replace
  },
  {
    title: "Desk setup in 15 seconds",
    brand: "Atlas Supply",            // placeholder — replace
    category: "Product Demo",
    format: "0:15 · 9:16",
    metric: "41% hook rate",          // placeholder — replace
    thumbnail: "assets/thumbs/02.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000002" // placeholder — replace
  },
  {
    title: "Founder explains the formula",
    brand: "Solace",                  // placeholder — replace
    category: "Talking Head",
    format: "0:38 · 9:16",
    metric: "-32% CPA",               // placeholder — replace
    thumbnail: "assets/thumbs/03.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000003" // placeholder — replace
  },
  {
    title: "Why my dog stopped scratching",
    brand: "Halo Pet",                // placeholder — replace
    category: "UGC",
    format: "0:29 · 9:16",
    metric: "3.1x ROAS",              // placeholder — replace
    thumbnail: "assets/thumbs/04.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000004" // placeholder — replace
  },
  {
    title: "Five reasons, zero footage",
    brand: "Meridian",                // placeholder — replace
    category: "Motion",
    format: "0:12 · 9:16",
    metric: "$0.71 CPC",              // placeholder — replace
    thumbnail: "assets/thumbs/05.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000005" // placeholder — replace
  },
  {
    title: "Unboxing, then the twist",
    brand: "Vera Home",               // placeholder — replace
    category: "Product Demo",
    format: "0:21 · 9:16",
    metric: "38% hold rate",          // placeholder — replace
    thumbnail: "assets/thumbs/06.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000006" // placeholder — replace
  },
  {
    title: "Three creators, one hook",
    brand: "Loop Active",             // placeholder — replace
    category: "UGC",
    format: "0:26 · 9:16",
    metric: "18 hooks tested",        // placeholder — replace
    thumbnail: "assets/thumbs/07.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000007" // placeholder — replace
  },
  {
    title: "The dermatologist breakdown",
    brand: "Brightwell",              // placeholder — replace
    category: "Talking Head",
    format: "0:44 · 9:16",
    metric: "2.0x ROAS",              // placeholder — replace
    thumbnail: "assets/thumbs/08.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000008" // placeholder — replace
  },
  {
    title: "Kinetic type launch spot",
    brand: "Tidal",                   // placeholder — replace
    category: "Motion",
    format: "0:09 · 9:16",
    metric: "1.2M views",             // placeholder — replace
    thumbnail: "assets/thumbs/09.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000009" // placeholder — replace
  }
];
