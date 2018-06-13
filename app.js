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
  .defer(d3.json, 'https://unpkg.com/world-atlas@1/world/110m.json')
  .defer(d3.tsv, 'https://raw.githubusercontent.com/KoGor/Maps.GeoInfo/master/world-country-names.tsv', tsvFormatter)
  .defer(d3.json, 'https://github.com/mledoze/countries/blob/442472de98e80f4a44f1028960dbb0dfb1d942fe/dist/countries.json')
  .defer(d3.text, 'https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_players.csv')
  .defer(d3.text, 'https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_rankings_current.csv')
  .await((err, topoJson, countryNames, countries, rawPlayers, rawRankings) => {

    if(err) throw err;
    console.log(countryNames);


    /* Format raw data */
    const players = playerFormatter(rawPlayers); 
    const rankings = playerFormatter(rawRankings);

    const data = topojson.feature(topoJson, topoJson.objects.countries).features;

    //Add country name to map
    data.forEach(d => {
      let foundCountry = countryNames.find(country => country.id === +d.id);
      d.properties.players = players.filter(pl => pl.countryCode  === foundCountry.name);
      d.properties.name = foundCountry ? foundCountry.name : undefined;
    });
    console.log(data);

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
