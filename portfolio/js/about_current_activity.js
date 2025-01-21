// Update the clock and current activity display every second
function updateAllDisplays() {
    updateClock();
    updateActivityDisplay(data);
}

let data = null; // To hold CSV data globally

// Update the local time display
function updateClock() {
    const now = new Date();
    const localTimeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); // 24-hour format local time
    document.getElementById('time-display').textContent = localTimeString;
}

// Load current activity from time_entries.csv and initialize data
async function loadCurrentActivity() {
    try {
        const response = await fetch('/portfolio/data/dummy/time_entries.csv');
        const csvText = await response.text();
        const rows = csvText.trim().split('\n');
        const headers = rows[0].split(',');
        data = rows.slice(1).map(row => {
            const values = row.split(',');
            return headers.reduce((acc, header, index) => {
                acc[header.trim()] = values[index] ? values[index].trim() : '';
                return acc;
            }, {});
        });
        
        updateAllDisplays(); // Initial update of all displays
        setInterval(updateAllDisplays, 1000); // Set interval to update all displays every second

    } catch (error) {
        console.error('Error loading current activity:', error);
        document.getElementById('activity-display').textContent = 'Error loading activity.';
    }
}

function updateActivityDisplay() {
    // Make sure data is loaded
    if (data) {
        // Find the row with an empty stop value
        const currentActivity = data.find(entry => !entry.stop);
        if (currentActivity) {
            const startTime = parseInt(currentActivity.start_timestamp);
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
}

loadCurrentActivity();

