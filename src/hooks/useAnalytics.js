import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import getCookie from '../utils/cookieUtils';

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    try {
      const userId = getCookie('user_id');
      if (!userId) {
        console.warn('Analytics: No user ID found');
        return;
      }

      const csrftoken = getCookie('csrftoken');
      if (!csrftoken) {
        console.warn('Analytics: No CSRF token found');
        return;
      }

      const analyticsData = {
        user_id: userId,
        page_path: location.pathname || '/',
      };

      axios.post('/api/pageview', analyticsData, {
        headers: {
          'X-CSRFToken': csrftoken,
          'Content-Type': 'application/json',
        }
      }).catch(error => {
        console.error('Error logging analytics:', error.message);
      });
    } catch (error) {
      console.error('Analytics hook error:', error.message);
    }
  }, [location]);
};
