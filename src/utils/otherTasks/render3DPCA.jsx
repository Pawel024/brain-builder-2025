import React, { useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Box } from '@radix-ui/themes';
import { Chart } from 'chart.js';
import '../../css/App.css';
import { handleChangeWrapper } from './plottingUtils';


export default function Render3DPCA({ width, height, states, stateSetter }) {
    const mainViewRef = React.createRef();
    const projectionRef = React.createRef();
    const mainChartInstanceRef = React.useRef(null);
    const projectionChartInstanceRef = React.useRef(null);
    const limits = [-10, 10];

    useEffect(() => {
        // Disable all animations globally for this visualization
        Chart.defaults.animations = false;
        Chart.defaults.transitions.active.animation.duration = 0;
        
        if (states.angle === undefined) {
            stateSetter('angle', 0);
        }

        if (!(states['x'] && states['y'] && states['z'])) {
            // Generate spiral-like 3D data for clearer visualization
            const points = 50;
            const noise = 0.5;
            const x = Array(points).fill(0).map((_, i) => 
                (i/points * 12 - 6) + (Math.random() - 0.5) * noise
            );
            const y = x.map((x, i) => 
                Math.sin(x) * 4 + (Math.random() - 0.5) * noise  // Increased amplitude from 3 to 4
            );
            const z = x.map((x, i) => 
                Math.cos(x) * 4 + (Math.random() - 0.5) * noise  // Increased amplitude from 3 to 4
            );

            stateSetter('x', x);
            stateSetter('y', y);
            stateSetter('z', z);
        }
    }, []);

    useEffect(() => {
        if (states.x && states.y && states.z) {
            plotData(states.angle);
        }
    }, [states.x, states.y, states.z]);

    const plotData = (angle) => {
        if (!mainViewRef.current || !projectionRef.current) return;
        
        // Cleanup old charts
        if (mainChartInstanceRef.current) {
            mainChartInstanceRef.current.destroy();
            mainChartInstanceRef.current = null;
        }
        if (projectionChartInstanceRef.current) {
            projectionChartInstanceRef.current.destroy();
            projectionChartInstanceRef.current = null;
        }

        const angleRad = angle * Math.PI / 180;
        
        // Calculate projection plane normal vector
        const normal = {
            // x: Math.cos(angleRad),
            // y: Math.sin(angleRad),
            // z: 0

            // I know the above is more correct, but this will be more intuitive
            x: -Math.sin(angleRad),
            y: Math.cos(angleRad), 
            z: 0
        };

        // Project points onto the plane
        const projectedPoints = states.x.map((x, i) => {
            const point = { x, y: states.y[i], z: states.z[i] };
            const dot = normal.x * point.x + normal.y * point.y + normal.z * point.z;
            return {
                x: point.x - normal.x * dot,
                y: point.y - normal.y * dot,
                z: point.z - normal.z * dot
            };
        });

        // Create the main 3D view with proper plane representation
        const maxZ = Math.max(...states.z);
        const minZ = Math.min(...states.z);
        const zRange = maxZ - minZ;

        // Calculate two points for the projection plane line
        // We want the line to span the view and be perpendicular to the normal vector
        const planeDirection = { x: -normal.y, y: normal.x }; // Perpendicular to normal
        const planeLength = 20; // Length of the line
        const plane = [
            { 
                x: -planeLength * planeDirection.x,
                y: -planeLength * planeDirection.y
            },
            { 
                x: planeLength * planeDirection.x,
                y: planeLength * planeDirection.y
            }
        ];

        mainChartInstanceRef.current = new Chart(mainViewRef.current, {
            type: 'bubble',
            data: {
                datasets: [
                    {
                        label: 'Original Points',
                        data: states.x.map((x, i) => ({
                            x: x,
                            y: states.y[i],
                            r: ((states.z[i] - minZ) / zRange) * 8 + 3  // Reduced from *15+5 to *8+3
                        })),
                        backgroundColor: states.z.map(z => 
                            `rgba(4, 151, 185, ${((z - minZ) / zRange) * 0.8 + 0.2})`
                        ),
                        borderColor: 'rgba(4, 151, 185, 0.8)',
                        borderWidth: 1
                    },
                    {
                        label: 'Projection Plane',
                        data: plane,
                        borderColor: 'rgba(200, 200, 200, 0.9)',
                        borderWidth: 3,
                        borderDash: [5, 5],
                        type: 'line'
                    },
                    {
                        label: 'Projected Points',
                        data: projectedPoints.map(p => ({
                            x: p.x,
                            y: p.y,
                            r: 6
                        })),
                        backgroundColor: 'rgba(185, 38, 4, 0.5)',
                        borderColor: 'rgba(185, 38, 4, 0.7)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: {
                        title: { display: true, text: 'X Axis' },
                        min: limits[0],
                        max: limits[1],
                        grid: {
                            color: 'rgba(200, 200, 200, 0.2)',
                        }
                    },
                    y: {
                        title: { display: true, text: 'Y Axis' },
                        min: limits[0],
                        max: limits[1],
                        grid: {
                            color: 'rgba(200, 200, 200, 0.2)',
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: '3D View (size/color = Z height)'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const i = context.dataIndex;
                                if (i !== undefined && states.x[i] !== undefined) {
                                    return `(${states.x[i].toFixed(1)}, ${states.y[i].toFixed(1)}, ${states.z[i].toFixed(1)})`;
                                }
                                return '';
                            }
                        }
                    }
                }
            }
        });

        // Calculate 2D coordinates in the projection plane
        const basis = {
            // x: -Math.sin(angleRad),
            // y: Math.cos(angleRad)

            // I know the above ones are more correct, but this will be more intuitive I think
            x: Math.cos(angleRad),
            y: Math.sin(angleRad)
        };

        const projected2D = projectedPoints.map(p => ({
            x: p.x * basis.x + p.y * basis.y,
            y: p.z
        }));

        // Calculate variance explained
        const originalVar = calculateVariance(states.x) + calculateVariance(states.y) + calculateVariance(states.z);
        const projectedVar = calculateVariance(projected2D.map(p => p.x)) + calculateVariance(projected2D.map(p => p.y));
        const explainedVar = projectedVar / originalVar;
        stateSetter('explainedVar', explainedVar.toFixed(3));

        // Create the 2D projection view
        projectionChartInstanceRef.current = new Chart(projectionRef.current, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: '2D Projection',
                    data: projected2D,
                    backgroundColor: 'rgba(185, 38, 4, 1)',
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: {
                        title: { display: true, text: '1st Principal Direction?' },
                        min: limits[0],
                        max: limits[1],
                        grid: {
                            color: 'rgba(200, 200, 200, 1)',
                        }
                    },
                    y: {
                        title: { display: true, text: '2nd Principal Direction?' },
                        min: limits[0],
                        max: limits[1],
                        grid: {
                            color: 'rgba(200, 200, 200, 1)',
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Final 2D Projection'
                    }
                }
            }
        });
    };

    const calculateVariance = (arr) => {
        const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
        return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    };

    const angleSlider = (
        <Slider.Root
            className="SliderRoot"
            defaultValue={[0]}
            onValueChange={(value) => handleChangeWrapper(value[0], null, plotData, 'angle', states, stateSetter)}
            min={-180}
            max={180}
            step={1}
            style={{ width: Math.round(0.16 * (window.innerWidth * 0.97)), margin: 10 }}
        >
            <Slider.Track className="SliderTrack" style={{ height: 3 }}>
                <Slider.Range className="SliderRange" />
            </Slider.Track>
            <Slider.Thumb className="SliderThumb" aria-label="Angle wrt x-z plane" />
        </Slider.Root>
    );

    return (
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: window.innerHeight-52, padding: '20px 30px', fontFamily: 'monospace' }}>
            <div>Angle: <b>{states['angle']}°</b></div>
            {angleSlider}

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', marginTop: 30 }}>
                <div style={{ width: Math.round(0.27 * (window.innerWidth * 0.97)), height: Math.round(0.55 * (window.innerHeight-52)), border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
                    <canvas ref={mainViewRef} />
                </div>
                <div style={{ width: Math.round(0.27 * (window.innerWidth * 0.97)), height: Math.round(0.55 * (window.innerHeight-52)), border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
                    <canvas ref={projectionRef} />
                </div>
            </div>

            <div style={{ marginTop: 20 }}>
                Explained Variance: <b>{states['explainedVar'] || '0.000'}</b>
            </div>
        </Box>
    );
}
