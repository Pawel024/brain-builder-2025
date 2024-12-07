import { v4 as uuidv4 } from 'uuid';
import * as d3 from 'd3';

function initAgglo(numPoints, setGroups, setDots, width, height) {
  const N = numPoints;

  let newGroups = [];
  let newDots = [];

  // Initialize each point as its own cluster
  for (let i = 0; i < N; i++) {
    let dot = {
      id: uuidv4(), // Add unique identifier for each dot
      x: Math.random() * (width - 20),
      y: Math.random() * (height - 20),
      group: {
        id: uuidv4(), // Add unique identifier for each group
        dots: [],
        color: 'hsl(' + (i * 360 / N) + ',100%,50%)',
        center: {}
      }
    };
    dot.group.dots.push(dot);
    dot.group.center = { x: dot.x, y: dot.y };
    dot.init = {
      x: dot.x,
      y: dot.y,
      group: dot.group,
      color: dot.group.color
    };
    newDots.push(dot);
    newGroups.push(dot.group);
  }

  setGroups(newGroups);
  setDots(newDots);

  console.log("groups after init:", newGroups);
  console.log("dots after init:", newDots);

  return { newGroups, newDots };
}

function stepAgglo(setIsStepDisabled, draw, linegRef, dotgRef, centergRef, groups, setGroups, dots, setDots) {
  if (groups.length <= 2) {
    setIsStepDisabled(true);
  }

  if (groups.length <= 1) {
    return;
  }

  // Find the two closest groups
  let minDistance = Infinity;
  let closestPair = [];

  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      let dx = groups[i].center.x - groups[j].center.x;
      let dy = groups[i].center.y - groups[j].center.y;
      let distance = dx * dx + dy * dy;
      if (distance < minDistance) {
        minDistance = distance;
        closestPair = [i, j];
      }
    }
  }

  // Merge the two closest groups
  const [i, j] = closestPair;
  const groupI = groups[i];
  const groupJ = groups[j];

  const mergedGroup = {
    id: uuidv4(),
    dots: [...groupI.dots, ...groupJ.dots],
    color: averageColor(groupI.color, groupJ.color),
    center: {}
  };

  // Update the center of the merged group
  const { x, y } = mergedGroup.dots.reduce(
    (acc, dot) => {
      acc.x += dot.x;
      acc.y += dot.y;
      return acc;
    },
    { x: 0, y: 0 }
  );

  mergedGroup.center = {
    x: x / mergedGroup.dots.length,
    y: y / mergedGroup.dots.length
  };

  // Update group references in dots
  const updatedDots = dots.map(dot => {
    if (groupI.dots.includes(dot) || groupJ.dots.includes(dot)) {
      return { ...dot, group: mergedGroup };
    }
    return dot;
  });

  // Remove the merged groups and add the new merged group
  const newGroups = groups.filter((_, index) => index !== i && index !== j);
  newGroups.push(mergedGroup);

  // Update state
  setGroups(newGroups);
  setDots(updatedDots);

  // Redraw visualization
  draw(linegRef.current, dotgRef.current, centergRef.current, newGroups, updatedDots);
}

function restartAgglo(setGroups, dots, setDots) {
  // Create a mapping from dot IDs to new group objects
  const dotToGroupMap = new Map();

  // Create updated groups
  const updatedGroups = dots.map(dot => {
    const newGroup = {
      id: uuidv4(),
      dots: [], // We'll assign dots after updating
      color: dot.init.color,
      center: { x: dot.init.x, y: dot.init.y }
    };
    dotToGroupMap.set(dot.id, newGroup);
    return newGroup;
  });

  // Update dots and assign to their new groups
  const updatedDots = dots.map(dot => {
    const newGroup = dotToGroupMap.get(dot.id);
    const updatedDot = {
      ...dot,
      x: dot.init.x,
      y: dot.init.y,
      group: newGroup, // Assign new group
      init: {
        ...dot.init,
        group: newGroup
      }
    };
    newGroup.dots.push(updatedDot); // Add dot to group's dots
    return updatedDot;
  });

  // Set the new state
  setGroups(updatedGroups);
  setDots(updatedDots);

  console.log("groups after restart:", updatedGroups);
  console.log("dots after restart:", updatedDots);

  return { newGroups: updatedGroups, newDots: updatedDots };
}

function averageColor(color1, color2) {
  const hsl1 = d3.hsl(color1);
  const hsl2 = d3.hsl(color2);

  const avgH = Math.max(0, Math.min(360, (hsl1.h + hsl2.h) / 2 + (Math.random() - 0.5) * 60)); // Add randomness to hue
  const avgS = Math.max(0, Math.min(1, (hsl1.s + hsl2.s) / 2 + (Math.random() - 0.5) * 0.4)); // Add randomness to saturation
  const avgL = Math.max(0, Math.min(1, (hsl1.l + hsl2.l) / 2 + (Math.random() - 0.5) * 0.4)); // Add randomness to lightness

  return d3.hsl(avgH, avgS, avgL).toString();
}

export { initAgglo, stepAgglo, restartAgglo };