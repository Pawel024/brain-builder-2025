import { prepareNNTrainingData, prepareSVMTrainingData } from './websocketFunctions/prepareTrainingData';
import initializeWebSocket from './websocketFunctions/initializeWebsocket';

const putRequest = (e, params, type) => {

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.warn('WebSocket connections disabled in localhost environment');
        return;
    }
    
    /*send the training data to the server and start the training process*/
  
    e.preventDefault();

    let trainingData = null
    if (type === 'NN') {trainingData = prepareNNTrainingData(params)};
    if (type === 'SVM') {trainingData = prepareSVMTrainingData(params)};

    if (trainingData) {initializeWebSocket(trainingData, params)} else {console.log('No training data found, not sending request')};
}

export default putRequest;