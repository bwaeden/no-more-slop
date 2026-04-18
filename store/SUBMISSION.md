# Chrome Web Store submission checklist

Step-by-step to get **No More Slop** live on the Chrome Web Store.

## One-time setup (15 min)

### 1. Pay the Chrome Web Store developer fee

- Go to https://chrome.google.com/webstore/devconsole
- Sign in with the Google account you want publications under
- Pay the one-time **$5 registration fee** (credit card)
- Verify email if prompted

### 2. Host the privacy policy publicly

The Chrome Web Store requires a public URL to the privacy policy. Since this repo is private, the simplest path:

**Option A — GitHub Gist (recommended):**
1. Go to https://gist.github.com
2. Paste the contents of `store/privacy-policy.md`
3. Filename: `no-more-slop-privacy.md`
4. Click **Create public gist**
5. Copy the URL (looks like `https://gist.github.com/bwaeden/abc123...`)
6. Save the URL — you'll paste it in step 5 below

**Option B — GitHub Pages (free, requires public repo):**
- Create a tiny public repo just for `privacy-policy.md`, enable Pages, done.

## Every submission (10 min)

### 3. Build and package

```bash
cd C:/Users/Braeden/Projects/no-more-short-form
npm run build
node scripts/package.cjs
```

This produces `no-more-slop-v<version>.zip` in the project root. Use that file to upload.

### 4. Take screenshots

You need 1–5 screenshots, **1280×800** PNG each (or 640×400). Take them in Chrome with the extension installed:

1. The popup **start view** ("What are you here to do?" with intent field + Start Focus Session button)
2. The popup **active view** mid-session (showing intent card, platform toggles, break/end buttons)
3. A toast firing on a real page (e.g., visit youtube.com/shorts/anything and screenshot the redirect + toast on youtube.com home)
4. The welcome page hero

Save them as `store/screenshots/screenshot-1.png` etc. so they're version-controlled.

Tip: on Windows, `Win+Shift+S` → rectangle snap → open in Paint or Photos → crop to 1280×800.

### 5. Fill out the listing in the dashboard

1. Click **New Item**, upload the ZIP from step 3
2. After processing, click **Edit**
3. Navigate to **Store listing** tab:
   - **Name:** `No More Slop`
   - **Short description:** paste from `store/listing.md`
   - **Description:** paste the full description from `store/listing.md`
   - **Category:** `Productivity`
   - **Language:** `English (United States)`
   - **Icon:** upload `public/icons/icon-128.png`
   - **Screenshots:** upload the PNGs from step 4
4. Navigate to **Privacy practices** tab:
   - **Single purpose:** paste from `store/listing.md` (the "Single purpose statement" section)
   - For each permission asked about, paste the corresponding justification from `store/listing.md`
   - **Data collection:** select "I do not collect user data"
   - **Privacy policy:** paste the gist URL from step 2
4. Navigate to **Distribution** tab:
   - **Visibility:** Public (or Unlisted if you want to test with a link before going public)
   - **Regions:** All, unless you want to limit
5. Click **Save draft**, then **Submit for review**

## What to expect after submission

- Review takes **anywhere from a few hours to 2 weeks** — median for a new extension with `<all_urls>` is 3–7 days
- You'll get an email if approved or rejected
- If rejected, the email explains why; fix and resubmit (no fee)
- Common rejection triggers for this extension:
  - **Missing permission justification** — the justifications in `store/listing.md` cover every sensitive permission, so paste them all
  - **Privacy policy URL broken** — make sure the gist is public, not secret

## Version bumps

When shipping updates:
1. Bump `version` in `manifest.json` and `package.json`
2. Run `npm run build && node scripts/package.cjs`
3. Upload the new ZIP in the dashboard (same item, click **Package** → **Upload new package**)
4. Store-listing changes don't trigger a re-review; code changes do
