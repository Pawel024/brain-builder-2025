import axios from 'axios';

const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

/**
 * Makes a GET request using Axios, but skips the request if running locally
 * 
 * @param {string} url - The URL to request
 * @param {object} options - The options to pass to Axios
 * 
 * @returns {Promise<object>} The response from the request
 */
export const safeGet = async (url, options = {}) => {
  if (isDevelopment) {
    console.warn('Skipping HTTP request becuase running locally:', url);
    return {
      data: null,
      status: 200,
      statusText: 'OK (Development)',
    };
  }
  
  return axios.get(url, options);
};
