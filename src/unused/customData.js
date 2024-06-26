import React from 'react'
import '../css/App.css';
import { Theme, Flex, Box, Tabs, Heading, Grid, IconButton, Separator, Checkbox, Text, Button } from '@radix-ui/themes';
import * as Form from '@radix-ui/react-form';
import '@radix-ui/themes/styles.css';
import tu_delft_pic from "../images/tud_black_new.png";
import color_scale_pic from "../images/color_scale_2.png";
import { Link } from 'react-router-dom';
import CytoscapeComponent from 'react-cytoscapejs';
import { PlayIcon, HomeIcon } from '@radix-ui/react-icons';
import Joyride from 'react-joyride';
//import { create } from 'filepond';
import 'filepond/dist/filepond.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type' ;
import { useNavigate } from 'react-router-dom';
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
import axios from 'axios';
// Import React FilePond
import { FilePond, registerPlugin } from 'react-filepond'
// Import FilePond styles
import 'filepond/dist/filepond.min.css'
import { GenerateFloatingButtons, LayerRemoveButton, LayerAddButton } from '../common/floatingButtons';

// Register the plugin
registerPlugin(FilePondPluginFileValidateType);

function BuildingWrapperWithUpload(props) {
  const navigate = useNavigate();

  const [files, setFiles] = React.useState([]);

  return <Building {...props} files={files} setFiles={setFiles} navigate={navigate} />;
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
class Building extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      description: [],
      printedDescription: '',
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
        },
        // Add more steps as needed
      ],
    };
  }
  shortDescription = 'Please reload the page to load the task description';

  typeWriter = (txt, speed=15, i=0) => {
    if (i < txt.length) {
      this.setState({ printedDescription: this.state.printedDescription + txt.charAt(i)})
      setTimeout(() => this.typeWriter(txt, speed, i + 1), speed);
    }
  };

  componentDidMount() {
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
    this.props.loadLastCytoLayers(this.props.setCytoLayers, this.props.apiData, this.props.setApiData, 'cytoLayers' + this.props.taskId, this.props.taskId, this.props.index, this.props.nOfInputs, this.props.nOfOutputs);
    this.props.updateCytoLayers(this.props.setCytoLayers, this.props.nOfInputs, this.props.nOfOutputs, this.props.index);
    }

    axios.get(window.location.origin + '/api/tasks/?task_id=' + this.props.taskId)
    .then(response => {
      this.shortDescription = response.data.short_description;
      if (response.data.description[0] === '[') {
        this.setState({ description: JSON.parse(response.data.description) });
        console.log("Attempting to set the array")
      } else {
        if (response.data.description[0] === 't') {
          console.log("Attempting to convert to array")
          this.createDescriptionList(response.data.description);
        } else {
          this.typeWriter(response.data.description);  // this works
        }
      }
    })
    .catch(error => {
      console.error('Task description error:', error);
      this.typeWriter("There was an error loading the task description. Please try reloading the paper or contact us");
    });
  }

  chartRef = React.createRef();
  chartInstance = null;

  componentDidUpdate(prevProps) {
    if (this.cy) {this.cy.resize();console.log("Resizing cytoscape");} // this seems to do nothing
    if (this.props.taskId !== 0 && this.chartRef.current) {
      const ctx = this.chartRef.current.getContext('2d');

      if (this.chartInstance && (JSON.stringify(this.props.errorList[0].slice(0, prevProps.errorList[0].length)) === JSON.stringify(prevProps.errorList[0]) && this.props.errorList[0].length > prevProps.errorList[0].length)) {
        // Update the chart if the error list has changed and is longer than before
        console.log("Updating chart")
        this.chartInstance.data.labels = this.props.errorList[0].map((_, i) => i + 1);
        this.chartInstance.data.datasets[0].data = this.props.errorList[0];
        this.chartInstance.update();
      } else {
        // Destroy the old chart if a different error list was received and a chart exists
        if (JSON.stringify(this.props.errorList[0].slice(0, prevProps.errorList[0].length)) !== JSON.stringify(prevProps.errorList[0])) {
          // If an old chart exists, destroy it
          if (this.chartInstance) {
            console.log("Destroying old chart")
            this.chartInstance.destroy();
            this.chartInstance = null;
          }
        } 
      }
      // Create a new chart if there is no chart
      if (this.chartInstance === null) {
        // create a new chart
        console.log("Creating new chart")
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

  handleJoyrideCallback = (data) => {
    const { action, status } = data;

    if (action === 'skip' || status === 'finished') {
      this.props.navigate('/');
    }
  }

  handleFileUpload = event => {
    const file = event.target.files[0];
    this.props.setFiles([file]);
    const reader = new FileReader();
  
    reader.onload = (event) => {
      // event.target.result contains the file content as text
      const fileContent = event.target.result;
      // Now you can send this content to the server
    };
  
    reader.readAsText(file);
  };

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
          paragraph.replace(/\*([^*]+)\*/g, '<b>$1</b>')
        );
        return [subtitle, ...formattedParagraphs];
      });
      this.setState({ description: descriptionList });
    } catch (error) {
      console.error('Error parsing JSON or formatting description:', error);
    }
  }
  

  render() {

    return(
    <div className='buildBody'>
      <Theme accentColor="cyan" grayColor="slate" panelBackground="solid" radius="large" appearance='light'>
      <Box py="2" style={{ backgroundColor: "var(--cyan-10)"}}>
        <Grid columns='3' mt='1'>
          <Box ml='3' style={{display:"flex"}}>  
            <Link to="/">
              <IconButton aria-label="navigate to home" height='21' style={{ marginLeft: 'auto', color: 'inherit', textDecoration: 'none' }}>
                <HomeIcon color="white" height='18' style={{ marginTop: 2 }} />
              </IconButton>
            </Link>
          </Box>
          <Link to={window.location.origin} style={{ textDecoration: 'none' }}>
          <Heading as='h1' align='center' size='6' style={{ color: 'var(--gray-1)', marginTop: 2, marginBottom: 0, textDecoration: 'none', fontFamily:'monospace, Courier New, Courier' }}>brAIn builder</Heading>
          </Link>
          <Box align='end' mr='3' >
            <Link to="https://www.tudelft.nl/en/" target="_blank" style={{ textDecoration: 'none'}}>
              <img src={tu_delft_pic} alt='Tu Delft Logo' width='auto' height='30'/>
            </Link>
          </Box>
        </Grid>
      </Box>

      <Tabs.Root defaultValue="upload" style={{ fontFamily:'monospace' }}>

        <Tabs.List size="2">
          <Tabs.Trigger value="task" >Background Info</Tabs.Trigger>
          <Tabs.Trigger value="upload" >Upload Data</Tabs.Trigger>
          <Tabs.Trigger value="building" >Build</Tabs.Trigger>
          <Tabs.Trigger value="stuff">Result</Tabs.Trigger>
          <Tabs.Trigger value="notebook">Notebook Test</Tabs.Trigger>
        </Tabs.List>

        <Box px="4" pt="3" pb="0">
        <Tabs.Content value="task">
          {this.props.taskId !== 0 && (
          <Flex direction="row" gap="2" >
          <Box style={{ flex: 2, overflow: 'auto', padding: '20px 300px', fontFamily:'monospace' }}>
            {this.state.description.length > 0 ? (
              this.state.description.map(([subtitle, ...paragraphs], index) => (
              <div key={index}>
                <Heading as='h2' size='5' style={{ color: 'var(--slate-12)', marginBottom:7 }}>&gt;_{subtitle} </Heading>
                {paragraphs.map((paragraph, pIndex) => (
                  <p key={pIndex} dangerouslySetInnerHTML={{ __html: paragraph }}></p>
                ))}
              </div>
              ))
            ) : (
              <div style={{ textAlign:'justify', marginBottom: '20px' }}>
                <Heading as='h2' size='5' style={{ color: 'var(--slate-12)', marginBottom:7 }}>&gt;_Task Description </Heading>
                {this.state.printedDescription}
              </div>
            )}
          </Box>
          <Separator orientation='vertical' style = {{ height: window.innerHeight-110 }}/>
            {/* next to this, plot the dataset */}
            <Box style={{ flex: 1, padding: '20px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
                  <img src={this.props.initPlot} alt='No data available' width='auto' height='auto' style={{ maxWidth: '100%', maxHeight: '100%' }} onLoad={() => {}/*URL.revokeObjectURL(this.props.initPlot)*/}/>
                </div>
            </Box>
          </Flex>
          )}
        </Tabs.Content>
        <Tabs.Content value="building">          
          <Box style={{ display: 'flex', flex: 3, height: '100vh' }}>
            <div className='cytoscape'style={{top: 5, left: 3, position: 'absolute', width: window.innerWidth*0.65, height: window.innerHeight-130}}></div>
            <Flex direction="column" gap="2" height={'100vh'}>
              <CytoscapeComponent elements={this.props.cytoElements} stylesheet={this.props.cytoStyle} panningEnabled={false} autoungrabify={true} style={ { width: window.innerWidth*0.97, height: window.innerHeight-120, border: "solid", borderColor: "var(--slate-8)", borderRadius: "var(--radius-3)" } } onCy={(cy) => {this.cy = cy;}}/>
              
              <img src={color_scale_pic} alt='Color scale from purple for negative to red for positive' width='20' height='auto' style={{ position: 'absolute', top: 15, left: 15 }}/>

              {((this.props.taskId < 20 && this.props.img && this.props.img !== '' && this.props.isTraining===1) &&
                <Flex direction="column" gap="1" style={{ position: 'absolute', bottom: window.innerHeight*0.2, left: window.innerWidth*0.45 }}>
                <img src={this.props.img} alt={`No plots yet`} onLoad={() => {}/*URL.revokeObjectURL(this.props.img)*/} style={{ height: '200px', width: 'auto' }}/>
                {this.props.taskId === 11 && (
                  <Flex direction="column" gap="0">
                  <p>Weight: {this.props.weights[0]}</p>
                  <p>Bias: {this.props.biases[0]}</p>
                  </Flex>
                )}
                </Flex>
              )}

              <GenerateFloatingButtons top={window.innerHeight - 223} left={0.1 * (window.innerWidth * 0.97) - 16.5} dist={0.4 * (window.innerWidth * 0.97)/Math.max(this.props.cytoLayers.length-1,1)} isItPlus={true} nLayers={this.props.cytoLayers.length} cytoLayers={this.props.cytoLayers} setCytoLayers={this.props.setCytoLayers} taskId={this.props.taskId} index={this.props.index} maxNodes={this.props.maxNodes} isTraining={this.props.isTraining}/>                    
              <GenerateFloatingButtons top={window.innerHeight - 178} left={0.1 * (window.innerWidth * 0.97) - 16.5} dist={0.4 * (window.innerWidth * 0.97)/Math.max(this.props.cytoLayers.length-1,1)} isItPlus={false} nLayers={this.props.cytoLayers.length} cytoLayers={this.props.cytoLayers} setCytoLayers={this.props.setCytoLayers} taskId={this.props.taskId} index={this.props.index} maxNodes={this.props.maxNodes} isTraining={this.props.isTraining}/>
              
              <LayerRemoveButton setCytoLayers={this.props.setCytoLayers} index={this.props.index} taskId={this.props.taskId} cytoLayers={this.props.cytoLayers} isTraining={this.props.isTraining}/>
              <LayerAddButton setCytoLayers={this.props.setCytoLayers} index={this.props.index} taskId={this.props.taskId} cytoLayers={this.props.cytoLayers} nOfOutputs={this.props.nOfOutputs} maxLayers={this.props.maxLayers} isTraining={this.props.isTraining}/>

            </Flex>
          </Box>
          
          <Separator orientation='vertical' style = {{ position:"absolute", top: Math.round(0.03 * (window.innerHeight-140)), left: Math.round(0.67 * (window.innerWidth * 0.97)), height: 0.96 * (window.innerHeight-140) }}/>

          <Box style={{ flex: 1 }}>

          {this.props.iterationsSliderVisibility ? (<Box style={{ position:"absolute", top: 0.14 * (window.innerHeight-140), left: Math.round(0.74 * (window.innerWidth * 0.97)), alignItems: 'start', justifyContent: 'end', fontFamily:'monospace'  }}>
            <div className="iterationsSlider">
              {this.props.iterationsSlider}
            </div>
            <div style={{ position:"absolute", zIndex: 9999, top: -30, left: 0.095 * (window.innerWidth * 0.97), transform: 'translateX(-50%)', fontSize: '14px', color: 'var(--slate-11)', whiteSpace: 'nowrap' }}>Epochs: {this.props.iterations}</div>
          </Box>) : (<div></div>)}

          {this.props.lrSliderVisibility ? (<Box style={{ position:"absolute", top: Math.round(0.26 * (window.innerHeight-140)), left: Math.round(0.74 * (window.innerWidth * 0.97)), alignItems: 'start', justifyContent: 'end', fontFamily:'monospace'  }}>
            <div className="learningRateSlider">
              {this.props.learningRateSlider}
            </div>
            <div style={{ position:"absolute", zIndex: 9999, top: -30, left: 0.095 * (window.innerWidth * 0.97), transform: 'translateX(-50%)', fontSize: '14px', color: 'var(--slate-11)', whiteSpace: 'nowrap' }}>Learning rate: {this.props.learningRate}</div>
          </Box>) : (<div></div>)}
          
          {this.props.normalizationVisibility ? (
          <Text as="label" size="2">
            <Flex style={{ position:"absolute", top: Math.round(0.4 * (window.innerHeight-140)-20), left: Math.round(0.7 * (window.innerWidth * 0.97)), width: Math.round(0.27 * (window.innerWidth * 0.97)), justifyContent:"flex-start", alignItems:"flex-start"}} gap="2">          
              <Checkbox disabled = { this.props.isTraining===1 } />
              Normalize training data
            </Flex>
          </Text>):(<div></div>)}

          {/* make the position of the box shift down if normalization is true */}
          <Box style={{ position:"absolute", top: Math.round(0.4 * (window.innerHeight-140)) + (this.props.normalizationVisibility ? 30 : 0), left: Math.round(0.7 * (window.innerWidth * 0.97)), alignItems: 'center', justifyContent: 'start', height: '100vh', fontSize: '14px', color: 'var(--slate-11)' }}>
            <div id="/api-data">
              {this.props.isTraining===2 ? (
                <Flex direction='column' >
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
                  <canvas ref={this.chartRef} id="myChart" style={{ width: Math.round(0.27 * (window.innerWidth * 0.97)), height: Math.round(0.35 * (window.innerHeight-140)), marginTop:10 }}></canvas>
                </Flex>
              ) : (
                <div style={{ textAlign:'justify', width: Math.round(0.27 * (window.innerWidth * 0.97)), fontFamily:'monospace' }}>
                  {this.shortDescription}
                </div>
              ))}
            </div>
          </Box>

          <IconButton
            onClick={this.props.taskId !== 0 ? (event) => this.props.putRequest(event, this.props.cytoLayers, this.props.apiData, this.props.setApiData, this.props.setAccuracy, this.props.setIsTraining, this.props.learningRate, this.props.iterations, this.props.taskId, this.props.index, this.props.nOfInputs, this.props.nOfOutputs, this.props.normalization) : () => {}}
            variant="solid"
            style={{ position: 'absolute', transform: 'translateX(-50%)', top: Math.round(0.92 * (window.innerHeight-140)), left: Math.round(0.835 * (window.innerWidth * 0.97)), borderRadius: 'var(--radius-3)', width: Math.round(0.12 * (window.innerWidth * 0.97)), height: 36, fontSize: 'var(--font-size-2)', fontWeight: "500" }}
            disabled = { this.props.isTraining===1 || (this.props.iterationsSliderVisibility && !this.props.iterations) || (this.props.lrSliderVisibility && !this.props.learningRate) }>
              <Flex direction="horizontal" gap="2" style={{alignItems: "center", fontFamily:'monospace' }}>
                <PlayIcon width="18" height="18" />Start training!
              </Flex>
          </IconButton>
          </Box>

        </Tabs.Content>
        
        <Tabs.Content value="upload">
            {this.props.taskId !== 0 && (
                <Flex direction="column" gap="2" style={{ alignItems:"center" }}>
                    <Box style={{width:500, marginTop:20 }}>
                    <FilePond
                      files={this.props.files}
                      onupdatefiles={this.props.setFiles}
                      allowMultiple={false}
                      server="/api"
                      name="files" /* sets the file input name, it's filepond by default */
                      labelIdle='Drag & Drop your CSV file or <span class="filepond--label-action">Browse</span>'
                      credits={false}
                      acceptedFileTypes={['text/csv']}
                    />
                    </Box>
                    <Button variant="outline">Upload</Button>
                </Flex>
            )}
        </Tabs.Content>

        <Tabs.Content value="stuff">
        {this.props.taskId !== 0 && (
          <Flex direction="row" gap = "3">
            <Flex direction="column" gap="2">
            
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
                <button className="FormButton" style={{ marginTop: 10 }}>
                  Predict!
                </button>
              </Form.Submit>}
            </Form.Root>
            
            <div id="query-response" style={{ fontFamily:'monospace' }}>
                {this.props.isResponding===2 ? (
                  <div>Output: {this.props.apiData["network_input"]}</div>
                ) : (this.props.isResponding===1 ? (
                  <div>Getting your reply...</div>
                ) : (
                  <div></div>
                )
                )}
              </div>
            </Flex>
            
            {/* This will render the images, if they exist */}
            <Flex direction="column" gap="2">
              {this.props.img ? (
                <img src={this.props.img} alt={`No plots yet`} onLoad={() => {}/*URL.revokeObjectURL(this.props.img)*/}/>
              ) : (
                <div>No image available. Try reloading the page? If this problem persists, please contact us.</div>
              )}
            {/* TODO: Turn this into a pretty animation */}
            </Flex>
          </Flex>
        )}
        </Tabs.Content>

        <Tabs.Content value="notebook">
          <Flex direction="column" gap="2" style={{ alignItems:"center" }}>
            <iframe src="https://www.kaggle.com/embed/pmarcelino/comprehensive-data-exploration-with-python?kernelSessionId=94433095" height="800" style={{margin: "auto", width: "100%", maxWidth: 950}} frameborder="0" scrolling="auto" title="Comprehensive data exploration with Python"></iframe>
          </Flex>
        </Tabs.Content>

        </Box>
        </Tabs.Root>

      <Joyride
        steps={this.state.steps}
        run={this.state.runTutorial}
        continuous={true}
        disableOverlayClose={true}
        disableCloseOnEsc={true}
        disableScrolling={true}
        callback={this.handleJoyrideCallback}
        locale={{ last: 'Finish' }}
      />
      </Theme>
    </div>
  )}
}

export default BuildingWrapperWithUpload;