import '../../css/App.css';
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

export { handleChangeWrapper, meanSquaredError, getMinMaxY, makeScatterChart, polyfit, polyval };
