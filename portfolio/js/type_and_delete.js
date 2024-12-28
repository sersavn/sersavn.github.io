// List of words to cycle through, ending with "for Purpose"
const words = [
    " ",
    " with Structure",
    " with Perseverance",
    " with Programming",
    " with Machine Learning",
    " for the Impact."
];
/*
    "I solve problems",
    " with Structured Thinking",
    " with Perseverance and Innovation",
    " with Programming and Data Analysis",
    " with Machine Learning and AI",
    " for Global Impact."
    " because it's my purpose"
*/

// for the impact Rating
// for the purpose
//  because it's my path
//  for improvement
//  because it is my mission
// to push the limits
// to expand borders
// because it is who I am.

document.addEventListener('DOMContentLoaded', function() {
    const dynamicWord = document.getElementById("typing-word");
    let wordIndex = 0; // Index to track the current word
    let charIndex = 0; // Index to track the character being typed
    let isDeleting = false; // Flag to determine typing or deleting

    // Default typing parameters
    let typingSpeed = 90; // Speed of typing in ms
    let deletingSpeed = 45; // Speed of deleting in ms
    let pause = 900; // Pause before deleting or moving to the next word
    let charsAtOnce = 1; // Number of characters to type at once

    function updateSpeeds() {
        // Divide speeds and pause by 5
        typingSpeed = 40;
        deletingSpeed = 20;
        pause = 450;
        charsAtOnce = 5; // Number of characters to type at once
    }

    function typeAndDelete() {
        const currentWord = words[wordIndex];
        let currentLength = dynamicWord.textContent.length;

        if (!isDeleting) {
            // Typing the word by multiple characters at once
            charIndex += charsAtOnce;
            dynamicWord.textContent = currentWord.substring(0, charIndex);
            if (charIndex > currentWord.length) {
                if (wordIndex === words.length - 1) return; // Stop animation at the last word
                isDeleting = true; // Start deleting after typing the full word
                setTimeout(typeAndDelete, pause);
                return;
            }
        } else {
            // Deleting the word by multiple characters at once
            charIndex -= charsAtOnce;
            dynamicWord.textContent = currentWord.substring(0, charIndex);
            if (charIndex <= 0) {
                isDeleting = false; // Start typing the next word
                wordIndex++;
            }
        }

        // Recursive call with dynamic speed
        setTimeout(typeAndDelete, isDeleting ? deletingSpeed : typingSpeed);
    }

    // Event listeners for user interactions to change the speeds immediately
    document.addEventListener('click', updateSpeeds, { once: true });
    document.addEventListener('scroll', updateSpeeds, { passive: true, once: true });

    // Start the typing effect
    typeAndDelete();
});


