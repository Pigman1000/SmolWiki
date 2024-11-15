const SearchModule = {
    init() {
        this.searchInput = document.getElementById('searchQuery');
        this.searchButton = document.getElementById('searchButton');
        this.aboutLink = document.getElementById('aboutLink');  // Added reference to the About link
        this.resultsContainer = document.getElementById('resultsContainer');
        this.bindEvents();
    },

    bindEvents() {
        // Handle Enter key press
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                ResultsModule.performSearch(this.searchInput.value);
            }
        });

        // Handle Search button click
        this.searchButton.addEventListener('click', () => {
            ResultsModule.performSearch(this.searchInput.value);
        });

        // Handle About link click
        this.aboutLink.addEventListener('click', (e) => {
            e.preventDefault();  // Prevent the default behavior of the link
            this.showAboutPage();
        });
    },

    showAboutPage() {
        this.resultsContainer.innerHTML = `
            <h2>About Simple Wiki</h2>
            <p>This is a simple Wiki application where content is fetched directly from Wikipedia using the Wikipedia API. You can search for any topic, and we will provide relevant Wikipedia articles for you.</p>
            <p>All the content shown here is sourced from Wikipedia, and this tool serves as a lightweight, quick access point for finding information.</p>
        `;
    }
};

const ResultsModule = {
    resultsContainer: document.getElementById('resultsContainer'),
    lastSearchQuery: '',

    showLoading() {
        this.resultsContainer.innerHTML = '<div class="loading">Looking for cool stuff... 🔍</div>';
    },

    showError(message) {
        this.resultsContainer.innerHTML = `<div class="error">
            <i class="fas fa-exclamation-circle"></i> ${message}
        </div>`;
    },

    async performSearch(query) {
        query = query.trim();
        this.lastSearchQuery = query;

        if (!query) {
            this.showError('Type something to search! 🤔');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=10&srprop=snippet`);
            const data = await response.json();

            if (!data.query?.search) {
                throw new Error('Invalid API response');
            }

            this.displayResults(data.query.search);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Oops! Something went wrong 😅 Try again?');
        }
    },

    displayResults(results) {
        if (results.length === 0) {
            this.showError('No results found 😢');
            return;
        }

        this.resultsContainer.innerHTML = results
            .map(result => {
                const { title, snippet, pageid } = result;
                return `
                    <div class="result-item" onclick="ContentModule.showContent('${pageid}', '${title}')">
                        <h3>${title}</h3>
                        <p>${snippet}...</p>
                    </div>
                `;
            })
            .join('');
    }
};

const ContentModule = {
    async showContent(pageid, title) {
        try {
            const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&pageids=${pageid}&format=json&origin=*`);
            const data = await response.json();
            const page = data.query.pages[pageid];

            ResultsModule.resultsContainer.innerHTML = `
                <div class="content-module">
                    <button class="back-button" onclick="ContentModule.goBack()">Back</button>
                    <h2>${title}</h2>
                    <div class="content-text">
                        <p>${page.extract}</p>
                    </div>
                    <a href="https://en.wikipedia.org/?curid=${pageid}" target="_blank" class="read-full-article">Read full article</a>
                </div>
            `;
        } catch (error) {
            console.error('Content fetch error:', error);
            ResultsModule.showError('Failed to load content. Please try again.');
        }
    },

    goBack() {
        ResultsModule.performSearch(ResultsModule.lastSearchQuery);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    SearchModule.init();
});