const width = 600;
const height = 500;
const radius = 12;
      
d3.selectAll('svg')
  .attr('width', width)
  .attr('height', height);

const tooltip = d3.select('#tooltip');

d3.queue()
  .defer(d3.json, './data/worldmap.json')
  .defer(d3.text, 'https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_players.csv')
  .defer(d3.text, 'https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_rankings_current.csv')
  .await(main)

function main(err, worldTopo, rawPlayers, rawRankings) {

    if(err) throw err;

    /* Format raw data player */
    const playersDataset = playerFormatter(rawPlayers); 
    const rankingsDataset = rankFormatter(rawRankings);

    let maxDate = d3.max(rankingsDataset, d => d.date);

    //get only the rankings for maxdate
    let rankings = rankingsDataset.filter(rank => rank.date.toDateString() === maxDate.toDateString());

    //get only the 100 first player from dataset
    rankings = rankings.splice(0, 100);

    /* force directed graph */

    //make players nodes for graph
    let nodes = makeNodes(playersDataset, rankings);

    //make links for graph
    let links = makeLinks(nodes);

    // create force directed simulation
    let simulation = d3.forceSimulation(nodes)
                         .force('charge', d3.forceManyBody().strength(-2))
                         .force('center', d3.forceCenter(width/2, height/2))
                         .force('collision', d3.forceCollide(radius * 2))
                         .force('link', d3.forceLink(links)
                                          .id(d => d.id));

    let node = d3.select('#graph')
                   .selectAll('image');

    let link = d3.select('#graph')
                   .selectAll('line');

    //create drag function for the force directed graph
    const drag = d3.drag()
                    .on('start', d => {
                      simulation.alphaTarget(0.3).restart();
                      d.fx = d.x;
                      d.fy = d.y;
                    })
                    .on('drag', d => {
                      d.fx = d3.event.x;
                      d.fy = d3.event.y;
                    })
                    .on('end', d => {
                      d.fx = null;
                      d.fy = null;
                      simulation.alphaTarget(0);
                    });   
                  
    restart(nodes, links);

    simulation.on('tick', ticked);

    function ticked() {

      node
        .attr('x', d => { return d.x = Math.max(0, Math.min(width - radius * 2, d.x)); })
        .attr('y', d => { return d.y = Math.max(0, Math.min(height - radius * 2, d.y)); })

      link
        .attr('x1', d => d.source.x + radius)
        .attr('y1', d => d.source.y + radius )
        .attr('x2', d => d.target.x + radius)
        .attr('y2', d => d.target.y + radius );
    }

    /*function draws force directed graph in svg element*/
    function restart(nodes, links) {

      console.log(nodes);

      node = node.data(nodes, d => d.id);
      link = link.data(links, d => d.target.id - d.source.id);

      link.exit()
          .remove(); //remove old link from graph

      link = link.enter() //create link
                 .append('line')
                   .classed('link', true)
                   .attr('stroke', 'lightgrey')
                   .attr('stroke-width', 1)
                 .merge(link); //create + update link

      node.exit() 
          .transition()
          .duration(1000)
          .ease(d3.easeCircleIn)
          .attr('width', 0)
          .attr('height', 0)
          .remove(); //remove old node from graph

      node = node.enter()
                 .append('image') //create node
                   .classed('node', true)
                   .attr('xlink:href', './data/icons/tennis-ball.svg')
                   .attr('width', radius * 2)
                   .attr('height', radius * 2)
                   .style('fill', 'lightblue')
                   .style('stroke-width', 1)
                   .style('border', 'solid 2px black')
                   .on('mouseenter touchstart', d => tooltipOn(d, 
                   `<p><strong>${d.firstName} ${d.lastName}</strong></p>
                    <p>${d.countryCode}</p>`))
                   .on('mousemove touchmove', tooltipUpdate)
                   .on('mouseout touchend', tooltipOff)
                   .call(drag)
                 .merge(node); //create + update node

    }

    /* convert topoJson to GeoJson */
    const worldMap = topojson.feature(worldTopo, worldTopo.objects.tracts).features;

    /* join players to world map */
    worldMap.map(country => country.properties.players = nodes.filter(pl => pl.countryCode === country.properties['country']));

    const projection = d3.geoFahey()
                         .translate([width/2, height/2]);


    let path = d3.geoPath(projection);

    const updateMap = d3.select('#map')
                          .append('g')
                          .selectAll('path')
                            .data(worldMap);


   const g = d3.select('#map')
                 .select('g');

   g.call(d3.zoom()
            .on('zoom', () => {
              g.attr('transform', d3.event.transform);
            }));

    updateMap
	.enter()
	.append('path')
          .classed('country', true)
	  .attr('d', path)
          .style('fill', 'grey')
          .on('mouseenter touchstart', d => tooltipOn(d, 
          `<p><strong>${d.properties.country}</strong></p>
           <p>${d.properties.players.length} players</p>`))
          .on('mousemove touchmove', tooltipUpdate)
          .on('mouseout touchend', tooltipOff)
          .on('click', d => { //user select a country on the map

	     let players = playersDataset.filter(player => player.countryCode === d.properties['country']);
	     console.log(players); //for debug purpose

             //make nodes set
	     nodes = makeNodes(players, rankings);

             //make links set
	     links = makeLinks(nodes);

             //update simulation
	      simulation.nodes(nodes)
                        .force('link').links(links);

             //restart simulation
             simulation.alpha(1).restart();

             //update force directed graph with new set of data
	     restart(nodes, links);

	  });


          const plotData = rankingsDataset.filter(rank => rank.playerId === rankingsDataset[0].playerId)

          console.log(plotData);

          const x = d3.scaleTime()
                      .range([0, width])
                      .domain(d3.extent(plotData, d => d.date));

          const y = d3.scaleLinear()
                      .range([height, 0])
                      .domain([d3.max(plotData, d => d.ranking), 100]);

          const lineGenerator = d3.line()
                                  .x(d => x(d.date))
                                  .y(d => y(d.ranking));

//          lineGenerator.domain(d3.extend


          d3.select("#plot")
            .selectAll('path')
              .data(plotData)
              .enter()
              .append('path')
                .attr('d', d => lineGenerator(d))
                .attr('stroke-width', '2px')
                .attr('stroke', 'grey')
            
};

function makeLinks(nodes) {

//create a links between compatriote player

  return nodes.reduce((acc, currPlayer, _, players) => {
    let compatriote = players.find(player => player !== currPlayer && player.countryCode === currPlayer.countryCode);
    if (!compatriote) return acc;
    let existing = acc.find(exEntry => exEntry.source.id === currPlayer.id && exEntry.target.id === compatriote.id || exEntry.target.id === currPlayer.id && exEntry.source.id === compatriote.id);
    if(!existing) {
      acc.push({source: currPlayer, target: compatriote});
    }
    return acc;
  }, []);
};

function makeNodes(players, rankings) {

  //join rankings data to their players
  players = players.filter(player => rankings.find(rank => rank.playerId === player.id));

  return players.map(player => {
    player.ranking = rankings.find(rank => rank.playerId === player.id).ranking
    return player;
  });
};
