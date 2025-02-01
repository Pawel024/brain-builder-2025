import React, { useEffect, useState, useRef } from 'react';
import { Button, Flex, Box, Heading, IconButton, TextField } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { CopyIcon } from '@radix-ui/react-icons';
import Readme from '../readme';
import * as Progress from '@radix-ui/react-progress';
import '@radix-ui/themes/styles.css';
import '../css/App.css';
import getCookie from '../utils/cookieUtils';
import isValidUUID from '../utils/userIdUtils';

function ChallengeButton({ link, label, Icon, active }) {
  const buttonStyle = {
    width: 136,
    height: 84,
    fontSize: 'var(--font-size-2)',
    fontWeight: '500',
    boxShadow: '0 1px 3px var(--slate-a11)',
  };

  // Function to check if a link is external
  const isExternalLink = (link) => /^https?:\/\//.test(link);
  
  return isExternalLink(link) ? (
    <a href={link} style={{ color: 'inherit', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
      <div style={{ position: 'relative', width: '136px', height: '84px' }}>
          <Button
            size="1"
            variant="outline"
            disabled={!active}
            style={buttonStyle}
          >
              
            <Flex gap="2" style={{ flexDirection: "column", alignItems: "center" }}>
                <label>{label}</label>
                <div>{Icon ? <Icon width="27" height="27" /> : null}</div>
            </Flex>

          </Button>
      </div>
  </a>
  ) : (
    <Link to={link} style={{ color: 'inherit', textDecoration: 'none' }}>
      <div style={{ position: 'relative', width: '136px', height: '84px' }}>
          <Button
            size="1"
            variant="outline"
            disabled={!active}
            style={buttonStyle}
          >
              
            <Flex gap="2" style={{ flexDirection: "column", alignItems: "center" }}>
                <label>{label}</label>
                <div>{Icon ? <Icon width="27" height="27" /> : null}</div>
            </Flex>

          </Button>
      </div>
    </Link>
  );
}


function OtherButton({ link, label, active }) {

  const buttonStyle = {
    flex: 1,
    fontSize: 'var(--font-size-2)',
    fontWeight: '500',
    boxShadow: '0 1px 3px var(--slate-a11)',
  };
  
  return (
      <Link to={link} style={{ color: 'inherit', textDecoration: 'none' }}>
          <Button
            size="1"
            variant="outline"
            disabled={!active}
            style={buttonStyle}
          >
          
          <label>{label}</label>

          </Button>
      </Link>
  );
}


function LevelBox({ level, showContent, handleShowContent, children }) {

  const toggleContent = () => handleShowContent(level-1, !showContent);

  const boxStyle = {
    border: "2px solid",
    borderColor: "var(--slate-8)",
    borderRadius: "var(--radius-3)",
    padding: '10px 24px',
    cursor: 'pointer', // Change cursor to pointer
    transition: 'background-color 0.3s', // Smooth transition for background color
    ':hover': {
      backgroundColor: "var(--slate-2)", // Change background color on hover
    }
  };

  return (
      <Box style={boxStyle} onClick={toggleContent} aria-expanded={showContent}>
          {children}
      </Box>
  );
}

function LevelHeading({ level, name }) {
  return (
      <Heading as='h2' size='5' style={{ color: 'var(--slate-12)', marginBottom:10 }}>&gt;_{name}</Heading>
  );
}

function GridBox(props) {

  const gridBoxStyle = {display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(136px, 136px))',
    gap: '15px',
    alignItems: 'start',
    justifyContent: 'start'
  };

  return <Box style={gridBoxStyle} {...props} />;
}

function useUserId() {
  const [userId, setUserId] = useState(getCookie('user_id'));
  const userIdRef = useRef(userId);

  useEffect(() => {
    const checkUserId = () => {
      const currentUserId = getCookie('user_id');
      if (userIdRef.current !== currentUserId) {
        setUserId(currentUserId);
        userIdRef.current = currentUserId; // Update the ref to the new value
      }
    };

    checkUserId(); // Check immediately in case it changed before the interval is set

    const intervalId = setInterval(checkUserId, 200); // Check every 0.2 seconds

    return () => clearInterval(intervalId); // Clean up the interval on component unmount
  }, []); // Empty dependency array means this effect runs once on mount

  return userId;
}

function ProgressBox({progress}) {

  // Use the custom hook to manage userId
  const userId = useUserId();

  const [copyFeedback, setCopyFeedback] = useState(userId);

  const handleCopy = () => {
    navigator.clipboard.writeText(userId)
      .then(() => {
        setCopyFeedback('Copied!'); // Update feedback message
        setTimeout(() => {
          setCopyFeedback(userId); // Revert
        }, 1000);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        setCopyFeedback('Error copying text'); // Provide feedback for error
        setTimeout(() => setCopyFeedback(userId), 1000); // Revert
      });
  };

  const [code, setCode] = useState('');


  const handleCodeChange = (event) => {
    setCode(event.target.value);
  };

  const handleSubmit = (event) => {
    if (event.key === 'Enter') {
      if (!isValidUUID(code)) {
        alert('Oops, invalid code! Please try again.');
      } else {
        document.cookie = `user_id=${code}; expires=Thu, 31 Dec 2099 23:59:59 GMT; path=/`;
        window.location.reload();
      }
    }
  };

  return (
    <Box style={{ border: "2px solid", borderColor: "var(--slate-8)", borderRadius: "var(--radius-3)", padding: '10px 24px'}} >
      <Flex direction='column' gap='1' style={{ justifyContent: 'center', alignItems: 'center' }}>
        <label style={{marginBottom: 10, fontSize: 'var(--font-size-2)', fontWeight: 'bold'}}>Your Progress</label>
        <Progress.Root className="ProgressRoot" value={progress} style={{ marginBottom:5, width: '100%' }}>
          <Progress.Indicator
            className="ProgressIndicator"
            style={{ transform: `translateX(-${100 - progress}%)` }}
          />
        </Progress.Root>

        <label style={{paddingTop: 5, fontSize: 'var(--font-size-2)'}}>Copy this code to continue in a different browser</label>
        <IconButton variant='soft' radius='full' size={2} style={{fontSize: 'var(--font-size-2)', color: 'var(--cyan-10)'}} onClick={handleCopy}>
          {copyFeedback}{copyFeedback === userId && <><span>&nbsp;</span><CopyIcon/></>}
        </IconButton>

        <label style={{paddingTop: 5, fontSize: 'var(--font-size-2)'}}>Do you already have a code? Enter it below!</label>
        <Box maxWidth="15vw">
          <TextField.Root size="1">
            <input placeholder="Paste and click Enter..." onChange={handleCodeChange} onKeyDown={handleSubmit} />
          </TextField.Root>
        </Box>
      </Flex>
    </Box>
  );
}

function ReadmeBox() {
  return (
      <Box style={{ flex: 1, border: "2px solid", borderColor: "var(--slate-8)", borderRadius: "var(--radius-3)", padding: '10px 30px' }}>
          <LevelHeading level={-1} name="Readme" />
          <Box>
              <Readme file="readme"/>
          </Box>
      </Box>
  );
}

export { ChallengeButton, OtherButton, LevelBox, LevelHeading, GridBox, ProgressBox, ReadmeBox };