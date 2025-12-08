/* eslint-disable no-lone-blocks */
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Theme } from '@radix-ui/themes';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from 'axios';

// ------- COMPONENTS -------
import { Link2Icon } from '@radix-ui/react-icons'; // for external links
// startpage is the only view that is not lazy loaded because it's very likely to be loaded

// ------- STYLES -------
import './css/App.css';
import '@radix-ui/themes/styles.css';

// ------- UTILS -------
import { safeGet } from './utils/axiosUtils';
import { generateCytoElements, generateCytoStyle } from './utils/cytoUtils';
import getCookie from './utils/cookieUtils';
import putRequest from './utils/websockets/websocketUtils';
import useAnonymizedUserCount from './utils/hooks/useAnonymizedUserCount';

// ------- LAZY LOADING OF ROUTED VIEWS -------
const StartPage = lazy(() => import('./startpage/startPage'));
const Introduction = lazy(() => import('./introduction'));
const QuizApp = lazy(() => import('./quiz'));
const OtherTask = lazy(() => import('./otherTasks'))
const SvmView = lazy(() => import('./svmView'));
const BuildView = lazy(() => import('./newBuildView'));
const ClusteringView = lazy(() => import('./clustering'));
const FeedbackApp = lazy(() => import('./feedback'));
const NotFound = lazy(() => import('./common/notFound'));
const ConstructionView = lazy(() => import('./common/constructionView'));


// ------- APP WRAPPER -------

export default function App() {
  // Loading view for in between pages
  const LoadingFallback = () => {
    const preloader = document.getElementById("preloader");
    if (preloader) {
      preloader.style.display = "flex";
    }
    return null;
  };
  
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <AppContent />
      </Suspense>
    </Router>
  );
}


// ------- APP CONTENT -------

function AppContent() {
  useAnonymizedUserCount();

  // Add preloading effect
  useEffect(() => {
    if (window.location.pathname === '/') {
      // Preload viewTemplate when on startpage
      const preloadViewTemplate = async () => {
        await import('./common/viewTemplate');
        console.log('ViewTemplate preloaded');
      };
      preloadViewTemplate();
    } else {
      // Preload startpage when on other pages
      const preloadStartPage = async () => {
        await import('./startpage/startPage');
        console.log('StartPage preloaded');
      };
      preloadStartPage();
    }
  }, []);

  function checkIfRunningLocally() {
    return (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  }

  // Setting the interval- and timing-related states
  const intervalTimeout = 20000;  // in milliseconds, the time to wait before ending the interval
  const pendingTime = 1000;  // in milliseconds, the time to wait when putting or posting a request -> set this close to 0 in production, but higher for debugging

  // ------- WINDOW RESIZING -------

  function getWindowSize() {
    const {innerWidth, innerHeight} = window;
    return {innerWidth, innerHeight};
  }
  
  // eslint-disable-next-line no-unused-vars
  const [windowSize, setWindowSize] = useState(getWindowSize());

  // update window size when window is resized
  useEffect(() => {
    function handleWindowResize() {
      setWindowSize(getWindowSize());
    }

    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);
  
  const loadData = (taskId, index) => {
    // TODO: INDICES !!!

    setIsTraining(prevIsTraining => {
      const newIsTraining = [...prevIsTraining];
      newIsTraining[index] = -1;
      return newIsTraining;
    });
    var userId = getCookie('user_id');
    var csrftoken = getCookie('csrftoken');

    let normalization = false;  // TODO: make this an actual variable

    const checkGamesData = () => {
      if (gamesData) {

        const inData = {
          learning_rate: 0,
          epochs: 0,
          normalization: normalization, 
          activations_on: true,
          network_input: JSON.stringify([]),
          games_data: gamesData,
        };
        
        const dataData = {
          action: 0,
          user_id: userId,
          task_id: taskId,
          in_out: JSON.stringify(inData),
        };

        // set up the websocket
        const ws = new WebSocket(`wss://${window.location.host}/ws/${userId}/`);
        let timeoutId;

        ws.onclose = () => {

          setIsTraining(prevIsTraining => {
            const newIsTraining = [...prevIsTraining];
            newIsTraining[index] = 0;
            return newIsTraining;
          });
          console.log('WebSocket connection closed');
        };

        ws.onopen = () => {
          console.log('WebSocket connection opened');
          // now, check if there is an entry in /api/backend:
          safeGet(window.location.origin + `/api/backend/?user_id=${userId}&task_id=${taskId}`, {
            headers: {
              'X-CSRFToken': csrftoken
            }
          }).then((response) => {
            if (response.data.length > 0) {
              // If the record exists, update it
              let pk = response.data[0].pk;
              axios.put(window.location.origin + `/api/backend/${pk}`, dataData, {
                headers: {
                  'X-CSRFToken': csrftoken
                }, 
                timeout: pendingTime
              }).catch((error) => {
                console.error(error);
              });
            } else {
              // If the record does not exist, throw an error
              throw new Error('No Record in /api/backend');
            };
          }).catch((error) => {
            if (error.message === 'No Record in /api/backend' || error.code === 'ECONNABORTED') {
              // If the record doesn't exist or the GET times out, post a new record
              console.log('No record found, creating a new one'); 
              axios.post(window.location.origin + "/api/backend/", dataData, {
                headers: {
                  'X-CSRFToken': csrftoken
                }, 
                timeout: pendingTime
              }).catch((error) => {
                console.error(error);
              })
            }
          });
        };

        timeoutId = setTimeout(() => {
          ws.close();
          console.log('Failed to load data for exercise ' + taskId/10);
          alert("Failed to load data for exercise " + taskId/10 + ". Try reloading the page, if the problem persists, please contact us.");
        }, intervalTimeout); // stop after n milliseconds
    
        ws.onmessage = function(event) {
          const data = JSON.parse(event.data);
          if (data.header === "data") { 
    
            setFeatureNames(prevFeatureNames => {
              const newFeatureNames = [...prevFeatureNames];
              newFeatureNames[index] = data.feature_names;
              return newFeatureNames;
            });
    
            setNObjects(prevNObjects => {
              const newNObjects = [...prevNObjects];
              newNObjects[index] = data.n_objects;
              return newNObjects;
            });
    
            // Decode and parse the base64 encoded image in 'plot'
            const binaryString = atob(data.plot);
            
            // Use Blob directly from binary string (more efficient)
            const byteNumbers = new Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                byteNumbers[i] = binaryString.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);

            setInitPlots(prevInitPlots => {
              const newInitPlots = [...prevInitPlots];
              if (newInitPlots[index]) {URL.revokeObjectURL(newInitPlots[index])};
              newInitPlots[index] = url;
              return newInitPlots;
            });
            
            console.log(`Data for exercise ${taskId/10} loaded`)
            ws.close();
            clearTimeout(timeoutId);
          } else {
            console.log("Received unexpected message from backend: ", data);
          }
        };
    
        ws.onerror = function(event) {
          alert("Failed to load data for exercise " + taskId/10 + ". Try reloading the page, if the problem persists, please contact us.");
          console.error('Error:', event);
        };
      } else {
        console.log(`Waiting for gamesData to be populated... (it's now ${gamesData}, nInputs is ${nInputs})`)
        setTimeout(checkGamesData, 500); // Check again after 0.5 second
      }
    };
    if (!checkIfRunningLocally()) {checkGamesData()};
  };

  const fetchQueryResponse = (setApiData, setIsResponding, taskId, index) => {  // updates the apiData state with the response from the backend
    var userId = getCookie('user_id');
    var csrftoken = getCookie('csrftoken');

    safeGet(window.location.origin + `/api/backend/?user_id=${userId}&task_id=${taskId}`, {
      headers: {
        'X-CSRFToken': csrftoken
      }
    })
      .then((response) => {
        setApiData(prevApiData => {
          const newApiData = [...prevApiData];
          newApiData[index] = response.data[0];
          return newApiData;
        });
      })
      .catch((error) => {
        console.error(`Error fetching API data: ${error}`);
      });
    setIsResponding(prevIsResponding => {
        const newIsResponding = [...prevIsResponding];
        newIsResponding[index] = 2;
        return newIsResponding;
      });
    console.log("Response received")
  };

  let accuracyColor = "rgb(68, 68, 68)" // 'var(--slate-11)';

  // this is for all the tasks
  const defaultTaskIds = (checkIfRunningLocally()) ? [11, 12, 13, 21, 22, 51, 52, 61, 62] : [];
  const [levelNames, setLevelNames] = useState(["Introduction to AI", "Support Vector Machines", "Neural Networks for Regression", "Neural Networks for Classification", "Dimensionality Reduction", "Clustering", "Extra: Ethics & Green AI"]);
  const [whichPulled, setWhichPulled] = useState({challenges: false, quizzes: false, intros: false});
  const [taskData, setTaskData] = useState([]);
  const [progressData, setProgressData] = useState({challenges: {}, quizzes: {}, intros: {}});
  const [taskNames, setTaskNames] = useState({})
  const [taskIds, setTaskIds] = useState(defaultTaskIds);
  const [taskIcons, setTaskIcons] = useState(defaultTaskIds.map(() => null));
  const [fileNames, setFileNames] = useState(defaultTaskIds.map(() => ''));
  const [functionNames, setFunctionNames] = useState(defaultTaskIds.map(() => ''));
  const [gamesData, setGamesData] = useState("");
  const [typ, setTyp] = useState(defaultTaskIds.map(() => 1));
  const [dataset, setDataset] = useState(defaultTaskIds.map(() => 'Clas2.csv'));
  const [featureNames, setFeatureNames] = useState(defaultTaskIds.map(() => []));
  const [initPlots, setInitPlots] = useState(defaultTaskIds.map(() => null));
  const [nInputs, setNInputs] = useState(defaultTaskIds.map(() => 1));
  const [nOutputs, setNOutputs] = useState(defaultTaskIds.map(() => 1));
  const [nObjects, setNObjects] = useState(defaultTaskIds.map(() => 0));  // TODO are we using this?
  const [isResponding, setIsResponding] = useState(defaultTaskIds.map(() => 0));
  const [isTraining, setIsTraining] = useState(defaultTaskIds.map(() => false));
  const [apiData, setApiData] = useState(defaultTaskIds.map(() => null));
  const [accuracy, setAccuracy] = useState(defaultTaskIds.map(() => 0));

  // this is for the neural network tasks
  const [NNTaskIds, setNNTaskIds] = useState(defaultTaskIds);
  const [sensitiveIds, setSensitiveIds] = useState([])
  const [maxEpochs, setMaxEpochs] = useState(defaultTaskIds.map(() => 200));
  const [maxLayers, setMaxLayers] = useState(defaultTaskIds.map(() => 10));
  const [maxNodes, setMaxNodes] = useState(defaultTaskIds.map(() => 16));
  const [normalizationVisibility, setNormalizationVisibility] = useState([false]);
  const [afVisibility, setAfVisibility] = useState(defaultTaskIds.map(() => false));
  const [afOptions, setAfOptions] = useState(defaultTaskIds.map(() => []));
  const [optimOptions, setOptimOptions] = useState(defaultTaskIds.map(() => []));
  const [iterationsSliderVisibility, setIterationsSliderVisibility] = useState([false]);
  const [lrSliderVisibility, setLRSliderVisibility] = useState(defaultTaskIds.map(() => false));
  const [imageVisibility, setImageVisibility] = useState(defaultTaskIds.map(() => false));
  const [cytoLayers, setCytoLayers] = useState(defaultTaskIds.map(() => []));
  // setting default values for the network-related states
  const [NNProgress, setNNProgress] = useState(defaultTaskIds.map(() => -1));
  const [errorList, setErrorList] = useState(defaultTaskIds.map(() => [[], null]));
  const [weights, setWeights] = useState(defaultTaskIds.map(() => []));
  const [biases, setBiases] = useState(defaultTaskIds.map(() => []));
  const [imgs, setImgs] = useState(defaultTaskIds.map(() => null));

  // this is for the SVM tasks
  const [SVMTaskIds, setSVMTaskIds] = useState([]);
  const [cSliderVisibility, setCSliderVisibility] = useState([]);
  const [gammaSliderVisibility, setGammaSliderVisibility] = useState([]);
  const [rbfVisibility, setRbfVisibility] = useState([]);
  // TODO

  // this is for the basics tasks
  const [basicsTaskIds, setBasicsIds] = useState([]);
  // TODO

  // this is for the clustering tasks
  const [clusteringTaskIds, setClusteringIds] = useState( (checkIfRunningLocally()) ? [61, 62] : [])

  // this is for the external links
  const [linkIds, setLinkIds] = useState([]);
  const [links, setLinks] = useState([]);

  // this is for the quizzes
  const [quizIds, setQuizIds] = useState([]);
  const [quizData, setQuizData] = useState([]);

  // this is for the intros
  const [introIds, setIntroIds] = useState([]);
  const [introData, setIntroData] = useState([]);

  const [otherTasks, setOtherTasks] = useState( (checkIfRunningLocally()) ? {11: 'ManualLinReg', 12: 'ManualPolyReg', 13: 'ManualMatrix', 51: 'ManualPCA', 52: 'Manual3DPCA'} : {} );	
  const [otherDescriptions, setOtherDescriptions] = useState( (checkIfRunningLocally()) ? {11: 'ManualLinRegDescription', 12: 'ManualPolyRegDescription', 13: 'ManualMatrixDescription', 51: 'ManualPCADescription', 52: 'Manual3DPCADescription'} : {} );
  const [constructionTaskIds, setConstructionTaskIds] = useState([23]);

  // for local testing 
  function localSetup() {
      if (checkIfRunningLocally()) {
      setProgressData({ challenges: {1: {0: 'open', 1: 'open', 2: 'open'}, 2: {0: 'open', 1: 'open'}, 5: {0: 'open', 1: 'open'}, 6: {0: 'open', 1: 'open'}}, quizzes: {}, intros: {} })

      setSVMTaskIds( [21] )
      setGammaSliderVisibility( [true] )
      setCSliderVisibility( [false] )
      setRbfVisibility( [true] )

      setNNTaskIds( [22] )
      setIterationsSliderVisibility( [true] )
      setLRSliderVisibility( [true] )
      setAfOptions( [['ReLU', 'Sigmoid', 'TanH']] )
      setOptimOptions( [['SGD', 'Adam']] )
    }
  }


  // ------- FETCHING TASK DATA -------

  const currentFileNames = [];
  const currentFunctionNames = [];
  const currentNInputs = [];
  const currentNOutputs = [];
  const currentTaskIds = [];
  const currentTaskNames = {};
  const currentTyp = [];
  const currentDataset = [];
  const currentIcons = [];

  const currentNNTaskIds = [];
  const currentSensitiveIds = [];
  const currentMaxEpochs = [];
  const currentMaxLayers = [];
  const currentMaxNodes = [];
  const currentNormalizationVisibility = [];
  const currentAfVisibility = [];
  const currentAfOptions = [];
  const currentOptimOptions = [];
  const currentIterationsSliderVisibility = [];
  const currentLRSliderVisibility = [];
  const currentImageVisibility = [];
  const currentWeights = [];

  const currentSVMTaskIds = [];
  const currentCSliderVisibility = [];
  const currentGammaSliderVisibility = [];
  const currentRbfVisibility = [];
  // TODO

  const currentBasicsTaskIds = [];
  // TODO

  const currentClusteringTaskIds = [];
  // TODO

  const currentLinkIds = [];
  const currentLinks = [];

  const currentOtherTasks = {};
  const currentOtherDescriptions = {};
  const currentConstructionTaskIds = [];

  const nOfLevels = levelNames.length;
  const currentTaskProgressData = {};
  const currentQuizProgressData = {};
  const currentIntroProgressData = {};

  for (let i = 1; i <= nOfLevels; i++) {
    currentTaskProgressData[i] = [];
    currentQuizProgressData[i] = [];
    currentIntroProgressData[i] = [];
  }

  function convertToList(string, separator=';') {
    if (string) {
      if (string[0] === '[') {
        return JSON.parse(string);
      } else { 
      return string.split(separator).map((item) => item.trim());
    }} else {
      return [];
    }
  }

  function readQuizOrIntroEntry(entry, isQuiz) {
    const currentId = isQuiz ? entry.quiz_id : entry.intro_id;
    const level = Math.floor(currentId / 10);
    const levelStr = level.toString();
    if (!entry.visibility) {
      console.log("Skipping task " + currentId)
      if (isQuiz) {
        currentQuizProgressData[levelStr].push("hidden")
      } else {
        currentIntroProgressData[levelStr].push("hidden")
      }
    } else {

      if (!entry.enabled) {
        if (isQuiz) {
          currentQuizProgressData[levelStr].push("disabled")
        } else {
          currentIntroProgressData[levelStr].push("disabled")
        }
      } else {
        if (isQuiz) {
          currentQuizProgressData[levelStr].push("open")
        } else {
          currentIntroProgressData[levelStr].push("open")
        }
      }
    }
  }

  function readTaskEntry(entry) {
    const level = Math.floor(entry.task_id / 10);
    const levelStr = level.toString();
    if (!entry.visibility) {
      console.log("Skipping task " + entry.task_id)
      currentTaskProgressData[levelStr].push("hidden")
    } else {

      if (!entry.enabled) {
        currentTaskProgressData[levelStr].push("disabled")
      } else {
        currentTaskProgressData[levelStr].push("open")
      }

      // set TaskDescription states
      currentFileNames.push(entry.file_name);
      currentFunctionNames.push(entry.function_name);
      currentNInputs.push(entry.n_inputs);
      currentNOutputs.push(entry.n_outputs);
      currentTaskIds.push(entry.task_id);
      currentWeights.push([]);
      currentTaskNames[entry.task_id] = entry.short_name;
      currentTyp.push(entry.type);
      currentDataset.push(entry.dataset);

      if (entry.other_task) {
        currentOtherTasks[entry.task_id] = entry.other_task;
        currentOtherDescriptions[entry.task_id] = entry.description;
        currentIcons.push(null);
      } else {

        // set NN states
        let nnDescription = entry.neural_network_description;
        if (nnDescription) {
          if (nnDescription.sensitive_data) {currentSensitiveIds.push(entry.task_id)};
          currentNNTaskIds.push(entry.task_id);
          currentMaxEpochs.push(nnDescription.max_epochs);
          currentMaxLayers.push(nnDescription.max_layers);
          currentMaxNodes.push(nnDescription.max_nodes);
          currentNormalizationVisibility.push(nnDescription.normalization_visibility);
          currentAfVisibility.push(nnDescription.af_visibility);
          currentAfOptions.push(convertToList(nnDescription.af_options));
          currentOptimOptions.push(convertToList(nnDescription.optimizer_options));
          currentIterationsSliderVisibility.push(nnDescription.iterations_slider_visibility);
          currentLRSliderVisibility.push(nnDescription.lr_slider_visibility);
          currentImageVisibility.push(nnDescription.decision_boundary_visibility);
          currentIcons.push(null);
        } else {

          // set svm states
          let svmDescription = entry.svm_description;
          if (svmDescription) {
            currentSVMTaskIds.push(entry.task_id);
            currentCSliderVisibility.push(svmDescription.c_slider_visibility);
            currentGammaSliderVisibility.push(svmDescription.gamma_slider_visibility);
            currentRbfVisibility.push(svmDescription.rbf_visibility);
            currentIcons.push(null);
          } else {

            // set basics states
            let basicsDescription = entry.basics_description;
            if (basicsDescription) {
              currentBasicsTaskIds.push(entry.task_id);
              // TODO
              currentIcons.push(null);
            } else {

              // set clustering states
              let clusteringDescription = entry.clustering_description;
              if (clusteringDescription) {
                currentClusteringTaskIds.push(entry.task_id);
                // TODO
                currentIcons.push(null);
              } else {

                // set external link states
                if (entry.external_link) {
                currentLinkIds.push(entry.task_id)
                currentLinks.push(entry.external_link.url)
                currentIcons.push(Link2Icon);
                } else {
                  currentConstructionTaskIds.push(entry.task_id);
                  currentIcons.push(null);
                  console.log("Task " + entry.task_id + " is not implemented in the frontend.")
                }
              }
            }
          }
        }
      }
    }
  }
  
  const [loadedTasks, setLoadedTasks] = useState(false);
  useEffect(() => {
    // hide the preloader when page loads
    const preloader = document.getElementById("preloader");
    if (preloader && window.location.pathname === '/') {
      preloader.style.display = "none";
    }

    safeGet('/api/all_tasks/')
      .then(response => {
        if (response.data === null) {
          localSetup()
          throw new Error('running locally');
        } else {
          const currentTaskData = response.data;
          currentTaskData.sort((a, b) => a.task_id - b.task_id); // sort the taskData by taskIds
          setTaskData(currentTaskData); 
          // IMPORTANT: taskData will include challenges with 'visibility' set to false
          console.log('currentTaskData: ', currentTaskData)  // for debugging
      
          currentTaskData.forEach(entry => {
            readTaskEntry(entry);
          });
      
          // Set universal states
          setTaskIds(currentTaskIds);
          setFileNames(currentFileNames);
          setFunctionNames(currentFunctionNames);
          setGamesData(JSON.stringify(currentTaskData));
          setNInputs(currentNInputs);
          setNOutputs(currentNOutputs);
          setNObjects(currentTaskIds.map(() => 0));
          setTaskNames(currentTaskNames);
          setTaskIcons(currentIcons);

          // Set neural network states
          setNNTaskIds(currentNNTaskIds);
          setSensitiveIds(currentSensitiveIds);
          setMaxEpochs(currentMaxEpochs);
          setMaxLayers(currentMaxLayers);
          setMaxNodes(currentMaxNodes);
          setWeights(currentWeights);
          setNormalizationVisibility(currentNormalizationVisibility);
          setAfVisibility(currentAfVisibility);
          setIterationsSliderVisibility(currentIterationsSliderVisibility);
          setLRSliderVisibility(currentLRSliderVisibility);
          setImageVisibility(currentImageVisibility);
          setAfOptions(currentAfOptions);
          setOptimOptions(currentOptimOptions);

          // Set svm states
          setSVMTaskIds(currentSVMTaskIds);
          setCSliderVisibility(currentCSliderVisibility);
          setGammaSliderVisibility(currentGammaSliderVisibility);
          setRbfVisibility(currentRbfVisibility);

          // Set basics states
          setBasicsIds(currentBasicsTaskIds);
          // TODO

          // Set clustering states
          setClusteringIds(currentClusteringTaskIds);
          // TODO

          // Set link states
          setLinkIds(currentLinkIds)
          setLinks(currentLinks)

          // Initialise the rest of the states 
          setTyp(currentTyp);
          setDataset(currentDataset);
          setIsTraining(currentTaskIds.map(() => 0));
          setApiData(currentTaskIds.map(() => null));
          setIsResponding(currentTaskIds.map(() => false));
          setFeatureNames(currentTaskIds.map(() => []));  // TODO: load these somewhere else
          setImgs(currentTaskIds.map(() => null));
          setInitPlots(currentTaskIds.map(() => null));

          setCytoLayers(currentNNTaskIds.map(() => []));

          setAccuracy(currentNNTaskIds.map(() => 0));
          setNNProgress(currentNNTaskIds.map(() => 0));
          setErrorList(currentNNTaskIds.map(() => [[], null]));
          setBiases(currentNNTaskIds.map(() => []));

          // some custom taskIds
          setOtherTasks(currentOtherTasks);
          setOtherDescriptions(currentOtherDescriptions);
          setConstructionTaskIds(currentConstructionTaskIds);

          setLoadedTasks(true); // unify this with the whichPulled state
          setWhichPulled(prev => {
            const updated = {...prev};
            updated.challenges = true;
            return updated
          });
          setProgressData(prev => {
            const updated = {...prev};
            updated.challenges = currentTaskProgressData;
            return updated
          });
        }
      })
      .catch(error => {
        setLoadedTasks(false);
        // making some things visible for exercise 3.1
        setIterationsSliderVisibility(prev => {
          const updated = [...prev];
          updated[5] = true;
          return updated;
        });
        setLRSliderVisibility(prev => {
          const updated = [...prev];
          updated[5] = true;
          return updated;
        });
        setAfOptions(prev => {
          const updated = [...prev];
          updated[5] = ['Linear', 'ReLU', 'Sigmoid', 'TanH'];
          return updated;
        });
        setOptimOptions(prev => {
          const updated = [...prev];
          updated[5] = ['SGD', 'Adam'];
          return updated;
        });
        // no need to print error if data is null - that means we're just running locally
        if (error.message !== 'running locally') {
          console.error('Error fetching tasks:', error);
        }
      });

    safeGet('/api/all_quizzes/')
      .then(response => {
        if (response.data === null) {
          throw new Error('running locally');
        } else {
          const currentQuizData = response.data;
          currentQuizData.sort((a, b) => a.quiz_id - b.quiz_id)// sort the quizData by quizIds
          setQuizData(currentQuizData);
          
          const currentQuizIds = [];

          currentQuizData.forEach(entry => {
            currentQuizIds.push(entry.quiz_id);
            readQuizOrIntroEntry(entry, true); // isQuiz=true
          });
          setQuizIds(currentQuizIds);
          setWhichPulled(prev => {
            const updated = {...prev};
            updated.quizzes = true;
            return updated
          });
          setProgressData(prev => {
            const updated = {...prev};
            updated.quizzes = currentQuizProgressData;
            return updated
          });
        }
      })
      .catch(error => {
        const defaultQuizIds = [];
        setQuizIds(defaultQuizIds);
        console.log("Setting default states instead.")
        if (error.message !== 'running locally') {
          console.error('Error fetching quizzes:', error);
        }
      });

      safeGet('/api/all_intros/')
      .then(response => {
        if (response.data === null) {
          throw new Error('running locally');
        } else {
          const currentIntroData = response.data;
          currentIntroData.sort((a, b) => a.intro_id - b.intro_id)// sort the introData by introIds
          setIntroData(currentIntroData);
          
          const currentIntroIds = [];

          currentIntroData.forEach(entry => {
            currentIntroIds.push(entry.intro_id);
            readQuizOrIntroEntry(entry, false); // isQuiz=false
          });
          setIntroIds(currentIntroIds);
          setWhichPulled(prev => {
            const updated = {...prev};
            updated.intros = true;
            return updated
          });
          setProgressData(prev => {
            const updated = {...prev};
            updated.intros = currentIntroProgressData;
            return updated
          });
        }
      })
      .catch(error => {
        const defaultIntroIds = [];
        setIntroIds(defaultIntroIds);
        console.log("Setting default states instead.")
        if (error.message !== 'running locally') {
          console.error('Error fetching intros:', error);
        }
      });
    
    setTimeout(() => {
      const isLikelyMobile = (window.innerWidth <= 768 && window.innerHeight/window.innerWidth <= 0.6) || window.innerWidth <= 480 || (window.innerHeight/window.innerWidth >= 1.75 && window.innerHeight <= 768);
      
      if (isLikelyMobile) {
        alert("Welcome to brAIn bUIlder! Looks like you might be using a phone and we don't support mobile browsers just yet... Hope to see you soon on a computer!")
      }
    }, 1000);

  }, []);

  // ------- PROCESSING TASK DATA -------
  
  useEffect(() => {
    if (whichPulled.challenges && whichPulled.quizzes && whichPulled.intros) {
      console.log("Pulled challenges, quizzes, and intros");
    };
  }, [whichPulled]);

  const linksDict = linkIds.reduce((acc, curr, index) => {
    acc[curr] = links[index];
    return acc;
  }, {});
  
  useEffect(() => { 
    const newCytoLayers = [...cytoLayers];
    let shouldUpdateCytoLayers = false;

    newCytoLayers.forEach((cytoLayer, index) => {
      if (cytoLayer.length === 0) {
        const taskIndex = taskIds.indexOf(NNTaskIds[index]);
        newCytoLayers[index] = [nInputs[taskIndex], nOutputs[taskIndex]];
        shouldUpdateCytoLayers = true;
      }
      const localStorageKey = `cytoLayers${NNTaskIds[index]}`;
      const newCytoLayerString = JSON.stringify(newCytoLayers[index]);
      if (newCytoLayerString !== localStorage.getItem(localStorageKey)) {
        localStorage.setItem(localStorageKey, newCytoLayerString);
      }
    });

    if (shouldUpdateCytoLayers) {
      setCytoLayers(newCytoLayers);
    }

    newCytoLayers.forEach((cytoLayer, index) => {
      const taskIndex = taskIds.indexOf(NNTaskIds[index]);
      if (isTraining[taskIndex] !== -1) {
        setIsTraining(prevIsTraining => {
          const newIsTraining = [...prevIsTraining];
          newIsTraining[taskIndex] = 0;
          return newIsTraining;
        });
      }
    });
  }, [cytoLayers, NNTaskIds, nInputs, nOutputs, taskIds]);


  useEffect(() => {
    console.log('progressData:', progressData);
  }, [progressData]);

  
  const loadLastCytoLayers = (setCytoLayers, apiData, setApiData, propertyName, taskId, index, NNIndex, nInputs, nOutputs) => {
    // Check localStorage for a saved setting
    const savedSetting = localStorage.getItem(propertyName);
    let goToStep2 = false;
    let goToStep3 = false;

    if (savedSetting && savedSetting !== '[]' && !JSON.parse(savedSetting).some(element => element === undefined)) {
        try {
            // If a saved setting is found, try to parse it from JSON
            const cytoLayersSetting = JSON.parse(savedSetting);
            // try to set the cytoLayers to the saved setting, if there is an error, set it to default
            setCytoLayers(prevCytoLayers => {
              const newCytoLayers = [...prevCytoLayers];
              newCytoLayers[NNIndex] = cytoLayersSetting;
              // make the number of nodes in the first and last layer match the number of inputs and outputs
              newCytoLayers[NNIndex][0] = nInputs;  
              newCytoLayers[NNIndex][newCytoLayers[NNIndex].length - 1] = nOutputs;
              return newCytoLayers;
            });
        }
        catch (error) {
            console.print(`getting the saved setting didn't work: ${error}`);
            goToStep2 = true;
        }
    }
    else {goToStep2 = true;};

    var userId = getCookie('user_id');
    var csrftoken = getCookie('csrftoken');

    if (goToStep2) {
      safeGet(window.location.origin + `/api/backend/?user_id=${userId}&task_id=${taskId}`, {
        headers: {
          'X-CSRFToken': csrftoken
        }
      })
      .then((response) => {
        try {
            setApiData(prevApiData => {
              const newApiData = [...prevApiData];
              newApiData[index] = response.data[0];
              return newApiData;
            });
            setCytoLayers(prevCytoLayers => {
              const newCytoLayers = [...prevCytoLayers];
              newCytoLayers[NNIndex] = JSON.parse(response.data[0]["in_out"]);
              // make the number of nodes in the first and last layer match the number of inputs and outputs
              newCytoLayers[NNIndex][0] = nInputs;
              newCytoLayers[NNIndex][newCytoLayers[NNIndex].length - 1] = nOutputs;
              return newCytoLayers;
            });
          } catch (error) {
            console.print(`the db record didn't have a cytoLayers setting: ${error}`);
            goToStep3 = true;
          }
      })
      .catch((error) => {
        console.print(`getting cytoLayers from db failed: ${error}`);
        goToStep3 = true;
      });

      if (goToStep3) {
        setCytoLayers(prevCytoLayers => {
          const newCytoLayers = [...prevCytoLayers];
          newCytoLayers[NNIndex] = [nInputs, nOutputs];
          return newCytoLayers;
        });
      }
    }
  };

  const [cytoElements, setCytoElements] = useState([]);
  const [cytoStyle, setCytoStyle] = useState([]);

  // Update the state when the dependencies change
  useEffect(() => {
    if (Array.isArray(cytoLayers)) {
      setCytoElements(NNTaskIds.map((taskId, index) => {
        const correspondingTaskIndex = taskIds.indexOf(NNTaskIds[index]);
        return generateCytoElements(cytoLayers[index], apiData[correspondingTaskIndex], isTraining[correspondingTaskIndex], weights[index], biases[index])
      }
      ));
    }
  }, [NNTaskIds, cytoLayers, apiData, weights, biases, isTraining, taskIds]);

  useEffect(() => {
    setCytoStyle(NNTaskIds.map((taskId, index) => 
      generateCytoStyle(cytoLayers[index])
    ));
  }, [NNTaskIds, cytoLayers, cytoElements]);


  const cancelRequestRef = useRef(null);



  // ------- FORMS -------

  const handleSubmit = (event, setIsResponding, setApiData, taskId, index) => {
    event.preventDefault();
    setIsResponding(prevIsResponding => {
      const newIsResponding = [...prevIsResponding];
      newIsResponding[index] = 1;
      return newIsResponding;
    });

    var userId = getCookie('user_id');
    var csrftoken = getCookie('csrftoken');

    safeGet(window.location.origin + `/api/backend/?user_id=${userId}&task_id=${taskId}`, {
      headers: {
        'X-CSRFToken': csrftoken
      }
    })
    .then((response) => {
      const networkData = response.data[0];
      const formData = new FormData(event.target);
      const values = Array.from(formData.values()).map((value) => Number(value));

      // let newInOut = JSON.parse(networkData.in_out);
      // newInOut['model_input'] = JSON.stringify(values);
      let newInOut = {'model_input': JSON.stringify(values)}
      networkData.in_out = JSON.stringify(newInOut);

      networkData.action = 2;
      
      axios.put(window.location.origin + `/api/backend/${networkData.pk}`, networkData, {
        headers: {
          'X-CSRFToken': csrftoken
        }
      })
        .then((response) => {
          console.log(`response status: ${response.status}`);
          fetchQueryResponse(setApiData, setIsResponding, taskId, index);
        })
        .catch((error) => {
          console.error(error);
        });
    })
    .catch((error) => {
      console.error(error);
    });
  };



  // ------- CYTOSCAPE STUFF -------

  const updateCytoLayers = (setCytoLayers, nOfInputs, nOfOutputs, index) => {
    setCytoLayers(prevCytoLayers => {
      const newCytoLayers = [...prevCytoLayers];
      newCytoLayers[index] = newCytoLayers[index].map((layer, i) => {
        if (i === 0) {
          return nOfInputs;
        } else if (i === newCytoLayers[index].length - 1) {
          return nOfOutputs;
        } else {
          return layer;
        }
      });
  
      return newCytoLayers;
    });
  };

  // ------- RETURN THE APP CONTENT -------
  return (
    <Theme accentColor="cyan" grayColor="slate" panelBackground="solid" radius="large" appearance='light'>
      <Routes>
        <Route path="/" element={<StartPage levelNames={levelNames} taskNames={taskNames} introData={introData} quizData={quizData} taskIds={taskIds} taskIcons={taskIcons} quizIds={quizIds} introIds={introIds} links={linksDict} progressData={progressData} />} />
        
        {introIds.map((introId, index) => {
          const level = Math.floor(introId / 10);
          const task = introId % 10;
          
          if (!introData[index].visibility || !introData[index].enabled) {
            return (
              <Route
              key={`intro${introId}`}
              path={`/introduction${level}-${task}`}
              element={<NotFound />}/>
            );
          } else {
            return (
              <Route key={`intro${introId}`} path={`/introduction${level}-${task}`} element={
                <div className="App">
                  <Introduction introId={introId}/>
                </div>
              } />
            );
          }
        })}

        {clusteringTaskIds.map((taskId, index) => {
          const type = "challenges";
          const level = Math.floor(taskId / 10);
          const task = taskId % 10;
          const isOpen = progressData[type]?.[level]?.[task-1] === "open";
        
          if (!isOpen) {
            return (
              <Route
              key={taskId}
              path={`/exercise${level}-${task}`}
              element={<NotFound />}/>
            );
          }

          return (
            <Route key={taskId} path={`/exercise${level}-${task}`} element={
              <div className="App">
                <ClusteringView clusteringId={taskId} />
              </div>
            } />
          );
        })}

        {Object.entries(otherTasks).map(([taskId, taskName], index) => {
          const type = "challenges";
          const level = Math.floor(taskId / 10);
          const task = taskId % 10;
          const isOpen = progressData[type]?.[level]?.[task-1] === "open";
        
          if (!isOpen) {
            return (
              <Route
              key={taskId}
              path={`/exercise${level}-${task}`}
              element={<NotFound />}/>
            );
          }

          return (
            <Route key={taskId} path={`/exercise${level}-${task}`} element={
              <div className="App">
                <OtherTask
                  type = {taskName}
                  host = {window.location.host}
                  customId = {parseInt(taskId)}
                  userId = {getCookie('user_id')}
                  description = {otherDescriptions[taskId]}
                />
              </div>
            } />
          ); 
        })}

        {SVMTaskIds.map((taskId, SVMIndex) => {
          const type = "challenges";
          const level = Math.floor(taskId / 10);
          const task = taskId % 10;
          const isOpen = progressData[type]?.[level]?.[task-1] === "open";
        
          if (!isOpen) {
            return (
              <Route
              key={taskId}
              path={`/exercise${level}-${task}`}
              element={<NotFound />}/>
            );
          }

          return (
            <Route
              key={taskId}
              path={`/exercise${level}-${task}`}
              element={
                <div>
                <SvmView 
                isTraining={isTraining[taskIds.indexOf(taskId)]} setIsTraining={setIsTraining} userId={getCookie('user_id')} taskId={taskId} cancelRequestRef={cancelRequestRef} SVMIndex={SVMIndex} index={taskIds.indexOf(taskId)} name={taskNames[taskId]} pendingTime={pendingTime} intervalTimeout={intervalTimeout} isResponding={taskIds.indexOf(taskId)} apiData={apiData.indexOf(taskId)} setApiData={setApiData} handleSubmit={handleSubmit} featureNames={featureNames[taskIds.indexOf(taskId)]} img={imgs[taskIds.indexOf(taskId)]} setImgs={setImgs} initPlot={initPlots[taskIds.indexOf(taskId)]} typ={typ[taskIds.indexOf(taskId)]} loadData={loadData} normalization={true} dataset={dataset[taskIds.indexOf(taskId)]}
                fileName={fileNames[taskIds.indexOf(taskId)]} functionName={functionNames[taskIds.indexOf(taskId)]} startTraining={putRequest} tabs={['data', 'training']} sliderValues={{'CSlider': 10, 'GammaSlider': 0.1}} sliderVisibilities={{ 'CSlider': cSliderVisibility[SVMIndex], 'GammaSlider': gammaSliderVisibility[SVMIndex] }} inputFieldVisibilities={{}} dropdownVisibilities={{}} checkboxVisibilities={{'KernelCheckbox': rbfVisibility[SVMIndex] }} setIsResponding={setIsResponding} 
                />
                </div>
              }
            />
          );
        })}

        {NNTaskIds.map((taskId, NNIndex) => {
          const type = "challenges";
          const level = Math.floor(taskId / 10);
          const task = taskId % 10;
          const isOpen = progressData[type]?.[level]?.[task-1] === "open";
        
          if (!isOpen) {
            return (
              <Route
              key={taskId}
              path={`/exercise${level}-${task}`}
              element={<NotFound />}/>
            );
          }

          return (
            <Route
              key={taskId}
              path={`/exercise${level}-${task}`}
              element={
                <div>
                  <BuildView
                    nOfInputs={nInputs[taskIds.indexOf(taskId)]}
                    nOfOutputs={nOutputs[taskIds.indexOf(taskId)]}
                    // nOfObjects={nObjects[taskIds.indexOf(taskId)]}
                    maxLayers={maxLayers[NNIndex]}
                    taskId={taskId}
                    NNIndex={NNIndex}
                    index={taskIds.indexOf(taskId)}
                    cytoElements={cytoElements[NNIndex]}
                    cytoStyle={cytoStyle[NNIndex]}
                    cytoLayers={cytoLayers[NNIndex]}
                    setCytoLayers={setCytoLayers}
                    updateCytoLayers={updateCytoLayers}
                    loadLastCytoLayers={loadLastCytoLayers}
                    isTraining={isTraining[taskIds.indexOf(taskId)]}
                    setIsTraining={setIsTraining}
                    apiData={apiData[taskIds.indexOf(taskId)]}
                    setApiData={setApiData}
                    setAccuracy={setAccuracy}
                    accuracyColor={accuracyColor}
                    handleSubmit={handleSubmit}
                    isResponding={isResponding[taskIds.indexOf(taskId)]}
                    setIsResponding={setIsResponding}
                    progress={NNProgress[NNIndex]}
                    featureNames={featureNames[taskIds.indexOf(taskId)]}
                    errorList={errorList[NNIndex]}
                    weights={weights[NNIndex]}
                    biases={biases[NNIndex]}
                    img={imgs[taskIds.indexOf(taskId)]}
                    initPlot={initPlots[taskIds.indexOf(taskId)]}
                    loadData={loadData}
                    imageVisibility={imageVisibility[NNIndex]}
                    setProgress={setNNProgress}
                    setErrorList={setErrorList}
                    setWeights={setWeights}
                    setBiases={setBiases}
                    pendingTime={pendingTime}
                    cancelRequestRef={cancelRequestRef}
                    fileName={fileNames[taskIds.indexOf(taskId)]}
                    functionName={functionNames[taskIds.indexOf(taskId)]}
                    maxNodes={maxNodes[NNIndex]}
                    maxEpochs={maxEpochs[NNIndex]}
                    setImgs={setImgs}
                    userId={getCookie('user_id')}
                    intervalTimeout={intervalTimeout}
                    typ={typ[taskIds.indexOf(taskId)]}
                    dataset={dataset[taskIds.indexOf(taskId)]}
                    normalization={(NNIndex < 2) ? false : true}
                    name={taskNames[taskId]}
                    startTraining={putRequest}
                    tabs={['data', 'training', 'testing']}
                    sliderVisibilities={{'EpochSlider': iterationsSliderVisibility[NNIndex], 'LRSlider': lrSliderVisibility[NNIndex]}}
                    inputFieldVisibilities={{}}
                    dropdownVisibilities={{'AFDropdown': !!afOptions[NNIndex].length, 'OptimizerDropdown': !!optimOptions[NNIndex].length}}
                    dropdownOptions={{'AFDropdown': afOptions[NNIndex], 'OptimizerDropdown': optimOptions[NNIndex]}}
                    checkboxVisibilities={{'AFCheckbox': afVisibility[NNIndex], 'NormCheckbox': normalizationVisibility[NNIndex]}}
                    gamesData={gamesData}
                    runningLocally={checkIfRunningLocally()}
                  />
                </div>
              }
            />
          );
        })}

        {quizIds.map((quizId, index) => {
          const level = Math.floor(quizId / 10);
          const task = quizId % 10;

          if (!quizData[index].visibility || !quizData[index].enabled) {
            return (
              <Route
              key={`quiz${quizId}`}
              path={`/quiz${level}-${task}`}
              element={<NotFound />}/>
            );
          } else {
            
            return (
              <Route
              key={`quiz${quizId}`}
              path={`/quiz${level}-${task}`}
              element={
                <div className="App">
                  <QuizApp quizId={quizId} />
                </div>
              }/>
            );
          }
        })}

        <Route path={`/feedback`} element={
          <div className="App">
            <FeedbackApp host={window.location.origin} cookie={getCookie('csrftoken')} />
          </div>
        } />

        <Route path="/:ex" element={
          <ConstructionView taskIds={constructionTaskIds} />
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Theme>
  );
}
