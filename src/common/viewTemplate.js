import React from 'react'
import '../css/App.css';
import { Theme, Flex, Box, Tabs, Heading, IconButton, Separator, Checkbox, Text } from '@radix-ui/themes';
import * as SliderSlider from '@radix-ui/react-slider';
import * as Select from '@radix-ui/react-select';
import { PlayIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon, CodeIcon } from '@radix-ui/react-icons';
import CodePreview from '../code_preview/codePreview';
import layersToCode from '../code_preview/codeExplainTools';
import Header from '../common/header';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-animated-slider';
import * as Form from '@radix-ui/react-form';
import horizontalCss from '../css/horizontalSlides.css';
import '@radix-ui/themes/styles.css';
import axios from 'axios';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const loadingLottieFile = process.env.PUBLIC_URL + '/loading.lottie';

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
            'dummyDropdown': <Dropdown options={["Option A", "Option B", "Option C"]} onChange={(selectedOption) => this.handleDropdownChange(selectedOption)} placeholder={"Please select an option"} disabled={this.props.isTraining===1} />
        }

        this.checkboxes = {
            'dummyCheckbox': <Checkbox disabled={this.props.isTraining===1} onClick={this.handleCheckboxChange} checked={false} />
        }

    };


    // DEFAULT FUNCTIONS  // TODO: remove these in your copy
    
    handleTabChange = (value) => {
        this.setState({ activeTab: value });
    };

    componentDidMount() {
        axios.get(window.location.origin + '/api/tasks/?task_id=' + this.props.taskId)
        .then(response => {
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
                { type: 'slider', name, visible: this.props.sliderVisibilities[name] }
            )),
            Object.entries(this.inputFields).map(([name, inputField], index) => (
                { type: 'inputField', name, visible: this.props.inputFieldVisibilities[name] }
            )),
            Object.entries(this.dropdowns).map(([name, dropdown], index) => (
                { type: 'dropdown', name, visible: this.props.dropdownVisibilities[name] }
            )),
            Object.entries(this.checkboxes).map(([name, checkbox], index) => (
                { type: 'checkbox', name, visible: this.props.checkboxVisibilities[name] }
            ))];
        console.log(loglist);
        // TODO: add any additional code that should run after the description is loaded
        console.log("continueComponentDidMount is not implemented in component ", this.props.name)
    }

    valuesUndefined = () => {
        return Object.values(this.props.sliderVisibilities).includes(null) || Object.values(this.state.sliderValues).includes(null);
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
    textHeight = 40
    buttonPosition = Math.round(0.92 * (window.innerHeight-140))

    sliderPosition = (index) => {
        return Math.round((0.14 + 0.12*index) * (window.innerHeight-140))
    }

    inputFieldPosition = (index) => {
        // const n = Object.values(this.props.sliderVisibilities).filter(value => value !== false).length;
        const n = Object.keys(this.sliders).length;
        return Math.round(this.sliderPosition(n) + this.textHeight*index)  // (0.14 + 0.12*Object.keys(this.sliders).length)*(window.innerHeight-140) + this.textHeight*index
    }

    dropdownPosition = (index) => {
        const n = Object.values(this.props.inputFieldVisibilities).filter(value => value !== false).length;  // Object.keys(this.inputFields).length
        return Math.round(this.inputFieldPosition(n) + this.textHeight*index)
    }

    checkboxPosition = (index) => {
        const n = Object.values(this.props.dropdownVisibilities).filter(value => value !== false).length;
        return Math.round(this.dropdownPosition(n) + 1.2*this.textHeight*index)
    }

    renderModel = () => {
        // TODO: define the model view here (large box on the left in the training tab)
        console.log("renderModel is not implemented in component ", this.props.name)
        return (
        <Box style={{ display: 'flex', flex: 3, height: '100vh' }}>
            
        </Box>)
    }

    additionalComponents = () => {
        // TODO: use this to add any additional components like charts or text
        return (
        <Box style={{ position:"absolute", top: Math.round(0.5 * (window.innerHeight-140)), left: Math.round(0.7 * (window.innerWidth * 0.97)), alignItems: 'center', justifyContent: 'start', height: '100vh', fontSize: '14px', color: 'var(--slate-11)' }}>
        <div style={{ textAlign:'justify', width: Math.round(0.27 * (window.innerWidth * 0.97)), fontFamily:'monospace' }}>
            {this.shortDescription}
        </div>
        </Box>
    )}

    // TODO: remove the render function in your copy
    render() {
      if (this.state.loading) {
        console.log("Loading...")
        return <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
          <Box style={{ height: '20vh' }}>
            <DotLottieReact
              src={loadingLottieFile}
              loop
              autoplay
            />
          </Box>
        </Box>
      } else {

        return(
                <div className='buildBody'>
                  <Theme accentColor="cyan" grayColor="slate" panelBackground="solid" radius="large" appearance='light'>
            
                  <Header showHomeButton={true} />
            
                  <Tabs.Root defaultValue="training" style={{ fontFamily:'monospace' }}>
            
                    <Tabs.List size="2">
                        {this.tabs.map(tab => (   // cycle through all possible tabs and include the ones specified in this.props.tab
                        this.props.tabs.includes(tab.value) && (
                        <Tabs.Trigger key={tab.value} value={tab.value} onValueChange={this.handleTabChange}>
                        {tab.name}
                        </Tabs.Trigger>
                        )
                        ))}
                    </Tabs.List>
            
                    <Box px="4" pt="3" pb="0">


                    {/* THE DATA TAB - this tab contains background information in slides, also has space for a plot of the data */}

                    <Tabs.Content value="data">
                      {this.props.taskId !== 0 && (    // a taskId of 0 is used for tutorials
                        <Flex direction="row" gap="2" style={{ overflow: 'auto', fontFamily:'monospace', width: '100%', height: window.innerHeight-116 }}>
                            
                            {/* slides with descriptions loaded from the database */}
                            <Box style={{ flexBasis: '50%' }}>   
                            {this.state.description.length > 0 ? (           
                            <Flex direction='column' gap='2' style={{ padding: '20px 10px', display: 'flex', justifyContent:"center", alignItems:"center" }}>
                                <Flex style={{ flexbasis:'100%', marginBottom: 0, width:'100%' }}>
                                <Slider key={this.state.currentSlide} classNames={horizontalCss} infinite={false} slideIndex={this.state.currentSlide}
                                  previousButton={
                                    <ChevronLeftIcon
                                      style={{ color: 'var(--slate-9)', width:64, height:64 }}
                                      onClick={() => {
                                        const prevSlide = this.state.currentSlide - 1;
                                        if (prevSlide >= 0) {
                                          this.setState({ currentSlide: prevSlide });
                                        }
                                    }}/>}
                                  nextButton={
                                    <ChevronRightIcon
                                      style={{ color: 'var(--slate-9)', width:64, height:64 }}
                                      onClick={() => {
                                        const nextSlide = this.state.currentSlide + 1;
                                        if (nextSlide < this.state.description.length) {
                                          this.setState({ currentSlide: nextSlide });
                                        }
                                    }}/>}
                                >
                                  {this.state.description.map(([subtitle, ...paragraphs], index) => (
                                    <div key={index} className="slide-container">
                                      <div className="slide-content">
                                        <Heading as='h2' size='5' style={{ color: 'var(--slate-12)', marginBottom:7, textAlign:"center" }}>&gt;_{subtitle} </Heading>
                                        {paragraphs.map((paragraph, pIndex) => (
                                          <p key={pIndex} dangerouslySetInnerHTML={{ __html: paragraph }}></p>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </Slider>
                                </Flex>
                            </Flex>
                            ):(<div/>)}
                            </Box>

                            <Separator orientation='vertical' style = {{ height: window.innerHeight-152, position: 'fixed', left: window.innerWidth * 0.5, bottom: (window.innerHeight-92) * 0.5, transform: `translateY(${(window.innerHeight - 152) / 2}px)` }}/>

                          {/* plot of the data */}
                          <Box style={{ flexBasis: '50%', display: 'flex', justifyContent:"center", alignItems:"center", padding: "0px 30px" }}>
                              <img src={this.props.initPlot} alt='Plot of the data' width='auto' height='auto' style={{ maxWidth: '100%', maxHeight: '100%' }} onLoad={() => {}}/>
                          </Box>
                      </Flex>)}
                  </Tabs.Content>
              

                    {/* THE TRAINING TAB - this tab contains the training interface */} 

                    <Tabs.Content value="training">   
                        
                        {this.renderModel()}
                        
                        <Separator orientation='vertical' style = {{ position:"absolute", top: Math.round(0.03 * (window.innerHeight-140)), left: Math.round(0.67 * (window.innerWidth * 0.97)), height: 0.96 * (window.innerHeight-140) }}/>

                        <Box style={{ flex: 1 }}>
                            {Object.entries(this.sliders).map(([name, slider], index) => (
                                this.props.sliderVisibilities[name] ?
                                (<Box style={{ position:"absolute", top: this.sliderPosition(index), left: Math.round(0.74 * (window.innerWidth * 0.97)), alignItems: 'start', justifyContent: 'end', fontFamily:'monospace'  }}>
                                    <div style={{ position:"absolute", zIndex: 9999, top: -30, left: 0.095 * (window.innerWidth * 0.97), transform: 'translateX(-50%)', fontSize: '14px', color: 'var(--slate-11)', whiteSpace: 'nowrap' }}>
                                        {this.inputNames[name]}: {this.state.sliderValues[name]}
                                    </div>
                                    <div className={name}>
                                        {slider}
                                    </div>
                                </Box>) : (<div></div>)
                            ))}

                            {Object.entries(this.inputFields).map(([name, inputField], index) => (
                                this.props.inputFieldVisibilities[name] ?
                                (<Box style={{ position:"absolute", top: this.inputFieldPosition(index), left: Math.round(0.7 * (window.innerWidth * 0.97)), alignItems: 'start', justifyContent: 'end', fontFamily:'monospace'  }}>
                                    <div className={name}>
                                    {this.inputNames[name]}: {inputField}
                                    </div>
                                </Box>) : (<div></div>)
                            ))}

                            {Object.entries(this.dropdowns).map(([name, dropdown], index) => (
                                this.props.dropdownVisibilities[name] ?
                                (<Box style={{ position:"absolute", top: this.dropdownPosition(index), left: Math.round(0.7 * (window.innerWidth * 0.97)), alignItems: 'start', justifyContent: 'end', fontFamily:'monospace'  }}>
                                    <div className={name}>
                                    {this.inputNames[name]}: {dropdown}
                                    </div>
                                </Box>) : (<div></div>)
                            ))}
                            
                            {Object.entries(this.checkboxes).map(([name, checkbox], index) => (
                                this.props.checkboxVisibilities[name] ?
                                (<Text className={name} as = "label" size="2">
                                    <Flex style={{ position:"absolute", top: this.checkboxPosition(index), left: Math.round(0.7 * (window.innerWidth * 0.97)), width: Math.round(0.27 * (window.innerWidth * 0.97)), justifyContent:"flex-start", alignItems:"flex-start"}} gap="2">          
                                    {this.inputNames[name]}: {React.cloneElement(checkbox, {checked: this.state.checkboxValues[name]})}
                                    </Flex>
                                </Text>) : (<div></div>)
                            ))}

                            {this.additionalComponents()}

                            <Flex direction="row" gap="3" style={{ position: 'absolute', transform: 'translateX(-50%)', top: this.buttonPosition, left: Math.round(0.835 * (window.innerWidth * 0.97)), fontFamily:'monospace' }}>
                                <IconButton onClick={this.handleStartClick} variant="solid" color="cyan" style={{ borderRadius: 'var(--radius-3)', width: Math.round(0.12 * (window.innerWidth * 0.97)), height: 36, fontSize: 'var(--font-size-2)', fontWeight: "500" }} 
                                disabled = { this.props.isTraining < 0 || this.valuesUndefined() } >
                                    <Flex direction="horizontal" gap="2" style={{alignItems: "center", fontFamily:'monospace' }}>
                                        {this.props.isTraining === -1 ? "Loading..." : (this.props.isTraining === 1 ? "Cancel" : (<><PlayIcon width="18" height="18" />Start training!</>))}
                                    </Flex>
                                </IconButton>
                                {this.useCodePreview && 
                                <IconButton onClick={this.handleCodeClick} variant="outline" color="cyan" style={{ borderRadius: 'var(--radius-3)', width: Math.round(0.12 * (window.innerWidth * 0.97)), height: 36, fontSize: 'var(--font-size-2)', fontWeight: "500" }}
                                disabled = { this.props.isTraining < 0 || this.valuesUndefined() } >
                                    <Flex direction="horizontal" gap="2" style={{alignItems: "center", fontFamily:'monospace' }}>
                                        {<><CodeIcon width="18" height="18" />Preview in code</>}
                                    </Flex>
                                </IconButton>}
                            </Flex>
                        </Box>
                        {this.state.showCode && <CodePreview code={this.state.code} typ={this.props.typ} /> }
                    </Tabs.Content>


                  {/* THE TESTING TAB - this tab contains the testing interface */}
                  {/* TODO: this was copied from the previous buildView and hence needs thorough testing */}
                  <Tabs.Content value="testing">
                  {this.props.taskId !== 0 && (
                  
                  <Flex direction="row" gap = "3" style={{ display: 'flex' }}>
                      <Box style={{ flexBasis: '50%', justifyContent: 'center', alignItems: 'center', padding: '30px 0px' }}>
                      <Flex direction="column" gap="2" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      
                      {/* This will render the form with the feature names received from the backend, if it exists */}
                      <Form.Root className="FormRoot" onSubmit={this.props.taskId !== 0 ? (event) => this.props.handleSubmit(event, this.props.setIsResponding, this.props.setApiData, this.props.taskId, this.props.index) : () => {}} style={{ fontFamily:'monospace' }}>
                          {this.props.featureNames.length > 0 && this.props.featureNames.map((featureName, index) => (
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
                          {this.props.featureNames.length > 0 &&
                          <Form.Submit asChild>
                          <button className="FormButton" style={{ marginTop: 10, width: window.innerWidth * 0.3 - 30 }}>
                              Predict!
                          </button>
                          </Form.Submit>}
                      </Form.Root>
                      <div id="query-response" style={{ fontFamily:'monospace' }}>
                          {this.props.isResponding===2 ? (
                              <div>Output: {this.props.apiData["in_out"]}</div>
                          ) : (this.props.isResponding===1 ? (
                              <div>Getting your reply...</div>
                          ) : (
                              <div></div>
                          )
                          )}
                          </div>
                      </Flex>
                      </Box>
                      <Separator orientation='vertical' style = {{ height: window.innerHeight-152, position: 'fixed', left: window.innerWidth * 0.5, bottom: (window.innerHeight-92) * 0.5, transform: `translateY(${(window.innerHeight - 152) / 2}px)` }}/>
                      <Box style={{ flexBasis: '50%', justifyContent: 'center', alignItems: 'center' }}>
                      {/* This will render the images, if they exist */}
                      <Flex direction="column" gap="2" style={{ justifyContent: 'center', alignItems: 'center', padding: '30px 30px' }}>
                          {this.props.img ? (
                          <img src={this.props.img} alt={`Plot of the data`} onLoad={() => {}/*URL.revokeObjectURL(this.props.img)*/}/>
                          ) : (
                          <div>No image available. Try reloading the page? If this problem persists, please contact us.</div>
                          )}
                      {/* TODO: Turn this into a pretty animation */}
                      </Flex>
                      </Box>
                  </Flex>
                  )}
                  </Tabs.Content>


                    {/* ADD MORE TABS IF NECESSARY */}

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