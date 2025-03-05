import React, { lazy, Suspense, useState, useEffect } from 'react'
import '../css/App.css';
import { Theme, Flex, Box, Tabs, IconButton, Separator, Checkbox, Text } from '@radix-ui/themes';
import * as SliderSlider from '@radix-ui/react-slider';
import * as Select from '@radix-ui/react-select';
import { PlayIcon, ChevronDownIcon, ChevronUpIcon, CodeIcon } from '@radix-ui/react-icons';
import CodePreview from '../code_preview/codePreview';
import SvmCodePreview from '../code_preview/svmCodePreview';
import Header from '../common/header';
import { useNavigate } from 'react-router-dom';
import '@radix-ui/themes/styles.css';
import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import ReactMarkdown from 'react-markdown';
import { safeGet } from '../utils/axiosUtils';
const DataTab = lazy(() => import('./dataTab'));
const TestingTab = lazy(() => import('./testingTab'));

// This is a template for creating a new view in the application, similar to buildView. 
// To implement a new view, simply copy this file and address all the TODOs (search for "TODO" in the file).

// TODO: make sure you have the necessary imports

// TODO: replace this with
// class ... extends Model {
class Model extends React.Component {

    // INITIALIZATION
    constructor(props) {
      super(props);
      // TODO: make sure you pass these props: isTraining, taskId, cancelRequestRef, index, name, startTraining, pendingTime, tabs, initPlot,sliderValues, sliderVisibilities, inputFieldVisibilities, dropdownVisibilities, checkboxVisibilities, setIsResponding, isResponding, apiData, setApiData, handleSubmit, featureNames, img & typ

      this.state = {
        loading: true,
        currentSlide: 0,
        activeTab: 'training',
        showCode: false,
        code: '',
        description: [],
        sliderVisibilities: [], 
        inputFieldVisibilities: [], 
        dropdownVisibilities: [], 
        checkboxVisibilities: [], 
        // TODO: add all your states here
        sliderValues: {'dummySlider': 50},
      };

        // TODO: specify which tabs, sliders, input fields, dropdowns, and checkboxes should be included

        this.useCodePreview = true

        this.tabs = [
            { name: 'Data', value: 'data' },
            { name: 'Model', value: 'training' },
            { name: 'Result', value: 'testing' },
        ]

        this.inputNames = {
            'dummySlider': 'Dummy 1',
            'dummyInputField': 'Dummy 2',
            'dummyDropdown': 'Dummy 3',
            'dummyCheckbox': 'Dummy 4'
        }

        const dummySlider = (
            <SliderSlider.Root
              className="SliderRoot"
              defaultValue={[45]}
              onValueChange={(value) => this.handleSliderChange(value)}
              min={0}
              max={100}
              step={1}
              style={{ width: Math.round(0.16 * (window.innerWidth * 0.97)), margin: 10 }}
              disabled={this.props.isTraining===1}
            >
              <SliderSlider.Track className="SliderTrack" style={{ height: 3 }}>
                <SliderSlider.Range className="SliderRange" />
              </SliderSlider.Track>
              <SliderSlider.Thumb className="SliderThumb" aria-label="Weight" />
            </SliderSlider.Root>
        );

        const Dropdown = ({ label, options, onChange, placeholder, disabled }) => (
            <Select.Root onValueChange={onChange} disabled={disabled} >
              <Select.Trigger className="SelectTrigger" aria-label={label}>
                <Select.Value placeholder={placeholder} />
                <Select.Icon className="SelectIcon">
                  <ChevronDownIcon />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="SelectContent" >
                  <Select.ScrollUpButton className="SelectScrollButton">
                    <ChevronUpIcon />
                  </Select.ScrollUpButton>
                  <Select.Viewport className="SelectViewport">
                    <Select.Group>
                    {options.map((option) => (
                        <Select.Item key={option} value={option} className="SelectItem" style={{ margin: 5, marginLeft:10 }}>
                            <Select.ItemText>{option}</Select.ItemText>
                        </Select.Item>
                    ))}
                    </Select.Group>
                  </Select.Viewport>
                  <Select.ScrollDownButton className="SelectScrollButton">
                    <ChevronDownIcon />
                  </Select.ScrollDownButton>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
        );
          
        this.sliders = {
            'dummySlider': dummySlider
        }

        this.inputFields = {
            'dummyInputField': <input type="number" onChange={(event) => this.handleInputChange(event)} disabled={this.props.isTraining===1} style={ {width:100} } />
        }

        this.dropdowns = {
            'dummyDropdown': <Dropdown options={["Option A", "Option B", "Option C"]} onChange={(selectedOption) => this.handleDropdownChange(selectedOption)} placeholder={"Select..."} disabled={this.props.isTraining===1} />
        }

        this.checkboxes = {
            'dummyCheckbox': <Checkbox disabled={this.props.isTraining===1} onClick={this.handleCheckboxChange} checked={false} />
        }

    };


    // DEFAULT FUNCTIONS  // TODO: remove these in your copy
    
    handleTabChange = (value) => {
        this.setState({ showCode: false, activeTab: value });
    };

    componentDidMount() {
        safeGet(window.location.origin + '/api/tasks/?task_id=' + this.props.taskId)
        .then(response => {
          // hide the preloader when page loads
          const preloader = document.getElementById("preloader");
          if (preloader) {
            preloader.style.display = "none";
          }

          this.setState({
            sliderVisibilities: this.props.sliderVisibilities, 
            inputFieldVisibilities: this.props.inputFieldVisibilities, 
            dropdownVisibilities: this.props.dropdownVisibilities, 
            checkboxVisibilities: this.props.checkboxVisibilities, 
          })
          
          this.shortDescription = response.data.short_description;

          if (response.data.description[0] === '[') {
            this.setState({ description: JSON.parse(response.data.description) });
          } else {
            this.createDescriptionList(response.data.description);
          }
          this.continueComponentDidMount();
        })
        .catch(error => {
          console.error('Task description error:', error);
          this.setState({ description: ["Error while Loading Description", "There was an error loading the task description. You should be able to continue, but notify us if this issue persists."] });
          this.continueComponentDidMount();
        });
      }

    componentWillUnmount() {
        if (this.props.isTraining === 1) {
            this.props.cancelRequest();
        }
    }

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

      goToSlide = (index) => {
        this.setState({ currentSlide: index });
      };

      debounce(func, delay) {
        let debounceTimer;
        return function(...args) {
          const context = this;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
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

    
    // CUSTOMIZABLE FUNCTIONS

    continueComponentDidMount = () => {
        let loglist = [...
            Object.entries(this.sliders).map(([name, slider], index) => (
                { type: 'slider', name, visible: this.state.sliderVisibilities[name] }
            )),
            Object.entries(this.inputFields).map(([name, inputField], index) => (
                { type: 'inputField', name, visible: this.state.inputFieldVisibilities[name] }
            )),
            Object.entries(this.dropdowns).map(([name, dropdown], index) => (
                { type: 'dropdown', name, visible: this.state.dropdownVisibilities[name] }
            )),
            Object.entries(this.checkboxes).map(([name, checkbox], index) => (
                { type: 'checkbox', name, visible: this.state.checkboxVisibilities[name] }
            ))];
        console.log(loglist);
        // TODO: add any additional code that should run after the description is loaded
        console.log("continueComponentDidMount is not implemented in component ", this.props.name)
    }

    valuesUndefined = () => {
        return Object.values(this.state.sliderVisibilities).includes(null) || Object.values(this.state.sliderValues).includes(null);
    }
    
    handleStartClick = (() => {
        console.log("handleStartClick is not implemented in component ", this.props.name)
        let inThrottle;
        return (event) => {
            if (!inThrottle && this.props.taskId !== 0) { 
            if (this.props.isTraining === 1) {
                this.props.cancelRequestRef.current(this.props.taskId, this.props.index)
            } else { 
                let trainingParams = {
                // TODO: use props to set the training parameters
                }
                this.props.startTraining(event, trainingParams);
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

    // TODO: implement the necessary handle...Change functions

    handleSliderChange = (value) => {
        this.setState({ dummySliderValue: value });
        console.log("handleSliderChange is not implemented in component ", this.props.name)
    }
    
    handleInputChange = (event) => {
        console.log("handleInputChange is not implemented in component ", this.props.name)
    }

    handleDropdownChange = (selectedOption) => {
        console.log("handleDropdownChange is not implemented in component ", this.props.name)
    }

    handleCheckboxChange = () => {
        console.log("handleCheckboxChange is not implemented in component ", this.props.name)
    }


    // FINALLY, THE RENDER
    // TODO: delete the functions you don't change

    // TODO: tune the vertical positioning here
    sliderBottomMargin = -20
    textHeight = 40
    buttonPosition = Math.round(0.92 * (window.innerHeight-140))

    sliderPosition = (index) => {
      // Position sliders at the top
      return Math.round((0.14 + 0.12 * index) * (window.innerHeight - 140));
    }

    inputFieldPosition = (index) => {
      // Position input fields below the sliders
      const visibleSliderCount = Object.keys(this.sliders).filter(key => this.props.sliderVisibilities[key]).length;
      console.log("visibleSliderCount: ", visibleSliderCount);
      return Math.round(this.sliderPosition(visibleSliderCount) + 1.2 * this.textHeight * index + this.sliderBottomMargin);
    }

    dropdownPosition = (index) => {
      // Position dropdowns below the input fields
      const visibleInputCount = Object.keys(this.inputFields).filter(key => this.props.inputFieldVisibilities[key]).length;
      console.log("visibleInputCount: ", visibleInputCount);
      return Math.round(this.inputFieldPosition(visibleInputCount) + 1.2 * this.textHeight * index);
    }

    checkboxPosition = (index) => {
      // Position checkboxes below the dropdowns
      const visibleDropdownCount = Object.keys(this.dropdowns).filter(key => this.props.dropdownVisibilities[key]).length;
      console.log("visibleDropdownCount: ", visibleDropdownCount);
      return Math.round(this.dropdownPosition(visibleDropdownCount) + 1.2 * this.textHeight * index);
    }

    renderModel = () => {
        // TODO: define the model view here (large box on the left in the training tab)
        console.log("renderModel is not implemented in component ", this.props.name)
        return (
        <Box style={{ display: 'flex', flex: 3, height: '100vh' }}>
            
        </Box>)
    }

    additionalComponents = (dropdownVisibilities, checkboxVisibilities) => {
        // TODO: use this to add any additional components like charts or text
        return (
        <Box style={{ position:"absolute", top: Math.round(0.5 * (window.innerHeight-140)), left: Math.round(0.7 * (window.innerWidth * 0.97)), alignItems: 'center', justifyContent: 'start', height: '100vh', fontSize: '14px', color: 'var(--slate-11)' }}>
        <div style={{ textAlign:'justify', width: Math.round(0.27 * (window.innerWidth * 0.97)), fontFamily:'monospace' }}>
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{this.shortDescription}</ReactMarkdown>
        </div>
        </Box>
    )}

    render() {
      const preloader = document.getElementById("preloader");
      
      if (this.state.loading) {
        if (preloader) { preloader.style.display = "flex"; };
      } else {
        if (preloader) { preloader.style.display = "none"; };

      const DelayedFallback = () => {
        const [show, setShow] = useState(false);
        
        useEffect(() => {
          const timer = setTimeout(() => setShow(true), 500); // Only show loading after 500ms
          return () => clearTimeout(timer);
        }, []);
        
        return show ? <div>Loading...</div> : null;
      };

        return(
                <div className='buildBody'>
                  <Theme accentColor="cyan" grayColor="slate" panelBackground="solid" radius="large" appearance='light'>
            
                  <Header showHomeButton={true} />
            
                  <Tabs.Root value={this.state.activeTab} onValueChange={this.handleTabChange} >
            
                    <Tabs.List size="2">
                        {this.tabs.map(tab => (   // cycle through all possible tabs and include the ones specified in this.props.tab
                        this.props.tabs.includes(tab.value) && (
                        <Tabs.Trigger key={tab.value} value={tab.value}>
                        {tab.name}
                        </Tabs.Trigger>
                        )
                        ))}
                    </Tabs.List>
            
                    <Box px="4" pt="3" pb="0">


                    {/* THE DATA TAB - this tab contains background information in slides, also has space for a plot of the data */}

                    <Tabs.Content value="data">
                      {this.props.taskId !== 0 && (    // a taskId of 0 is used for tutorials
                        <Suspense fallback={<DelayedFallback />}>
                          <DataTab 
                              description={this.state.description}
                              currentSlide={this.state.currentSlide}
                              setCurrentSlide={(slide) => this.setState({ currentSlide: slide })}
                              initPlot={this.props.initPlot}
                          />
                        </Suspense>
                      )}
                  </Tabs.Content>
              

                    {/* THE TRAINING TAB - this tab contains the training interface */} 

                    <Tabs.Content value="training" style={{ fontFamily:'monospace' }}>   
                        
                        {this.renderModel()}
                        
                        <Separator orientation='vertical' style = {{ position:"absolute", top: Math.round(0.03 * (window.innerHeight-140)), left: Math.round(0.67 * (window.innerWidth * 0.97)), height: 0.96 * (window.innerHeight-140) }}/>

                        <Box style={{ flex: 1 }}>
                            {Object.keys(this.props.sliderVisibilities).filter(key => this.props.sliderVisibilities[key]).map((name, index) => (
                                this.state.sliderVisibilities[name] ?
                                (<Box style={{ position:"absolute", top: this.sliderPosition(index), left: Math.round(0.74 * (window.innerWidth * 0.97)), alignItems: 'start', justifyContent: 'end', fontFamily:'monospace'  }}>
                                    <div style={{ position:"absolute", zIndex: 9999, top: -30, left: 0.095 * (window.innerWidth * 0.97), transform: 'translateX(-50%)', fontSize: '14px', color: 'var(--slate-11)', whiteSpace: 'nowrap' }}>
                                      {typeof this.inputNames[name] === 'string' ? 
                                          <label>{this.inputNames[name]}</label> :
                                          this.inputNames[name]
                                      }: <b>{this.state.sliderValues[name]}</b>
                                    </div>
                                    <div className={name}>
                                        {this.sliders[name]}
                                    </div>
                                </Box>) : (<div></div>)
                            ))}

                            {Object.keys(this.props.inputFieldVisibilities).filter(key => this.props.inputFieldVisibilities[key]).map(([name, inputField], index) => (
                                this.state.inputFieldVisibilities[name] ?
                                (<Box style={{ position:"absolute", top: this.inputFieldPosition(index), left: Math.round(0.7 * (window.innerWidth * 0.97)), alignItems: 'start', justifyContent: 'end', fontFamily:'monospace'  }}>
                                    <div className={name}>
                                      {typeof this.inputNames[name] === 'string' ? 
                                          <label>{this.inputNames[name]}</label> :
                                          this.inputNames[name]
                                      }: {this.inputFields[name]}
                                    </div>
                                </Box>) : (<div></div>)
                            ))}

                            {Object.keys(this.props.dropdownVisibilities).filter(key => this.props.dropdownVisibilities[key]).map((name, index) => (
                                this.state.dropdownVisibilities[name] ?
                                (<Box style={{ position:"absolute", top: this.dropdownPosition(index), left: Math.round(0.7 * (window.innerWidth * 0.97)), alignItems: 'start', justifyContent: 'end', fontFamily:'monospace'  }}>
                                    <div className={name}>
                                      {typeof this.inputNames[name] === 'string' ? 
                                          <label>{this.inputNames[name]}</label> :
                                          this.inputNames[name]
                                      }: {this.dropdowns[name]}
                                    </div>
                                </Box>) : (<div></div>)
                            ))}
                            
                            {Object.keys(this.props.checkboxVisibilities).filter(key => this.props.checkboxVisibilities[key]).map((name, index) => (
                                this.state.checkboxVisibilities[name] ?
                                (<Text className={name} as = "label" size="2">
                                    <Flex style={{ position:"absolute", top: this.checkboxPosition(index), left: Math.round(0.7 * (window.innerWidth * 0.97)), width: Math.round(0.27 * (window.innerWidth * 0.97)), justifyContent:"flex-start", alignItems:"flex-start"}} gap="2">          
                                      {typeof this.inputNames[name] === 'string' ? 
                                          <label>{this.inputNames[name]}</label> :
                                          this.inputNames[name]
                                      }: {React.cloneElement(this.checkboxes[name], {checked: this.state.checkboxValues[name]})}
                                    </Flex>
                                </Text>) : (<div></div>)
                            ))}

                            {this.additionalComponents(this.state.dropdownVisibilities, this.state.checkboxVisibilities)}

                            <Flex direction="row" gap="3" style={{ position: 'absolute', transform: 'translateX(-50%)', top: this.buttonPosition, left: Math.round(0.835 * (window.innerWidth * 0.97)) }}>
                                <IconButton onClick={this.handleStartClick} variant="solid" color="cyan" style={{ borderRadius: 'var(--radius-3)', width: Math.round(0.12 * (window.innerWidth * 0.97)), height: 36, fontSize: 'var(--font-size-2)', fontWeight: "500" }} 
                                disabled = { this.props.isTraining < 0 || this.valuesUndefined() } >
                                    <Flex direction="horizontal" gap="2" style={{alignItems: "center", fontFamily:'monospace' }}>
                                        {this.props.isTraining === -1 ? "Loading..." : (this.props.isTraining === 1 ? "Cancel" : (<><PlayIcon width="18" height="18" />Start training!</>))}
                                    </Flex>
                                </IconButton>
                                {this.useCodePreview && 
                                <IconButton onClick={this.handleCodeClick} variant="outline" color="cyan" style={{ borderRadius: 'var(--radius-3)', width: Math.round(0.12 * (window.innerWidth * 0.97)), height: 36, fontSize: 'var(--font-size-2)', fontWeight: "500" }}
                                disabled = { this.props.isTraining < 0 || this.props.isTraining == 1 || this.valuesUndefined() } >
                                    <Flex direction="horizontal" gap="2" style={{alignItems: "center", fontFamily:'monospace' }}>
                                        {<><CodeIcon width="18" height="18" />Preview in code</>}
                                    </Flex>
                                </IconButton>}
                            </Flex>
                        </Box>
                        {this.state.showCode && (
                            this.props.taskId < 30 ? 
                            <SvmCodePreview code={this.state.code} sliderVisibilities={this.state.sliderVisibilities} /> :
                            <CodePreview code={this.state.code} typ={this.props.typ} />
                        )}
                    </Tabs.Content>


                  {/* THE TESTING TAB - this tab contains the testing interface */}
                  {/* TODO: this was copied from the previous buildView and hence needs thorough testing */}
                  <Tabs.Content value="testing">
                  {this.props.taskId !== 0 && (
                    <Suspense fallback={<DelayedFallback />}>
                      <TestingTab 
                          taskId={this.props.taskId}
                          featureNames={this.props.featureNames}
                          handleSubmit={this.props.handleSubmit}
                          setIsResponding={this.props.setIsResponding}
                          setApiData={this.props.setApiData}
                          index={this.props.index}
                          isResponding={this.props.isResponding}
                          apiData={this.props.apiData}
                          img={this.props.img}
                      />
                    </Suspense>
                  )}
                  </Tabs.Content>

                </Box>
                </Tabs.Root>
                </Theme>
                </div>
        )
      }
    }
}


// INCLUDE THIS AT THE END OF YOUR NEW FILE

function DefaultView(props) {
    const navigate = useNavigate();
  
    return <Model {...props} navigate={navigate} />;
  }

export {DefaultView, Model};