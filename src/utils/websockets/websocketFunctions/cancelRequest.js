/**
 * Cancels the training process and closes the websocket connection
 * 
 * @param {number} NNIndex - the index of the neural network in the list of neural networks
 * @param {number} index - the index of the neural network in the list of neural networks
 * @param {WebSocket} ws - the websocket connection
 * @param {number} timeoutId - the timeout id
 * @param {object} params - the parameters for the training process
 * 
 * @returns {void}
 */
export default function cancelRequest(NNIndex, index, ws, timeoutId, params) {

    /*cancel the training process*/

    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {'header': 'cancel', 'task_id': params.taskId};
        try {
            ws.send(JSON.stringify(message));
            ws.close();
        } catch (error) {
            console.error("Error cancelling the training request:", error);
        }
    }

    clearTimeout(timeoutId);

    if (params.progress[NNIndex] >= 0.8 && params.isTraining[index] === 1) {
            params.setIsTraining(prevIsTraining => {
                const newIsTraining = [...prevIsTraining];
                newIsTraining[index] = 2;
                return newIsTraining;
            });
            console.log("Setting isTraining to 2 - the progress is over 80%!!!")
        } else {
        params.setIsTraining(prevIsTraining => {
            const newIsTraining = [...prevIsTraining];
            newIsTraining[index] = 0;
            return newIsTraining;
        });
    }
    
    console.log("Training cancelled")

};