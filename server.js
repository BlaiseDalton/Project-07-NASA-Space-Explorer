const express = require('express');
const { load } = require('cheerio');
const path = require('node:path');

const app = express();
const port = process.env.PORT || 4173;
const earliestDate = '1995-06-16';
const maximumRangeDays = 31;

app.use(express.static(__dirname, { dotfiles: 'ignore' }));

function parseDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
		return null;
	}

	const date = new Date(`${value}T00:00:00.000Z`);
	return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
		? null
		: date;
}

async function getApodForDate(date) {
	const shortDate = date.slice(2).replaceAll('-', '');
	const response = await fetch(`https://science.nasa.gov/apod/?date=${shortDate}`);

	if (!response.ok) {
		throw new Error(`NASA could not load the APOD entry for ${date}.`);
	}

	const html = await response.text();
	const $ = load(html);
	const pageTitle = $('meta[property="og:title"]').attr('content') || '';
	const title = pageTitle
		.replace(/^APOD:\s*/, '')
		.replace(/^\d{4}\s+[A-Za-z]+\s+\d+\s*-\s*/, '')
		.replace(/\s*-\s*Nasa Science$/i, '')
		.trim();
	const publishedDate = $('meta[property="article:published_time"]').attr('content');
	const imageUrl = $('meta[property="og:image"]').attr('content');
	const videoUrl = $('meta[property="og:video"]').attr('content') || '';
	const explanationLabel = $('strong')
		.filter((_, element) => $(element).text().trim().replace(/:$/, '') === 'Explanation')
		.first();
	const explanation = explanationLabel.length
		? explanationLabel.parent().text().replace(/^\s*Explanation:\s*/, '').replace(/\s+/g, ' ').trim()
		: '';

	if (!title || !imageUrl || !explanation) {
		throw new Error(`NASA's APOD page for ${date} did not contain all expected information.`);
	}

	return {
		title,
		date: publishedDate ? publishedDate.slice(0, 10) : date,
		pageUrl: response.url,
		imageUrl,
		videoUrl,
		explanation
	};
}

app.get('/api/apod', async (request, response) => {
	const { start_date: startDate, end_date: endDate } = request.query;
	const start = parseDate(startDate);
	const end = parseDate(endDate);
	const today = new Date().toISOString().slice(0, 10);

	if (!start || !end || startDate < earliestDate || endDate > today || start > end) {
		return response.status(400).json({ error: 'Choose a valid date range from June 16, 1995 through today.' });
	}

	const dates = [];
	for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
		dates.push(date.toISOString().slice(0, 10));
	}

	if (dates.length > maximumRangeDays) {
		return response.status(400).json({ error: `Choose a range of ${maximumRangeDays} days or fewer.` });
	}

	try {
		// NASA's APOD archive accepts one date at a time, so fetch each day in the range.
		const items = await Promise.all(dates.map(getApodForDate));
		return response.json(items);
	} catch (error) {
		return response.status(502).json({ error: error.message || 'Unable to load NASA APOD data.' });
	}
});

app.listen(port, '0.0.0.0', () => {
	console.log(`Space Explorer is running at http://localhost:${port}`);
});