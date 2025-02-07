import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import getCookie from '../utils/cookieUtils';

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    const userId = getCookie('user_id');
    const csrftoken = getCookie('csrftoken');

    const analyticsData = {
      user_id: userId,
      page_path: location.pathname,
    };

    axios.post('/api/analytics/', analyticsData, {
      headers: {
        'X-CSRFToken': csrftoken
      }
    }).catch(error => {
      console.error('Error logging analytics:', error);
    });
  }, [location]);
};
