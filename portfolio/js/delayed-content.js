// Function to show delayed PaperMod content
function showDelayedContent() {
  const delayedWrapper = document.getElementById('delayed-papermod-content-wrapper');
  if (delayedWrapper) {
    delayedWrapper.classList.add('show-delayed-content');
  }
}

// Set a 10-second delay before showing the content
setTimeout(showDelayedContent, 10000); // 10000 milliseconds = 10 seconds

