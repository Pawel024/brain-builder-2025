import chroma from 'chroma-js';

const colorScale = chroma.scale(['#49329b', '#5e5cc2', '#8386d8', '#afb0e1', '#dddddd', '#e3a692', '#d37254', '#b64124', '#8f0500']).domain([-1, -0.75, -0.5, -0.25, 0, 0.25, 0.52, 0.75, 1]);


/**
 * Generates the elements for the cytoscape graph
 * 
 * @param {number[]} list - The list of nodes per layer
 * @param {object} apiData - The data from the API
 * @param {number} isTraining - The training status
 * @param {number[][][]} weights - The weights of the neural network
 * @param {number[][]} biases - The biases of the neural network
 * 
 * @returns {object[]} The elements for the cytoscape graph
 */
export function generateCytoElements(list, apiData, isTraining, weights, biases) {
  const cElements = [];

  // Generate nodes
  list.forEach((nodesPerLayer, i) => {
    for (let j = 0; j < nodesPerLayer; j++) {
      const id = list.slice(0, i).reduce((acc, curr) => acc + curr, 0) + j;
      const label = `Node ${id}`;
      const wAvailable = 0.4 * (window.innerWidth * 0.97);
      const hAvailable = window.innerHeight - 326;
      const xDistBetweenNodes = wAvailable/Math.max(list.length-1, 1);
      const yDistBetweenNodes = hAvailable/Math.max(...list);
      const position = { x: Math.round((0.5 * window.innerWidth * 0.97) + (i-list.length+1) * xDistBetweenNodes), y: Math.round( 0.5 * (window.innerHeight-140) - 0.5*yDistBetweenNodes - 65 + (-nodesPerLayer) * 0.5 * yDistBetweenNodes + yDistBetweenNodes + j * yDistBetweenNodes) };
      cElements.push({ data: { id, label }, position });
    }
  });

  // Generate lines between nodes
  // let weights;
  let max;
  let min;
  let absMax;
  if (apiData && weights) {
    try {
    max = weights.reduce((max, part) => Math.max(max, part.reduce((subMax, arr) => Math.max(subMax, ...arr.map(Number)), 0)), 0);
    min = weights.reduce((min, part) => Math.min(min, part.reduce((subMin, arr) => Math.min(subMin, ...arr.map(Number)), Infinity)), Infinity);
    absMax = Math.max(Math.abs(max), Math.abs(min));
    }
    catch (error) {
      console.error("Error processing max and min weights:", error);
    }
  }

  let cumulativeSums = list.reduce((acc, curr, i) => {
    acc[i] = (acc[i-1] || 0) + curr;
    return acc;
  }, []);

  list.forEach((nodesPerLayer, i) => {
    for (let j = 0; j < nodesPerLayer; j++) {
      let source;
      if (i > 0) {
        source = cumulativeSums[i-1] + j;
      } else {
        source = j;
      }
      for (let k = 0; k < list[i+1]; k++) {
        const target = cumulativeSums[i] + k;
        if (target <= cElements.length) {
          let weight = 5;
          if (apiData && weights.length > 0 && isTraining >= 0) { 
            try {
              weight = parseFloat(weights[i][k][j])/absMax;
            }
            catch (error) {
              weight = 5;
            }
          }
          cElements.push({ data: { source, target, weight } });
        }
      }
    }
  });

  return cElements;
}


/**
 * Generates the style for the cytoscape graph
 * 
 * @param {number[]} list - The list of nodes per layer
 * 
 * @returns {object[]} The style for the cytoscape graph
 */
export function generateCytoStyle(list = []) {
  const nodeSize = 180/Math.max(...list) < 90 ? 180/Math.max(...list) : 90;

  const cStyle = [ // the base stylesheet for the graph
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'width': nodeSize,
        'height': nodeSize,
      }
    },

    {
      selector: 'edge',
      style: {
        'line-color': ele => {
          return ele.data('weight') !== 5 ? colorScale(ele.data('weight')).toString() : '#666';
        },
        'width': ele => ele.data('weight') !== 5 ? Math.abs(ele.data('weight'))*2 : 1,
        'curve-style': 'bezier'
      }
    }
  ];
  return cStyle;
}


export default { generateCytoElements, generateCytoStyle };