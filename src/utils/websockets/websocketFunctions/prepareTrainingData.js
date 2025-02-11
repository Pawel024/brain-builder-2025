import getCookie from '../../cookieUtils';

// Extracted task-specific configurations for better separation of concerns
const getTaskConfiguration = (taskId) => ({
  11: { learningRate: 0.0005, normalization: false, activationFunctionsEnabled: false },
  12: { normalization: false, activationFunctionsEnabled: false }
}[taskId] || {});

// State update function that doesn't directly manipulate the state
const updateState = (setter, newValue, index) => {
  setter(prev => {
    const updated = Array.isArray(prev) ? [...prev] : {};
    updated[index] = newValue;
    return updated;
  });
};

const prepareNNTrainingData = ({
  learningRate = 0.01,
  iterations = 50,
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

  const taskConfig = getTaskConfiguration(taskId);
  const finalLearningRate = taskConfig.learningRate || learningRate;
  const normalization = taskConfig.normalization ?? true;

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
    learning_rate: parseFloat(finalLearningRate),
    epochs: iterations,
    normalization,
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