const plot = d3.select('#plot')
const widthPlot = plot.node().clientWidth;
const heightPlot = plot.node().clientHeight;
const padding = 40;

let xScale = d3.scaleTime()
            .range([padding, widthPlot - padding]);

let yScale = d3.scaleLinear()
            .range([padding, heightPlot - padding * 2]);

const line = d3.line()
               .x(function(d) { return xScale(d.date); })
               .y(function(d) { return yScale(d.ranking); });

function updateLineGraph(player, rankings) {

  plot.select('.line')
        .classed('line', true)
        .attr('d', line(rankings))
        .attr('stroke-width', '2px')
        .attr('stroke', 'lightblue')
        .style('fill', 'none');
}

/* linePlot graph */
function drawLineGraph(player, rankings) {



  const xAxis = d3.axisBottom(xScale)
		  .tickFormat(d3.timeFormat("%b %d, %Y"));


  const yAxis = d3.axisLeft(yScale)
		  .ticks(d3.max(rankings, d => d.ranking))
		  .tickFormat(d3.format('d'));


  xScale = xScale.domain(d3.extent(rankings, d => d.date));
  yScale = yScale.domain(d3.extent(rankings, d => d.ranking));

  plot.append('path')
        .classed('line', true)
        .attr('d', line(rankings))
        .attr('stroke-width', '2px')
        .attr('stroke', 'lightblue')
        .style('fill', 'none');

  plot.append('text')
    .classed('title', true)
    .attr('text-anchor', 'middle')
    .attr('transform', `translate(${widthPlot/2}, ${padding/2})`)
    .text(`${player.firstName} - ${player.lastName}`);

  plot.append('g')
    .classed('xAxis', true)
    .attr('transform', `translate(0, ${heightPlot - padding*2})`)
    .call(xAxis);

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
}
