import React from 'react';
import './css/App.css';
import { Theme, Box, Heading } from '@radix-ui/themes';
import Readme from '../readme';
import Header from '../common/header';

function LinksPage () {
    return(
    <Theme accentColor="cyan" grayColor="slate" panelBackground="solid" radius="large" appearance='light'>
        <Header showHomeButton={true}/>
        <Box style={{ overflow: 'auto', width: '100%', height: window.innerHeight-52, padding: '30px 300px' }}>
            <Box style={{ flex: 1, border: "2px solid", borderColor: "var(--slate-8)", borderRadius: "var(--radius-3)", padding: '10px 30px' }}>
                <Heading as='h2' size='5' style={{ color: 'var(--slate-12)', marginBottom:7 }}>&gt;_Useful Links</Heading>
                <Readme file="links"/>
            </Box>
        </Box>
    </Theme>
    )
}

export default LinksPage;