import { updateProgress, checkTrainingComplete, endTraining, updateErrorListIfNeeded, updateF1ScoreIfNeeded, updateWeightsIfNeeded, updateBiasesIfNeeded, updateImagesIfNeeded } from './updatesOnMessage';

/**
 * Handles incoming messages from the websocket.
 * 
 * @param {Event} event - the event object
 * @param {WebSocket} ws - the websocket connection
 * @param {object} params - the parameters for the training process
 * 
 * @returns {void}
 */
export default function handleMessage(event, ws, params) {

    /*handle incoming messages from the websocket*/

    resetTimeout(ws, params);

    const data = JSON.parse(event.data);
    console.log("Message received with header ", data.header)  // for debugging
    if (data.header === 'SVM') {  // SVM training is completed, includes plot and f1score
        
        params.setF1Score(data.f1_score);
        updateImagesIfNeeded(data, params);
        endTraining(ws, params);
        
    }

    else if (data.header === 'update') {  // every 1%; includes params.progress, error_list, network_weights and network_biases, sometimes also plots

      if (JSON.stringify(data.progress) !== JSON.stringify(params.progress[params.index])) {
        
        updateProgress(data, params);

        checkTrainingComplete(data, params, ws);

        updateErrorListIfNeeded(data, params);
        updateF1ScoreIfNeeded(data, params);
        
        updateWeightsIfNeeded(data, params);

        updateBiasesIfNeeded(data, params);

        updateImagesIfNeeded(data, params);
      }
    }
}


/**
 * Resets the timeout for the websocket connection.
 * 
 * @param {WebSocket} ws - the websocket connection
 * @param {object} params - the parameters for the training process
 * 
 * @returns {void}
 */
function resetTimeout(ws, params) {

    /*reset the timeout to close the websocket if no message is received for a certain amount of time*/

    clearTimeout(params.timeoutId);
    params.timeoutId = setTimeout(() => {
      ws.close();
      params.setIsTraining(prevIsTraining => {
        const newIsTraining = [...prevIsTraining];
        newIsTraining[params.globalIndex] = 0;
        return newIsTraining;
      });
      console.log("Training failed")
      alert("Training failed. Please try again. If the problem persists, please contact us.");
    }, params.intervalTimeout); // stop after n milliseconds
}