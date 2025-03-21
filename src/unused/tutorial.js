import React from 'react';
import BuildView from './buildView';
import './css/App.css';
import { useState, useEffect } from 'react';
import { generateCytoElements, generateCytoStyle } from './utils/cytoUtils';
import * as Slider from '@radix-ui/react-slider';


function Tutorial({ nOfInputs,
  nOfOutputs,
  maxLayers,
  taskId,
  index,
  updateCytoLayers,
  loadLastCytoLayers,
  addLayer,
  removeLayer,
  iterations,
  setIterations,
  learningRate,
  setLearningRate,
  isTraining,
  setIsTraining,
  apiData,
  setApiData,
  taskData,
  setTaskData,
  putRequest,
  accuracy,
  setAccuracy,
  accuracyColor,
  handleSubmit,
  isResponding,
  setIsResponding,
  progress,
  featureNames,
  errorList,
  imgs,
  loadData,
  normalization,
  normalizationVisibility,
  iterationsSliderVisibility,
  lrSliderVisibility,
  initPlot,
  setProgress,
  setErrorList,
  setWeights,
  setBiases,
  maxNodes,
  gamesData}) {
  
  const [tutorialCytoElements, setTutorialCytoElements] = useState([]);
  const [tutorialCytoStyle, setTutorialCytoStyle] = useState([]);
  const [tutorialCytoLayers, setTutorialCytoLayers] = useState([4, 8, 8, 8, 8, 3]);
  const [tutorialApiData, setTutorialApiData] = useState([]);
  const [tutorialWeights, setTutorialWeights] = useState([]);

  // Update the state when the dependencies change
  useEffect(() => {
    setTutorialCytoElements(generateCytoElements(tutorialCytoLayers, tutorialApiData, isTraining, tutorialWeights, null));
    setTutorialCytoStyle(generateCytoStyle(tutorialCytoLayers));
  }, [tutorialCytoLayers, tutorialApiData, isTraining, tutorialWeights]);


  const tutorialIterationsSlider = (
      <Slider.Root
        className="SliderRoot"
        defaultValue={[50]}
        max={100}
        step={0.5}
        style={{ width: Math.round(0.19 * (window.innerWidth * 0.97)) }}
        disabled={isTraining === 1}
      >
        <Slider.Track className="SliderTrack" style={{ height: 3 }}>
          <Slider.Range className="SliderRange" />
        </Slider.Track>
        <Slider.Thumb className="SliderThumb" aria-label="Iterations" />
      </Slider.Root>
    );

  const tutorialLearningRateSlider = (
      <Slider.Root
        className="SliderRoot"
        defaultValue={[35]}
        max={70}
        step={10}
        style={{ width: Math.round(0.19 * (window.innerWidth * 0.97)) }}
        disabled={isTraining === 1}
      >
        <Slider.Track className="SliderTrack" style={{ height: 3 }}>
          <Slider.Range className="SliderRange" />
        </Slider.Track>
        <Slider.Thumb className="SliderThumb" aria-label="Learning Rate" />
      </Slider.Root>
    );
  
  return (
      <BuildView
        nOfInputs={nOfInputs}
        nOfOutputs={nOfOutputs}
        maxLayers={maxLayers}
        cytoElements={tutorialCytoElements}
        cytoStyle={tutorialCytoStyle}
        cytoLayers={tutorialCytoLayers}
        setCytoLayers={setTutorialCytoLayers}
        updateCytoLayers={updateCytoLayers}
        loadLastCytoLayers={loadLastCytoLayers}
        addLayer={addLayer}
        removeLayer={removeLayer}
        iterationsSlider={tutorialIterationsSlider}
        iterations={iterations}
        setIterations={setIterations}
        learningRateSlider={tutorialLearningRateSlider}
        learningRate={learningRate}
        setLearningRate={setLearningRate}
        isTraining={isTraining}
        setIsTraining={setIsTraining}
        apiData={apiData}
        setApiData={setApiData}
        accuracy={accuracy}
        setAccuracy={setAccuracy}
        accuracyColor={accuracyColor}
        handleSubmit={handleSubmit}
        isResponding={isResponding}
        setIsResponding={setIsResponding}
        taskId={taskId}
        index={index}
        taskData={taskData}
        setTaskData={setTaskData}
        putRequest={putRequest}
        progress={progress}
        featureNames={featureNames}
        errorList={errorList}
        imgs={imgs}
        loadData={loadData}
        normalization={normalization}
        normalizationVisibility={normalizationVisibility}
        iterationsSliderVisibility={iterationsSliderVisibility}
        lrSliderVisibility={lrSliderVisibility}
        initPlot={initPlot}
        setProgress={setProgress}
        setErrorList={setErrorList}
        setWeights={setWeights}
        setBiases={setBiases}
        maxNodes={maxNodes}
        gamesData={gamesData}
    />
  );
}

export default Tutorial;