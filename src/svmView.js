import React from 'react'
import { Theme, Flex, Box, Checkbox } from '@radix-ui/themes';
import * as SliderSlider from '@radix-ui/react-slider';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-animated-slider';
import '@radix-ui/themes/styles.css';
import { Model } from './common/viewTemplate';


// This is a template for creating a new view in the application, similar to buildView. 
// To implement a new view, simply copy this file and address all the TODOs (search for "TODO" in the file).

class SvmView extends Model {

    // INITIALIZATION
    constructor(props) {
      super(props);

      this.state = {
        currentSlide: 0,
        activeTab: 'training',
        showCode: false,
        code: '',
        description: [],

        sliderValues: {'CSlider': 1, 'GammaSlider': 1},
        checkboxValues: {'KernelCheckbox': false},
        F1Score: null
      };


        this.useCodePreview = false

        this.tabs = [
            { name: 'Data', value: 'data' },
            { name: 'Model', value: 'training' },
            { name: 'Result', value: 'testing' },
        ]

        this.inputNames = {
            'CSlider': 'Misclassification cost',
            'GammaSlider': 'Kernel width',
            'KernelCheckbox': 'Enable rbf kernel'
        } 

        this.sliders = {
            'CSlider': this.cSlider,
            'GammaSlider': this.gammaSlider
        }

        this.checkboxes = {
            'KernelCheckbox': <Checkbox disabled={this.props.isTraining===1} onClick={this.handleCheckboxChange} checked={this.state.checkboxValues['KernelCheckbox']} />
        }

        this.inputFields = {};
        this.dropdowns = {};
    };
    
    // CUSTOMIZABLE FUNCTIONS

    continueComponentDidMount = () => {
        this.props.loadData(this.props.taskId, this.props.index)  // let the backend load the data  // TODO
    }

    componentWillUnmount() {
        if (this.props.isTraining === 1) {
          this.props.cancelRequest();
        }
      }

    valuesUndefined = () => {
        return Object.values(this.props.sliderVisibilities).includes(null) || Object.values(this.state.sliderValues).includes(null);
    }
    
    handleStartClick = (() => {
        let inThrottle;
        return (event) => {
            if (!inThrottle && this.props.taskId !== 0) { 
            if (this.props.isTraining === 1) {
                this.props.cancelRequestRef.current(this.props.taskId, this.props.index)
            } else { 
                let trainingParams = {
                    userId: this.props.userId,
                    taskId: this.props.taskId,
                    fileName: this.props.fileName,
                    functionName: this.props.functionName, 
                    dataset: this.props.dataset,
                    cValue: this.state.sliderValues['CSlider'],
                    gammaValue: this.state.sliderValues['GammaSlider'],
                    kernelValue: this.state.checkboxValues['KernelCheckbox'] ? 'rbf' : 'linear',
                    linearlySeparable: !this.props.sliderVisibilities['CSlider'],
                    normalization: this.props.normalization,
                    img: this.props.img,
                    setImgs: this.props.setImgs,
                    setF1Score: this.setF1Score,
                    setApiData: this.props.setApiData,
                    setIsTraining: this.props.setIsTraining,
                    index: this.props.SVMIndex,
                    globalIndex: this.props.index,
                    intervalTimeout: this.props.intervalTimeout,
                    cancelRequestRef: this.props.cancelRequestRef
                }
                this.props.startTraining(event, trainingParams, 'SVM');
            }
            inThrottle=true
            setTimeout(() => inThrottle = false, 2*this.props.pendingTime);
            }
        };
    })();

    handleCodeClick = (event) => {
        this.setState({
            // TODO: implement the relevant code function
            code: "print('Hello World!')",
            showCode: true
        });
        window.scrollTo(0, document.body.scrollHeight); // Scroll to the bottom of the page
    }

    handleCheckboxChange = () => {
        console.log('Checkbox clicked, changing to ', !this.state.checkboxValues['KernelCheckbox'])
        this.setState( prev => {
            const newCheckboxValues = {...prev.checkboxValues};
            newCheckboxValues['KernelCheckbox'] = !prev.checkboxValues['KernelCheckbox'];
            return {checkboxValues: newCheckboxValues};
        });
    }

    cSlider = (
        <SliderSlider.Root
          className="SliderRoot"
          defaultValue={[0.5]}
          onValueChange={(value) => this.handleCChange(value)}
          min={0}
          max={3.5}
          step={0.5}
          style={{ width: Math.round(0.16 * (window.innerWidth * 0.97)), margin: 10 }}
          disabled={this.props.isTraining===1}
        >
          <SliderSlider.Track className="SliderTrack" style={{ height: 3 }}>
            <SliderSlider.Range className="SliderRange" />
          </SliderSlider.Track>
          <SliderSlider.Thumb className="SliderThumb" aria-label="C" />
        </SliderSlider.Root>
    );
    handleCChange = (value) => {
        this.setState( prev => {
            const newSliderValues = {...prev.sliderValues};
            newSliderValues['CSlider'] = (value[0] % 1 + 0.5) * 10**Math.floor(value[0]);
            return {sliderValues: newSliderValues};
        });
    };
    
    gammaSlider = (
        <SliderSlider.Root
        className="SliderRoot"
        defaultValue={[-0.5]} 
        onValueChange={(value) => this.handleGammaChange(value)}
        min={-0.5}
        max={3.5}
        step={0.5}
        style={{ width: Math.round(0.19 * (window.innerWidth * 0.97)) }}
        disabled={this.props.isTraining[this.props.index] === 1}
      >
        <SliderSlider.Track className="SliderTrack" style={{ height: 3 }}>
          <SliderSlider.Range className="SliderRange" />
        </SliderSlider.Track>
        <SliderSlider.Thumb className="SliderThumb" aria-label="Gamma" />
      </SliderSlider.Root>
    );
    handleGammaChange = (value) => {
        this.setState( prev => {
            const newSliderValues = {...prev.sliderValues};
            newSliderValues['GammaSlider'] = (Math.abs(value[0] % 1) + 0.5) * 10**(-Math.round(value[0]));
            return {sliderValues: newSliderValues};
        });
    };

    setF1Score = (value) => {
        this.setState({F1Score: value})
    }


    // FINALLY, THE RENDER

    renderModel = () => {
        return (
        <Box style={{ display: 'flex', flex: 3, height: '100vh' }}>
            {console.log('SVM img & initPlot', this.props.img, this.props.initPlot)}
            {this.props.img ? (
                <img 
                    src={this.props.img} 
                    alt={"Plot of the decision boundary"} 
                    style={{ 
                        maxWidth: '80%', 
                        maxHeight: '80%', 
                        objectFit: 'contain' 
                    }} 
                />
            ) : (
                <img 
                    src={this.props.initPlot} 
                    alt={"Plot of the data"} 
                    style={{ 
                        maxWidth: '80%', 
                        maxHeight: '80%', 
                        objectFit: 'contain' 
                    }} 
                />
            )}
        </Box>)
    }

    additionalComponents = () => {
        return (
        <Box style={{ position:"absolute", top: Math.round(0.5 * (window.innerHeight-140)), left: Math.round(0.7 * (window.innerWidth * 0.97)), alignItems: 'center', justifyContent: 'start', height: '100vh', fontSize: '14px', color: 'var(--slate-11)' }}>
            <div style={{ textAlign:'justify', width: Math.round(0.27 * (window.innerWidth * 0.97)), fontFamily:'monospace' }}>
                {this.shortDescription}
            </div>
        </Box>
    )}

}



function SvmWrapper(props) {
    const navigate = useNavigate();
  
    return <SvmView {...props} navigate={navigate} />;
}

export default SvmWrapper;