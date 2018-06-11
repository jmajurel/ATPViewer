const width = 800;
const height = 600;

d3.select('svg')
  .attr('width', width)
  .attr('height', height)
  .style('border', 'solid purple 2px');


d3.queue()
  .defer(d3.json, './data/custom.geo.json')
  .await((err, geoJson) => {
    if(err) throw err;

    const topoJson = topojson.topology(geoJson.features);
    console.log(topoJson);
    const projection = d3.geoMercator()
                         .translate([width/2 -10, height/2 +80])

    projection.scale(projection.scale() * 0.8);
    debugger;

    const path = d3.geoPath(projection);

    d3.select('svg')
      .selectAll('path')
	.data(topoJson.arcs)
	.enter()
	.append('path')
	  .attr('d', path)
  })
