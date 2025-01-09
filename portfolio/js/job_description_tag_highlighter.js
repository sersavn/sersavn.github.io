document.addEventListener("DOMContentLoaded", function() {
    // 1. Retrieve Elements
    const textarea = document.getElementById('jobDescription');

    // 2. Initialize Data Variables
    let allTags = [];
    let familiarTags = [];

    // 3. Paths to JSON Files
    const allTagsPath = 'portfolio/data/all_tags.json';
    const familiarTagsPath = 'portfolio/data/familiar_tags.json';

    // 4. Initialize Fuse.js Variable (Retained but Unused)
    let fuse;

    // 5. Fetch JSON Data
    Promise.all([
        fetch(allTagsPath).then(response => {
            if (!response.ok) throw new Error(`Failed to load ${allTagsPath}`);
            return response.json();
        }),
        fetch(familiarTagsPath).then(response => {
            if (!response.ok) throw new Error(`Failed to load ${familiarTagsPath}`);
            return response.json();
        })
    ]).then(([allTagsData, familiarTagsData]) => {
        // Convert all anchors in allTags to lowercase for consistent matching
        allTags = allTagsData.map(tag => ({
            ...tag,
            anchor: tag.anchor.toLowerCase()
        }));

        // Convert tags in familiarTags to lowercase for consistent matching
        familiarTags = familiarTagsData.map(tag => tag.tag.toLowerCase());

        // 6. Initialize Fuse.js with Appropriate Settings (Retained but Unused)
        fuse = new Fuse(allTags, {
            keys: ['anchor'],
            threshold: 0.5, // Adjust threshold as needed
            includeScore: true,
            ignoreLocation: true,
            minMatchCharLength: 4 // Ensures minimum character length for matches
        });

        console.log('All Tags Loaded:', allTags);
        console.log('Familiar Tags Loaded:', familiarTags);

        // 7. Enable the Textarea After Data is Loaded
        textarea.disabled = false;
    }).catch(error => console.error('Error loading JSON files:', error));

    // 8. Debounce Function to Limit the Rate of Function Execution
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Function to Reset All Tag Classes
     */
    function resetTags() {
        document.querySelectorAll('.tagcloud-tag').forEach(tag => {
            tag.classList.remove('known', 'unknown', 'extra'); // Remove all classes
            console.log(`Resetting tag: ${tag.dataset.tag}`);
        });
    }

    /**
     * Function to Highlight Tags Based on Matches
     * @param {Array} matchedTags - Array of matched tag objects from Fuse.js
     */
    function highlightTags(matchedTags) {
        console.log('Matched Tags:', matchedTags);

        matchedTags.forEach(tagObj => {
            const tagName = tagObj.tag.toLowerCase();
            const anchorLower = tagObj.anchor.toLowerCase();

            // Select the <li> element with the corresponding data-tag
            const tagElement = document.querySelector(`.tagcloud-tag[data-tag="${tagName}"]`);
            if (tagElement) {
                tagElement.classList.add('visible'); // GPT HELP! That line makes highlighting for matched tags obsolete!
                if (familiarTags.includes(tagName)) {
                    tagElement.classList.add('known');
                    console.log(`Tag "${tagName}" marked as 'known'.`);
                } else {
                    tagElement.classList.add('unknown');
                    console.log(`Tag "${tagName}" marked as 'unknown'.`);
                }
            } else {
                console.warn(`Tag element not found for tag: ${tagName}`);
            }
        });

        // Handle 'extra' tags: Tags in familiarTags not present in matchedTags
        familiarTags.forEach(familiarTag => {
            const isMatched = matchedTags.some(tagObj => tagObj.tag.toLowerCase() === familiarTag);
            if (!isMatched) {
                const tagElement = document.querySelector(`.tagcloud-tag[data-tag="${familiarTag}"]`);
                if (tagElement) {
                    tagElement.classList.add('visible');
                    tagElement.classList.add('extra');
                    console.log(`Tag "${familiarTag}" marked as 'extra'.`);
                }
            }
        });
    }

    /**
     * Function to Extract N-grams from Job Description Based on Tag Anchor Word Count
     * @param {string} text - The job description text
     * @param {number} n - Number of words in the tag's anchor
     * @returns {Set} - Set of unique n-grams
     */
    function extractNGrams(text, n) {
        text = text.replace(/\*\*/g, "");
        const words = text.split(/\s+/).filter(word => word.length > 2);
        const nGrams = new Set();

        for (let i = 0; i <= words.length - n; i++) {
            const nGram = words.slice(i, i + n).join(' ').trim();
            if (nGram) {
                nGrams.add(nGram);
            }
        }

        return nGrams;
    }

    /**
     * Main Function to Handle Input and Perform Tag Highlighting
     */
    function handleInput() {
        let jobDescription = textarea.value.toLowerCase().trim();
        console.log('Processing Job Description:', jobDescription);

        if (!jobDescription || jobDescription.length < 3) { // Minimum length to avoid overmatching
            console.log('Job description is too short or empty, resetting tags...');
            resetTags();
            return;
        }

        resetTags();

        // For performance, create a map of word count to tags
        const tagsByWordCount = {};
        allTags.forEach(tag => {
            const wordCount = tag.anchor.split(' ').length;
            if (!tagsByWordCount[wordCount]) {
                tagsByWordCount[wordCount] = [];
            }
            tagsByWordCount[wordCount].push(tag);
        });

        console.log('Tags Organized by Word Count:', tagsByWordCount);

        const matchedAnchorsSet = new Set();

        // Iterate through tags grouped by word count
        for (const [wordCount, tags] of Object.entries(tagsByWordCount)) {
            const n = parseInt(wordCount);
            if (isNaN(n) || n < 1) continue; // Skip invalid entries

            const nGrams = extractNGrams(jobDescription, n);
            console.log(`Extracted ${n}-grams:`, nGrams);

            // **Modified Matching Process Starts Here**

            // Initialize Fuse.js with the extracted N-grams
            const tempFuse = new Fuse(Array.from(nGrams), {
                threshold: 0.4, // Adjust threshold as needed
                includeScore: true,
                ignoreLocation: true,
                minMatchCharLength: 4 // Ensures minimum character length for matches
            });

            // Iterate through each tag in the current word count group
            tags.forEach(tag => {
                console.log(`Searching for Tag: "${tag.anchor}"`);
                const results = tempFuse.search(tag.anchor, { limit: 1 });
                if (results.length > 0 && results[0].score <= 0.5) { // Adjust threshold as needed
                    matchedAnchorsSet.add(tag.anchor.toLowerCase());
                    console.log(`Found Match: ${tag.anchor} (Score: ${results[0].score})`);
                }
            });

            // **Modified Matching Process Ends Here**
        }

        const matchedAnchors = [...matchedAnchorsSet];
        console.log('Matched Anchors:', matchedAnchors);

        // Extract matched tags based on matched anchors
        const matchedTags = allTags.filter(tag => matchedAnchors.includes(tag.anchor.toLowerCase()));
        console.log('Matched Tags:', matchedTags);

        if (matchedTags.length > 0) {
            highlightTags(matchedTags);
        } else {
            console.log('No matching tags found.');
        }
    }

    // Add input event listener with debouncing
    textarea.addEventListener('input', debounce(handleInput, 500));
});

