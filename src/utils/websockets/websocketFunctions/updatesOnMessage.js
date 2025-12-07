/**
 * Updates the progress state if it has changed
 * 
 * @param {object} data - The data received from websocket
 * @param {object} params - The parameters including state setters
 * 
 * @returns {void}
 */
function updateProgress(data, params) {
    params.setProgress(prevProgress => {
        const newProgress = [...prevProgress];
        newProgress[params.index] = data.progress;
        return newProgress;
    });
}

/**
 * Checks if training is complete and closes the websocket if criteria are met
 * 
 * @param {object} data - The data received from websocket
 * @param {object} params - The parameters including training config
 * @param {WebSocket} ws - The websocket connection
 * 
 * @returns {void}
 */
function checkTrainingComplete(data, params, ws) {
    if (data?.progress !== undefined && params?.iterations !== undefined) {
      if (data.progress >= 0.98 || (params.iterations <=30 && data.progress >= 0.95) || (params.iterations <=20 && data.progress*params.iterations >= (params.iterations - 1))) {
        endTraining(ws, params);
      }
    }
}

/**
 * Ends the training process by closing websocket and updating state
 * 
 * @param {WebSocket} ws - The websocket connection
 * @param {object} params - The parameters including state setters
 * 
 * @returns {void}
 */
function endTraining(ws, params) {
  ws.close();
  clearTimeout(params.timeoutId);
  params.setIsTraining(prevIsTraining => {
    const newIsTraining = [...prevIsTraining];
    newIsTraining[params.globalIndex] = 2;
    return newIsTraining;
  });
}

/**
 * Updates the error list state if new errors are different from current
 * 
 * @param {object} data - The data received from websocket
 * @param {object} params - The parameters including state setters
 * 
 * @returns {void}
 */
function updateErrorListIfNeeded(data, params) {
    if (data?.error_list?.[0] !== undefined && data?.error_list?.[1] !== undefined && params?.errorList?.[0] !== undefined && params?.errorList?.[1] !== undefined) { 
      if (data.error_list[0].length !== params.errorList[0].length || data.error_list[1] !== params.errorList[1]) {
        params.setErrorList(prevErrorList => {
          const newErrorList = [...prevErrorList];
          newErrorList[params.index] = data.error_list;
          return newErrorList;
        });
      }
    }
}

/**
 * Updates the F1 score if available in the data
 * 
 * @param {object} data - The data received from websocket
 * @param {object} params - The parameters including state setters
 * 
 * @returns {void}
 */
function updateF1ScoreIfNeeded(data, params) {
  if(data.f1score !== undefined && params.setF1Score !== undefined) {
    params.setF1Score(data.f1score);
  }
}

/**
 * Updates the network weights if they have changed
 * 
 * @param {object} data - The data received from websocket
 * @param {object} params - The parameters including state setters
 * 
 * @returns {void}
 */
function updateWeightsIfNeeded(data, params) {
  if (!data?.network_weights || !params?.setWeights) {
    return;
  }

  const currentWeights = params.weights?.[params.index];
  const shouldUpdate = !currentWeights || currentWeights[0][0] !== data.network_weights[0][0]; // will update if the first weight is different

  if (shouldUpdate) {
    params.setWeights(prevWeights => {
      const newWeights = [...prevWeights];
      newWeights[params.index] = data.network_weights;
      return newWeights;
    });
  }
}

/**
 * Updates the network biases if they have changed
 * 
 * @param {object} data - The data received from websocket
 * @param {object} params - The parameters including state setters
 * 
 * @returns {void}
 */
function updateBiasesIfNeeded(data, params) {
    if (params?.biases?.length !== undefined && data?.network_biases?.[0] !== undefined && params?.biases?.[0] !== undefined) {
      if (params.biases.length !== 0 || data.network_biases[0] !== params.biases[0]) {
          params.setBiases(prevBiases => {
            const newBiases = [...prevBiases];
            newBiases[params.index] = data.network_biases;
            return newBiases;
          });
      }
    }
}

/**
 * Updates the images by decompressing and parsing base64 encoded plot data
 * 
 * @param {object} data - The data received from websocket containing base64 encoded plot
 * @param {object} params - The parameters including state setters
 * 
 * @returns {void}
 */
function updateImagesIfNeeded(data, params) {
    if (data?.plot) {
        // Decompress and parse the images in 'plot'
        // Offload decoding to avoid freezing the main thread (as much as possible in sync context)
        try {
            const binaryString = atob(data.plot);
            
            // Pre-allocate buffer for better performance
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const blob = new Blob([bytes], { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);

            params.setImgs(prevImgs => {
                const newImgs = [...prevImgs];
                if (newImgs[params.globalIndex]) {
                    URL.revokeObjectURL(newImgs[params.globalIndex]);
                }
                newImgs[params.globalIndex] = url;
                return newImgs;
            });
        } catch (error) {
            console.error("Error decoding image:", error);
        }
    }
}

export { updateProgress, checkTrainingComplete, endTraining, updateErrorListIfNeeded, updateF1ScoreIfNeeded, updateWeightsIfNeeded, updateBiasesIfNeeded, updateImagesIfNeeded };