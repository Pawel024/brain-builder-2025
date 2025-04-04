import React, { useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Flex, Box } from '@radix-ui/themes';
import '../../css/App.css';
import { handleChangeWrapper, meanSquaredError, getMinMaxY, makeScatterChart } from './plottingUtils';



export default function RenderLinReg({ width, height, states, stateSetter }) {  // width & height are for the bounding box of the animation (the right side of the vertical separator)
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
