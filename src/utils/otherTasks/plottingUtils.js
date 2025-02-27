import '../../css/App.css';
import React, { useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Flex, Box } from '@radix-ui/themes';
import { Chart, registerables } from 'chart.js';

Chart.defaults.color = '#333';
Chart.defaults.font.family = 'sans-serif';


/**
 * Throttles a function to limit how often it can be called
 * 
 * @param {Function} func - The function to throttle
 * @param {number} limit - Time limit in milliseconds
 * 
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}


/**
 * Wrapper function to handle changes in slider values
 * 
 * @param {number} value - The new slider value
 * @param {Function} processingFunction - Function to process the value
 * @param {Function} plottingFunction - Function to update the plot
 * @param {string} state - The state key to update
 * @param {object} all_states - All current states
 * @param {Function} stateSetter - Function to update state
 * @param {number} delay - Throttle delay in milliseconds
 * 
 * @returns {void}
 */
const handleChangeWrapper = (value, processingFunction, plottingFunction, state, all_states, stateSetter, delay=50) => {
    const handleChange = throttle((value, processingFunction, plottingFunction, state, all_states) => {
        if (processingFunction) {value = processingFunction(value)}
        
        const newStates = { ...all_states, [state]: value };
        stateSetter(state, value);  
        plottingFunction(value)
    
        return newStates
    }, delay);

    handleChange(value, processingFunction, plottingFunction, state, all_states)
}


/**
 * Calculates mean squared error between predicted and actual values
 * 
 * @param {number} a - Slope parameter
 * @param {Array<number>} x - Input values
 * @param {number} b - Bias parameter
 * @param {Array<number>} y - Target values
 * 
 * @returns {number} Mean squared error
 */
function meanSquaredError(a, x, b, y) {  // TODO: Copilot-generated, check if it works
    let sum = 0;
    for (let i = 0; i < x.length; i++) {
        sum += Math.pow((a * x[i] + b - y[i]), 2);
    }
    return sum / x.length;
}


/**
 * Calculates binomial coefficient
 * 
 * @param {number} n - Total number of items
 * @param {number} k - Number of items to choose
 * 
 * @returns {number} Binomial coefficient
 */
function binomial(n, k) {
    // Simple binomial coefficient for small n
    let result = 1;
    for (let i = 0; i < k; i++) {
        result *= (n - i) / (i + 1);
    }
    return result;
}


/**
 * Expands polynomial coefficients from normalized to original coordinates
 * 
 * @param {Array<number>} cPrime - Normalized coefficients
 * @param {number} mean - Mean of x values
 * @param {number} scale - Scale factor
 * 
 * @returns {Array<number>} Expanded coefficients
 */
function expandCoeffs(cPrime, mean, scale) {
    // Convert normalized polynomial back to original coordinates
    const n = cPrime.length;
    const finalCoeffs = new Array(n).fill(0);
    for (let k = 0; k < n; k++) {
        // factor includes dividing by scale^k
        const factor = cPrime[k] / Math.pow(scale, k);
        for (let i = 0; i <= k; i++) {
            // binomial(k, i)* (x^i) * [(-mean)^(k-i)]
            const sign = ((k - i) % 2 === 0) ? 1 : -1; // handle (-mean)^(k-i)
            finalCoeffs[i] += factor * binomial(k, i) * sign * Math.pow(mean, (k - i));
        }
    }
    return finalCoeffs;
}


/**
 * Fits a polynomial to the given data points
 * 
 * @param {Array<number>} x - Input values
 * @param {Array<number>} y - Target values
 * @param {number} degree - Polynomial degree
 * 
 * @returns {Array<number>|null} Array of coefficients or null if error
 */
function polyfit(x, y, degree) {
    try {
        const n = degree + 1;
        
        // Pre-allocate arrays
        let sums = new Array(2 * n - 1).fill(0);
        let A = Array(n).fill().map(() => new Array(n).fill(0));
        let b = new Array(n).fill(0);

        // Normalize x values
        const xMean = x.reduce((a, b) => a + b, 0) / x.length;
        const xScale = Math.max(...x.map(xi => Math.abs(xi - xMean))) || 1;
        const xNorm = x.map(xi => (xi - xMean) / xScale);

        // Build normal equations with normalized x
        for (let i = 0; i < x.length; i++) {
            for (let j = 0; j < 2 * n - 1; j++) {
                sums[j] += Math.pow(xNorm[i], j);
            }
            for (let j = 0; j < n; j++) {
                b[j] += y[i] * Math.pow(xNorm[i], j);
            }
        }

        // Build matrix A
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                A[i][j] = sums[i + j];
            }
        }

        // Add small value to diagonal for numerical stability
        const epsilon = 1e-10;
        for (let i = 0; i < n; i++) {
            A[i][i] += epsilon;
        }

        // Solve using Gaussian elimination
        for (let i = 0; i < n; i++) {
            let maxEl = Math.abs(A[i][i]);
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(A[k][i]) > maxEl) {
                    maxEl = Math.abs(A[k][i]);
                    maxRow = k;
                }
            }

            for (let k = i; k < n; k++) {
                let tmp = A[maxRow][k];
                A[maxRow][k] = A[i][k];
                A[i][k] = tmp;
            }
            let tmp = b[maxRow];
            b[maxRow] = b[i];
            b[i] = tmp;

            for (let k = i + 1; k < n; k++) {
                let c = -A[k][i] / A[i][i];
                for (let j = i; j < n; j++) {
                    if (i === j) {
                        A[k][j] = 0;
                    } else {
                        A[k][j] += c * A[i][j];
                    }
                }
                b[k] += c * b[i];
            }
        }

        let x_ = Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            x_[i] = b[i] / A[i][i];
            for (let k = i - 1; k >= 0; k--) {
                b[k] -= A[k][i] * x_[i];
            }
        }

        // Store solution in cPrime (coeffs for normalized x)
        let cPrime = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            cPrime[i] = x_[i];
        }

        // Expand back to unnormalized polynomial
        const finalCoeffs = expandCoeffs(cPrime, xMean, xScale);
        return finalCoeffs;
    } catch (e) {
        console.error("Error in polynomial fitting:", e);
        return null;
    }
}

/**
 * Evaluates a polynomial at given x values
 * 
 * @param {Array<number>} coefficients - Polynomial coefficients
 * @param {number} x - Input value
 * @returns {number} Polynomial value at x
 */
function polyval(coefficients, x) {
    return coefficients.reduce((sum, coef, i) => sum + coef * Math.pow(x, i), 0);
}

Chart.register(...registerables);

function getMinMaxY(y) {
  const dataMax = Math.max(...y);
  const dataMin = Math.min(...y);
  const median = getMedianY(y);
  const distance = Math.max(Math.abs(dataMax - median), Math.abs(dataMin - median)) * 1.2;
  return { min: Math.floor(median - distance), max: Math.ceil(median + distance) };
}

function getMedianY(y) {
    const sorted = y.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function makeScatterChart(ctx, x, y, minY, maxY, chartInstanceRef) {
  const scatterData = {
    datasets: [{
      label: 'Scatter Dataset',
      data: x.map((xi, index) => ({ x: xi, y: y[index] })),
      backgroundColor: 'rgba(4, 151, 185, 1)',
      type: 'scatter'
    }]
  };

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { min: -10, max: 10 },
      y: { min: minY, max: maxY }
    },
    plugins: {
      legend: { display: false }
    },
    animation: false,
    animations: {
      y: false
    }
  };

  if (chartInstanceRef.current) chartInstanceRef.current.destroy();

  chartInstanceRef.current = new Chart(ctx, {
    type: 'scatter',
    data: scatterData,
    options: scatterOptions
  });

  return chartInstanceRef.current;
}

export function RenderLinReg({ width, height, states, stateSetter }) {  // width & height are for the bounding box of the animation (the right side of the vertical separator)
    // TODO: actually use the width and height or get rid of the parameters

    const chartRef = React.createRef();
    const chartInstanceRef = React.useRef(null);

    useEffect(() => {
        if (states.weight === undefined) {
            stateSetter('weight', 1);
        }
        if (states.bias === undefined) {
            stateSetter('bias', 0);
        }
        
        if (!(states['x'] && states['y'])) {
            const target_a = Math.tan((Math.random()/3)*Math.PI).toFixed(3);
            const target_b = Math.floor(Math.random() * 12 - 5).toFixed(3);
            const x = Array.from({ length: 100 }, () => Math.floor(Math.random() * 20) - 10);
            const y = x.map(xi => target_a * xi + parseFloat(target_b) + (Math.random() * 2.82 - 1.41));
            
            const minMaxY = getMinMaxY(y);
            stateSetter('minY', minMaxY.min);
            stateSetter('maxY', minMaxY.max);
            stateSetter('x', x);
            stateSetter('y', y);
        }
    }, []);

    useEffect(() => {
        if (states.x && states.y) {
          plotData(states.weight, states.bias);
        }
    }, [states.x, states.y]);

    const plotData = (weight, bias) => {
        const scatterChart = makeScatterChart(
            chartRef.current, 
            states.x, 
            states.y, 
            states.minY, 
            states.maxY,
            chartInstanceRef
        );

        if (weight !== null && bias !== null) {
            const lineData = {
                datasets: [{
                    label: 'Line Dataset',
                    data: Array.from({ length: 200 }, (_, i) => {
                        const x_s = -10 + (20 / 199) * i;
                        return { x: x_s, y: weight * x_s + bias };
                    }),
                    borderColor: 'rgba(185, 38, 4, 1)',
                    fill: false,
                    type: 'line',
                    showPoint: false,
                    pointRadius: 0
                }]
            };

            scatterChart.data.datasets.push(lineData.datasets[0]);
            scatterChart.update();

            stateSetter('error', meanSquaredError(weight, states['x'], bias, states['y']).toFixed(3))
        }
    }

    const processWeight = (value) => {
        value = value * Math.PI / 180;
        value = Math.tan(value);
        value = parseFloat(value.toFixed(3))
        return value
    }

    const plottingWrapper = (value) => {
        plotData(states['weight'], states['bias'])
    }

    const weightSlider = (
        <Slider.Root
            className="SliderRoot"
            defaultValue={[45]}
            onValueChange={(value) => handleChangeWrapper(value[0], processWeight, plottingWrapper, 'weight', states, stateSetter)}
            min={-85}
            max={85}
            step={1}
            style={{ width: Math.round(0.16 * (window.innerWidth * 0.97)), margin: 10 }}
        >
            <Slider.Track className="SliderTrack" style={{ height: 3 }}>
                <Slider.Range className="SliderRange" />
            </Slider.Track>
            <Slider.Thumb className="SliderThumb" aria-label="Weight" />
        </Slider.Root>
    );

    const biasSlider = (
        <Slider.Root
            className="SliderRoot"
            defaultValue={[0]}
            onValueChange={(value) => handleChangeWrapper(value[0], null, plottingWrapper, 'bias', states, stateSetter)}  // COPY THIS LINE
            min={-10}
            max={10}
            step={0.01}
            style={{ width: Math.round(0.16 * (window.innerWidth * 0.97)), margin: 10 }}
        >
            <Slider.Track className="SliderTrack" style={{ height: 3 }}>
                <Slider.Range className="SliderRange" />
            </Slider.Track>
            <Slider.Thumb className="SliderThumb" aria-label="Bias" />
        </Slider.Root>
    );  

    return (
        <Box style={{ flex:1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: window.innerHeight-52, padding:'30px 50px', fontFamily:'monospace' }}>
            <Flex direction='column' gap="0" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div>Weight: <b>{states['weight']}</b></div>
                {weightSlider}
                <div style={{ marginTop:10 }}>Bias: <b>{states['bias']}</b></div>
                {biasSlider}
                
                {chartRef ? 
                    <div style={{ width: Math.round(0.32 * (window.innerWidth * 0.97)), height: Math.round(0.45 * (window.innerHeight-52)), marginTop: 40, marginBottom: 45 }}>
                        <canvas 
                            ref={chartRef} 
                            id="myChart"
                        />
                    </div>
                    : null}
                
                <div>
                    Current error: <b>{states['error']}</b>
                </div>
            </Flex>
        </Box>
    );
}

export function RenderPolyReg({ width, height, states, stateSetter }) {
    const chartRef = React.createRef();
    const chartInstanceRef = React.useRef(null);
    const limits = [0, 6.28];  // 2π

    useEffect(() => {
        if (states.degree === undefined) {
            stateSetter('degree', 1);
        }

        if (!(states['x'] && states['y'])) {
            const x = Array.from({ length: 10 }, () => Math.random() * (limits[1] - limits[0]) + limits[0]);
            const y = x.map(xi => Math.sin(xi) + (Math.random() * 0.2 - 0.1));
            
            stateSetter('minY', -2);
            stateSetter('maxY', 2);
            stateSetter('x', x);
            stateSetter('y', y);
        }
    }, []);

    useEffect(() => {
        if (states.x && states.y) {
            plotData(states.degree);
        }
    }, [states.x, states.y]);

    const plotData = (degree) => {
        if (!chartRef.current) return;
        
        // Fix: Generate more points for smooth curves
        const x_s = Array.from({ length: 200 }, (_, i) => 
            limits[0] + (i / 199) * (limits[1] - limits[0])
        );
        const y_s = x_s.map(x => Math.sin(x));

        if (chartInstanceRef.current) chartInstanceRef.current.destroy();

        const datasets = [
            {
                label: 'True Function',
                data: x_s.map((x, i) => ({ x, y: y_s[i] })),
                borderColor: 'rgba(0, 0, 0, 1)',
                fill: false,
                type: 'line',
                pointRadius: 0
            },
            {
                label: 'Data Points',
                data: states.x.map((x, i) => ({ x, y: states.y[i] })),
                backgroundColor: 'rgba(4, 151, 185, 1)',
                type: 'scatter'
            }
        ];

        if (degree !== null) {
            try {
                const coeffs = polyfit(states.x, states.y, degree);
                if (coeffs) {
                    const fitted_y = x_s.map(x => polyval(coeffs, x));
                    if (fitted_y.every(y => !isNaN(y) && isFinite(y))) {
                        datasets.push({
                            label: 'Polynomial Fit',
                            data: x_s.map((x, i) => ({ x, y: fitted_y[i] })),
                            borderColor: 'rgba(185, 38, 4, 1)',
                            fill: false,
                            type: 'line',
                            pointRadius: 0
                        });
                    }
                }
            } catch (e) {
                console.error("Error plotting polynomial:", e);
            }
        }

        chartInstanceRef.current = new Chart(chartRef.current, {
            type: 'scatter',                  // Make the base type scatter
            data: { datasets },
            options: {
                parsing: false,
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        min: limits[0],
                        max: limits[1],
                        ticks: { stepSize: 1 }
                    },
                    y: {
                        type: 'linear',
                        min: states.minY,
                        max: states.maxY
                    }
                },
                plugins: {
                    legend: { display: true }
                },
                animation: false
            }
        });
    };

    const plottingWrapper = (value) => {
        plotData(states['degree'])
    }

    const degreeSlider = (
        <Slider.Root
            className="SliderRoot"
            defaultValue={[1]}
            onValueChange={(value) => handleChangeWrapper(value[0], Math.round, plottingWrapper, 'degree', states, stateSetter)}
            min={1}
            max={10}
            step={1}
            style={{ width: Math.round(0.16 * (window.innerWidth * 0.97)), margin: 10 }}
        >
            <Slider.Track className="SliderTrack" style={{ height: 3 }}>
                <Slider.Range className="SliderRange" />
            </Slider.Track>
            <Slider.Thumb className="SliderThumb" aria-label="Polynomial Degree" />
        </Slider.Root>
    );

    return (
        <Box style={{ flex:1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: window.innerHeight-52, padding:'30px 50px', fontFamily:'monospace' }}>
            <Flex direction='column' gap="0" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div>Polynomial Degree: <b>{states['degree']}</b></div>
                {degreeSlider}     
                
                {chartRef ? 
                    <div style={{ width: Math.round(0.35 * (window.innerWidth * 0.97)), height: Math.round(0.5 * (window.innerHeight-52)), marginTop: 80 }}>
                        <canvas 
                            ref={chartRef} 
                            id="myChart"
                        />
                    </div>
                    : null}
            </Flex>
        </Box>
    );
}
