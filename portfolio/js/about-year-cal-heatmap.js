import { getTogglTimeEntries } from './about-cache.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Script loaded and DOMContentLoaded event fired.');
    
    // Fetch data using the shared cache
    const result = await getTogglTimeEntries()
    const csvData = result.data;
    
    // Initialize the Cal-Heatmap instance
    const cal = new CalHeatmap();
    
    // Handle fetch failures
    cal.on('fetchFail', (error) => {
        console.error('Data fetch failed:', error);
    });

    // Optional: Handle successful data fetch
    cal.on('dataReady', () => {
        console.log('Data successfully loaded and ready for rendering.');
    });
    let selectedDate = null;

    // Function to format the timestamp to 'YYYY-MM-DD'
    function formatDate(timestamp) {
        return new Date(timestamp).toISOString().split('T')[0];
    }
    
    let lastLockedElement = null; // Store the last locked element

    cal.on('click', (event, timestamp, value) => {
        const formattedDate = formatDate(timestamp);

        if (selectedDate === formattedDate) {
            // If the clicked date is already selected, unlock it
            selectedDate = null;
            if (lastLockedElement) {
                lastLockedElement.classList.remove('selected');
                lastLockedElement = null;
            }
            console.log(`Unlocked date: ${formattedDate}`);
        } else {
            // If there's a previously locked date, remove the 'selected' class
            if (lastLockedElement) {
                lastLockedElement.classList.remove('selected');
            }

            // Lock the new selected date
            selectedDate = formattedDate;
            lastLockedElement = event.target; // Update the last locked element reference
            lastLockedElement.classList.add('selected');
            console.log(`Locked date: ${formattedDate}`);
            // Call the function with the selected date
            exampleBarPlotUsage(formattedDate);
        }
    });

    // Configure and paint the heatmap
    cal.paint(
        {
            data: {
                // source: encodeURIComponent(csvData),
                source: 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData),
                type: 'csv',
                x: d => {
                    const utcTimestamp = +d['start_timestamp'] * 1000; // Convert to milliseconds
                    const localOffsetHours = +d['local_timezone']; // Extract GMT offset (in hours)
                    const localOffsetMilliseconds = localOffsetHours * 60 * 60 * 1000; // Convert hours to milliseconds
                    return new Date(utcTimestamp + localOffsetMilliseconds); // Adjust to local time
                },
                y: d => {
                    const duration = +d['duration'] / 3600; // Convert to hours
                    return duration > 0 ? duration : 0;    // Only include positive durations
                },
                groupY: 'sum',
                defaultValue: 0,
            },

            // Configure the date range and highlighting
            date: { 
                start: new Date('2025-01-01'),
                locale: {
                    weekStart: 1,
                },
                timezone: 'Asia/Bangkok' 
                //highlight: new Date(), // Current date highlight
            },
            range: 12, // Number of domains (months)
            domain: {
                type: 'month',
                gutter: 2,
                label: { text: 'MMM', textAlign: 'start', position: 'top' },
            },
            subDomain: {type: 'day', radius: 2, width: 16, height: 16, gutter: 2},
            scale: {
                color: {
                    type: 'threshold', // type: 'linear',
                    range: ['#333333', '#3a4a4a', '#449a9a', '#4edede', '#00ffcc'],
                    domain: [2, 4, 6, 8],
                },
            },
            itemSelector: '#year-cal-heatmap',// Ensure this matches your HTML
            
        },
        [
            [
                Tooltip,
                {
                    text: function (date, value, dayjsDate) {
                        const dateStr = dayjsDate.format('YYYY-MM-DD');
                        // Call exampleBarPlotUsage only if the date is not locked
                        if (!selectedDate || selectedDate === dateStr) {
                            exampleBarPlotUsage(dateStr);
                        }
                        return (
                            (value ? value.toFixed(2) : 'No') +
                            ' hours tracked on ' +
                            dayjsDate.format('dddd, MMMM D, YYYY')
                        );
                    },
                },
            ],
            [
                LegendLite,
                {
                    includeBlank: false,
                    itemSelector: '#year-cal-heatmap-legend',
                    radius: 2,
                    width: 16,
                    height: 16,
                    gutter: 2,
                    title: 'Hours Worked',
                },
            ],
            [
                CalendarLabel,
                {
                    width: 30,
                    textAlign: 'start',
                    text: () => ['', 'Tue', '', 'Thu', '', 'Sat', ''],
                    padding: [25, 0, 0, 0],
                },
            ],
        ]
    );
    
    // Dynamically create the DOM elements for the legend
    const legendContainer = document.createElement('div');
    legendContainer.className = 'legend-container';

    // "Less" label
    const lessSpan = document.createElement('span');
    lessSpan.className = 'less-label';
    lessSpan.textContent = 'Less';
    legendContainer.appendChild(lessSpan);

    // Legend div
    const legendDiv = document.createElement('div');
    legendDiv.id = 'year-cal-heatmap-legend';
    legendDiv.className = 'legend-div';
    legendContainer.appendChild(legendDiv);

    // "More" label
    const moreSpan = document.createElement('span');
    moreSpan.className = 'more-label';
    moreSpan.textContent = 'More';
    legendContainer.appendChild(moreSpan);

    // Append the legend to the heatmap container
    const heatmapContainer = document.getElementById('year-cal-heatmap');
    if (heatmapContainer && heatmapContainer.parentNode) {
        heatmapContainer.parentNode.insertBefore(legendContainer, heatmapContainer.nextSibling);
    } else {
        console.error('Heatmap container (#year-cal-heatmap) not found in the DOM.');
    }

});

