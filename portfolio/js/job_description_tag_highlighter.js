document.addEventListener("DOMContentLoaded", function() {
    const textarea = document.getElementById('jobDescription');
    const tags = document.querySelectorAll('.tagcloud-tag a');

    // Initialize an empty array for familiarTags; it will be filled from the JSON file
    let familiarTags = [];

    // Fetch familiar tags from the JSON file
    fetch('portfolio/data/familiar_tags.json')
        .then(response => response.json())
        .then(data => {
            // Extract the 'tag' from each item and store it in the familiarTags array
            familiarTags = data.map(item => item.tag);
            console.log('Familiar Skills loaded:', familiarTags);
        })
        .catch(error => {
            console.error('Error loading familiar tags:', error);
        });

    document.getElementById('jobDescription').addEventListener('input', function() {
        console.log('Job Description:', this.value);
    });

    // Function to reset all tags to default color
    tags.forEach(tag => {
        tag.addEventListener('click', function(event) {
            const tagName = tag.closest('.tagcloud-tag').dataset.tag; // Get tag name from parent tag
        });
    });

    /**
     * Reset all tags to their default color and state.
     */
    function resetTags() {
        document.querySelectorAll('.tagcloud-tag').forEach(tag => {
            tag.classList.remove('known', 'unknown', 'extra'); // Remove all color classes
            console.log(`Resetting tag: ${tag.dataset.tag}`); // Debugging log
        });
    }
    
    /**
     * Highlight tags based on the content of the job description
     */
    function highlightTags() {
        const jobDescription = document.getElementById('jobDescription').value.trim();
        
        // 🛠️ If the input is empty, reset the tags and stop execution
        if (!jobDescription) {
            console.log('Job description is empty, resetting tags...');
            resetTags();
            return;
        }

        const jobdescr_words = jobDescription.toLowerCase().split(/\s+/).map(word => word.trim());
        
        document.querySelectorAll('.tagcloud-tag').forEach(tag => {
            const tagName = tag.dataset.tag;
            console.log('Checking tag:', tagName); // Log each tag being checked
            tag.classList.remove('known', 'unknown', 'extra');
            
            console.log('-> jobdescr_words: ', jobdescr_words);
            console.log('-> jobDescription: ', jobDescription);
            
            if (familiarTags.includes(tagName) && jobdescr_words.includes(tagName)) {
                tag.classList.add('known');
            } else if (!familiarTags.includes(tagName) && jobdescr_words.includes(tagName)) {
                tag.classList.add('unknown');
            } else if (familiarTags.includes(tagName) && !jobdescr_words.includes(tagName)) {
                tag.classList.add('extra');
            }
        });
    }

    let debounceTimer;
    textarea.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(highlightTags, 500); // Delay of 500ms
    });
});

