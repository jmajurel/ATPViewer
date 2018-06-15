const width = 800;
const height = 600;

d3.select('svg')
  .attr('width', width)
  .attr('height', height)
  .style('border', 'solid purple 2px');

const dateExtracter = /^(\d{4})(\d{2})(\d{2})$/g ;

const playerFormatter = (text) => {

  return d3.csvParseRows(text, row => {

    let result = dateExtracter.exec(row[4]);
    let date = result ? `${result[1]}-${result[2]}-${result[3]}`: null;

    return {
      id: +row[0],
      firstName: row[1],
      lastName: row[2],
      hand: row[3],
      countryCode: row[5],
      birthDate: date
    };
  });
};

const rankFormatter = (text) => {

  return d3.csvParseRows(text, row => {

    let result = dateExtracter.exec(row[0]);
    let date = result ? `${result[1]}-${result[2]}-${result[3]}`: null;

    return {
      rankingDate: date,
      ranking: +row[1],
      playerId: +row[2],
      rankingPoint: +row[3]
    };
  })
};

function tsvFormatter(data, _, header) {
  return {
    id: +data[header[0]],
    name: data[header[1]]
  };
};

d3.queue()
/*  .defer(d3.json, 'https://unpkg.com/world-atlas@1/world/110m.json')
  .defer(d3.tsv, 'https://raw.githubusercontent.com/KoGor/Maps.GeoInfo/master/world-country-names.tsv', tsvFormatter)
  .defer(d3.json, 'https://github.com/mledoze/countries/blob/442472de98e80f4a44f1028960dbb0dfb1d942fe/dist/countries.json')*/
  .defer(d3.json, './data/finalmap.json')
  .defer(d3.text, 'https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_players.csv')
  .defer(d3.text, 'https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_rankings_current.csv')
  .await((err, world, rawPlayers, rawRankings) => {

    if(err) throw err;

    /* Format raw data */
    const players = playerFormatter(rawPlayers); 
    const rankings = playerFormatter(rawRankings);

    //const data = topojson.feature(topoJson, topoJson.objects.countryMap).features;

    //Add country name to map
/*    data.forEach(d => {
      let foundCountry = countryNames.find(country => country.id === +d.id);
      d.properties.players = players.filter(pl => pl.countryCode  === foundCountry.name);
      d.properties.name = foundCountry ? foundCountry.name : undefined;
    });*/
    console.log(world.features);

    world(country => country.properties.players = rawPlayers.filter(pl => pl.countryCode === country.code))

    const path = d3.geoPath();

    const updateMap = d3.select('svg')
                        .selectAll('path')
                          .data(world.features);

    updateMap
	.enter()
	.append('path')
	  .attr('d', path)
          .style('fill', 'grey')
          .on('mouseover touchover', (d, i, nodes) => {
	    console.log(d.properties.players);

            d3.select(d3.event.target)
              .transition()
		.delay(100)
              .style('fill', 'blue');

          })
          .on('mouseout', () => {
            d3.select(d3.event.target)
              .transition()
		.delay(100)
              .style('fill', 'grey')
          })

  })
