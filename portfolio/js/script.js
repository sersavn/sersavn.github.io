document.addEventListener("DOMContentLoaded", function() {
    const textarea = document.getElementById('jobDescription');
    const tags = document.querySelectorAll('.tagcloud-tag a');
    
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

        const words = jobDescription.toLowerCase().split(/\s+/).map(word => word.trim());
        
        document.querySelectorAll('.tagcloud-tag').forEach(tag => {
            const tagName = tag.dataset.tag;
            console.log('Checking tag:', tagName); // Log each tag being checked
            tag.classList.remove('known', 'unknown', 'extra');

            if (familiarSkills.includes(tagName) && words.includes(tagName)) {
                tag.classList.add('known');
            } else if (!familiarSkills.includes(tagName) && words.includes(tagName)) {
                tag.classList.add('unknown');
            } else if (familiarSkills.includes(tagName) && !words.includes(tagName)) {
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

