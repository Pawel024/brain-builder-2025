import axios from 'axios';

const isDevelopment = window.location.hostname === 'localhost';

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
