document.addEventListener('DOMContentLoaded', function() {
    const nav = document.querySelector('.nav');
    const jobDescr = document.querySelector('.jobdescr');
    const instruction = document.querySelector('.instruction');
    const tagCloud = document.querySelector('.tagcloud-wrapper');
    let animationsTriggered = false;

    function triggerFadeIn() {
        if (!animationsTriggered) {
            animationsTriggered = true; // Ensure animations only trigger once

            nav.style.animation = `fadeInNav 1.5s ease-out forwards`;
            jobDescr.style.animation = `fadeInJobDescr 1.5s ease-out forwards`;
            instruction.style.animation = `fadeInInstruction 5s ease-out forwards`;
            tagCloud.style.animation = `fadeInTagcloud 5s ease-out forwards`;
        }
    }

    // Event listeners for user interactions to trigger the animation immediately
    document.addEventListener('click', triggerFadeIn, { once: true });
    document.addEventListener('scroll', triggerFadeIn, { passive: true, once: true });

    // Set a timeout to trigger the animations after the CSS-defined delays if no interaction has occurred
    setTimeout(() => {
        if (!animationsTriggered) {
            triggerFadeIn();
        }
    }, 25000); // Use the maximum of both delays or the specific delay mentioned in requirements
});

