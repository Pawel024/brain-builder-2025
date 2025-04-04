import React, { useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Box } from '@radix-ui/themes';
import { Chart } from 'chart.js';
import '../../css/App.css';
import { handleChangeWrapper, getMinMaxY } from './plottingUtils';


export default function RenderPCA({ width, height, states, stateSetter }) {
    const chartRef = React.createRef();
    const projectionChartRef = React.createRef();
    const chartInstanceRef = React.useRef(null);
    const projectionChartInstanceRef = React.useRef(null);
    const limits = [-10, 10];

    useEffect(() => {
        if (states.angle === undefined) {
            stateSetter('angle', 45);
        }

        if (!(states['x'] && states['y'])) {
            // Generate random data similar to the Python implementation
            const target_a = Math.tan((Math.random()/3)*Math.PI).toFixed(3);
            const target_b = 0;
            const x = Array.from({ length: 50 }, () => Math.floor(Math.random() * (limits[1] - limits[0])) + limits[0]);
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
            plotData(states.angle);
        }
    }, [states.x, states.y]);

    const plotData = (angle) => {
        if (!chartRef.current || !projectionChartRef.current) return;
        
        // Destroy existing charts
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }
        if (projectionChartInstanceRef.current) {
            projectionChartInstanceRef.current.destroy();
            projectionChartInstanceRef.current = null;
        }
        
        // Convert angle to radians
        const angleRad = angle * Math.PI / 180;
        const a = Math.tan(angleRad);
        
        // Create the main scatter plot
        const datasets = [
            {
                label: 'Data Points',
                data: states.x.map((x, i) => ({ x, y: states.y[i] })),
                backgroundColor: 'rgba(4, 151, 185, 1)',
                type: 'scatter'
            }
        ];

        if (angle !== null) {
            // Add the line representing the projection direction
            const x_s = Array.from({ length: 200 }, (_, i) => 
                limits[0] + (i / 199) * (limits[1] - limits[0])
            );
            const y_s = x_s.map(x => a * x);
            
            datasets.push({
                label: 'Projection Line',
                data: x_s.map((x, i) => ({ x, y: y_s[i] })),
                borderColor: 'rgba(185, 38, 4, 1)',
                fill: false,
                type: 'line',
                pointRadius: 0
            });

            // Add projection lines and projected points
            const projectedPoints = states.x.map((x, i) => {
                const y = states.y[i];
                // Calculate projection point
                const t = (x + a * y) / (1 + a * a);
                const projX = t;
                const projY = a * t;
                return { x: projX, y: projY };
            });

            // Add projection lines
            datasets.push({
                label: 'Projection Lines',
                data: states.x.flatMap((x, i) => [
                    { x, y: states.y[i] },
                    projectedPoints[i],
                    { x: NaN, y: NaN } // Break the line between points
                ]),
                borderColor: 'rgba(185, 38, 4, 0.2)',
                fill: false,
                type: 'line',
                pointRadius: 0
            });

            // Add projected points
            datasets.push({
                label: 'Projected Points',
                data: projectedPoints,
                backgroundColor: 'rgba(185, 38, 4, 0.8)',
                type: 'scatter',
                pointRadius: 3
            });
        }

        const scaleMin = Math.min(limits[0], states.minY);
        const scaleMax = Math.max(limits[1], states.maxY);

        chartInstanceRef.current = new Chart(chartRef.current, {
            type: 'scatter',
            data: { datasets },
            options: {
                parsing: false,
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        min: scaleMin,
                        max: scaleMax,
                        ticks: { stepSize: 1 },
                        title: { display: true, text: 'X Axis' }
                    },
                    y: {
                        type: 'linear',
                        min: scaleMin,
                        max: scaleMax,
                        title: { display: true, text: 'Y Axis' }
                    }
                },
                plugins: {
                    legend: { display: true },
                    title: {
                        display: true,
                        text: 'Original Data & Projection'
                    }
                },
                animation: false
            }
        });

        // Calculate projections of points onto the line
        const projections = states.x.map((x, i) => {
            const y = states.y[i];
            return (x + a * y) / Math.sqrt(a * a + 1);
        });

        // Calculate variance and explained variance
        const totalVar = calculateVariance(states.x) + calculateVariance(states.y);
        const projVar = calculateVariance(projections);
        const explainedVar = projVar / totalVar;

        // Update the explained variance in the state
        stateSetter('explainedVar', explainedVar.toFixed(3));

        // Create a 1D scatter plot for projections
        projectionChartInstanceRef.current = new Chart(projectionChartRef.current, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Projected Points',
                    data: projections.map(p => ({ x: p, y: 0 })),
                    backgroundColor: 'rgba(4, 151, 185, 1)',
                    type: 'scatter',
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        min: -15,
                        max: 15,
                        title: { display: true, text: 'Projection Axis' }
                    },
                    y: {
                        display: false,
                        min: -0.5,
                        max: 0.5
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: '1D Projection'
                    }
                },
                animation: false
            }
        });
    };

    // Helper function to calculate variance
    const calculateVariance = (arr) => {
        const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
        return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    };

    const plottingWrapper = (value) => {
        plotData(states['angle']);
    };

    const angleSlider = (
        <Slider.Root
            className="SliderRoot"
            defaultValue={[45]}
            onValueChange={(value) => handleChangeWrapper(value[0], null, plottingWrapper, 'angle', states, stateSetter)}
            min={-85}
            max={85}
            step={1}
            style={{ width: Math.round(0.16 * (window.innerWidth * 0.97)), margin: 10 }}
        >
            <Slider.Track className="SliderTrack" style={{ height: 3 }}>
                <Slider.Range className="SliderRange" />
            </Slider.Track>
            <Slider.Thumb className="SliderThumb" aria-label="Angle wrt x-axis" />
        </Slider.Root>
    );

    return (
        <Box style={{ flex:1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: window.innerHeight-52, padding:'30px 50px', fontFamily:'monospace' }}>
            <div>Angle: <b>{states['angle']}°</b></div>
            {angleSlider}
                
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', marginTop: 30 }}>
                <div style={{ width: Math.round(0.27 * (window.innerWidth * 0.97)), height: Math.round(0.55 * (window.innerHeight-52)), border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
                    <canvas ref={chartRef} id="mainChart" />
                </div>
                <div style={{ width: Math.round(0.27 * (window.innerWidth * 0.97)), height: Math.round(0.55 * (window.innerHeight-52)), border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
                    <canvas ref={projectionChartRef} id="projectionChart" />
                </div>
            </div>
                
            <div style={{ marginTop: 20 }}>
                Explained Variance: <b>{states['explainedVar'] || '0.000'}</b>
            </div>
        </Box>
    );
}