document.addEventListener("DOMContentLoaded", function() {
    // 1. Retrieve Elements
    const textarea = document.getElementById('jobDescription');

    // 2. Initialize Data Variables
    let allTags = [];
    let familiarTags = [];

    // 3. Paths to JSON Files
    const allTagsPath = 'portfolio/data/tags/all_tags.json';
    const familiarTagsPath = 'portfolio/data/tags/familiar_tags.json';

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
            anchor: tag.anchor.map(a => a.toLowerCase())
        }));

        // Convert tags in familiarTags to lowercase for consistent matching
        familiarTags = familiarTagsData.map(tag => tag.tag.toLowerCase());

        console.log('All Tags Loaded:', allTags);
        console.log('Familiar Tags Loaded:', familiarTags);

        // 6. Enable the Textarea After Data is Loaded
        textarea.disabled = false;
    }).catch(error => console.error('Error loading JSON files:', error));

    // 7. Debounce Function to Limit the Rate of Function Execution
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

    // 8. Function to Reset All Tag Classes
    function resetTags() {
        document.querySelectorAll('.tagcloud-tag').forEach(tag => {
            tag.classList.remove('known', 'unknown', 'extra'); // Remove all classes
            // console.log(`Resetting tag: ${tag.dataset.tag}`);
        });
    }

    /**
     * 9. Function to Highlight Tags Based on Matches
     * @param {Array} matchedTags - Array of matched tag objects from Fuse.js
     */
    function highlightTags(matchedTags) {
        console.log('Matched Tags:', matchedTags);

        matchedTags.forEach(tagObj => {
            const tagName = tagObj.tag.toLowerCase();
            // const anchorLower = tagObj.anchor.toLowerCase(); removed for the upd

            // Select the <li> element with the corresponding data-tag
            const tagElement = document.querySelector(`.tagcloud-tag[data-tag="${tagName}"]`);
            if (tagElement) {
                tagElement.classList.add('visible');
                if (familiarTags.includes(tagName)) {
                    tagElement.classList.add('known');
                    // console.log(`Tag "${tagName}" marked as 'known'.`);
                } else {
                    tagElement.classList.add('unknown');
                    // console.log(`Tag "${tagName}" marked as 'unknown'.`);
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
                }
            }
        });
    }

    /**
     * 10. Function to Extract N-grams from Job Description Based on Tag Anchor Word Count
     * @param {string} text - The job description text
     * @param {number} n - Number of words in the tag's anchor
     * @returns {Set} - Set of unique n-grams
     */
    function extractNGrams(text, n) {
        text = text.replace(/\*\*/g, "");
        const words = text.split(/\s+/).filter(word => word.length > 1);
        const nGrams = new Set();

        for (let i = 0; i <= words.length - n; i++) {
            const nGram = words.slice(i, i + n).join(' ').trim();
            if (nGram) {
                nGrams.add(nGram);
            }
        }

        return nGrams;
    }

    // 11. Main Function to Handle Input and Perform Tag Highlighting
    function handleInput() {
        let jobDescription = textarea.value.toLowerCase().trim();
        jobDescription = jobDescription.replace('-', ' ')
        console.log('Processing Job Description:', jobDescription);

        resetTags();

        // Create a map of word count to tags
        const tagsByWordCount = {};
        allTags.forEach(tag => {
            const wordCounts = tag.anchor.map(a => a.split(' ').length);
            tag.anchor.forEach(anchorOption => {
                const wordCount = anchorOption.split(' ').length;
                if (!tagsByWordCount[wordCount]) {
                    tagsByWordCount[wordCount] = [];
                }
                // Push an object containing the tag and its specific anchor option
                tagsByWordCount[wordCount].push({
                    tag: tag.tag,
                    anchorOption: anchorOption
                });
            });
        });

        console.log('Tags Organized by Word Count:', tagsByWordCount);

        const matchedAnchorsSet = new Set();

        // Iterate through tags grouped by word count
        for (const [wordCountStr, tagAnchors] of Object.entries(tagsByWordCount)) {
            const wordCount = parseInt(wordCountStr);
            if (isNaN(wordCount) || wordCount < 1) continue; // Skip invalid entries

            const nGrams = extractNGrams(jobDescription, wordCount);
            console.log(`Extracted ${wordCount}-grams:`, nGrams);

            if (wordCount >= 2) {
                // Create a temporary Fuse.js instance for fuzzy matching on multi-word anchors
                const tempFuse = new Fuse(Array.from(nGrams), {
                    threshold: 0.2, // Adjust threshold as needed
                    includeScore: true,
                    ignoreLocation: true,
                    minMatchCharLength: 1 // Prevents matching anchors with fewer than 1 characters
                });

                // Iterate through each tag-anchor pair in the current word count group
                tagAnchors.forEach(({ tag, anchorOption }) => {
                    const results = tempFuse.search(anchorOption, { limit: 1 });
                    if (results.length > 0 && results[0].score <= 0.2) { // Adjust threshold as needed
                        matchedAnchorsSet.add(tag.toLowerCase()); // Add the tag's main identifier
                        console.log(`Found Match: ${tag} (Score: ${results[0].score}) for Anchor: "${anchorOption}", JobDescr input: ${results[0].item}`);
                    }
                });
            } else if (wordCount === 1) {
                // Perform exact matching for single-word anchors
                tagAnchors.forEach(({ tag, anchorOption }) => {
                    // Use a regex to match whole words only
                    const regex = new RegExp(`\\b${anchorOption}\\b`, 'i');
                    if (regex.test(jobDescription)) {
                        matchedAnchorsSet.add(tag.toLowerCase());
                        console.log(`Found Exact Match: ${tag} for Anchor: "${anchorOption}"`);
                    }
                });
            }
        }

        const matchedAnchors = [...matchedAnchorsSet];
        console.log('Matched Anchors:', matchedAnchors);

        // Extract matched tags based on matched anchors
        const matchedTags = allTags.filter(tag => matchedAnchors.includes(tag.tag.toLowerCase()));
        console.log('Matched Tags:', matchedTags);

        if (matchedTags.length > 0) {
            highlightTags(matchedTags);
        } else {
            console.log('No matching tags found.');
        }
    }

    // Add input event listener with debouncing
    textarea.addEventListener('input', debounce(handleInput, 1000));
});

