import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import Header from './common/header';
import { Flex, Button, Box, Card, Text, TextField, Heading } from '@radix-ui/themes';
import { initKMeans, stepKMeans, restartKMeans } from './utils/clustering/kmeansUtils';
import { initAgglo, stepAgglo, restartAgglo } from './utils/clustering/aggloUtils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

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
    const [width, setWidth] = useState(window.innerWidth * 0.32, 600);
    const [height, setHeight] = useState(window.innerWidth * 0.32, 600);
    const [description, setDescription] = useState([]);
    const [shortDescription, setShortDescription] = useState("");
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    // Refs for SVG and D3 groups
    const svgRef = useRef(null);
    const linegRef = useRef(null);
    const dotgRef = useRef(null);
    const centergRef = useRef(null);

    // Check if running locally
    const isRunningLocally = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const newSize = window.innerWidth * 0.32;
            setWidth(newSize);
            setHeight(newSize);
            
            if (svgRef.current) {
                svgRef.current
                    .attr('width', newSize)
                    .attr('height', newSize);
                handleReset();
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // hide the preloader when page loads
        const preloader = document.getElementById("preloader");
        if (preloader) {
            preloader.style.display = "none";
        }

        // Set default description if running locally
        if (isRunningLocally) {
            if (clusteringMethod === 'kmeans') {
                setShortDescription("**K-Means Clustering**\n\nK-means clustering is an unsupervised learning algorithm that groups similar data points together. The algorithm works by:\n\n1. Randomly initializing K cluster centers\n2. Assigning each data point to the nearest cluster center\n3. Updating the cluster centers to be the mean of all points in that cluster\n4. Repeating steps 2-3 until convergence\n\nUse the controls to adjust the number of points and clusters, then click 'Step' to see each iteration of the algorithm.");
            } else {
                setShortDescription("**Agglomerative Clustering**\n\nAgglomerative clustering is a hierarchical clustering algorithm that builds clusters by merging similar data points. The algorithm works by:\n\n1. Starting with each point as its own cluster\n2. Finding the two closest clusters\n3. Merging them into a new cluster\n4. Repeating steps 2-3 until only one cluster remains\n\nUse the controls to adjust the number of points, then click 'Step' to see each merging step.");
            }
        } else {
            // Load description from API
            fetch(window.location.origin + '/api/tasks/?task_id=' + clusteringId)
                .then(response => response.json())
                .then(data => {
                    // Handle both array response and direct object response
                    const taskData = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
                    
                    if (taskData) {
                        setShortDescription(taskData.short_description || "");
                        
                        if (taskData.description) {
                            if (taskData.description[0] === '[') {
                                setDescription(JSON.parse(taskData.description));
                            } else {
                                createDescriptionList(taskData.description);
                            }
                        } else {
                            console.log('No description found in API response');
                        }
                    } else {
                        console.log('No data found for clusteringId:', clusteringId);
                    }
                })
                .catch(error => {
                    console.error('Error loading description:', error);
                    setDescription([["Error Loading Description", "There was an error loading the task description. You should be able to continue, but notify us if this issue persists."]]);
                });
        }

        if (!svgRef.current) {
            const size = window.innerWidth * 0.32;
            // Initialize SVG and groups if not already initialized
            const svg = d3.select("#kmeans").append("svg")
                .attr('width', size)
                .attr('height', size)
                .style('padding', '10px')
                .style('background', '#223244')
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
    
    const createDescriptionList = (jsonText) => {
        try {
            const sanitizedJson = jsonText.replace(/<\/?[^>]+(>|$)/g, "")
                .replace(/&/g, "&amp;")
                .replace(/%/g, "&#37;")
                .replace(/#/g, "&#35;")
                .replace(/!/g, "&#32;")
                .replace(/\?/g, "&#63;")
                .replace(/'/g, "&#39;")
                .replace(/"/g, "&quot;");
            const splitText = sanitizedJson.split('\n ');
            const descriptionList = splitText.map(subText => {
                const [subtitle, ...paragraphs] = subText.split('\n');
                const formattedParagraphs = paragraphs.map(paragraph => 
                    paragraph.replace(/\*([^*]+)\*/g, '<b>$1</b>')  // bold
                    .replace(/_([^_]+)_/g, '<i>$1</i>') // italic
                );
                return [subtitle, ...formattedParagraphs];
            });
            setDescription(descriptionList);
        } catch (error) {
            console.error('Error parsing JSON or formatting description:', error);
        }
    };
    
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
          const distanceSquared = (Math.pow(dot.x - group.center.x, 2) + Math.pow(dot.y - group.center.y, 2))/2700; // divided by 50 squared to change svg size from 500x500 to 10x10
          return groupAcc + distanceSquared;
        }, 0);
        return acc + groupWCSS;
      }, 0);

    return (
        <Flex direction="column" gap="1" style={{ width: '100%', height: '100%' }}>
            <Header showHomeButton={true} />

            <Box style={{ padding: '2vh', position: 'relative', width: '100%', height: 'calc(100vh - 54px)' }}>

                {/* Controls section */}
                <Card style={{ 
                    padding: '2vh',
                    width: '27vw',
                    position: 'absolute', 
                    top: '3vh', 
                    left: '2vw' 
                }}>
                    <Flex direction="column" gap="3">
                        <Flex gap="2" style={{ alignItems: 'center' }}>
                            <label style={{ 
                                verticalAlign: 'middle', 
                                fontSize: "var(--font-size-2)",
                                width: '60%' 
                            }}>
                                Number of points:
                            </label>
                            
                            <Box style={{ width: '40%' }}>
                                <TextField.Root size="2" type="number" value={numPoints} onChange={(e) => setNumPoints(Number(e.target.value))} />
                            </Box>
                        </Flex>

                        {clusteringMethod === 'kmeans' && (
                            <Flex gap="2" style={{ alignItems: 'center' }}>
                                <label style={{ 
                                    verticalAlign: 'middle', 
                                    fontSize: "var(--font-size-2)",
                                    width: '60%'
                                }}>
                                    Number of clusters:
                                </label>

                                <Box style={{ width: '40%' }}>
                                    <TextField.Root size="2" type="number" value={numClusters} onChange={(e) => setNumClusters(Number(e.target.value))} />
                                </Box>
                            </Flex>
                        )}

                        <Flex gap="2">
                            <Button id="run" onClick={handleReset} style={{ flex: 1}}>
                                New points
                            </Button>
                            <Button id="restart" onClick={handleRestart} disabled={isRestartDisabled} style={{ flex: 1, padding: '10px 20px' }}>
                                Restart
                            </Button>
                        </Flex>
                    </Flex>
                </Card>

                {/* Main visualization section */}
                <Flex 
                    gap="2vh" 
                    direction="column" 
                    style={{
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        marginTop: '1vh'
                    }}
                >
                    <div id="kmeans" style={{ 
                        width: '32vw',
                        height: '32vw'
                    }}/>
                    
                    <Button 
                        id="step" 
                        onClick={handleStep} 
                        disabled={isStepDisabled} 
                        size="3" 
                        style={{ 
                            width: '32vw'
                        }}
                    >
                        {clusteringMethod === 'agglo' ? 'Merge clusters' : flag === true ? 'Update centers' : 'Assign to clusters'}
                    </Button>

                    <Card style={{ 
                        padding: '1.5vh', 
                        width: '32vw'
                    }}>
                        <Flex direction="column" gap="2" align="center">
                            <Text size="2" style={{ fontWeight: 'bold' }}>Steps: {nOfSteps}</Text>
                            <Text size="2" style={{ fontWeight: 'bold' }}>SSE (WCSS): {SSE.toFixed(3)}</Text>
                        </Flex>
                    </Card>
                </Flex>

                {/* Description section */}
                <Card style={{ 
                    padding: '2vh', 
                    width: '27vw',
                    position: 'absolute', 
                    top: '3vh', 
                    right: '2vw'
                }}>
                    <Flex direction="column" gap="2">
                        <div style={{ 
                            textAlign: 'justify', 
                            fontFamily: 'monospace', 
                            fontSize: 'calc(0.8rem + 0.2vw)', 
                            color: 'var(--slate-11)',
                            padding: '10px 20px'
                        }}>
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{shortDescription}</ReactMarkdown>
                        </div>
                    </Flex>
                </Card>
            </Box>
        </Flex>
    );
}

export default ClusteringVisualization;