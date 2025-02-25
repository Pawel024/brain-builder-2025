import React from 'react';
import { StarIcon, StarFilledIcon } from '@radix-ui/react-icons';

const Stars = ({ rating }) => {
  return (
    <span style={{ display: 'flex', gap: '2px' }}>
      {[...Array(5)].map((_, index) => (
        index < rating ? (
          <StarFilledIcon 
            key={`star-${index}`}
            style={{color: 'var(--slate-11)'}} 
            width={27} 
            height={27} 
          />
        ) : (
          <StarIcon 
            key={`star-${index}`}
            style={{color: 'var(--slate-11)'}} 
            width={27} 
            height={27} 
          />
        )
      ))}
    </span>
  );
};

export default Stars;
