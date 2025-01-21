import { getTogglTimeEntries } from './about-cache.js';


/**
 * Parses CSV data into an array of objects.
 *
 * @param {string} csvText - The CSV file content as a string.
 * @returns {Array<Object>} - Array of objects representing each row.
 */
function parseCSV(csvText) {
    const [headerLine, ...lines] = csvText.trim().split('\n');
    const headers = headerLine.split(',').map(header => header.trim());

    return lines.map(line => {
        const values = line.split(',').map(value => value.trim());
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {});
    });
}

/**
 * Calculates the overlapping minutes within a specific hour.
 *
 * @param {Date} entryStart - Start time of the activity.
 * @param {Date} entryEnd - End time of the activity.
 * @param {number} hour - The hour to calculate overlap for (0-23, UTC).
 * @returns {Object|null} - Object with y_start and y_end fractions or null if no overlap.
 */
function getOverlapInHour(entryStart, entryEnd, hour) {
    if (!(entryStart instanceof Date) || !(entryEnd instanceof Date)) {
        throw new TypeError("entryStart and entryEnd must be Date instances.");
    }
    if (isNaN(entryStart) || isNaN(entryEnd)) {
        throw new RangeError("entryStart and entryEnd must be valid dates.");
    }
    if (entryStart > entryEnd) {
        throw new RangeError("entryStart cannot be later than entryEnd.");
    }

    // Define the start and end of the specified hour in UTC
    const hourStart = new Date(entryStart);
    hourStart.setUTCHours(hour, 0, 0, 0);

    const hourEnd = new Date(hourStart);
    hourEnd.setUTCHours(hour + 1, 0, 0, 0);

    // Calculate the overlap between the activity and the hour
    const overlapStart = new Date(Math.max(entryStart.getTime(), hourStart.getTime()));
    const overlapEnd = new Date(Math.min(entryEnd.getTime(), hourEnd.getTime()));

    if (overlapStart >= overlapEnd) {
        return null; // No overlap
    }

    const startMinutes = overlapStart.getUTCMinutes() + overlapStart.getUTCSeconds() / 60;
    let endMinutes = overlapEnd.getUTCMinutes() + overlapEnd.getUTCSeconds() / 60;

    // Adjust endMinutes to 60 if overlapEnd matches hourEnd
    if (overlapEnd.getTime() === hourEnd.getTime()) {
        endMinutes = 60;
    }

    return {
        y_start: startMinutes / 60,
        y_end: endMinutes / 60
    };
}

/**
 * Updates the last entry if it's ongoing by setting the stop_timestamp to the current local time.
 *
 * @param {Array<Object>} entries - Array of activity entries.
 */
function updateOngoingEntry(entries) {
    if (entries.length === 0) return;

    const lastEntry = entries[entries.length - 1];
    const stopTimestamp = parseInt(lastEntry.stop_timestamp, 10);

    if (Number.isNaN(stopTimestamp)) {
        const timezoneOffset = parseInt(lastEntry.local_timezone, 10) || 0;
        const currentLocalTime = Math.floor(Date.now() / 1000);
        lastEntry.stop_timestamp = currentLocalTime.toString();
        lastEntry.ongoing = true;
    }
}

/**
 * Processes CSV entries for a specific date and organizes them by hour.
 *
 * @param {Array<Object>} entries - Array of activity entries.
 * @param {Date} targetDate - The specific date for visualization (UTC).
 * @returns {Array<Array<Object>>} - Array of 24 arrays, each containing segments for the hour.
 */
function processEntriesForDate(entries, targetDate) {
    const hourlyData = Array.from({ length: 24 }, () => []);

    updateOngoingEntry(entries);

    entries.forEach(entry => {
        const timezoneOffset = parseInt(entry.local_timezone, 10) || 0;

        const startTimestampUTC = parseInt(entry.start_timestamp, 10) * 1000;
        const stopTimestampUTC = parseInt(entry.stop_timestamp, 10) * 1000;

        const entryStartLocal = new Date(startTimestampUTC + timezoneOffset * 3600 * 1000);
        const entryEndLocal = new Date(stopTimestampUTC + timezoneOffset * 3600 * 1000);

        const entryDateLocal = entryStartLocal.toISOString().split('T')[0];
        const targetDateLocal = targetDate.toISOString().split('T')[0];
        if (entryDateLocal !== targetDateLocal) {
            return; // Skip entries not on the target date in local timezone
        }

        for (let hour = 0; hour < 24; hour++) {
            const overlap = getOverlapInHour(entryStartLocal, entryEndLocal, hour);
            if (overlap) {
                hourlyData[hour].push({
                    y_start: overlap.y_start,
                    y_end: overlap.y_end,
                    description: entry.description,
                    project_id: entry.project_id,
                    project_name: entry.project_name,
                    start_timestamp: entry.start_timestamp,
                    stop_timestamp: entry.stop_timestamp,
                    ongoing: entry.ongoing || false,
                    timezoneOffset
                });
            }
        }
    });

    hourlyData.forEach(hourSegments => {
        hourSegments.sort((a, b) => a.y_start - b.y_start);
    });

    return hourlyData;
}

/**
 * Assigns group IDs to contiguous segments and aggregates tooltip information.
 *
 * @param {Array<Array<Object>>} hourlyData - Array of 24 arrays containing segments.
 * @returns {Object} - Contains updated hourlyData and a mapping of group IDs to their aggregated info.
 */
function assignGroupIDs(hourlyData) {
    // Flatten the hourlyData into a single list with associated hour
    const segmentsList = hourlyData.flatMap((segments, hour) =>
        segments.map(segment => ({
            hour,
            ...segment,
            start_timestamp: parseInt(segment.start_timestamp, 10),
            stop_timestamp: parseInt(segment.stop_timestamp, 10)
        }))
    );

    // Sort the segments by start_timestamp
    segmentsList.sort((a, b) => a.start_timestamp - b.start_timestamp);

    let groupId = 0;
    let previousEndTimestamp = null;
    const groupInfo = {};

    segmentsList.forEach(segment => {
        if (previousEndTimestamp === null || segment.start_timestamp > previousEndTimestamp) {
            groupId += 1;
            groupInfo[groupId] = {
                start_timestamp: segment.start_timestamp,
                end_timestamp: segment.stop_timestamp,
                descriptions: new Set([segment.description]),
                project_names: new Set([segment.project_name])
            };
        } else {
            // Extend the current group
            const currentGroup = groupInfo[groupId];
            currentGroup.end_timestamp = Math.max(currentGroup.end_timestamp, segment.stop_timestamp);
            currentGroup.descriptions.add(segment.description);
            currentGroup.project_names.add(segment.project_name);
        }

        // Assign group_id and group_info to the segment
        segment.group_id = groupId;
        segment.group_start_timestamp = groupInfo[groupId].start_timestamp;
        segment.group_end_timestamp = groupInfo[groupId].end_timestamp;

        previousEndTimestamp = segment.stop_timestamp;
    });

    // Update hourlyData with group assignments
    let currentIndex = 0;
    for (let hour = 0; hour < 24; hour++) {
        hourlyData[hour].forEach(segment => {
            const currentSegment = segmentsList[currentIndex];
            segment.group_id = currentSegment.group_id;
            segment.group_start_timestamp = currentSegment.group_start_timestamp;
            segment.group_end_timestamp = currentSegment.group_end_timestamp;
            currentIndex += 1;
        });
    }

    return {
        hourlyData,
        groupInfo
    };
}

/**
 * Processes CSV data for the bar plot.
 *
 * @param {string} csvText - The CSV data as a string.
 * @param {string} dateStr - The target date in 'YYYY-MM-DD' format (UTC).
 * @returns {Promise<Object>} - Promise resolving to an object containing processed hourly data and group info.
 */
async function processCSVForBarPlot(csvText, dateStr) {
    try {
        const parsedEntries = parseCSV(csvText);

        // Create a Date object for the target date (UTC)
        const targetDate = new Date(`${dateStr}T00:00:00Z`);

        // Process entries for the target date
        const hourlyData = processEntriesForDate(parsedEntries, targetDate);

        // Assign group IDs
        const { hourlyData: updatedHourlyData, groupInfo } = assignGroupIDs(hourlyData);

        console.log('Processed CSV data for bar plot.');

        return { hourlyData: updatedHourlyData, groupInfo };
    } catch (error) {
        console.error('Error processing CSV for bar plot:', error);
        return { hourlyData: [], groupInfo: {} };
    }
}


/**
 * Creates a tooltip element with the provided content.
 *
 * @param {string} content - The HTML content for the tooltip.
 * @returns {HTMLElement} - The tooltip element.
 */
function createTooltip(content) {
    const tooltip = document.createElement('span');
    tooltip.classList.add('tooltip');
    tooltip.innerHTML = content;
    return tooltip;
}

/**
 * Generates the bar plot based on processed hourly data, including highlighting of contiguous blocks and combined tooltips.
 *
 * @param {Array<Array<Object>>} hourlyData - Processed data for each hour.
 * @param {Object} groupInfo - Mapping of group IDs to their aggregated info.
 * @param {string} dateStr - The target date in 'YYYY-MM-DD' format (UTC).
 */
function generateBarPlot(hourlyData, groupInfo, dateStr) {
    const container = document.getElementById('hourly-bar-chart');
    if (!container) {
        console.error('Container with id "hourly-bar-chart" not found.');
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Create and append the date label
    const dateLabel = document.createElement('div');
    dateLabel.classList.add('date-label');
    const formattedDate = new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    dateLabel.textContent = formattedDate;
    container.appendChild(dateLabel);

    // Define Y-axis labels and their positions
    const yAxisLabels = [
        { text: '15min', position: '30.35%' },
        { text: '45min', position: '74.25%' }
    ];

    yAxisLabels.forEach(label => {
        const labelDiv = document.createElement('div');
        labelDiv.classList.add('y-axis-label');
        labelDiv.textContent = label.text;
        Object.assign(labelDiv.style, {
            position: 'absolute',
            top: label.position
        });
        container.appendChild(labelDiv);
    });

    // Create a document fragment to minimize reflows
    const fragment = document.createDocumentFragment();

    hourlyData.forEach((segments, hour) => {
        // Create a bar for each hour
        const bar = document.createElement('div');
        bar.classList.add('bar');

        // Create and position the X-axis label
        const labelDiv = document.createElement('div');
        labelDiv.classList.add('x-axis-label');
        labelDiv.textContent = hour.toString().padStart(2, '0');
        Object.assign(labelDiv.style, {
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            visibility: hour % 4 === 0 ? 'visible' : 'hidden',
            transition: 'visibility 0.2s'
        });

        if (hour % 4 !== 0) {
            // Show label on hover
            bar.addEventListener('mouseenter', () => {
                labelDiv.style.visibility = 'visible';
            });
            bar.addEventListener('mouseleave', () => {
                labelDiv.style.visibility = 'hidden';
            });
        }

        bar.appendChild(labelDiv);

        // Iterate through each segment within the hour
        segments.forEach(segment => {
            const segmentDiv = document.createElement('div');
            segmentDiv.classList.add('bar-segment');
            if (segment.ongoing) {
                segmentDiv.classList.add('bar-segment-ongoing');
            }

            // Reverse y-axis to have 1 at the top and 0 at the bottom
            const yStart = 1 - segment.y_end;
            const yEnd = 1 - segment.y_start;

            segmentDiv.style.bottom = `${yStart * 100}%`;
            segmentDiv.style.height = `${(yEnd - yStart) * 100}%`;

            // Set data attributes for group identification
            segmentDiv.dataset.groupId = segment.group_id;

            // Add ARIA labels for accessibility
            const group = groupInfo[segment.group_id];
            const timezoneOffset = segment.timezoneOffset || 0;
            const groupStartLocalTime = new Date((group.start_timestamp + timezoneOffset * 3600) * 1000).toISOString().substr(11, 5);
            const groupEndLocalTime = new Date((group.end_timestamp + timezoneOffset * 3600) * 1000).toISOString().substr(11, 5);
            segmentDiv.setAttribute('aria-label', `${[...group.project_names].join(', ')} - ${[...group.descriptions].join(', ')}; ${groupStartLocalTime} - ${groupEndLocalTime}`);

            // Create tooltip
            const combinedDescription = `${[...group.project_names].join(', ')}: ${[...group.descriptions].join(', ')}`;
            const tooltipContent = `${combinedDescription} <br> ${groupStartLocalTime} - ${groupEndLocalTime}`;
            const tooltip = createTooltip(tooltipContent);
            segmentDiv.appendChild(tooltip);

            // Event listeners for highlighting contiguous blocks
            const handleMouseOver = () => {
                const allSegments = container.querySelectorAll(`[data-group-id="${segment.group_id}"]`);
                allSegments.forEach(seg => seg.classList.add('namehighlight'));
            };

            const handleMouseOut = () => {
                const allSegments = container.querySelectorAll(`[data-group-id="${segment.group_id}"]`);
                allSegments.forEach(seg => seg.classList.remove('namehighlight'));
            };

            segmentDiv.addEventListener('mouseover', handleMouseOver);
            segmentDiv.addEventListener('mouseout', handleMouseOut);

            bar.appendChild(segmentDiv);
        });

        fragment.appendChild(bar);
    });

    container.appendChild(fragment);
}

/**
 * @param {string} dateStr - The target date in 'YYYY-MM-DD' format (UTC).
 */
async function exampleBarPlotUsage(dateStr) {
    try {
        // Fetch data using the shared cache
        const csvData = await getTogglTimeEntries();

        // Process the CSV data
        const { hourlyData, groupInfo } = await processCSVForBarPlot(csvData, dateStr);

        // Generate the bar plot
        generateBarPlot(hourlyData, groupInfo, dateStr);

        console.log(`Bar plot generated for date: ${dateStr}`);
    } catch (error) {
        console.error('Error in exampleBarPlotUsage:', error);
    }
}

// Expose the function to the global scope
window.exampleBarPlotUsage = exampleBarPlotUsage;


document.addEventListener('DOMContentLoaded', () => {
    const currentDate = new Date().toISOString().split('T')[0];
    exampleBarPlotUsage(currentDate); // Call the function with today's date
});

