import '../../css/App.css';
import React, {  } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Flex, Box } from '@radix-ui/themes';
import { Chart, registerables } from 'chart.js';
//import { Chart, CategoryScale, LinearScale, LineController, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

Chart.defaults.color = '#333';
Chart.defaults.font.family = 'sans-serif';

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

function debounce(func, delay) {
    let debounceTimer;
    return function(...args) {
      const context = this;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

// General-purpose handleChange function, call like this:
//      const processValue = () => {
//          ...
//      }
//      const plotValue = () => {
//          ...
//      }
//      const genericSlider = (
//          <Slider.Root
//             (...)
//             onValueChange={(value) => handleChangeWrapper(value[0], processValue, plotValue, 'genericState', states, stateSetter)}  // COPY THIS LINE 
//           >
//              (...)
//           </Slider.Root>
//         );

const handleChangeWrapper = (value, processingFunction, plottingFunction, state, all_states, stateSetter, delay=50) => {
    const handleChange = throttle((value, processingFunction, plottingFunction, state, all_states) => {  // TODO: switch to throttle while user is dragging the slider, but somehow take value the user lands on
        if (processingFunction) {value = processingFunction(value)}
        
        stateSetter(state, value);  
        all_states[state] = value
    
        plottingFunction(value)
    
        return all_states
    }, delay);

    handleChange(value, processingFunction, plottingFunction, state, all_states)
}

function meanSquaredError(a, x, b, y) {  // TODO: Copilot-generated, check if it works
    let sum = 0;
    for (let i = 0; i < x.length; i++) {
        sum += Math.pow((a * x[i] + b - y[i]), 2);
    }
    return sum / x.length;
}

Chart.register(...registerables);
let chartInstance = null;

// Calculate max Y range once
const getMaxY = (x, y, weight, bias) => {
    const dataMax = Math.max(...y);
    const lineMax = Math.max(
        weight * 10 + bias,
        weight * -10 + bias
    );
    return Math.max(dataMax, lineMax) * 1.2; // 20% padding
};

function makeScatterChart(ctx, x, y, fixedMaxY) {
    const scatterData = {
        datasets: [{
            label: 'Scatter Dataset',
            data: x.map((xi, index) => ({ x: xi, y: y[index] })),
            backgroundColor: 'rgba(4, 151, 185, 1)'
        }]
    };

    const scatterOptions = {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
            x: {
                min: -10,
                max: 10,
                grid: { color: '#d0d0d0', drawBorder: true },
                ticks: { color: '#333' }
            },
            y: {
                min: -10,
                max: fixedMaxY,
                grid: { color: '#d0d0d0', drawBorder: true },
                ticks: { color: '#333' }
            }
        },
        animation: {
            duration: 0
        },
        plugins: {
            legend: { display: false }
        }
    };

    if (chartInstance) {
        chartInstance.destroy()
    }

    chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: scatterData,
        options: scatterOptions
    });

    return chartInstance;
}

export const renderLinReg = (width, height, states, stateSetter) => {  // width & height are for the bounding box of the animation (the right side of the vertical separator)

    const chartRef = React.createRef();

    // TODO: for whatever reason this broke everything
    // if (!(states['weight'] && states['bias'])) {
    //     stateSetter('weight', 45);
    //     states['weight'] = 45;
    //     stateSetter('bias', 0);
    //     states['bias'] = 0
    // }

    if (!(states['x'] && states['y'])) {  // TODO: check if this works
        const target_a = Math.tan((Math.random()/3)*Math.PI).toFixed(3)
        const target_b = Math.floor(Math.random() * 12 - 5).toFixed(3)
        const x = Array.from({ length: 100 }, () => Math.floor(Math.random() * 20) - 10);
        const y = x.map(xi => target_a * xi + parseFloat(target_b) + (Math.random() * 2.82 - 1.41));  // approximate noise as a normal distribution
        stateSetter('x', x)
        states['x'] = x
        stateSetter('y', y)
        states['y'] = y
    }

    const plotData = (weight, bias) => {
        const fixedMaxY = getMaxY(states['x'], states['y'], weight || 0, bias || 0);
        const scatterChart = makeScatterChart(chartRef.current, states['x'], states['y'], fixedMaxY);

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
            min={-5}
            max={5}
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
        <Box style={{ flex:1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: window.innerHeight-52, padding:'30px 50px' }}>
            <Flex direction='column' gap="0" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div>Weight: {states['weight']}</div>
                {weightSlider}
                <div>Bias: {states['bias']}</div>
                <div className="slider" style={{ marginTop:10, height:50, display: 'flex', justifyContent: 'center' }}>
                    {biasSlider}
                </div>
                
                {chartRef ? 
                    <canvas 
                        ref={chartRef} 
                        id="myChart"
                        style={{ width: Math.round(0.27 * (window.innerWidth * 0.97)), height: Math.round(0.35 * (window.innerHeight-140)), marginBottom:10 }}
                    />
                    : null}
                
                <div>
                    Current error: {states['error']}
                </div>
            </Flex>
        </Box>
    );
}
