import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import Header from './common/header';
import { Flex, Button, Box, Card, Text, TextField } from '@radix-ui/themes';
import { initKMeans, stepKMeans, restartKMeans } from './utils/clustering/kmeansUtils';
import { initAgglo, stepAgglo, restartAgglo } from './utils/clustering/aggloUtils';

function draw(lineg, dotg, centerg, groups, dots) {

    let circles = dotg.selectAll('circle')
      .data(dots);
    circles.enter()
      .append('circle');
    circles.exit().remove();
    circles
        .attr('fill', d => d.group ? d.group.color : '#ffffff');
    circles
      .transition()
      .duration(500)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 5);
  
    if (dots[0]?.group) {
      let l = lineg.selectAll('line')
        .data(dots);
      const updateLine = function(lines) {
        lines
          .attr('x1', d => d.x)
          .attr('y1', d => d.y)
          .attr('x2', d => d.group.center.x)
          .attr('y2', d => d.group.center.y)
          .attr('stroke', d => d.group.color);
      };
      updateLine(l.enter().append('line'));
      updateLine(l.transition().duration(500));
      l.exit().remove();
    } else {
      lineg.selectAll('line').remove();
    }
  
    let c = centerg.selectAll('path')
      .data(groups, d => d.id);
    const updateCenters = function(centers) {
      centers
        .attr('transform', d => "translate(" + d.center.x + "," + d.center.y + ") rotate(45)")
        .attr('fill', d => d.color)
        .attr('stroke', '#aabbcc');
    };
    c.exit().remove();
    updateCenters(c.enter()
      .append('path')
      .attr('d', d3.symbol().type(d3.symbolCross).size(200))
      .attr('stroke', '#aabbcc'));
    updateCenters(c);
}

function ClusteringVisualization({clusteringId}) {
    const cluMet = (clusteringId === 61) ? "agglo" : "kmeans"; // TODO handle this through a property in the database

    const [clusteringMethod, setClusteringMethod] = useState(cluMet);
    const [numPoints, setNumPoints] = useState((cluMet === "agglo") ? 10 : 200);
    const [numClusters, setNumClusters] = useState(2);
    const [isRestartDisabled, setIsRestartDisabled] = useState(true);
    const [isStepDisabled, setIsStepDisabled] = useState(false);
    const [flag, setFlag] = useState(false);
    const [groups, setGroups] = useState([]);
    const [dots, setDots] = useState([]);
    const [nOfSteps, setNOfSteps] = useState(0);
    const [width, setWidth] = useState(window.innerHeight*0.6);
    const [height, setHeight] = useState(window.innerHeight*0.6);

    // Refs for SVG and D3 groups
    const svgRef = useRef(null);
    const linegRef = useRef(null);
    const dotgRef = useRef(null);
    const centergRef = useRef(null);

    useEffect(() => {
        // hide the preloader when page loads
        const preloader = document.getElementById("preloader");
        if (preloader) {
            preloader.style.display = "none";
        }

        if (!svgRef.current) {
            // Initialize SVG and groups if not already initialized
            const svg = d3.select("#kmeans").append("svg")
                .attr('width', width)
                .attr('height', height)
                .style('padding', '10px')
                .style('background', '#223344')
                .style('cursor', 'pointer')
                .style('user-select', 'none')
                .on('click', function(event) {
                    event.preventDefault();
                    //handleStep();
                });
            svgRef.current = svg;

            // Initialize groups
            linegRef.current = svg.append('g');
            dotgRef.current = svg.append('g');
            centergRef.current = svg.append('g');
        }

        handleReset();
        //not elegant but fixes the issue of not rendering the dots on the first render
        handleReset();

        // Cleanup function
        return () => {
            if (svgRef.current) {
                svgRef.current.on('click', null); // Remove click event listener
            }
        };
    }, []); // this runs only once on mount
    
    const handleReset = () => {
        setIsStepDisabled(false);
        setIsRestartDisabled(false);

        setNOfSteps(0);

        let initOutput;
        if (clusteringMethod === 'kmeans') {
            initOutput = initKMeans(numPoints, numClusters, setGroups, setFlag, setDots, width, height);
        } else {
            initOutput = initAgglo(numPoints, setGroups, setDots, width, height);
        }
        // Use refs to access SVG and groups
        draw(linegRef.current, dotgRef.current, centergRef.current, initOutput.newGroups, initOutput.newDots);
    };

    const handleStep = () => {
        setIsRestartDisabled(false);

        if (clusteringMethod === 'kmeans') {
            setNOfSteps(nOfSteps + 0.5);
            stepKMeans(setIsStepDisabled, flag, setFlag, draw, linegRef, dotgRef, centergRef, groups, setGroups, dots, setDots);
        } else {
            setNOfSteps(nOfSteps + 1);
            stepAgglo(setIsStepDisabled, draw, linegRef, dotgRef, centergRef, groups, setGroups, dots, setDots);
        }
    };
    
    const handleRestart = () => {
        setIsRestartDisabled(true);
        setIsStepDisabled(false);

        setNOfSteps(0);

        let restartOutput;
        if (clusteringMethod === 'kmeans') {
            restartOutput = restartKMeans(groups, setGroups, dots, setDots, setFlag);
        } else {
            restartOutput = restartAgglo(setGroups, dots, setDots);
        }
        draw(linegRef.current, dotgRef.current, centergRef.current, restartOutput.newGroups, restartOutput.newDots);
    };

    const SSE = groups.reduce((acc, group) => {
        const groupWCSS = group.dots.reduce((groupAcc, dot) => {
          const distanceSquared = (Math.pow(dot.x - group.center.x, 2) + Math.pow(dot.y - group.center.y, 2))/2500; // divided by 50 squared to change svg size from 500x500 to 10x10
          return groupAcc + distanceSquared;
        }, 0);
        return acc + groupWCSS;
      }, 0);

    return (
        <Flex direction="column" gap="1" style={{ width: '100%', height: '100%' }}>
            <Header showHomeButton={true} />

            <Box style={{ padding: '10px', position: 'relative', width: '100%', height: window.innerHeight - 54, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

                <Card style={{ padding: '10px', maxWidth: '300px', position: 'absolute', top: '15px', left: '17px' }}>
                    <Flex direction="column" gap="3">

                        <Flex gap="2" style={{ alignItems: 'center' }}>
                            <label style={{ verticalAlign: 'middle', fontSize: "var(--font-size-2)" }}>
                                Number of points:
                            </label>
                            
                            <Box maxWidth="15vw">
                                <TextField.Root size="2" type="number" value={numPoints} onChange={(e) => setNumPoints(Number(e.target.value))} />
                            </Box>
                        </Flex>

                        {clusteringMethod === 'kmeans' && (
                            <Flex gap="2" style={{ alignItems: 'center' }}>
                                <label style={{ verticalAlign: 'middle', fontSize: "var(--font-size-2)" }}>
                                    Number of clusters:
                                </label>

                                <Box maxWidth="15vw">
                                    <TextField.Root size="2" type="number" value={numClusters} onChange={(e) => setNumClusters(Number(e.target.value))} />
                                </Box>
                            </Flex>
                        )}

                        <Flex gap="2">
                            <Button id="run" onClick={handleReset}>
                                Generate new points
                            </Button>
                            <Button id="restart" onClick={handleRestart} disabled={isRestartDisabled}>
                                Restart
                            </Button>
                        </Flex>

                    </Flex>
                </Card>

                <Flex gap="3" direction="column" style={{ padding: '5px', justifyContent: 'center', alignItems: 'center' }}>
                   
                    <div id="kmeans"/>
                    
                    <Button id="step" onClick={handleStep} disabled={isStepDisabled} size="3" style={{ width: `${width}px` }}>
                        {clusteringMethod === 'agglo' ? 'Merge clusters' : flag === true ? 'Update centers' : 'Assign to clusters'}
                    </Button>

                    <Card style={{ padding: '10px', width: '100%', maxWidth: `${width}px`, fontSize: 'var(--font-size-2)' }}>
                        <Flex direction="column" gap="2" align="center">
                            <Text size="2" style={{ fontWeight: 'bold' }}>Steps: {nOfSteps}</Text>
                            <Text size="2" style={{ fontWeight: 'bold' }}>SSE (WCSS): {SSE.toFixed(3)}</Text>
                        </Flex>
                    </Card>

                </Flex>

            </Box>
        </Flex>
    );
}

export default ClusteringVisualization;