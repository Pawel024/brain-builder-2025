import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import getCookie from '../cookieUtils';
import { shouldExcludeIP } from '../ipUtils';
import { shouldExcludeUser } from '../userIdUtils';


/**
 * Hook to log page views and count users anonymously 
 */
export const useAnonymizedUserCount = () => {
  const location = useLocation();

  useEffect(() => {
    const logPageView = async () => {
      try {
        // USER ID - this is the only critical requirement
        const userId = getCookie('user_id');
        if (!userId) {
          console.warn('No user ID found');
          return;
        }

        // Check excluded users from environment - continue if not configured
        const excludeUsersStr = process.env.EXCLUDE_USERS;
        if (excludeUsersStr) {
          const excludeUsers = excludeUsersStr.split(',');
          if (shouldExcludeUser(userId, excludeUsers)) {
            console.debug('Analytics: User ID excluded from tracking');
            return;
          }
        }

        // CSRF TOKEN
        const csrftoken = getCookie('csrftoken');
        if (!csrftoken) {
          console.warn('No CSRF token found');
          return;
        }

        // ANALYTICS DATA
        const analyticsData = {
          user_id: userId,
          page_path: location.pathname || '/',
          referrer: document.referrer || 'direct'
        };

        // Try to get client IP, but continue without it if not available
        try {
          const ipResponse = await axios.get('/api/client-ip');
          if (ipResponse.data?.ip) {
            const clientIP = ipResponse.data.ip;
            
            /// Check excluded IPs from environment - continue if not configured
            const excludeIPsStr = process.env.EXCLUDE_IPS;
            if (excludeIPsStr) {
              const excludeIPs = excludeIPsStr.split(',');
              if (shouldExcludeIP(clientIP, excludeIPs)) {
                console.debug('Analytics: IP excluded from tracking');
                return;
              }
            }
          }
        } catch (ipError) {
          console.debug('Could not fetch client IP:', ipError.message);
          // Continue without IP information
        }

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
