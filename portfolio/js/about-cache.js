const CACHE_DURATION = 180 * 1000; // 180 seconds in milliseconds
const DATA_URL = 'https://storage.yandexcloud.net/sersavn-github-io-bucket/time_entries.csv';
//const DATA_URL = '/portfolio/data/dummy/time_entries.csv';

const cache = {
  data: null,
  timezoneOffset: null,
  timestamp: 0,
};

/**
 * Fetches time entries data and timezone offset with caching.
 * @returns {Promise<{ data: string, timezoneOffset: number }>} - Promise resolving to an object containing CSV data and timezone offset.
 */
export async function getTogglTimeEntries() {
  const now = Date.now();

  // Check if cached data and timezoneOffset are valid
  if (
    cache.data &&
    cache.timezoneOffset !== null &&
    (now - cache.timestamp) < CACHE_DURATION
  ) {
    console.log('Loaded data and timezoneOffset from cache.');
    return {
      data: cache.data,
      timezoneOffset: cache.timezoneOffset,
    };
  }

  try {
    console.log('Fetching new data from the server.');
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const csvData = await response.text();

    // Parse the timezoneOffset from the last row of the CSV
    const rows = csvData.trim().split('\n');
    const lastRow = rows[rows.length - 1];
    const columns = lastRow.split(',');

    // Assuming the timezoneOffset is the last column in the CSV
    const timezoneOffsetStr = columns[columns.length - 1];
    const timezoneOffset = parseFloat(timezoneOffsetStr);

    if (isNaN(timezoneOffset)) {
      throw new Error('Invalid timezone offset value.');
    }

    // Update the cache with new data and timezoneOffset
    cache.data = csvData;
    cache.timezoneOffset = timezoneOffset;
    cache.timestamp = now;

    console.log('Fetched new data and timezoneOffset, updated cache.');

    return {
      data: csvData,
      timezoneOffset: timezoneOffset,
    };
  } catch (error) {
    console.error('Error fetching or processing time entries:', error);

    // Optionally, you can decide to return cached data even if it's stale
    if (cache.data) {
      console.warn('Returning stale cached data due to error.');
      return {
        data: cache.data,
        timezoneOffset: cache.timezoneOffset,
      };
    }

    // If no cached data is available, rethrow the error
    throw error;
  }
}

