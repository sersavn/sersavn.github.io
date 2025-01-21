const words = [
    " ",
    " with Structure",
    " with Perseverance",
    " with Programming",
    " with Machine Learning",
    " for the Impact."
];

document.addEventListener('DOMContentLoaded', function() {
    const dynamicWord = document.getElementById("typing-word");
    let wordIndex = 0; // Index to track the current word
    let charIndex = 0; // Index to track the character being typed
    let isDeleting = false; // Flag to determine typing or deleting
    let skipToLastWord = false; // Flag to skip to the last word on interaction

    // Default typing parameters
    const typingSpeed = 90; // Speed of typing in ms
    const deletingSpeed = 45; // Speed of deleting in ms
    const pause = 900; // Pause before deleting or moving to the next word

    function typeAndDelete() {
        if (skipToLastWord && wordIndex !== words.length - 1) {
            // Skip directly to the last word
            wordIndex = words.length - 2; // Set to the second last to proceed to last
            isDeleting = true; // Start deleting to trigger last word typing
        }

        const currentWord = words[wordIndex];
        const isLastWord = wordIndex === words.length - 1;

        if (!isDeleting) {
            // Typing the word
            dynamicWord.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;

            if (charIndex === currentWord.length) {
                // If it's the last word, stop typing further
                if (isLastWord) {
                    return;
                }
                isDeleting = true;
                setTimeout(typeAndDelete, pause);
            } else {
                setTimeout(typeAndDelete, typingSpeed);
            }
        } else {
            // Deleting the word
            dynamicWord.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;

            if (charIndex === 0) {
                wordIndex++;
                isDeleting = false;
                setTimeout(typeAndDelete, typingSpeed);
            } else {
                setTimeout(typeAndDelete, deletingSpeed);
            }
        }
    }

    // Event listeners for user interactions to switch to typing the last word
    function handleInteraction() {
        skipToLastWord = true; // Set flag to move to the last word after current
        if (charIndex === 0 && wordIndex === 0) { // Check if typing hasn't started yet
            typeAndDelete(); // Initiate typing immediately if no action has started
        }
    }

    document.addEventListener('click', handleInteraction);
    document.addEventListener('scroll', handleInteraction, { passive: true });

    // Start the typing effect
    typeAndDelete();
});

