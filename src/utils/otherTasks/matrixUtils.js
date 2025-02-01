import '../../css/App.css';
import React, {  } from 'react';
import { Flex, Box, Text, Checkbox } from '@radix-ui/themes';

export default function renderDataMatrix(width, height, states, stateSetter) {
    let inputOptions = ["Aircraft Type", "Origin", "Destination", "Distance (km)"];  // "Airline", "Number of Passengers", ...
    let allInputData = [
        ['A220', '787', '737'], // 'E190'
        ['Milan', 'Amsterdam', 'Eindhoven'], // 'London' 
        ['Amsterdam', 'New York', 'Malaga'], // 'Rotterdam'
        [820, 5860, 1820] // 300
    ];
    if (states['inputData']) {
    } else {
        states['inputData'] = [[]]
        stateSetter('inputData', [[]]);
    }
    if (states['features']) {
    } else {
        states['features'] = []
        stateSetter('features', []);
    }

    let outputOptions = ["Manufacturer", "Flight Time (mins)"];
    let allOutputData = [
        ['Airbus', 'Boeing', 'Boeing'], // 'Embraer'
        [110, 500, 175] // 55
    ];
    if (states['outputData']) {
    } else {
        states['outputData'] = [[]]
        stateSetter('outputData', [[]]);
    }
    if (states['targets']) {
    } else {
        states['targets'] = []
        stateSetter('targets', []);
    }

    const initialCheckboxValues = [...inputOptions, ...outputOptions].reduce((acc, key) => {
        acc[key] = false;  // initialize all as false
        return acc;
      }, {});
    if (states['checkboxValues']) {
    } else {
        states['checkboxValues'] = initialCheckboxValues
        stateSetter('checkboxValues', initialCheckboxValues);
    }

    //const [convertToNumbers, setConvertToNumbers] = useState(false);

    function generateMatrix(name) {
        let newCheckboxValues = {...states['checkboxValues']};
        newCheckboxValues[name] = !states['checkboxValues'][name];
        states['checkboxValues'] = newCheckboxValues; 
        stateSetter('checkboxValues', newCheckboxValues);

        const selection = Object.keys(states['checkboxValues']).filter(key => states['checkboxValues'][key]);
        let indices = new Set(selection.map(name => [...inputOptions, ...outputOptions].indexOf(name)));
        
        const newInputData = allInputData.filter((_, index) => indices.has(index));
        states['inputData'] = newInputData; 
        stateSetter('inputData', newInputData);
        const newFeatures = inputOptions.filter((_, index) => indices.has(index));
        states['features'] = newFeatures; 
        stateSetter('features', newFeatures);

        const newOutputData = allOutputData.filter((_, index) => indices.has(index + allInputData.length));
        states['outputData'] = newOutputData; 
        stateSetter('outputData', newOutputData);
        const newTargets = outputOptions.filter((_, index) => indices.has(index + inputOptions.length));
        states['targets'] = newTargets; 
        stateSetter('targets', newTargets);

        console.log(states['features'].length, states['features'], states['targets'])  // TODO remove
    }

    function displayMatrix(data, rowNames) {
        return (
            <tbody>
                {data[0] && 
                    <tr key={0}>
                        <td key={0}/>
                        {data[0].map((_, j) => (
                            <td key={j+1} style={{ border: '1px solid black', padding: '5px' }}><i>{'Object '+String(j+1)}</i></td>
                        ))}
                    </tr>
                }
                {data[0] && data[0][0] && data.map((row, i) => (
                    <tr key={i+1}>
                        <td key={0} style={{ border: '1px solid black', padding: '5px' }}><i>{rowNames[i]}</i></td>
                        {row.map((cell, j) => (
                            <td key={j+1} style={{ border: '1px solid black', padding: '5px' }}>{cell}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        )
    }

    function checkboxPosition(index) {
        const textHeight = 20
        return Math.round(0.12*height + 2.0*textHeight*index)
    }

    return (
        <Box style={{ flex:1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: window.innerHeight-52, padding:'30px 50px' }}>
            <Flex direction='column' gap="0" style={{ alignItems: 'center', justifyContent: 'center' }}>
            
                {/* Display the checkboxes in two columns*/}
                <Flex direction='row'>
                    <Flex direction='column'>
                        <div style={{ position: 'absolute', top: checkboxPosition(-1), left: Math.round(0.1 * width)}}>Desired Inputs:</div>
                        {inputOptions.map((name, index) => (
                            <Text className={name+'Checkbox'} as="label" size="2">
                                <Flex style={{ position:"absolute", top: checkboxPosition(index), left: Math.round(0.1 * width)}}>          
                                    <Checkbox style={{ marginRight: '10px' }} onClick={() => generateMatrix(name)} checked={states['checkboxValues'][name]} /> {name}
                                </Flex>
                            </Text>
                        ))}
                    </Flex>

                    <Flex direction='column'>
                        <div style={{ position: 'absolute', top: checkboxPosition(-1), left: Math.round(0.6 * width)}}>Desired Outputs:</div>
                        {outputOptions.map((name, index) => (
                            <Text className={name+'Checkbox'} as="label" size="2">
                                <Flex style={{ position:"absolute", top: checkboxPosition(index), left: Math.round(0.6 * width)}}>          
                                    <Checkbox style={{ marginRight: '10px' }} onClick={() => generateMatrix(name)} checked={states['checkboxValues'][name]} /> {name}
                                </Flex>
                            </Text>
                        ))}
                    </Flex>
                </Flex>
                
                {/* Display the matrices */}
                <Flex direction='column' style={{ position:'absolute', top: 0.40*height }}>
                    <div style={{textAlign: 'center'}} >Input matrix</div>
                    <table style={{ borderCollapse: 'collapse', textAlign: 'center' }}>
                        {displayMatrix(states['inputData'], states['features'])}
                    </table>
                </Flex>

                <Flex direction='column' style={{ position:'absolute', top: 0.75*height }}>
                <div style={{textAlign: 'center'}} >Output matrix</div>
                    <table style={{ borderCollapse: 'collapse', textAlign: 'center' }}>
                        {displayMatrix(states['outputData'], states['targets'])}
                    </table>
                </Flex>

            </Flex>
        </Box>
    );
}
