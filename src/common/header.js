import React from 'react';
import '../css/App.css';
import { Box, Heading, Grid, IconButton } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import tu_delft_pic from "../images/tud_black_new.png";
import { Link } from 'react-router-dom';
import { HomeIcon } from '@radix-ui/react-icons';

function Header({ showHomeButton }) {
  return (
    <Box py="2" style={{ backgroundColor: "var(--cyan-10)"}}>
      <Grid columns='3' mt='1'>

        {showHomeButton ? (
          <Box ml='3' style={{display:"flex"}}>  
            <Link to="/">
              <IconButton aria-label="navigate to home" height='21' style={{ marginLeft: 'auto', color: 'inherit', textDecoration: 'none' }}>
                <HomeIcon color="white" height='18' style={{ marginTop: 2 }} />
              </IconButton>
            </Link>
          </Box>
        ) : (
          <Box style={{ flex: 1 }} />
        )}

        <Link to={window.location.origin} style={{ flex:1, textDecoration: 'none' }}>
        <Heading as='h1' align='center' size='6' style={{ color: 'var(--gray-1)', marginTop: 2, marginBottom: 0, textDecoration: 'none', fontFamily:'monospace, Courier New, Courier' }}><b>brAIn builder</b></Heading>
        </Link>

        <Box align='end' mr='3' style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingRight: 7 }}>
            <Link to="https://www.tudelft.nl/en/" target="_blank" style={{ textDecoration: 'none'}}>
            <img src={tu_delft_pic} alt='Tu Delft Logo' width='auto' height='30'/>
            </Link>
        </Box>

      </Grid>
    </Box>
  );
}

export default Header;