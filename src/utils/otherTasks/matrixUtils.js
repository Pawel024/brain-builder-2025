import '../../css/App.css';
import React, {  } from 'react';
import { Flex, Box, Text, Checkbox } from '@radix-ui/themes';


/**
 * Renders a matrix with data and checkboxes to select which columns to display
 * 
 * @param {object} props - The properties of the component
 * @param {number} props.width - The width of the component
 * @param {number} props.height - The height of the component
 * @param {object} props.states - The states of the component
 * @param {function} props.stateSetter - The function to set the states of the component
 * 
 * @returns {JSX.Element} The rendered matrix component
 */
export function RenderDataMatrix({ width, height, states, stateSetter }) {
    let inputOptions = ["Aircraft Type", "Origin", "Destination", "Distance (km)"];  // "Airline", "Number of Passengers", ...
    let allInputData = [
        ['A220', 'Milan', 'Amsterdam', 820], 
        ['787', 'Amsterdam', 'Eindhoven', 5860], 
        ['737', 'Eindhoven', 'Malaga', 1820], 
        // ['E190', 'London', 'Rotterdam', 300]
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

    let outputOptions = ["Manufacturer", "Time (mins)"];
    let allTargetData = [
        ['Airbus', 110], 
        ['Airbus', 500], 
        ['Boeing', 175], 
        // ['Embraer', 55], 
    ];
    if (states['targetData']) {
    } else {
        states['targetData'] = [[]]
        stateSetter('targetData', [[]]);
    }
    let allOutputData = [
        ['Airbus', 109], 
        ['Airbus', 517], 
        ['Boeing', 178], 
        // ['Embraer', 51], 
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


    /**
     * Generates a new matrix based on checkbox selections
     * 
     * @param {string} name - Name of the checkbox that was clicked
     * 
     * @returns {void}
     */
    function generateMatrix(name) {
        let newCheckboxValues = {...states['checkboxValues']};
        newCheckboxValues[name] = !states['checkboxValues'][name];
        states['checkboxValues'] = newCheckboxValues; 
        stateSetter('checkboxValues', newCheckboxValues);

        const selection = Object.keys(states['checkboxValues']).filter(key => states['checkboxValues'][key]);
        let indices = new Set(selection.map(name => [...inputOptions, ...outputOptions].indexOf(name)));
        
        const newInputData = allInputData.map((sublist, rowIndex) => {
            return [
            ...sublist.filter((_, index) => indices.has(index)),
            ...allTargetData[rowIndex].filter((_, index) => indices.has(index + allInputData[0].length))
        ]});
        states['inputData'] = newInputData; 
        stateSetter('inputData', newInputData);
        const newFeatures = inputOptions.filter((_, index) => indices.has(index));
        states['features'] = newFeatures; 
        stateSetter('features', newFeatures);

        // const newOutputData = allOutputData.filter((_, index) => indices.has(index + allInputData.length));  // datapoints horizontally
        const newOutputData = allOutputData.map(sublist => sublist.filter((_, index) => indices.has(index + allInputData[0].length)));  // datapoints vertically
        states['outputData'] = newOutputData; 
        stateSetter('outputData', newOutputData);
        const newTargets = outputOptions.filter((_, index) => indices.has(index + inputOptions.length));
        states['targets'] = newTargets; 
        stateSetter('targets', newTargets);
    }


    /**
     * Creates a table display for a matrix with column names
     * 
     * @param {Array<Array>} data - Matrix data to display
     * @param {Array<string>} columnNames - Names for each column
     * 
     * @returns {JSX.Element} Table body element
     */
    function displayMatrix(data, columnNames) {
        return (
            <tbody>
                {data[0] && 
                    <tr key={0}>
                        <td key={0}/>
                        {data[0].map((_, j) => (
                            <td key={j+1} style={{ border: '1px solid black', padding: '5px' }}><i>{columnNames[j]}</i></td>
                        ))}
                    </tr>
                }
                {data[0] && data[0][0] && data.map((row, i) => (
                    <tr key={i+1}>
                        <td key={0} style={{ border: '1px solid black', padding: '5px' }}><i>{'Object '+String(i+1)}</i></td>
                        {row.map((cell, j) => (
                            <td key={j+1} style={{ border: '1px solid black', padding: '5px' }}>{cell}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        )
    }

    
    /**
     * Calculates the position of a checkbox based on its index
     * 
     * @param {number} index - Index of the checkbox
     * 
     * @returns {number} The position of the checkbox
     */
    function checkboxPosition(index) {
        const textHeight = 20
        return Math.round(0.10*height + 2.0*textHeight*index)
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
                <Flex direction='column' style={{ position:'absolute', top: 0.31*height }}>
                    <div style={{textAlign: 'center'}} >Data</div>
                    <table style={{ borderCollapse: 'collapse', textAlign: 'center' }}>
                        {displayMatrix(states['inputData'], [...states['features'], ...states['targets']])}
                    </table>
                </Flex>

                <Flex direction='column' style={{ position:'absolute', top: 0.62*height }}>
                <div style={{textAlign: 'center'}} >Predictions</div>
                    <table style={{ borderCollapse: 'collapse', textAlign: 'center' }}>
                        {displayMatrix(states['outputData'], states['targets'])}
                    </table>
                </Flex>

            </Flex>
        </Box>
    );
}
