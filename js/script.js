// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Pick one space fact to show each time the page loads.
const spaceFacts = [
	'Sunlight takes about 8 minutes and 20 seconds to reach Earth.',
	'Venus takes about 243 Earth days to spin once, longer than its year.',
	'Jupiter’s Great Red Spot is a storm larger than Earth.',
	'Mars is home to Olympus Mons, the tallest volcano in the solar system.',
	'Saturn’s average density is lower than water’s.'
];
const randomFactIndex = Math.floor(Math.random() * spaceFacts.length);
document.getElementById('spaceFact').textContent = spaceFacts[randomFactIndex];

const loadButton = document.getElementById('loadImages');
const gallery = document.getElementById('gallery');
const imageModal = document.getElementById('imageModal');
const closeModalButton = document.getElementById('closeModal');
const modalImage = document.getElementById('modalImage');
const modalDate = document.getElementById('modalDate');
const modalTitle = document.getElementById('modalTitle');
const modalExplanation = document.getElementById('modalExplanation');

// Show a short message in the gallery while loading or when there are no results.
function showMessage(message) {
	const paragraph = document.createElement('p');
	paragraph.className = 'placeholder';
	paragraph.textContent = message;
	gallery.replaceChildren(paragraph);
}

// Fill in the dialog with this APOD entry and open it.
function openImageModal(item) {
	modalImage.src = item.imageUrl;
	modalImage.alt = item.title;
	modalDate.textContent = item.date;
	modalTitle.textContent = item.title;
	modalExplanation.textContent = item.explanation;
	imageModal.showModal();
}

// Build one gallery card from an APOD result.
function createGalleryItem(item) {
	const card = document.createElement('article');
	card.className = 'gallery-item';

	const openButton = document.createElement('button');
	openButton.type = 'button';
	openButton.className = 'gallery-item-trigger';
	openButton.setAttribute('aria-label', `View ${item.title}, ${item.date}`);
	openButton.addEventListener('click', () => openImageModal(item));

	const title = document.createElement('h2');
	title.textContent = item.title;
	openButton.append(title);

	const date = document.createElement('p');
	date.className = 'gallery-item-date';
	date.textContent = item.date;
	openButton.append(date);

	const image = document.createElement('img');
	image.src = item.imageUrl;
	image.alt = item.title;
	image.loading = 'lazy';
	openButton.append(image);
	card.append(openButton);

	if (item.videoUrl) {
		// Some APOD entries include a video as well as a preview image.
		const videoLink = document.createElement('a');
		videoLink.href = item.pageUrl;
		videoLink.textContent = 'Watch this APOD video on NASA Science';
		videoLink.target = '_blank';
		videoLink.rel = 'noopener noreferrer';
		card.append(videoLink);
	}

	return card;
}

// Request every APOD entry between the selected dates and show the results.
async function loadSpaceImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate || startDate > endDate) {
		showMessage('Choose a valid date range. The end date must be on or after the start date.');
		return;
	}

	// Ask our local server for the NASA Science APOD entries in this range.
	const query = new URLSearchParams({
		start_date: startDate,
		end_date: endDate
	});

	loadButton.disabled = true;
	showMessage('🔄 Loading space photos...');

	try {
		const response = await fetch(`/api/apod?${query}`);
		const contentType = response.headers.get('content-type') || '';

		if (!contentType.includes('application/json')) {
			throw new Error('Start the app with `npm start` and open the forwarded port 4173 in VS Code. A static preview cannot load APOD data.');
		}

		const apodItems = await response.json();

		if (!response.ok) {
			throw new Error(apodItems.error || 'NASA could not load those images. Try again.');
		}

		const cards = apodItems.map(createGalleryItem);

		if (cards.length === 0) {
			showMessage('No space images were found for those dates.');
			return;
		}

		gallery.replaceChildren(...cards);
	} catch (error) {
		showMessage(error.message || 'Something went wrong while loading the space images.');
	} finally {
		loadButton.disabled = false;
	}
}

loadButton.addEventListener('click', loadSpaceImages);
closeModalButton.addEventListener('click', () => imageModal.close());

// Let users close the dialog by clicking outside its content.
imageModal.addEventListener('click', (event) => {
	if (event.target === imageModal) {
		imageModal.close();
	}
});
