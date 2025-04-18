import React, { Component } from 'react';
import './css/App.css';
import { Flex, Theme, Box, Heading, Separator } from '@radix-ui/themes';
import Header from './common/header';
import * as Slider from '@radix-ui/react-slider';

import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import ReactMarkdown from 'react-markdown';


const RenderLinReg = React.lazy(() => import('./utils/otherTasks/renderLinReg'));
const RenderPolyReg = React.lazy(() => import('./utils/otherTasks/renderPolyReg')); 
const RenderPCA = React.lazy(() => import('./utils/otherTasks/render2DPCA'));
const Render3DPCA = React.lazy(() => import('./utils/otherTasks/render3DPCA'));
const RenderDataMatrix = React.lazy(() => import('./utils/otherTasks/matrixUtils'));
const RenderEmissions = React.lazy(() => import('./utils/otherTasks/emissionUtils'));


class OtherTask extends Component {

    constructor(props) {
        super(props);

        this.animationWindowRef = React.createRef();
        this.state = {
            description: this.props.description,
            animationStates: {}, // changing one of these in the animation function causes a rerender
            animationWindowWidth: window.innerWidth * 0.67,
            animationWindowHeight: window.innerHeight,
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
        this.mount()
    }

    mount() {
        this.setState({ loading: true })
        if (this.props.type === 'ManualLinReg') {
            this.animation = RenderLinReg;
        } else if (this.props.type === 'ManualMatrix') {
            this.animation = RenderDataMatrix;
        } else if (this.props.type === 'ManualPolyReg') {
            this.animation = RenderPolyReg;
        } else if (this.props.type === 'ManualPCA') {
            this.animation = RenderPCA;
        } else if (this.props.type === 'Manual3DPCA') {
            this.animation = Render3DPCA;
        } else {
            alert("Function not implemented yet");
        }

        const { width, height } = document.querySelector('.animation-window').getBoundingClientRect();
        if (width !== 0 && height !== 0) {this.setState({ animationWindowWidth: width, animationWindowHeight: height, type: this.props.type })}  // else {this.mount()}  // danger of update loop 
        if (this.props.description[0] === '[') {
            this.setState({ description: JSON.parse(this.props.description) });
          } else {
            this.createDescriptionList(this.props.description);
        }

        this.setState({ loading: false })
    }

    componentDidUpdate(prevProps) {
        if (this.props.type !== this.state.type || this.props.description !== prevProps.description) {
            this.mount()
        }
    }

    // componentWillUnmount() {
    //     ...
    // }

    createDescriptionList = (jsonText) => {
        try {
          const sanitizedJson = jsonText.replace(/<\/?[^>]+(>|$)/g, "")
            .replace(/&/g, "&amp;")
            .replace(/%/g, "&#37;")
            .replace(/#/g, "&#35;")
            .replace(/!/g, "&#33;")
            .replace(/\?/g, "&#63;")
            .replace(/'/g, "&#39;")
            .replace(/"/g, "&quot;");
          const splitText = sanitizedJson.split('\n ');
          const descriptionList = splitText.map(subText => {
            const [subtitle, ...paragraphs] = subText.split('\n');
            const formattedParagraphs = paragraphs.map(paragraph => 
              paragraph.replace(/\*([^*]+)\*/g, '<b>$1</b>')  // bold
              .replace(/_([^_]+)_/g, '<i>$1</i>') // italic
            );
            return [subtitle, ...formattedParagraphs];
          });
          this.setState({ description: descriptionList });
        } catch (error) {
          console.error('Error parsing JSON or formatting description:', error);
        }
    }

    animation(props) {
        console.log('Animation not implemented')
    }

    render() {
        const preloader = document.getElementById("preloader");
      
        if (this.state.loading) {
          if (preloader) { preloader.style.display = "flex"; };
        } else {
          if (preloader) { preloader.style.display = "none"; };
        

        return (
        <Theme accentColor="cyan" grayColor="slate" panelBackground="solid" radius="large" appearance='light'>
            <div className='App'>
            <Flex direction='column' gap='0'>
            <Header showHomeButton={true} paths={this.props.paths} />

            <Box style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: window.innerHeight-52, width:'100vw' }}>
                <Flex direction='row' gap="0" style={{ height: window.innerHeight-52, width:'100vw', alignItems: 'center', justifyContent: 'center' }}>
                    
                    <Box style={{ flex:1, display: 'flex', flexDirection: 'column', textAlign:'justify', alignItems: 'flex-start', justifyContent: 'center', height: window.innerHeight-52, padding:'30px 50px' }}>
                        {Array.isArray(this.state.description) && this.state.description.map(([subtitle, text], index) => (
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
}



class OriginalTask extends Component {

    animation() {
    }

    render() {
        return (
        <Theme accentColor="cyan" grayColor="slate" panelBackground="solid" radius="large" appearance='light'>
            <div className='App'>
            <Flex direction='column' gap='0'>
            <Header showHomeButton={true} />

            <Box style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: window.innerHeight-52, width:'100vw' }}>
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
                    
                    <Box style={{ flex: 2}}>
                        {this.props.type === 'ManualEmissions' ? 
                            <RenderEmissions
                                states={[this.state.out1, this.state.out2]}
                                stateSetter={[this.state.in1, this.state.in2, this.updateTime, this.updateWords]}
                                width={null}
                                height={null}
                            /> 
                            : this.animation()}
                    </Box>
                </Flex>
            </Box>
            </Flex>
            </div>
        </Theme>
        );
    }
}

class BackendTask extends OriginalTask {
    /* This component can be used for simple tasks with a split screen with an explanation on the left and sliders and a visualisation on the right, separated by a vertical line. */

    constructor(props) {
        let inVals = {
            'ManualLinReg': [1, 0], 
            'ManualPolyReg': [1],  // Add initial value for polynomial degree
            'ManualMatrix': [5, 3], 
            'ManualPCA': [45], 
            'Manual3DPCA': [0], 
            'ManualEmissions': []
        }
        let inNames = {
            'ManualLinReg': ['Weight', 'Bias'], 
            'ManualPolyReg': ['Degree'],  // Add name for polynomial degree input
            'ManualMatrix': ['Number of objects', 'Number of features'], 
            'ManualPCA': ['Angle'], 
            'Manual3DPCA': ['Angle'], 
            'ManualEmissions': []
        }
        let outNames = {'ManualLinReg': ['Error'], 'ManualPolyReg': [], 'ManualMatrix': [], 'ManualPCA': ['Explained variance'], 'Manual3DPCA': ['Explained variance'], 'ManualEmissions': []}
        super(props);
        this.state = {
            in1: inVals[this.props.type][0] || 0,
            in1Name: inNames[this.props.type][0] || null,
            in2: inVals[this.props.type][1] || 0,
            in2Name: inNames[this.props.type][1] || null,
            out1: null,
            out1Name: outNames[this.props.type][0] || null,
            out2: null, 
            out2Name: outNames[this.props.type][1] || null,
            img: null,
            view: null
        };
        if (this.props.type === 'ManualLinReg' || this.props.type === 'ManualPCA' || this.props.type === 'Manual3DPCA') {
            this.ws = new WebSocket(`wss://${this.props.host}/ws/${this.props.userId}/`);
        } else {
            this.ws = null;
            // if (this.props.type === 'ManualMatrix') {
            // this.setState({ view: renderMatrix(5, 3) });
            // }
        }
    }

    componentDidMount() {
        // hide the preloader when page loads
        const preloader = document.getElementById("preloader");
        if (preloader) {
            preloader.style.display = "none";
        }

        if (this.ws !== null) {

        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        this.ws.onopen = () => {
            console.log('WebSocket connection opened');
            if (this.props.type === 'ManualLinReg') {
                // send a message to the websocket to create a baseline plot
                this.ws.send(JSON.stringify({ header: 'initial_change', task_name: this.props.type, task_id: this.props.customId, a: 1, b: 0 }));
            } else if (this.props.type === 'ManualPCA') {
                this.ws.send(JSON.stringify({ header: 'initial_change', task_name: this.props.type, task_id: this.props.customId, a: 45 }));
            } else if (this.props.type === 'Manual3DPCA') {
                this.ws.send(JSON.stringify({ header: 'initial_change', task_name: this.props.type, task_id: this.props.customId, angle: 0 }));
            }
        }

        this.ws.onerror = (error) => {
            console.error('WebSocket error: ', error);
        }

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received message: ', data);  // TODO remove
            if (data.header === 'plot') {
                const binaryString = atob(data.plot);  // decode from base64 to binary string
                const bytes = new Uint8Array(binaryString.length);  // convert from binary string to byte array
                for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);  // now bytes contains the binary image data
                }
                const blob = new Blob([bytes.buffer], { type: 'image/jpeg' });
                const url = URL.createObjectURL(blob);
                // now images can be accessed with <img src={url} />
                this.setState({ img: url });
                this.setState({ out1: data.out1 });
                this.setState({ out2: data.out2 });
            }
        }
        }
    }

    componentWillUnmount() {
        if (this.ws !== null) {
        this.ws.close();
        }
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    debounce(func, delay) {
        let debounceTimer;
        return function(...args) {
          const context = this;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
      }

    // handleMatrixChange = (value, whichIn) => {
    //     if (whichIn === 1) {
    //         this.setState({ in1: value[0] });
    //         this.setState({ view: renderMatrix(value[0], this.state.in2) })
    //     } else {
    //         this.setState({ in2: value[0] });
    //         this.setState({ view: renderMatrix(this.state.in1, value[0]) })
    //     }
    // }

    handleAngleChange = this.throttle((value) => {
        this.setState({ in1: value[0] });
        const message = JSON.stringify({ header: 'angle_change', task_name: this.props.type, task_id: this.props.customId, angle: value});
        this.ws.send(message);
    }, 500)

    handleWeightChange = this.debounce((value) => {
        if (this.props.type === 'ManualPCA') {this.setState({ in1: value[0] })};
        value = value[0] * Math.PI / 180;
        value = Math.tan(value);
        value = parseFloat(value.toFixed(3));
        if (this.props.type === 'ManualLinReg') {this.setState({ in1: value })};
        // Send a message through the WebSocket
        const message = JSON.stringify({ header: 'weight_change', task_name: this.props.type, task_id: this.props.customId, a: value, b: this.state.in2});
        this.ws.send(message);
    }, 100)

    handleBiasChange = this.throttle((value) => {
        this.setState({ in2: value[0] });
        // Send a message through the WebSocket
        const message = JSON.stringify({ header: 'bias_change', task_name:this.props.type, task_id: this.props.customId, a: this.state.in1, b: value[0]});
        this.ws.send(message);
    }, 100)

    setResult = (value) => {
        this.setState({ out1: value[0], out2: value[1] });
    }

    updateWords= (value) => {
        if (value === 'a sentence (~30 words)') {
            this.setState({ in1: 30 });
        } else if (value === 'a paragraph (~100 words)') {
            this.setState({ in1: 100 });
        } else if (value === 'a page (~400 words)') {
            this.setState({ in1: 400 });
        }
    }

    updateTime = (value1, value2) => {
        this.setState({ in2: [value1, value2] });
    }

    animation() {

        const weightSlider = (
            <Slider.Root
              className="SliderRoot"
              defaultValue={[45]}
              onValueChange={(value) => this.handleWeightChange(value)}
              min={-85}
              max={85}
              step={1}
              style={{ width: Math.round(0.16 * (window.innerWidth * 0.97)), margin: 10 }}
            >
              <Slider.Track className="SliderTrack" style={{ height: 3 }}>
                <Slider.Range className="SliderRange" />
              </Slider.Track>
              <Slider.Thumb className="SliderThumb" aria-label="Weight" />
            </Slider.Root>
          );
        
        const angleSlider = (
            <Slider.Root
              className="SliderRoot"
              defaultValue={[0]}
              onValueChange={(value) => this.handleAngleChange(value)}
              min={-180}
              max={180}
              step={1}
              style={{ width: Math.round(0.16 * (window.innerWidth * 0.97)), margin: 10 }}
            >
              <Slider.Track className="SliderTrack" style={{ height: 3 }}>
                <Slider.Range className="SliderRange" />
              </Slider.Track>
              <Slider.Thumb className="SliderThumb" aria-label="Weight" />
            </Slider.Root>
          );
        
        const biasSlider = (
            <Slider.Root
              className="SliderRoot"
              defaultValue={[0]}
              onValueChange={(value) => this.handleBiasChange(value)}
              min={-5}
              max={5}
              step={0.01}
              style={{ width: Math.round(0.16 * (window.innerWidth * 0.97)), margin: 10 }}
            >
              <Slider.Track className="SliderTrack" style={{ height: 3 }}>
                <Slider.Range className="SliderRange" />
              </Slider.Track>
              <Slider.Thumb className="SliderThumb" aria-label="Bias" />
            </Slider.Root>
        );  
        
        const orderSlider = (
            <Slider.Root
                className="SliderRoot"
                defaultValue={[1]}
                onValueChange={(value) => this.handleOrderChange(value)}
                min={1}
                max={10}
                step={1}
                style={{ width: Math.round(0.16 * (window.innerWidth * 0.97)), margin: 10 }}
            >
            <Slider.Track className="SliderTrack" style={{ height: 3 }}>
                <Slider.Range className="SliderRange" />
              </Slider.Track>
              <Slider.Thumb className="SliderThumb" aria-label="Order" />
            </Slider.Root>
        );
        
        // const nObjectsSlider = (
        //     <Slider.Root
        //         className="SliderRoot"
        //         defaultValue={[5]}
        //         onValueChange={(value) => this.handleMatrixChange(value, 1)}
        //         min={2}
        //         max={20}
        //         step={1}
        //         style={{ width: Math.round(0.16 * (window.innerWidth * 0.97)), margin: 10 }}
        //     >
        //     <Slider.Track className="SliderTrack" style={{ height: 3 }}>
        //         <Slider.Range className="SliderRange" />
        //       </Slider.Track>
        //       <Slider.Thumb className="SliderThumb" aria-label="nObjects" />
        //     </Slider.Root>
        // );
        
        // const nFeaturesSlider = (
        //     <Slider.Root
        //         className="SliderRoot"
        //         defaultValue={[3]}
        //         onValueChange={(value) => this.handleMatrixChange(value, 2)}
        //         min={1}
        //         max={10}
        //         step={1}
        //         style={{ width: Math.round(0.16 * (window.innerWidth * 0.97)), margin: 10 }}
        //     >
        //     <Slider.Track className="SliderTrack" style={{ height: 3 }}>
        //         <Slider.Range className="SliderRange" />
        //       </Slider.Track>
        //       <Slider.Thumb className="SliderThumb" aria-label="nFeatures" />
        //     </Slider.Root>
        // );

        return (
            <Box style={{ flex:1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: window.innerHeight-52, padding:'30px 50px', fontFamily:'monospace' }}>
                <Flex direction='column' gap="0" style={{ alignItems: 'center', justifyContent: 'center' }}>
                
                {this.state.in1Name !== 'Angle' && (
                <div>{this.state.in1Name}: <b>{this.state.in1}</b></div>
                )}
                <div className="slider" style={{ marginTop:10, height:50, display: 'flex', justifyContent: 'center' }}>
                    {
                    (this.props.type === 'ManualLinReg' || this.props.type === 'ManualPCA') ? weightSlider
                    : this.props.type === 'Manual3DPCA' ? angleSlider
                    : this.props.type === 'ManualPolyReg' ? orderSlider 
                    // : this.props.type === 'ManualMatrix' ? nObjectsSlider
                    : null}
                </div>

                {this.state.in2Name !== null && (
                <>
                <div>{this.state.in2Name}: <b>{this.state.in2}</b></div>
                <div className="slider" style={{ marginTop:10   , height:50, display: 'flex', justifyContent: 'center' }}>
                    {this.props.type === 'ManualLinReg' ? biasSlider
                    // : this.props.type === 'ManualMatrix' ? nFeaturesSlider
                    : null}
                </div>
                </>
                )}
                
                {
                this.state.img ? <img src={this.state.img} alt="Plot" style={{ height: window.innerHeight*0.55, marginBottom:10 }}/>
                : this.state.view ?
                <Box style={{ height: window.innerHeight*0.55, marginBottom:10 }}>
                    {this.state.view}
                </Box>
                : null
                }
                
                {this.state.out1Name !== null && (
                <div>
                    {/* Drag the sliders to change the weight and bias of the perceptron. Try to minimize the error. */}
                    Current {this.state.out1Name}: <b>{this.state.out1}</b>
                </div>)}
                
                {this.state.out2Name !== null && (
                <>
                <div>
                    Current {this.state.out2Name}: <b>{this.state.out2}</b>
                </div>
                </>)}
                </Flex>
            </Box>
        );
    }
}

export default OtherTask;