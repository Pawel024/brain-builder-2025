import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const usePlausible = () => {
  const location = useLocation();

  useEffect(() => {
    if (window.plausible) {
      window.plausible('pageview');
    }
  }, [location]);
};
