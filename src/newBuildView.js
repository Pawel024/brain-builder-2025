// NEW BUILDVIEW

import React from 'react'
import './css/App.css';
import { Flex, Box, Checkbox } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import color_scale_pic from "./images/color_scale_2.png";
import CytoscapeComponent from 'react-cytoscapejs';
import * as Slider from '@radix-ui/react-slider';
import { useNavigate } from 'react-router-dom';
import layersToCode from './code_preview/codeExplainTools';
import {GenerateFloatingButtons, LayerRemoveButton, LayerAddButton} from './common/floatingButtons';
import { 
  Chart, 
  CategoryScale, 
  LinearScale, 
  LineController, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { DefaultView, Model } from './common/viewTemplate';


class Building extends Model {

    // INITIALIZATION
    constructor(props) {
        super(props);

        this.state = {
        currentSlide: 0,
        activeTab: 'training',
        showCode: false,
        code: '',
        description: '',

        sliderValues: {'EpochSlider': 100, 'LRSlider': 0.01},
        checkboxValues: {'NormCheckbox': false, 'AFCheckbox': true},
        runTutorial: false,
        steps: [
            {
              target: '.buildBody',
              content: 'Welcome to the Building View! This is where you can build and test your own neural networks.',
              placement: 'center',
            },
            {
              target: '.cytoscape',
              content: 'This is the neural network you will be building. You can add and remove layers with the buttons on the right. You can also use the + and - buttons below the network to add or remove nodes.',
            },
            {
              target: '.iterationsSlider',
              content: 'This is the slider to adjust the number of epochs. Put simply: the more epochs, the more your network will learn. But be careful, too many epochs can lead to overfitting!',
            },
            {
              target: '.learningRateSlider',
              content: 'This is the slider to adjust the learning rate. Put simply: the lower the learning rate, the less the network will adjust itself at every step.',
            }]
        };

        this.useCodePreview = true

        this.tabs = [
            { name: 'Data', value: 'data' },
            { name: 'Model', value: 'training' },
            { name: 'Result', value: 'testing' },
        ]

        this.inputNames = {
            'EpochSlider': 'Epochs',
            'LRSlider': 'Learning rate',
            'normCheckbox': 'Normalize data',
            'AFCHeckbox': 'Enable activation functions'
        }

        this.sliders = {
            'EpochSlider': this.iterationsSlider,
            'LRSlider': this.learningRateSlider,
        }

        this.inputFields = {
        }

        this.dropdowns = {
        }

        this.checkboxes = {
            'NormCheckbox': <Checkbox disabled = { this.props.isTraining===1 } onClick={() => this.handleNormClick()} checked={this.state.checkboxValues['Normcheckbox']} />,
            'AFCheckbox': <Checkbox disabled = { this.props.isTraining===1 } onClick={() => this.handleAfClick()} checked={this.state.checkboxValues['AFCheckbox']} />,
        }

    };


    // CUSTOMIZABLE FUNCTIONS

    continueComponentDidMount = () => {
        if (this.props.taskId === 0) {
          this.setState({ runTutorial: true }, () => {
            // Delay the click on the beacon until after the Joyride component has been rendered
            setTimeout(() => {
              const beacon = document.querySelector('.react-joyride__beacon');
      
              if (beacon) {
                beacon.click();
              }
            }, 0);
          });
        }
        else {
        this.props.loadData(this.props.taskId, this.props.index)  // let the backend load the data, then set the images and feature names
        this.props.loadLastCytoLayers(this.props.setCytoLayers, this.props.apiData, this.props.setApiData, 'cytoLayers' + this.props.taskId, this.props.taskId, this.props.index, this.props.NNIndex, this.props.nOfInputs, this.props.nOfOutputs);
        this.props.updateCytoLayers(this.props.setCytoLayers, this.props.nOfInputs, this.props.nOfOutputs, this.props.NNIndex);
        }
      }

    chartRef = React.createRef();
    chartInstance = null;
  
    componentDidUpdate(prevProps) {
      if (this.cy) {this.cy.resize();} // this seems to do nothing
      if (this.props.taskId !== 0 && this.chartRef.current) {
        const ctx = this.chartRef.current.getContext('2d');
  
        if (this.chartInstance && (JSON.stringify(this.props.errorList[0].slice(0, prevProps.errorList[0].length)) === JSON.stringify(prevProps.errorList[0]) && this.props.errorList[0].length > prevProps.errorList[0].length)) {
          // Update the chart if the error list has changed and is longer than before
          this.chartInstance.data.labels = this.props.errorList[0].map((_, i) => i + 1);
          this.chartInstance.data.datasets[0].data = this.props.errorList[0];
          this.chartInstance.update();
        } else {
          // Destroy the old chart if a different error list was received and a chart exists
          if (JSON.stringify(this.props.errorList[0].slice(0, prevProps.errorList[0].length)) !== JSON.stringify(prevProps.errorList[0])) {
            // If an old chart exists, destroy it
            if (this.chartInstance) {
              this.chartInstance.destroy();
              this.chartInstance = null;
            }
          } 
        }
        // Create a new chart if there is no chart
        if (this.chartInstance === null) {
          // create a new chart
          this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
              labels: this.props.errorList[0].map((_, i) => i + 1), // Generate labels based on error array length
              datasets: [{
                  label: 'Errors',
                  data: this.props.errorList[0],
                  borderColor: 'rgba(7, 151, 185, 1)',
                  backgroundColor: 'rgba(7, 151, 185, 0.2)',
              }]
            },
            options: {
              scales: {
                  y: {
                      beginAtZero: true
                  }
              },
              animation: {
                duration: 1000 // general animation time
              },
              responsive: false,
              maintainAspectRatio: false,
            }  
          });
        }
      }
    }
  
    componentWillUnmount() {
      if (this.props.isTraining === 1) {
        this.props.cancelRequest();
      }
    }

    valuesUndefined = () => {
        return Object.values(this.props.sliderVisibilities).includes(null) || Object.values(this.state).includes(null);
    }
    
    handleStartClick = (() => {
    let inThrottle;
    return (event) => {
        if (!inThrottle && this.props.taskId !== 0) { 
        if (this.props.isTraining === 1) {
            this.props.cancelRequestRef.current(this.props.taskId, this.props.index)
        } else { 
            let trainingParams = {
                cytoLayers: this.props.cytoLayers,
                learningRate: this.props.learningRate,
                iterations: this.props.iterations,
                taskId: this.props.taskId,
                nOfInputs: this.props.nOfInputs,
                nOfOutputs: this.props.nOfOutputs,
                index: this.props.NNIndex,
                globalIndex: this.props.index,
                setProgress: this.props.setProgress,
                setErrorList: this.props.setErrorList,
                setWeights: this.props.setWeights,
                setBiases: this.props.setBiases,
                setImgs: this.props.setImgs,
                setApiData: this.props.setApiData,
                setAccuracy: this.props.setAccuracy,
                setIsTraining: this.props.setIsTraining,
                userId: this.props.userId,
                intervalTimeout: this.props.intervalTimeout,
                progress: this.props.progress,
                errorList: this.props.errorList,
                weights: this.props.weights,
                biases: this.props.biases,
                img: this.props.img,
                isTraining: this.props.isTraining,
                af: this.props.af,
                cancelRequestRef: this.props.cancelRequestRef,
                typ: this.props.typ,
                dataset: this.props.dataset,
                fileName: this.props.fileName,
                functionName: this.props.functionName,
            }
            this.props.startTraining(event, trainingParams, 'NN');
        }
        inThrottle=true
        setTimeout(() => inThrottle = false, 2*this.props.pendingTime);
        }
    };
    })();

    handleCodeClick = (event) => {
        this.setState({
            code: layersToCode(this.props.cytoLayers, this.props.learningRate, this.props.iterations, this.props.taskId, this.props.af),
            showCode: true
          });
        window.scrollTo(0, document.body.scrollHeight); // Scroll to the bottom of the page
    }

    handleAfClick = () => {
        this.setState( prev => {
            const newCheckboxValues = {...prev.checkboxValues};
            newCheckboxValues['AFCheckbox'] = !prev.checkboxValues['AFCheckbox'];
            return {checkboxValues: newCheckboxValues};
        });
    }

    handleNormClick = () => {
        this.setState( prev => {
            const newCheckboxValues = {...prev.checkboxValues};
            newCheckboxValues['NormCheckbox'] = !prev.checkboxValues['NormCheckbox'];
            return {checkboxValues: newCheckboxValues};
        });
    }


    // FINALLY, THE RENDER

    iterationsSlider = (
      <Slider.Root
        key={this.props.NNIndex}
        className="SliderRoot"
        defaultValue={[null]} //maxEpochs[index] ? maxEpochs[index] / 4 : 25
        onValueChange={(value) => this.handleIterationChange(value)}
        max={this.props.maxEpochs ? this.props.maxEpochs / 2 : 50}
        step={0.5}
        style={{ width: Math.round(0.19 * (window.innerWidth * 0.97)) }}
        disabled={this.props.isTraining[this.props.index] === 1}
      >
        <Slider.Track className="SliderTrack" style={{ height: 3 }}>
          <Slider.Range className="SliderRange" />
        </Slider.Track>
        <Slider.Thumb className="SliderThumb" aria-label="Iterations" />
      </Slider.Root>
    )
    handleIterationChange = (value) => {
        this.setState( prev => {
            const newSliderValues = {...prev.sliderValues};
            newSliderValues['EpochSlider'] = value[0]*2; 
            return {sliderValues: newSliderValues};
        });
    };

    learningRateSlider = (
        <Slider.Root
        key={this.props.NNIndex}
        className="SliderRoot"
        defaultValue={[null]} //40
        onValueChange={(value) => this.handleLearningRateChange(value)}
        max={70}
        step={10}
        style={{ width: Math.round(0.19 * (window.innerWidth * 0.97)) }}
        disabled={this.props.isTraining[this.props.index] === 1}
      >
        <Slider.Track className="SliderTrack" style={{ height: 3 }}>
          <Slider.Range className="SliderRange" />
        </Slider.Track>
        <Slider.Thumb className="SliderThumb" aria-label="Learning Rate" />
      </Slider.Root>
    );
    handleLearningRateChange = (value) => {
        this.setState( prev => {
            const newSliderValues = {...prev.sliderValues};
            newSliderValues['LRSlider'] = (10 ** ((value[0]/-20)-0.33)).toFixed(Math.round((value[0]+10) / 20));
            return {sliderValues: newSliderValues};
        });
    };

    renderModel = () => {
        console.log('rendering model')  // for debugging, TODO remove
        return (
        <Box style={{ display: 'flex', flex: 3, height: '100vh' }}>
        <div className='cytoscape'style={{top: 5, left: 3, position: 'absolute', width: window.innerWidth*0.65, height: window.innerHeight-130}}></div>
        <Flex direction="column" gap="2" height={'100vh'}>
          <CytoscapeComponent elements={this.props.cytoElements} stylesheet={this.props.cytoStyle} panningEnabled={false} autoungrabify={true} style={ { width: window.innerWidth*0.97, height: window.innerHeight-120, border: "solid", borderColor: "var(--slate-8)", borderRadius: "var(--radius-3)" } } onCy={(cy) => {this.cy = cy;}}/>
          
          <img src={color_scale_pic} alt='Color scale from purple for negative to red for positive' width='20' height='auto' style={{ position: 'absolute', top: 15, left: 15 }}/>

          {((this.props.imageVisibility && this.props.img && this.props.img !== '' && this.props.isTraining===1) &&
            <Flex direction="column" gap="1" style={{ position: 'absolute', bottom: window.innerHeight*0.2, left: window.innerWidth*0.45 }}>
            <img src={this.props.img} alt={`No plots yet`} onLoad={() => {}/*URL.revokeObjectURL(this.props.img)*/} style={{ height: '200px', width: 'auto' }}/>
            {this.props.taskId === 11 && this.props.weights[0] && this.props.biases[0] && (
              <Flex direction="column" gap="0">
              <p>Weight: {Number(this.props.weights[0]).toFixed(3)}</p>
              <p>Bias: {Number(this.props.biases[0]).toFixed(3)}</p>
              </Flex>
            )}
            </Flex>
          )}

          <GenerateFloatingButtons top={window.innerHeight - 223} left={0.1 * (window.innerWidth * 0.97) - 16.5} dist={0.4 * (window.innerWidth * 0.97)/Math.max(this.props.cytoLayers.length-1,1)} isItPlus={true} nLayers={this.props.cytoLayers.length} cytoLayers={this.props.cytoLayers} setCytoLayers={this.props.setCytoLayers} taskId={this.props.taskId} index={this.props.index} NNIndex={this.props.NNIndex} maxNodes={this.props.maxNodes} isTraining={this.props.isTraining}/>                    
          <GenerateFloatingButtons top={window.innerHeight - 178} left={0.1 * (window.innerWidth * 0.97) - 16.5} dist={0.4 * (window.innerWidth * 0.97)/Math.max(this.props.cytoLayers.length-1,1)} isItPlus={false} nLayers={this.props.cytoLayers.length} cytoLayers={this.props.cytoLayers} setCytoLayers={this.props.setCytoLayers} taskId={this.props.taskId} index={this.props.index} NNIndex={this.props.NNIndex} maxNodes={this.props.maxNodes} isTraining={this.props.isTraining}/>
         
          
          <LayerRemoveButton setCytoLayers={this.props.setCytoLayers} index={this.props.NNIndex} taskId={this.props.taskId} cytoLayers={this.props.cytoLayers} isTraining={this.props.isTraining}/>
          <LayerAddButton setCytoLayers={this.props.setCytoLayers} index={this.props.NNIndex} taskId={this.props.taskId} cytoLayers={this.props.cytoLayers} nOfOutputs={this.props.nOfOutputs} maxLayers={this.props.maxLayers} isTraining={this.props.isTraining}/>

        </Flex>
        </Box>
    )}

    additionalComponents = () => {
        return (
        <Box style={{ position:"absolute", top: Math.round(0.5 * (window.innerHeight-140)), left: Math.round(0.7 * (window.innerWidth * 0.97)), alignItems: 'center', justifyContent: 'start', height: '100vh', fontSize: '14px', color: 'var(--slate-11)' }}>
            <div id="/api-data">
              {this.props.isTraining===2 ? (
                <Flex direction='column' >
                  {this.shortDescription}
                  {(this.props.taskId < 20 &&
                  <div style={{ color: this.props.accuracyColor, fontFamily:'monospace' }}><b>R^2: {parseFloat(this.props.errorList[1]).toFixed(2)}</b></div>
                  )}
                  {(this.props.taskId >= 20 &&
                  <div style={{ color: this.props.accuracyColor, fontFamily:'monospace' }}><b>Accuracy: {(parseFloat(this.props.errorList[1])*100).toFixed(2)}%</b></div>
                  )}
                  <canvas ref={this.chartRef} id="myChart" style={{ width: Math.round(0.27 * (window.innerWidth * 0.97)), height: Math.round(0.4 * (window.innerHeight-140)), marginTop:10 }}></canvas>
                </Flex>
              ) : (this.props.isTraining===1 ? (
                <Flex direction= 'column'>
                  <div style={{ fontFamily:'monospace' }}><b>Training... </b></div>
                  <div style={{ fontFamily:'monospace' }}><b>Progress: {Math.round((parseFloat(this.props.progress))*100)}%</b></div>
                  <canvas ref={this.chartRef} id="myChart" style={{ display: this.state.activeTab === 'training' ? 'block' : 'none', width: Math.round(0.27 * (window.innerWidth * 0.97)), height: Math.round(0.35 * (window.innerHeight-140)), marginTop:10 }}></canvas>
                </Flex>
              ) : (
                <div style={{ textAlign:'justify', width: Math.round(0.27 * (window.innerWidth * 0.97)), fontFamily:'monospace' }}>
                  {this.shortDescription}
                </div>
              ))}
            </div>
        </Box>
    )}
}
    
Chart.register(
    CategoryScale, 
    LinearScale, 
    LineController, 
    PointElement, 
    LineElement, 
    Title, 
    Tooltip, 
    Legend
);
    
// INLCUDE THIS AT THE END OF YOUR NEW FILE

function BuildingWrapper(props) {
    const navigate = useNavigate();
  
    return <Building {...props} navigate={navigate} />;
}

export default BuildingWrapper;