const plot = d3.select('#plot')
const widthPlot = plot.node().clientWidth;
const heightPlot = plot.node().clientHeight;
const padding = 40;

let xScale = d3.scaleTime()
            .range([padding, widthPlot - padding]);

let yScale = d3.scaleLinear()
            .range([padding, heightPlot - padding * 2]);

const xAxis = d3.axisBottom(xScale)
		.tickFormat(d3.timeFormat("%b %d, %Y"))
                .tickSizeInner(-heightPlot + padding * 2);

const yAxis = d3.axisLeft(yScale)
		.tickFormat(d3.format('d'))
                .tickSizeInner(-widthPlot + padding * 2);

const line = d3.line()
               .x(function(d) { return xScale(d.date); })
               .y(function(d) { return yScale(d.ranking); });

function updateLineGraph(player, rankings) {

  xScale.domain(d3.extent(rankings, d => d.date));
  yScale.domain(d3.extent(rankings, d => d.ranking));

  plot.select('.line')
        .transition()
        .attr('d', line(rankings))

  plot.select('.xAxis')
        .call(xAxis);

  plot.select('.yAxis')
        .call(yAxis);

  plot.select('.title')
        .text(`${player.firstName} - ${player.lastName}`);

}

/* linePlot graph */
function drawLineGraph(player, rankings) {

  xScale.domain(d3.extent(rankings, d => d.date))
	.ticks(d3.max(rankings, d => d.ranking))

  yScale.domain(d3.extent(rankings, d => d.ranking));

  plot.append('path')
        .classed('line', true)
        .attr('d', line(rankings))
        .attr('stroke-width', '2px')
        .attr('stroke', 'rgb(99, 214, 74)')
        .style('fill', 'none');

  plot.append('text')
    .classed('title', true)
    .attr('text-anchor', 'middle')
    .attr('transform', `translate(${widthPlot/2}, ${padding/2})`)
    .style('font-weight', 'bold')
    .text(`${player.firstName} - ${player.lastName}`);

  plot.append('g')
    .classed('xAxis', true)
    .attr('transform', `translate(0, ${heightPlot - padding*2})`)
    .call(xAxis);

  plot.selectAll('.xAxis .tick line')
      .attr('stroke-dasharray', '10,10')
      .attr('stroke', 'grey');


 const xLabels = d3.select('#plot .xAxis')
		   .selectAll('text')
     
 xLabels
   .attr('text-anchor', 'end')
   .attr('alignment-baseline', 'hanging')
 .attr('transform',  'rotate(-50)')

  plot.append('g')
      .classed('yAxis', true)
      .attr('transform', `translate(${padding}, 0)`)
      .call(yAxis)

  plot.selectAll('.yAxis .tick line')
      .attr('stroke-dasharray', '10,10')
      .attr('stroke', 'grey');

}
