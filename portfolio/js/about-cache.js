const CACHE_DURATION = 180 * 1000; // 180 seconds in milliseconds
const DATA_URL = 'https://storage.yandexcloud.net/sersavn-github-io-bucket/time_entries.csv';
// const DATA_URL = '/portfolio/data/dummy/time_entries.csv'

const cache = {
  data: null,
  timestamp: 0,
};

/**
 * Fetches time entries data with caching.
 * @returns {Promise<string>} - Promise resolving to CSV data as a string.
 */
export async function getTogglTimeEntries() {
  const now = Date.now();
  if (cache.data && (now - cache.timestamp) < CACHE_DURATION) {
    console.log('Loaded data from cache.');
    return cache.data;
  } else {
    try {
      console.log('Fetching new data from the server.');
      const response = await fetch(DATA_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      const csvData = await response.text();
      cache.data = csvData;
      cache.timestamp = now;
      console.log('Fetched new data and updated cache.');
      return csvData;
    } catch (error) {
      console.error('Error fetching time entries:', error);
      throw error;
    }
  }
}

