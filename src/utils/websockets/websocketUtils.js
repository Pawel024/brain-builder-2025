import { prepareNNTrainingData, prepareSVMTrainingData } from './websocketFunctions/prepareTrainingData';
import initializeWebSocket from './websocketFunctions/initializeWebsocket';

/**
 * Function to send a PUT request to the server
 * 
 * @param {Event} e - The event that triggered the function
 * @param {object} params - The parameters for the training process
 * @param {string} type - The type of model to train
 * 
 * @returns {void}
 */
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