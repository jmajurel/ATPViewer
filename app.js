const width = 800;
const height = 600;

d3.select('svg')
  .attr('width', width)
  .attr('height', height)
  .style('border', 'solid purple 2px');

const dateExtracter = /^(\d{4})(\d{2})(\d{2})$/g ;

const playerFormatter = (string) => d3.csvParseRows(string, function(d) {

  let [_, year, month, day] = dateExtracter.exec(d[4]);

  return {
    id: d[0],
    firstName: d[1],
    lastName: d[2],
    hand: d[3],
    birthDate: `${year}-${month}-${day}`,
    countryCode: d[5]
  }
});


d3.queue()
  .defer(d3.json, 'https://unpkg.com/world-atlas@1/world/110m.json')
  .defer(d3.csv, 'https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_players.csv', playerFormatter)
  .defer(d3.csv, 'https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_rankings_current.csv')
  .await((err, topoJson, players, rankings) => {
    if(err) throw err;
    const data = topojson.feature(topoJson, topoJson.objects.countries).features;

    const projection = d3.geoMercator()
                         .translate([width/2 -10, height/2 +80])

    projection.scale(projection.scale() * 0.8);

    const path = d3.geoPath(projection);

    const updateMap = d3.select('svg')
                        .selectAll('path')
                          .data(data);

    updateMap
	.enter()
	.append('path')
	  .attr('d', path)
          .style('fill', 'grey')
          .on('mouseover touchover', (d, i, nodes) => {

            d3.select(d3.event.target)
              .transition()
              .style('fill', 'blue');

          })
          .on('mouseout', () => {
            d3.select(d3.event.target)
              .transition()
              .style('fill', 'grey')
          })

  })
