const width = 600;
const height = 500;

d3.selectAll('svg')
  .attr('width', width)
  .attr('height', height);

const tooltip = d3.select('#tooltip');

d3.queue()
  .defer(d3.json, './data/worldmap.json')
  .defer(d3.text, 'https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_players.csv')
  .defer(d3.text, 'https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_rankings_current.csv')
  .await((err, worldTopo, rawPlayers, rawRankings) => {

    if(err) throw err;

    /* Format raw data player */
    let players = playerFormatter(rawPlayers); 
    let rankings = rankFormatter(rawRankings);

    let maxDate = d3.max(rankings, d => d.date);

    //get only the rankings for maxdate
    rankings = rankings.filter(rank => rank.date.toDateString() === maxDate.toDateString());
    //get only the 100 first player from dataset
    rankings = rankings.splice(0, 100);

    players = makeNodes(players, rankings);

    /* force directed graph */
    let links = makeLinks(players);

    let simulation = d3.forceSimulation(players)
                         .force('charge', d3.forceManyBody()
			                    .strength(-2))
                         .force('center', d3.forceCenter(width/2, height/2))
                         .force('collision', d3.forceCollide(-2))
			 .force('link', d3.forceLink(links)
                                          .id(d => d.id))

     const drag = d3.drag()
		     .on('start', () => {
		       simulation.alphaTarget(0.5);
		       simulation.restart();
		     })
		     .on('drag', d => {
		       d.fx = d3.event.x;
		       d.fy = d3.event.y;
		     })
		     .on('end', d => {
		       d.fx = null;
		       d.fy = null;
		       simulation.alphaTarget(0);
		     })   

    simulation.on('tick', () => drawGraph(players, links));


    function drawGraph(players, links) {

      const updateGraph = d3.select('#graph')
			    .selectAll('circle')
			      .data(players, d => d.id);

      const updateLinks = d3.select('#graph')
			    .selectAll('line')
			      .data(links);

      updateLinks
	.enter()
	.append('line')
	  .classed('links', true)
	  .attr('stroke', 'lightgrey')
	  .attr('stroke-width', 1)
	.merge(updateLinks)
	  .attr('x1', d => d.source.x)
	  .attr('y1', d => d.source.y)
	  .attr('x2', d => d.target.x)
	  .attr('y2', d => d.target.y)

      updateGraph
	.enter()
	.append('circle')
	  .classed('player', true)
	  .style('fill', 'lightblue')
	  .style('stroke-width', 1)
	  .style('stroke', 'darkblue')
	  .attr('r', 10)
	  .on('mouseover', (d) => {
	    tooltip
	      .style('opacity', 0.8)
	      .html(`
		<p><strong>${d.firstName} ${d.lastName}</strong></p>
		<p>${d.countryCode}</p>
	      `);
	  })
	  .on('mousemove', () => {
	    tooltip
	      .style('top', d3.event.pageY + (tooltip.node().offsetHeight/2) + 5 + 'px')
	      .style('left', d3.event.pageX - (tooltip.node().offsetWidth / 2) + 5 + 'px')
	  })
	  .on('mouseout', () => {
	    tooltip
	      .html('')
	      .style('opacity', 0);
	  })
	  .call(drag)
	.merge(updateGraph)
	  .attr('cx', d => d.x)
	  .attr('cy', d => d.y)

    }

    /* convert topoJson to GeoJson */
    const worldMap = topojson.feature(worldTopo, worldTopo.objects.seventh).features;

    /* join players to world map */
    worldMap.map(country => country.properties.players = players.filter(pl => pl.countryCode === country.properties['alpha-3']));


    const map = d3.select('#map')
      .append('g')
        .attr('width', width)
        .attr('height', height)
	.attr('transform', 'scale(0.7)')

    map.call(d3.zoom()
	.on('zoom', () => {
	  map.attr('transform', d3.event.transform)
	}))


    let path = d3.geoPath();

    const updateMap = map.selectAll('path')
                           .data(worldMap);

    updateMap
	.enter()
	.append('path')
          .classed('country', true)
	  .attr('d', path)
          .style('fill', 'grey')
          .on('mouseenter touchstart', tooltipOn)
          .on('mousemove', () => {
            tooltip
              .style('top', d3.event.pageY + (tooltip.node().offsetHeight/2) + 5  + 'px')
              .style('left', d3.event.pageX - (tooltip.node().offsetWidth / 2) + 5 + 'px')
          })
          .on('mouseout touchend', tooltipOff)
          .on('click', d => {
	     players = players.filter(player => player.countryCode === d.properties['alpha-3']);
	     console.log(players);
	     players = makeNodes(players, rankings);
	     links = makeLinks(players);
	     drawGraph(players, links);
	     simulation.restart();
	     console.log('triggered');
	  });

});





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
}

function makeNodes(players, rankings) {

  //join rankings data to their players
  players = players.filter(player => rankings.find(rank => rank.playerId === player.id));

  return players.map(player => {
    player.ranking = rankings.find(rank => rank.playerId === player.id).ranking
    return player;
  });
}
