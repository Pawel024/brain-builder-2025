import React, { Component, useState, useRef } from 'react';
import './css/App.css';
import { Flex, Theme, Box, Heading, Separator, Text, Checkbox } from '@radix-ui/themes';
import Header from './common/header';
import * as Slider from '@radix-ui/react-slider';

import { RenderLinReg, RenderPolyReg } from './utils/otherTasks/plottingUtils'
import { RenderDataMatrix } from './utils/otherTasks/matrixUtils';
import { RenderEmissions } from './utils/otherTasks/emissionUtils';

import { _ } from 'ajv';

import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import ReactMarkdown from 'react-markdown';


class OtherTask extends Component {

    constructor(props) {
        super(props);

        if (this.props.type === 'ManualLinReg') {
            this.animation = RenderLinReg;
        } else if (this.props.type === 'ManualMatrix') {
            this.animation = RenderDataMatrix;
        } else if (this.props.type === 'ManualPolyReg') {
            this.animation = RenderPolyReg;
        } else {
            alert("Function not implemented yet");
        }

        this.animationWindowRef = React.createRef();
        this.state = {
            animationStates: {}, // changing one of these in the animation function causes a rerender
            animationWindowWidth: 100, // TODO: update default value
            animationWindowHeight: 100, // TODO: update default value
        }
    }

    setAnimationState = (state, value) => {
        this.setState( prev => {
            const newAnimationStates = {...prev.animationStates};
            newAnimationStates[state] = value;
            return { animationStates: newAnimationStates }; 
        });
    }

    componentDidMount() {
        const { width, height } = document.querySelector('.animation-window').getBoundingClientRect();
        this.setState({ animationWindowWidth: width, animationWindowHeight: height })
    }

    // componentWillUnmount() {
    //     ...
    // }

    animation(props) {
        console.log('Animation not implemented')
    }

    render() {
        return (
        <Theme accentColor="cyan" grayColor="slate" panelBackground="solid" radius="large" appearance='light'>
            <div className='App'>
            <Flex direction='column' gap='0'>
            <Header showHomeButton={true} paths={this.props.paths} />

            <Box style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace', height: window.innerHeight-52, width:'100vw' }}>
                <Flex direction='row' gap="0" style={{ height: window.innerHeight-52, width:'100vw', alignItems: 'center', justifyContent: 'center' }}>
                    
                    <Box style={{ flex:1, display: 'flex', flexDirection: 'column', textAlign:'justify', alignItems: 'flex-start', justifyContent: 'center', height: window.innerHeight-52, padding:'30px 50px' }}>
                        {Array.isArray(this.props.description) && this.props.description.map(([subtitle, text], index) => (
                            <div key={index}>
                            <Heading as='h2' size='5' style={{ color: 'var(--slate-12)', marginBottom:7 }}>&gt;_{subtitle} </Heading>
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{text}</ReactMarkdown>
                            </div>
                        ))}
                    </Box>
                    
                    <Separator orientation='vertical' style = {{ height: window.innerHeight-110 }}/>
                    
                    <Box className="animation-window" style={{ flex: 2, position: 'relative' }}>
                        <this.animation 
                            width={this.state.animationWindowWidth}
                            height={this.state.animationWindowHeight}
                            states={this.state.animationStates}
                            stateSetter={this.setAnimationState}
                        />
                    </Box>
                </Flex>
            </Box>
            </Flex>
            </div>
        </Theme>
        );
    }
}

export default OtherTask;