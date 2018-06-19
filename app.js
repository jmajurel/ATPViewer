const width = 800;
const height = 500;

d3.selectAll('svg')
  .attr('width', width)
  .attr('height', height);

const dateParser = d3.timeParse('%Y%m%d');

const playerFormatter = (text) => {

  return d3.csvParseRows(text, row => {

    return {
      id: +row[0],
      firstName: row[1],
      lastName: row[2],
      hand: row[3],
      countryCode: row[5],
      birthDate: dateParser(row[4])
    };
  });
};

const rankFormatter = (text) => {

  return d3.csvParseRows(text, row => {

    return {
      date: dateParser(row[0]),
      ranking: +row[1],
      playerId: +row[2],
      rankingPoint: +row[3]
    };
  })
};

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
    rankings = rankings.splice(0, 100);

    let minRanking = d3.max(rankings, d => d.ranking);

    //join rankings data to their players
    players = players.filter(player => rankings.find(rank => rank.playerId === player.id));
    players = players.map(player => {
      player.ranking = rankings.find(rank => rank.playerId === player.id).ranking
      return player;
    });

    //players = players.splice(0, 100);
    console.log(players);

    let links = makeLinks(players);

    /* convert topoJson to GeoJson */
    const worldMap = topojson.feature(worldTopo, worldTopo.objects.seventh).features;

    /* join players to world map */
    worldMap.map(country => country.properties.players = players.filter(pl => pl.countryCode === country.properties['alpha-3']));


    let simulation = d3.forceSimulation(players)
                         .force('charge', d3.forceManyBody()
					       .strength(-3))
                         .force('center', d3.forceCenter(width/2, height/2))
                         .force('collision', d3.forceCollide(10))
			 .force('link', d3.forceLink(links)
                                          .id(d => d.id))
/*			                  .distance(d => {
					    if(d.source.ranking && d.target.ranking){
					      let diff = Math.abs(d.source.ranking - d.target.ranking)
					      let ratio = 0.2 * height/ (minRanking - 1);
					      return diff * ratio;
					    } else {
					      return 40;
					    }
					  }))
                                          */



    simulation.on('tick', () => {
      const updateGraph = d3.select('#graph')
                            .selectAll('circle')
                              .data(players);

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
        .merge(updateGraph)
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)



    });


    const path = d3.geoPath();
    const updateMap = d3.select('#map')
                        .selectAll('path')
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
          .on('click', () => console.log('clicked!'));
});

function tooltipOn(d) {
  tooltip
    .style('opacity', 0.8)
    .html(`
      <p><strong>${d.properties.name}</strong></p>
      <p>${d.properties.players.length} players</p>
    `);

  d3.select(d3.event.target)
    .transition()
      .delay(100)
    .style('fill', '#0074D9');
};

function tooltipOff() {
          
  d3.select(d3.event.target)
    .transition()
      .delay(100)
    .style('fill', 'grey');

  tooltip
    .style('opacity', 0)
    .html('');
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
}
