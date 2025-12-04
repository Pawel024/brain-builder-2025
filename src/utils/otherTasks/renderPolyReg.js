import React, { useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Flex, Box } from '@radix-ui/themes';
import { Chart } from 'chart.js';
import '../../css/App.css';
import { handleChangeWrapper, polyfit, polyval } from './plottingUtils';


export default function RenderPolyReg({ width, height, states, stateSetter }) {
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