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

    console.log(rankings[0]);
    //players.map(player => player.rankings = rankings.filter(rank => rank.playerId === player.id));
    let maxDate = d3.max(rankings, d=> d.date);

    /* convert topoJson to GeoJson */
    const worldMap = topojson.feature(worldTopo, worldTopo.objects.seventh).features;

    /* join players to world map */
    worldMap.map(country => country.properties.players = players.filter(pl => pl.countryCode === country.properties['alpha-3']));

    players = players.splice(0, 50)

    let simulation = d3.forceSimulation(players)
                         .force('charge', d3.forceManyBody()
                                            .strength(-2))
                         .force('center', d3.forceCenter(width/2, height/2))
                         .force('collision', d3.forceCollide()
                                               .radius(10))


    simulation.on('tick', () => {
      const updateGraph = d3.select('#graph')
                            .selectAll('circle')
                              .data(players);

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
}

function tooltipOff() {
          
  d3.select(d3.event.target)
    .transition()
      .delay(100)
    .style('fill', 'grey');

  tooltip
    .style('opacity', 0)
    .html('');
}

