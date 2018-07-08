window.onload = () => {

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
      const graph = d3.select('#graph');
      const [widthGraph, heightGraph] =  [graph.node().clientWidth, graph.node().clientHeight];
      const radius = widthGraph * 0.02;

      //make players nodes for graph
      let nodes = makeNodes(playersDataset, rankings);

      //make links for graph
      let links = makeLinks(nodes);

      // create force directed simulation
      let simulation = d3.forceSimulation(nodes)
                           .force('charge', d3.forceManyBody().strength(-2))
                           .force('center', d3.forceCenter(widthGraph/2, heightGraph/2))
                           .force('collision', d3.forceCollide(radius * 2))
                           .force('link', d3.forceLink(links)
                                            .id(d => d.id));

      let node = graph 
                   .selectAll('image');

      let link = graph
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
          .attr('x', d => { return d.x = Math.max(0, Math.min(widthGraph - radius * 2, d.x)); })
          .attr('y', d => { return d.y = Math.max(0, Math.min(heightGraph - radius * 2, d.y)); })

        link
          .attr('x1', d => d.source.x + radius)
          .attr('y1', d => d.source.y + radius)
          .attr('x2', d => d.target.x + radius)
          .attr('y2', d => d.target.y + radius);
      }

      /*function draws force directed graph in svg element*/
      function restart(nodes, links) {

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
      /* world map */
      const map = d3.select('#map');
      const [widthMap, heightMap] =  [map.node().clientWidth, map.node().clientHeight];

      /* convert topoJson to GeoJson */
      const worldMap = topojson.feature(worldTopo, worldTopo.objects.tracts);

      /* join players to world map */
      worldMap.features.map(country => country.properties.players = nodes.filter(pl => pl.countryCode === country.properties['country']));

      const projection = d3.geoFahey()
                           .translate([widthMap/2, heightMap/2])
                           .scale(50)

      let path = d3.geoPath(projection);

      const updateMap = map.append('g')
                           .selectAll('path')
                             .data(worldMap.features);


     const g = map.select('g');
     const zoom = d3.zoom()
                    .on('zoom', zoomed);

     function zoomed() {
zoom.scale(scale)
            .translate(trans)
       var e = d3.event,
           scale = (e && e.scale) ? e.scale : zoom.scale(),
           trans = (e && e.translate) ? e.translate : zoom.translate();
           g.attr('transform', [
                         'translate(' + trans + ')',
                         'scale(' + scale + ')']);
      }

      g.call(zoom);

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

            /* linePlot graph */

            const plot = d3.select('#plot')
            const widthPlot = plot.node().clientWidth;
            const heightPlot = plot.node().clientHeight;
            const padding = 40;

            const plotData = rankingsDataset.filter(rank => rank.playerId === rankingsDataset[0].playerId)

            let xScale = d3.scaleTime()
                        .range([padding, widthPlot - padding])

            const xAxis = d3.axisBottom(xScale)
                            .tickFormat(d3.timeFormat("%b %d, %Y"))


            let yScale = d3.scaleLinear()
                        .range([padding, heightPlot - padding * 2])

            const yAxis = d3.axisLeft(yScale)
                            .ticks(d3.max(plotData, d => d.ranking))
                            .tickFormat(d3.format('d'))

            const line = d3.line()
                           .x(function(d) { return xScale(d.date); })
                           .y(function(d) { return yScale(d.ranking); });

            xScale = xScale.domain(d3.extent(plotData, d => d.date));
            yScale = yScale.domain(d3.extent(plotData, d => d.ranking));

            d3.select("#plot")
              .append('path')
                .attr('d', line(plotData))
                .attr('stroke-width', '2px')
                .attr('stroke', 'lightblue')
                .style('fill', 'none')

            d3.select("#plot")
              .append('text')
                .classed('title', true)
                .attr('text-anchor', 'middle')
                .attr('transform', `translate(${widthPlot/2}, ${padding/2})`)
                .text('Player ranking')

            d3.select("#plot")
              .append('g')
                .classed('xAxis', true)
                .attr('transform', `translate(0, ${heightPlot - padding*2})`)
                .call(xAxis)

           const xLabels = d3.select('#plot .xAxis')
                             .selectAll('text')
               
           xLabels
             .attr('text-anchor', 'end')
             .attr('alignment-baseline', 'hanging')
           .attr('transform',  'rotate(-50)')

             d3.select("#plot")
              .append('g')
                .classed('yAxis', true)
                .attr('transform', `translate(${padding}, 0)`)
                .call(yAxis)
  };
}
