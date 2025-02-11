import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import getCookie from '../cookieUtils';
import { shouldExcludeIP } from '../ipUtils';
import { shouldExcludeUser } from '../userIdUtils';

export const useAnonymizedUserCount = () => {
  const location = useLocation();

  useEffect(() => {
    const logPageView = async () => {
      try {
        // USER ID
        const userId = getCookie('user_id');
        if (!userId) {
          console.warn('No user ID found');
          return;
        }

        // Check excluded users from environment
        const excludeUsersStr = process.env.REACT_APP_EXCLUDE_USERS;
        const excludeUsers = excludeUsersStr ? excludeUsersStr.split(',') : [];
        
        if (shouldExcludeUser(userId, excludeUsers)) {
          console.debug('Analytics: User ID excluded from tracking');
          return;
        }

        // CSRF TOKEN
        const csrftoken = getCookie('csrftoken');
        if (!csrftoken) {
          console.warn('No CSRF token found');
          return;
        }

        // CLIENT IP
        const ipResponse = await axios.get('/api/client-ip');
        if (!ipResponse.data || !ipResponse.data.ip) {
          return;
        }
        const clientIP = ipResponse.data.ip;

        // Check excluded IPs from environment
        const excludeIPsStr = process.env.REACT_APP_EXCLUDE_IPS;
        const excludeIPs = excludeIPsStr ? excludeIPsStr.split(',') : [];
        
        if (shouldExcludeIP(clientIP, excludeIPs)) {
          console.debug('Analytics: IP excluded from tracking');
          return;
        }

        // ANALYTICS DATA
        const analyticsData = {
          user_id: userId,
          page_path: location.pathname || '/',
          referrer: document.referrer || 'direct'
        };

        await axios.post('/api/pageview', analyticsData, {
          headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json',
          }
        });
      } catch (error) {
        console.error('Analytics error:', error.message);
      }
    };

    logPageView();
  }, [location]);
};

export default useAnonymizedUserCount;
