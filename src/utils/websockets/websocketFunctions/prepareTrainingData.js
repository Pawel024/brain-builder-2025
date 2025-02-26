import getCookie from '../../cookieUtils';


/**
 * Updates the state of a component without mutating the original state.
 * 
 * @param {function} setter - The setter function.
 * @param {any} newValue - The new value.
 * @param {number} index - The index.
 * 
 * @returns {void}
 */
const updateState = (setter, newValue, index) => {
  setter(prev => {
    const updated = Array.isArray(prev) ? [...prev] : {};
    updated[index] = newValue;
    return updated;
  });
};


/**
 * Prepares the training data for the neural network model.
 * 
 * @param {Object} params - The parameters object.
 * @param {number} params.learningRate - The learning rate.
 * @param {number} params.iterations - The number of iterations.
 * @param {string} params.af - The activation function.
 * @param {string} params.optimizer - The optimizer.
 * @param {string} params.taskId - The task ID.
 * @param {function} params.setProgress - The setProgress function.
 * @param {function} params.setErrorList - The setErrorList function.
 * @param {function} params.setWeights - The setWeights function.
 * @param {function} params.setBiases - The setBiases function.
 * @param {function} params.setImgs - The setImgs function.
 * @param {function} params.setApiData - The setApiData function.
 * @param {function} params.setAccuracy - The setAccuracy function.
 * @param {function} params.setIsTraining - The setIsTraining function.
 * @param {Array} params.cytoLayers - The cytoLayers.
 * @param {number} params.nOfInputs - The number of inputs.
 * @param {number} params.nOfOutputs - The number of outputs.
 * @param {Object} params.img - The image.
 * @param {string} params.typ - The type.
 * @param {string} params.dataset - The dataset.
 * @param {string} params.fileName - The file name.
 * @param {string} params.functionName - The function name.
 * @param {number} params.index - The index.
 * @param {number} params.globalIndex - The global index.
 * 
 * @returns {Object} The training data.
 */
const prepareNNTrainingData = ({
  learningRate = 0.005,  // this default will be used for ex3.1, 0.005 also works
  iterations = 50,
  normalization,
  af,
  optimizer,
  taskId,
  setProgress,
  setErrorList,
  setWeights,
  setBiases,
  setImgs,
  setApiData,
  setAccuracy,
  setIsTraining,
  cytoLayers,
  nOfInputs,
  nOfOutputs,
  img,
  typ,
  dataset,
  fileName,
  functionName,
  index, 
  globalIndex
}) => {

  /*prepare the training data to be sent to the server*/

  let userId = getCookie('user_id');

  // Simplified state updates
  [setProgress, setWeights, setBiases].forEach(setter => updateState(setter, [], index));
  if (img) {URL.revokeObjectURL(img)};  // revoke the old URL
  updateState(setImgs, null, globalIndex);
  updateState(setErrorList, [[], null], index); // Specific update for setErrorList

  // Direct manipulation of cytoLayers for clarity
  const updatedCytoLayers = [nOfInputs, ...cytoLayers.slice(1, -1), nOfOutputs];

  const trainingData = {
    header: 'start',
    file_name: fileName,
    function_name: functionName,
    user_id: userId,
    task_id: taskId,
    learning_rate: parseFloat(learningRate),
    epochs: iterations,
    normalization: normalization,
    af: af,
    optimizer: optimizer,
    nodes: updatedCytoLayers,
    n_inputs: nOfInputs,
    n_outputs: nOfOutputs,
    typ,
    dataset,
  };

  updateState(setApiData, trainingData, globalIndex);
  updateState(setAccuracy, null, index);
  updateState(setIsTraining, 1, globalIndex);

  return trainingData;
}


/**
 * Prepares the training data for the SVM model.
 * 
 * @param {Object} params - The parameters object.
 * @param {string} params.taskId - The task ID.
 * @param {string} params.fileName - The file name.
 * @param {string} params.functionName - The function name.
 * @param {string} params.dataset - The dataset.
 * @param {boolean} params.normalization - The normalization.
 * @param {number} params.cValue - The C value.
 * @param {number} params.gammaValue - The gamma value.
 * @param {string} params.kernelValue - The kernel value.
 * @param {boolean} params.linearlySeparable - Whether the data is linearly separable.
 * @param {Object} params.img - The image.
 * @param {function} params.setImgs - The setImgs function.
 * @param {function} params.setF1Score - The setF1Score function.
 * @param {function} params.setApiData - The setApiData function.
 * @param {function} params.setIsTraining - The setIsTraining function.
 * @param {number} params.index - The index.
 * @param {number} params.globalIndex - The global index.
 * 
 * @returns {Object} The training data.
 */
const prepareSVMTrainingData = ({
  taskId,
  fileName,
  functionName,
  dataset,
  normalization,
  cValue,
  gammaValue,
  kernelValue,
  linearlySeparable,
  img, 
  setImgs,
  setF1Score,
  setApiData,
  setIsTraining,
  index, 
  globalIndex
}) => {
  /*prepare the training data to be sent to the server*/

  let userId = getCookie('user_id');

  const trainingData = {
    header: 'start',
    file_name: fileName,
    function_name: functionName,
    user_id: userId,
    task_id: taskId,
    c: cValue,
    gamma: gammaValue,
    kernel: kernelValue,
    linearly_separable: linearlySeparable,
    normalization: normalization,
    dataset: dataset,
  };

  updateState(setApiData, trainingData, globalIndex);
  updateState(setIsTraining, 1, globalIndex);
  if (img) {URL.revokeObjectURL(img)};  // revoke the old URL
  updateState(setImgs, null, globalIndex);
  updateState(setF1Score, null, index);

  return trainingData;
}


export {prepareNNTrainingData, prepareSVMTrainingData};