let d8r = (function(d3){

  // Fixed node IDs
  const fixedNodeIDs = ["happy","sad","disgust","fear","angry","surprise"];
  // Rearranged to match server response ordering for donuts
  // const fixedNodeIDs = ["angry", "disgust", "fear", "happy", "sad", "surprise"];

  // Six random numbers that add up to x
  function nodeLinks(x) {
    let rndNmbrs = [];
    for(let i = 0; i < 6; i++){
      rndNmbrs.push(Math.random());
    }
    let total = rndNmbrs.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0
    );
    let multiplier = x/total;
    for(let i = 0; i < 6; i ++){
      rndNmbrs[i] = rndNmbrs[i] * multiplier;
    }
    return rndNmbrs;
  }

  // Get random int inclusive of min and max
  // from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
  }

  function getRandomFace() {
    let index = getRandomIntInclusive(1, 20);
    let emotion = ["angry","disgust","fear","happy","neutral","sad","surprise"][getRandomIntInclusive(0,6)]
    return "./faces/" + emotion + "/" + emotion + "_" + index + ".png";
  }

  // UUID generator (https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript)
  function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  function makeFixedNodes(ids){
    let fxNodes = [];
    for(let i = 0; i < 6; i++){
      fxNodes.push({id: ids[i], group:"target", image:ids[i] + ".svg"});
    }
    return {nodes: fxNodes, links: []};
  }

  const fixedNodes = makeFixedNodes(fixedNodeIDs);

  function getNode(thisID, fixedNodeIDs, outwardLinks, image = getRandomFace()){
    let node = {
      id: thisID,
      group: "data",
      image: image
    };
    let links = [];
    for(let i = 0; i < 6; i++){
      let link = {
        source: thisID,
        target: fixedNodeIDs[i],
        value: outwardLinks[i]
      };
      links.push(link);
    }
    return {nodes: [node], links: links};
  }

  // Preprocess server response
  function preprocess(serverResponse){
    let processed = [];
    serverResponse.forEach( element => {
      let nodes = [
          {
            "id": element[0].id,
            "image": element[0].image,
            "group": element[0].group
          }
        ];
      let links_arr = Array.from(element[1]);
      let links = [];
      links_arr.forEach( link => {
        links.push({
            "source": link.source,
            "target": link.target,
            "value":  link.value
        });
      });
      processed.push({
        "nodes": nodes,
        "links": links
        });
    });
    return processed;
  }

  function chartData(serverResponse){
    let processed = [];
    serverResponse.metrics.forEach( element => {
      processed.push({
        //"group": element.name,
        "group": uuidv4(),
        "value": element.value
      });
    });
    return processed[0];  // just returning the first right now!
  }

  // Convert server response node into node array node
  function toNodeArrayNode(serverResponseNode){
    let linksArray = [];
    for(let i = 0; i < 6; i++){
      let linkObject = {
        source: serverResponseNode.id,
        target: fixedNodeIDs[i],
        value: serverResponseNode.links[fixedNodeIDs[i]]
      };
      linksArray.push(linkObject);
    }

    let nodeArrayNode = {
      nodes:[
        {
          id: serverResponseNode.id,
          group: "data",
          image: serverResponseNode.image
        }
      ],
      links: linksArray
    };
    return nodeArrayNode;
  }

  function getNodeArray(lngth){
    let nodes = [];
    for(let i = 0; i < lngth; i++){
      nodes.push(getNode(uuidv4(),fixedNodeIDs,nodeLinks(1)));
    }
    return nodes;
  }

  function updateNode(thisNode, newLinks){
    for(let i = 0; i < 6; i++){
      thisNode.links[i].value = newLinks[i];
    }
    return thisNode;
  }

  function refreshNodeArray(nodeArray, serverResponse){
    let nodeArrayIds = nodeArray.map((x) => x.nodes[0].id);

    for(let i = 0; i < serverResponse.length; i++){
      if(nodeArrayIds.includes(serverResponse[i].nodes[0].id)){
        let uNode = nodeArray.find((x) => x.nodes[0].id === serverResponse[i].nodes[0].id);
        for(let j = 0; j < uNode.links.length; j++){
          uNode.links[j].value = serverResponse[i].links.find((x) => x.target === uNode.links[j].target.id).value;
        }
      } else {
        let nuNode = serverResponse[i];
        nodeArray.push(nuNode);
      }
    }
    return nodeArray;
  }

  function simpleUpdateNodeArray(nodeArray){
    for(let i = 0; i < nodeArray.length; i++){
      nodeArray[i] = updateNode(nodeArray[i],nodeLinks(1));
    }
    return nodeArray;
  }

  function updateNodeArray(nodeArray, add = 0, remove = 0){
    for(let i = 0; i < nodeArray.length; i++){
      nodeArray[i] = updateNode(nodeArray[i],nodeLinks(1));
    }
    if(remove > 0) {
      for(let i = 0; i < remove; i++){
        nodeArray.pop();
      }
    }
    if(add > 0) {
      for(let i = 0; i < add; i++){
        nodeArray.push(getNode(uuidv4(),fixedNodeIDs,nodeLinks(1)));
      }
    }
    return nodeArray;
  }

  function compileData(nodeArray){
    nodeArray.forEach(x => {
        x.nodes[0].donut = [];
        fixedNodeIDs.forEach((emo, i) => {
            let targetEmo = x.links.find(element => ( element.target === emo | element.target.id === emo ));
            x.nodes[0].donut[i] = targetEmo.value;
        });
    });
    // nodeArray.forEach(x => {
    //   x.nodes[0].donut = x.links.map(y => y.value);
    // });
    let dataC = nodeArray.reduce(joinNodesReducer);
    dataC = {nodes: fixedNodes.nodes.concat(dataC.nodes), links: dataC.links};
    return dataC;
  }

  const joinNodesReducer = (acc, cur) => {
    return {nodes: acc.nodes.concat(cur.nodes),links: acc.links.concat(cur.links)};
  }

  function hexagon(n, cx, cy, gs){
    switch(n){
      case 0:
        return [cx - gs, cy - (Math.sqrt(3)*gs)];
        break;
      case 1:
        return [cx + gs, cy - (Math.sqrt(3)*gs)];
        break;
      case 2:
        return [cx + 2 * gs, cy];
        break;
      case 3:
        return [cx + gs, cy + (Math.sqrt(3)*gs)];
        break;
      case 4:
        return [cx - gs, cy + (Math.sqrt(3)*gs)];
        break;
      case 5:
        return [cx - 2 * gs, cy];
        break;
    }
  }

// Hexagon array rotated to accommodate donut charts
  function hexagonArray(cx, cy, gs){
    return [
      {x: cx + gs, y: cy - (Math.sqrt(3)*gs)},
      {x: cx + 2 * gs, y: cy},
      {x: cx + gs, y: cy + (Math.sqrt(3)*gs)},
      {x: cx - gs, y: cy + (Math.sqrt(3)*gs)},
      {x: cx - 2 * gs, y: cy},
      {x: cx - gs, y: cy - (Math.sqrt(3)*gs)}
    ]
  }

  function dist(x1, y1, x2, y2) {
    let xs = x2 - x1;
    let ys = y2 - y1;
    xs *= xs;
    ys *= ys;
    return(Math.sqrt(xs + ys));
  }

  function getBarChart(height, width, div_id) {

    // create 2 data_sets
    let data0 = [
       {group: uuidv4(), value: 0},
       {group: uuidv4(), value: 0},
       {group: uuidv4(), value: 0},
       {group: uuidv4(), value: 0},
       {group: uuidv4(), value: 0},
       {group: uuidv4(), value: 0},
       {group: uuidv4(), value: 0},
       {group: uuidv4(), value: 0},
       {group: uuidv4(), value: 0},
       {group: uuidv4(), value: 0}
    ];

    // set the dimensions and margins of the graph
    const margin = {top: 50, right: 20, bottom: 50, left: 100};

    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;

    // append the svg object to the body of the page
    const svg = d3.select(div_id)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Initialize the X axis
    const x = d3.scaleBand()
      .range([ 0, width ])
      .padding(0.2);
    const xAxis = svg.append("g")
      .attr("transform", `translate(0,${height})`);

    // Initialize the Y axis
    const y = d3.scaleLinear()
      .range([ height, 0]);
    const yAxis = svg.append("g")
      .attr("class", "myYaxis");
    y.domain([0, 1]);
    yAxis.call(d3.axisLeft(y));

    // Add X axis label:
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width - 1)
        .attr("y", height + 20)
        .text("now");

    // Y axis label:
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -40)
        .attr("x", 0)
        .text("how well am I doing at classifying faces?");


    // A function that create / update the plot for a given variable:
    function update(data) {

      // Update the X axis
      x.domain(data.map(d => d.group));
      // xAxis.transition().duration(1000).call(d3.axisBottom(x)));

      // Update the Y axis
      // y.domain([0, d3.max(data, d => d.value) ]);
      // yAxis.transition().duration(1000).call(d3.axisLeft(y));

      // Create the u variable
      var u = svg.selectAll("rect")
        .data(data, d => d.group);

      // u
      //   .join("rect") // Add a new rect for each new elements
      //   .transition()
      //   .duration(1000)
      //     .attr("x", d => x(d.group))
      //     .attr("y", d => y(d.value))
      //     .attr("id", d => d.group)
      //     .attr("width", x.bandwidth())
      //     .attr("height", d => height - y(d.value))
      //     .attr("fill", "#69b3a2")

      u
        .join(
          enter => {
            enter.append("rect")
              .attr("id", d => d.group)
              .attr("class", "bar-chart-bar")
              .attr("x", d => x(d.group) +20)
              .attr("y", d => y(d.value))
              .attr("width", x.bandwidth())
              .attr("height", d => height - y(d.value))
              .attr("fill", "#F8CC6400")
            .transition()
            .duration(1000)
              .attr("x", d => x(d.group))
              .attr("fill", "#F8CC64");
          },
          update => {
            update.transition()
              .duration(1000)
              .attr("x", d => x(d.group))
              .attr("y", d => y(d.value))
              .attr("width", x.bandwidth())
              .attr("height", d => height - y(d.value))
              .attr("fill","#F8CC6466");
          },
          exit => {
            exit.transition()
              .duration(1000)
              .attr("x", -20)
              .attr("fill", "#F8CC6400")
              .remove();
          }
        )
    }

    // Initialize the plot with the first dataset
    update(data0)

    function switchData(new_data) {
      data0.push(new_data);
      console.log(new_data);
      data0.shift();
      update(data0);
    }

    function reinitialise() {
      data0 = data0.map( x => {
        return {group: x.group, value: 0};
      });
      update(data0);
    }

    return {
      chart: svg,
      update: update,
      switchData: switchData,
      reinitialise: reinitialise
    }
  }

  return {
    fixedNodeIDs: fixedNodeIDs,
    preprocess: preprocess,
    chartData: chartData,
    refreshNodeArray: refreshNodeArray,
    compileData: compileData,
    hexagonArray: hexagonArray,
    dist: dist,
    getBarChart: getBarChart,
    uuidv4: uuidv4,
    getRandomIntInclusive: getRandomIntInclusive
  };
})(d3);
