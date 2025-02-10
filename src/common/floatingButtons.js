
import React, { useCallback } from 'react';
import { PlusIcon, MinusIcon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { IconButton } from '@radix-ui/themes';

function FloatingButton(props) {
  let buttonStyle
  if (props.style === undefined) {
  buttonStyle = {
    position: 'absolute',
    zIndex: 9999,
    borderRadius: 'var(--radius-3)',
    width: 33,
    height: 33,
    boxShadow: '0 2px 8px var(--slate-a11)'
  };
  } else {buttonStyle = props.style}

  return <IconButton {...props} style={buttonStyle} />;
}

function SlideButton({onClick, disabled, rightPointing}) {
  return (
      <FloatingButton
          variant="outline"
          onClick = {onClick}
          size="0"
          disabled={disabled}
          style={{
            zIndex: 9999,
            borderRadius: 'var(--radius-5)',
            width: 35,
            height: 60,
            boxShadow: '0 2px 8px var(--slate-a11)'
          }}
          >

          {rightPointing ? (<ChevronRightIcon style={{height: 30, width: 30}}/>) : (<ChevronLeftIcon style={{height: 30, width: 30}}/>)}
          
      </FloatingButton>
  );
}

function LayerRemoveButton({setCytoLayers, NNIndex, taskId, cytoLayers, isTraining, setWeights}) {

    // function to remove a layer
    const removeLayer = useCallback((setCytoLayers, NNIndex) => {
      const newLayer = [...cytoLayers];
      if (newLayer.length > 2) {newLayer.splice(-2, 1)}
      setCytoLayers(prevLayers => {
        const newLayers = [...prevLayers];
        newLayers[NNIndex] = newLayer;
        return newLayers;
      });

      setWeights(prevWeights => {
        const newWeights = [...prevWeights];
        newWeights[NNIndex] = [];
        return newWeights;
      });
    }, [cytoLayers]);

    return (
        <FloatingButton
            variant="outline"
            onClick = {taskId !== 0 ? () => removeLayer(setCytoLayers, NNIndex) : () => {}}
            size="0"
            disabled={cytoLayers.length<3 || isTraining===1}
            style= {{ top: window.innerHeight*0.285, 
                        left: window.innerWidth*0.56,
                        position: 'absolute',
                        zIndex: 9999,
                        borderRadius: 'var(--radius-5)',
                        width: 35,
                        height: 60,
                        boxShadow: '0 2px 8px var(--slate-a11)'
                    }}
            >

            {<ChevronLeftIcon style={{height: 30, width: 30}}/>}
            
        </FloatingButton>
    );
}

function LayerAddButton({setCytoLayers, NNIndex, taskId, cytoLayers, nOfOutputs, maxLayers, isTraining, setWeights}) {

  // function to add a layer
  const addLayer = useCallback((setCytoLayers, nOfOutputs, NNIndex, max_layers) => {
      let newLayer = [...cytoLayers];
      if (cytoLayers.length < max_layers) {
        newLayer.push(nOfOutputs)
        setCytoLayers(prevLayers => {
          const newLayers = [...prevLayers];
          newLayers[NNIndex] = newLayer;
          return newLayers;
        });
      }

      setWeights(prevWeights => {
        const newWeights = [...prevWeights];
        newWeights[NNIndex] = [];
        return newWeights;
      });
  }, [cytoLayers]);

  return (
    <FloatingButton
      variant="outline"
      onClick = {taskId !== 0 ? () => addLayer(setCytoLayers, nOfOutputs, NNIndex, maxLayers) : () => {}}
      size="0"
      disabled={cytoLayers.length>maxLayers-1 || isTraining===1}
      style={{top: window.innerHeight*0.285, 
              left: window.innerWidth*0.60, 
              position: 'absolute',
              zIndex: 9999,
              borderRadius: 'var(--radius-5)',
              width: 35,
              height: 60,
              boxShadow: '0 2px 8px var(--slate-a11)'
      }}
      >

      {<ChevronRightIcon style={{height: 30, width: 30}}/> }

    </FloatingButton>
  );
}


function GenerateFloatingButtons({top, left, dist, isItPlus, nLayers, cytoLayers, setCytoLayers, taskId, index, NNIndex, maxNodes, isTraining, setWeights}) {

  // function to add a node to a layer
  const addNode = useCallback((column, setCytoLayers, taskId, index, max_nodes, setWeights) => {
    const newLayer = [...cytoLayers];
    newLayer[column] < max_nodes ? newLayer[column] += 1 : newLayer[column] = max_nodes;
    document.getElementById(taskId + "-input" + column).value = newLayer[column];
    setCytoLayers(prevLayers => {
      const newLayers = [...prevLayers];
      newLayers[index] = newLayer;
      return newLayers;
    });

    setWeights(prevWeights => {
      const newWeights = [...prevWeights];
      newWeights[NNIndex] = [];
      return newWeights;
    });
  }, [cytoLayers]);

  // function to remove a node from a layer
  const removeNode = useCallback((column, setCytoLayers, taskId, index, setWeights) => {
    const newLayer = [...cytoLayers];
    newLayer[column] > 1 ? newLayer[column] -= 1 : newLayer[column] = 1;
    document.getElementById(taskId + "-input" + column).value = newLayer[column];
    setCytoLayers(prevLayers => {
      const newLayers = [...prevLayers];
      newLayers[index] = newLayer;
      return newLayers;
    });

    setWeights(prevWeights => {
      const newWeights = [...prevWeights];
      newWeights[NNIndex] = [];
      return newWeights;
    });
  }, [cytoLayers]);

  // function to set a custom number of nodes for a layer
  const setNodes = useCallback((column, cytoLayers, setCytoLayers, taskId, index, maxNodes, setWeights) => {
    try {
      var nodeInput = Number(document.getElementById(taskId + "-input" + column).value)
    } catch (error) {
      console.log(`Error when getting nodeInput: ${error}`);
      console.log(`taskId + "-input" + column: ${taskId + "-input" + column}`);
    }
    if (nodeInput && Number.isInteger(nodeInput)) {
      if (nodeInput < 1) {
        nodeInput = 1;
      } else if (nodeInput > maxNodes) {
        nodeInput = maxNodes;
      }
      try {
        setCytoLayers(prevLayers => {
          const newLayers = [...prevLayers];
          newLayers[index][column] = nodeInput;
          return newLayers;
        });
      } catch (error) {
        console.log(`Error when setting cytoLayers (maybe wrong type?): ${error}`);
      }
    } else {
      nodeInput = cytoLayers[column];
      console.log("Invalid nodeInput, setting to: ", nodeInput);
    }
    document.getElementById(taskId + "-input" + column).value = nodeInput;

    setWeights(prevWeights => {
      const newWeights = [...prevWeights];
      newWeights[NNIndex] = [];
      return newWeights;
    });
  }, []);


  return (
    <>
      {Array.from({ length: nLayers-2 }, (_, i) => (
        <div key={i} style={{ top: top, left: left + (i+1) * dist }}>
            <FloatingButton
            variant="outline"
            disabled={(isItPlus && cytoLayers[i+1] >= maxNodes) || (!isItPlus && cytoLayers[i+1] < 2) || isTraining[index] === 1}
            onClick = {taskId !== 0 ? (isItPlus ? () => addNode(i+1, setCytoLayers, taskId, NNIndex, maxNodes, setWeights) : () => removeNode(i+1, setCytoLayers, taskId, NNIndex, setWeights)) : () => {}}
            style={{ position: 'absolute', top: window.innerHeight - 178 - 45*isItPlus, left: left + (i+1) * dist }}
            >
            {isItPlus ? <PlusIcon /> : <MinusIcon />}
            </FloatingButton>
            {isItPlus && (
            <form>
              <input
              id={taskId + "-input" + (i+1)}
              type="text"
              defaultValue={cytoLayers[i+1]}
              style={{
                  border: 'none',
                  width: 0.02 * (window.innerWidth * 0.97),
                  textAlign: 'center',
                  position: 'absolute',
                  top: window.innerHeight - 258,
                  left: left + (i+1) * dist + 16.5,
                  transform: 'translateX(-50%)',
                  fontSize: 'var(--font-size-2)',
                  color: 'var(--cyan-12)',
                  fontWeight: 'bold'
              }}
              onBlur={(taskId !== 0 && isTraining[index] !== 1) ? () => setNodes(i+1, cytoLayers, setCytoLayers, taskId, NNIndex, maxNodes, setWeights) : () => {}}
              onKeyDown={(event) => {
                  if (event.key === "Enter" && taskId !== 0 && isTraining[index] !== 1) {
                  event.preventDefault();
                  setNodes(i+1, cytoLayers, setCytoLayers, taskId, NNIndex, maxNodes, setWeights);
                  }
              }}
              />
            </form>
            )}
        </div>
        ))}
    </>
  );
}

export { SlideButton, GenerateFloatingButtons, LayerRemoveButton, LayerAddButton};