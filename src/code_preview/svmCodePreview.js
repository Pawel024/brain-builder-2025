import React, { useState } from 'react';
import Joyride from 'react-joyride';
import { Box } from '@radix-ui/themes';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import a11yDark from './a11y-dark';

function SvmCodePreview({ code }) {
    const steps = [
        {
            target: '#allparts',
            content: "This is an example of how you would train this SVM model using scikit-learn. We'll walk you through the most important parts of the code.",
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '#part1',
            content: 'We import the necessary components: the SVM classifier and a scaler for preprocessing the data.',
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '#part2',
            content: 'First, we scale the features. This is crucial for SVM performance as the algorithm is sensitive to the scale of the input features.',
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '#part3',
            content: 'Here we create the SVM model with your chosen parameters. C controls the trade-off between having a wide margin and correctly classifying training data. With RBF kernel, gamma determines the "reach" of a single training example.',
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '#part4',
            content: 'Finally, we train the model and return both the model and scaler. The scaler is needed to preprocess any new data points before prediction.',
            disableBeacon: true,
            placement: 'top',
        }
    ];

    // Split the code into parts
    const parts = code.split('\n\n');

    return (
        <div>
            <Box id='allparts' style={{ 
                overflow: 'hidden', 
                width: window.innerWidth*0.97,
                height: window.innerHeight*0.97,
                justifyContent: 'center', 
                alignItems: 'center'
            }}>
                <Box style={{ 
                    position: 'relative', 
                    textAlign: 'center', 
                    color: 'white', 
                    backgroundColor: 'transparent', 
                    width: window.innerWidth*0.97, 
                    height: window.innerHeight*0.97, 
                    borderRadius: "var(--radius-3)" 
                }}>
                    {parts.map((part, index) => (
                        <Box id={`part${index+1}`} key={index} style={{ position: 'relative', display:'block' }}>
                            <SyntaxHighlighter language="python" style={a11yDark} customStyle={{ margin: '0', borderRadius: '0' }}>
                                {part}
                            </SyntaxHighlighter>
                        </Box>
                    ))}
                </Box>
            </Box>
            <Joyride
                steps={steps}
                run={true}
                continuous={true}
                scrollToFirstStep={true}
                showProgress={false}
                showSkipButton={true}
                styles={{
                    options: {
                        zIndex: 10000,
                    }
                }}
                locale={{ last: 'Finish' }}
            />
        </div>
    );
}

export default SvmCodePreview;
