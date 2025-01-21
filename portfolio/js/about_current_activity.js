import { getTogglTimeEntries } from './about-cache.js';

// Update the clock and current activity display every second
function updateAllDisplays() {
    updateClock();
    updateActivityDisplay();
}

// Function to hold the current activity data
let currentActivity = null;

// Update the local time display
function updateClock() {
    const now = new Date();
    const localTimeString = now.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    }); // 24-hour format local time
    document.getElementById('time-display').textContent = localTimeString;
}

// Load current activity using the shared cache
async function loadCurrentActivity() {
    try {
        // Fetch CSV data using the shared cache
        const csvText = await getTogglTimeEntries();
        
        // Parse the CSV data
        const rows = csvText.trim().split('\n');
        const headers = rows[0].split(',').map(header => header.trim());
        const data = rows.slice(1).map(row => {
            const values = row.split(',').map(value => value.trim());
            return headers.reduce((acc, header, index) => {
                acc[header] = values[index] ? values[index] : '';
                return acc;
            }, {});
        });
        
        // Find the current activity (row with an empty stop value)
        currentActivity = data.find(entry => !entry.stop);
        
        updateAllDisplays(); // Initial update of all displays
        
        // Update displays every second
        setInterval(updateAllDisplays, 1000);
    
    } catch (error) {
        console.error('Error loading current activity:', error);
        document.getElementById('activity-display').textContent = 'Error loading activity.';
    }
}

// Update the activity display based on the current activity data
function updateActivityDisplay() {
    // Make sure currentActivity is loaded
    if (currentActivity) {
        const startTime = parseInt(currentActivity.start_timestamp, 10);
        const now_utc = Math.floor(Date.now() / 1000); // UTC timestamp in seconds
        const durationInSeconds = now_utc - startTime;

        const hours = Math.floor(durationInSeconds / 3600);
        const minutes = Math.floor((durationInSeconds % 3600) / 60);
        const seconds = durationInSeconds % 60;

        const activityText = `Engaged in ${currentActivity.project_name} – ${currentActivity.description} for ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('activity-display').textContent = activityText;
    } else {
        document.getElementById('activity-display').textContent = 'Currently not tracking';
    }
}

// Initialize the current activity display on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCurrentActivity();
});

