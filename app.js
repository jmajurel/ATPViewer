const width = 600;
const height = 500;
const radius = 10;
      
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
    let rankings = rankFormatter(rawRankings);

    let maxDate = d3.max(rankings, d => d.date);

    //get only the rankings for maxdate
    rankings = rankings.filter(rank => rank.date.toDateString() === maxDate.toDateString());

    //get only the 100 first player from dataset
    rankings = rankings.splice(0, 100);

    /* force directed graph */

    //make players nodes for graph
    let nodes = makeNodes(playersDataset, rankings);

    //make links for graph
    let links = makeLinks(nodes);

    // create force directed simulation
    let simulation = d3.forceSimulation(nodes)
                         .force('charge', d3.forceManyBody()
                                            .strength(-2))
                         .force('center', d3.forceCenter(width/2, height/2))
                         .force('collision', d3.forceCollide(-2))
                         .force('link', d3.forceLink(links)
                                          .id(d => d.id));


    let node = d3.select('#graph')
                   .selectAll('circle');

    let link = d3.select('#graph')
                   .selectAll('line');

    //create drag function for the force directed graph
    const drag = d3.drag()
                    .on('start', d => {
                      console.log('start dragging');
                      simulation.alphaTarget(0.3).restart();
                      d.fx = d.x;
                      d.fy = d.y;
                    })
                    .on('drag', d => {
                      console.log('dragging');
                      d.fx = d3.event.x;
                      d.fy = d3.event.y;
                    })
                    .on('end', d => {
                      console.log('stopped dragging');
                      d.fx = null;
                      d.fy = null;
                      simulation.alphaTarget(0);
                    });   
                  
    restart(nodes, links);

    simulation.on('tick', ticked);

    function ticked() {
      console.log(simulation.alpha());

      node
        .attr('cx', d => { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
        .attr('cy', d => { return d.y = Math.max(radius, Math.min(height - radius, d.y)); })

      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
    }

    /*function draws force directed graph in svg element*/
    function restart(nodes, links) {

      console.log(nodes)

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
          .attr('r', 0)
          .remove(); //remove old node from graph

      node = node.enter()
                 .append('circle') //create node
                   .classed('node', true)
                   .style('fill', 'lightblue')
                   .style('stroke-width', 1)
                   .style('stroke', 'darkblue')
                   .attr('r', radius)
                   .on('mouseenter touchstart', d => tooltipOn(d, 
                   `<p><strong>${d.firstName} ${d.lastName}</strong></p>
                    <p>${d.countryCode}</p>`))
                   .on('mousemove touchmove', tooltipUpdate)
                   .on('mouseout touchend', tooltipOff)
                   .call(drag)
                 .merge(node); //create + update node

    }

    /* convert topoJson to GeoJson */
    const worldMap = topojson.feature(worldTopo, worldTopo.objects.seventh).features;

    /* join players to world map */
    worldMap.map(country => country.properties.players = nodes.filter(pl => pl.countryCode === country.properties['alpha-3']));



/*    map.call(d3.zoom()
	.on('zoom', () => {
          let transform = d3.event.transform;
          map.attr("transform", "translate(" + transform.x + "," + transform.y + ") scale(" + transform.k + ")");
	}))
*/
    let path = d3.geoPath();

    const updateMap = d3.select('#map')
                          .selectAll('path')
                           .data(worldMap);

    updateMap
	.enter()
	.append('path')
          .classed('country', true)
	  .attr('d', path)
          .style('fill', 'grey')
          .on('mouseenter touchstart', d => tooltipOn(d, 
          `<p><strong>${d.properties.name}</strong></p>
           <p>${d.properties.players.length} players</p>`))
          .on('mousemove touchmove', tooltipUpdate)
          .on('mouseout touchend', tooltipOff)
          .on('click', d => { //user select a country on the map

	     let players = playersDataset.filter(player => player.countryCode === d.properties['alpha-3']);
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
