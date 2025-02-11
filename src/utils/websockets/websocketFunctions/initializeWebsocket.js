import handleMessage from "./handleMessage";
import cancelRequest from "./cancelRequest";


/**
 * Initializes the websocket connection.
 * 
 * @param {object} trainingData - the training data
 * @param {object} params - the parameters for the training process
 * 
 * @returns {void}
 */
export default function initializeWebSocket(trainingData, params) {

    /*initialize the websocket connection*/

    const ws = setupWebSocket(trainingData, params);

    //partial application of cancelRequest to make it no-argument
    params.cancelRequestRef.current = () => cancelRequest(params.index, params.globalIndex, ws, params.timeoutId, params);

}


/**
 * Sets up the websocket connection.
 * 
 * @param {object} trainingData - the training data
 * @param {object} params - the parameters for the training process
 * 
 * @returns {WebSocket} - the websocket connection
 */
function setupWebSocket(trainingData, params) {

    /*setup the websocket connection*/

    const ws = createWebSocket(params.userId);
    setupEventHandlers(ws, trainingData, params);
    return ws;
}


/**
 * Creates the websocket connection.
 * 
 * @param {string} userId - the user id
 * 
 * @returns {WebSocket} - the websocket connection
 */
function createWebSocket(userId) {

    /*create the websocket connection*/

    return new WebSocket(`wss://${window.location.host}/ws/${userId}/`);
}


/**
 * Sets up the websocket event handlers.
 * 
 * @param {WebSocket} ws - the websocket connection
 * @param {object} trainingData - the training data
 * @param {object} params - the parameters for the training process
 * 
 * @returns {void}
 */
function setupEventHandlers(ws, trainingData, params) {

    /*setup the websocket event handlers*/

    ws.onopen = () => handleOpen(ws, trainingData, params);
    ws.onmessage = (event) => handleMessage(event, ws, params);
    ws.onerror = (event) => handleError(event, params);
    ws.onclose = () => handleClose(params);
}


/**
 * Handles the websocket opening.
 * 
 * @param {WebSocket} ws - the websocket connection
 * @param {object} trainingData - the training data
 * @param {object} params - the parameters for the training process
 * 
 * @returns {void}
 */
function handleOpen(ws, trainingData, params) {

    /*handle websocket opening*/

    console.log('WebSocket connection opened');

    ws.send(JSON.stringify(trainingData));

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


/**
 * Handles the websocket error.
 * 
 * @param {Event} event - the event
 * @param {object} params - the parameters for the training process
 * 
 * @returns {void}
 */
function handleError(event, params) {

    /*handle websocket errors*/

    console.error('Error:', event);
    if (params.cancelRequestRef.current) {
        params.cancelRequestRef.current();
    }
    alert("A websocket error occurred. Please try again. If the problem persists, please contact us.");
}


/**
 * Handles the websocket closure.
 * 
 * @param {object} params - the parameters for the training process
 * 
 * @returns {void}
 */
function handleClose(params) {

    /*handle websocket closure*/

    console.log('WebSocket connection closed', params.isTraining, params.progress);
}