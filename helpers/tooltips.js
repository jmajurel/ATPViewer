
function tooltipOn(d, content) {

  tooltip
    .style('opacity', 0.8)
    .html(content);

  d3.select(d3.event.target)
    .transition()
      .delay(100)
    .style('fill', '#0074D9');

};

function tooltipUpdate() {

  tooltip
    .style('top', d3.event.pageY + (tooltip.node().offsetHeight/2) + 5  + 'px')
    .style('left', d3.event.pageX - (tooltip.node().offsetWidth / 2) + 5 + 'px')

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
