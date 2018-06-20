
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
