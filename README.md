# Stats for Spotify

A static, browser-based Spotify listening dashboard. No server-side build is required.

## Run locally

Serve this directory over HTTP (for example, with VS Code Live Server) and open the site at the URL you register as a Spotify redirect URI. The app uses Spotify Authorization Code with PKCE and stores its session and listening library in the browser.

## Deploy to GitHub Pages

1. Push this directory to a GitHub repository on the `main` or `master` branch.
2. In the repository, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source.
3. Add the deployed site URL to the redirect URI allow-list for the Spotify app. For a project site, this is usually `https://<owner>.github.io/<repository>/`.
4. Open the deployed site and connect Spotify. The app derives its OAuth redirect URI from the current page URL, so register that exact URL, including its trailing slash and any repository path.

The workflow at `.github/workflows/pages.yml` publishes the repository root as a static site whenever `main` or `master` is updated, and can also be started manually from the Actions tab.

## Notes

- The page is served over HTTPS by GitHub Pages. Spotify must allow the exact deployed redirect URI in its app settings.
- Anime.js and JSZip are loaded from pinned CDN URLs in `Index.html`; the app remains usable without Anime.js, with motion disabled when the browser requests reduced motion.
- IndexedDB and local storage are browser-local. They are not shared across browsers or devices.
