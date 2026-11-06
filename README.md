# Project 7: NASA Space Explorer
Explore NASA's Astronomy Picture of the Day (APOD) entries by date range.

The gallery loads titles, dates, explanations, and images from [NASA Science's APOD pages](https://science.nasa.gov/apod/). No NASA API key is needed. NASA's website does not allow browser pages to read its article pages directly, so a small local Node.js server fetches and parses those pages for the gallery.

## Run the App
1. Install [Node.js](https://nodejs.org/) if it is not already installed.
2. In this project folder, run `npm install` once.
3. Run `npm start` and open the forwarded port `4173` in VS Code.
4. Choose a date range and select **Get Space Images**.

The server allows ranges of up to 31 days so it can fetch each matching APOD page without overwhelming NASA's website.
