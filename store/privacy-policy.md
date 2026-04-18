# Privacy Policy for No More Slop

**Last updated:** April 17, 2026

No More Slop is a browser extension that helps users stay focused by blocking short-form and algorithmic-feed content. This privacy policy explains what the extension does with data.

## Summary

**No More Slop does not collect, transmit, or sell any personal data.** All state is stored locally in your browser. Nothing is sent to any server operated by the developer.

## What the extension stores locally

Stored in your browser's local `chrome.storage.local` on your own device:

- Your current focus-session state (active/inactive, intent text, start time, block count)
- Your platform toggle preferences (which sites are blocked)
- Your break state (duration, end time)
- Your theme preference (light/dark)
- Your strict-mode preference

The extension also uses `sessionStorage` briefly to carry a toast message across a same-origin redirect. This data is cleared automatically when the tab closes.

## What the extension does on the sites you visit

Content scripts run on YouTube, Instagram, TikTok, Snapchat, X (Twitter), Reddit, and Google Search to:

- Hide short-form video shelves and algorithmic feeds via CSS
- Redirect blocked URLs (e.g. `youtube.com/shorts/*`) to non-feed destinations
- Show an in-page toast confirming a block

None of the page content, URLs, or interactions are logged, stored, or transmitted off your device.

## Why the extension requests the permissions it does

- **storage** — remember your settings across browser sessions (local only, never synced to any server).
- **tabs** and **webNavigation** — detect navigations to blocked URLs so they can be intercepted.
- **scripting** plus `<all_urls>` host permission — inject the in-page toast overlay into destination pages after a cross-site redirect (e.g. when bouncing you back from TikTok to whatever page you were on before).
- **alarms** — schedule the end of your break timer so blocks snap back when the timer runs out.

## Third parties

The extension does not communicate with any third-party servers, analytics platforms, or tracking services.

The welcome page includes static public cryptocurrency receive addresses and a Buy Me a Coffee link. These are displayed for voluntary tipping only. The extension does not track whether you click them or whether you send tips.

## Changes

If the policy changes, the updated version will be committed to the repository at `store/privacy-policy.md` and this document's "Last updated" date will change.

## Contact

Open an issue at https://github.com/bwaeden/no-more-slop/issues or email via the Chrome Web Store listing contact link.
