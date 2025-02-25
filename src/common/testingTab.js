import React from 'react';
import { Box, Flex, Separator } from '@radix-ui/themes';
import * as Form from '@radix-ui/react-form';
import '@radix-ui/themes/styles.css';

function FormatOutput(val) {
    if (typeof val === 'number') {
        // val is a number
        return val.toFixed(3)
    } else if (val.length && val.length === 1) {
        // val is a list with single numbers
        return Number(val[0]).toFixed(3);
    } else if (Array.isArray(val)) {
        // val is a list with multiple numbers
        return val.map(num => Number(num).toFixed(3));
    } else {
        return val
    }
}

const TestingTab = ({ taskId, featureNames, handleSubmit, setIsResponding, setApiData, index, isResponding, apiData, img }) => {
    return (
        <Flex direction="row" gap = "3" style={{ display: 'flex' }}>
            <Box style={{ flexBasis: '50%', justifyContent: 'center', alignItems: 'center', padding: '30px 0px' }}>
                <Flex direction="column" gap="2" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    {/* This will render the form with the feature names received from the backend, if it exists */}
                    <Form.Root className="FormRoot" onSubmit={taskId !== 0 ? (event) => handleSubmit(event, setIsResponding, setApiData, taskId, index) : () => {}}>
                        {featureNames.length > 0 && featureNames.map((featureName, index) => (
                            <Form.Field className="FormField" name={featureName} key={index}>
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                                    <Form.Label className="FormLabel">{featureName}</Form.Label>
                                    <Form.Message className="FormMessage" match="valueMissing">
                                        Please enter the {featureName}
                                    </Form.Message>
                                    <Form.Message className="FormMessage" match="typeMismatch">
                                        Please provide a valid number.
                                    </Form.Message>
                                </div>
                                <Form.Control asChild>
                                    <input className="FormInput" type="text" pattern="^-?[0-9]*[.,]?[0-9]+" required />
                                </Form.Control>
                            </Form.Field>
                        ))}
                        {featureNames.length > 0 &&
                            <Form.Submit asChild>
                                <button className="FormButton" style={{ marginTop: 10, width: window.innerWidth * 0.3 - 30 }}>
                                    Predict!
                                </button>
                            </Form.Submit>}
                    </Form.Root>
                    <div id="query-response">
                        {isResponding === 2 ? (
                            <div>Output: {FormatOutput(apiData["in_out"])}</div>
                        ) : (isResponding === 1 ? (
                            <div>Getting your reply...</div>
                        ) : (
                            <div></div>
                        )
                        )}
                    </div>
                </Flex>
            </Box>
            <Separator orientation='vertical' style={{ height: window.innerHeight - 152, position: 'fixed', left: window.innerWidth * 0.5, bottom: (window.innerHeight - 92) * 0.5, transform: `translateY(${(window.innerHeight - 152) / 2}px)` }} />
            <Box style={{ flexBasis: '50%', justifyContent: 'center', alignItems: 'center' }}>
                {/* This will render the images, if they exist */}
                <Flex direction="column" gap="2" style={{ justifyContent: 'center', alignItems: 'center', padding: '30px 30px' }}>
                    {img ? (
                        <img src={img} alt={`Plot of the data`} onLoad={() => { }/*URL.revokeObjectURL(this.props.img)*/} />
                    ) : (
                        <div>No plots available yet... have you already trained a model?</div>
                    )}
                    {/* TODO: Turn this into a pretty animation */}
                </Flex>
            </Box>
        </Flex>
    );
};

export default TestingTab;