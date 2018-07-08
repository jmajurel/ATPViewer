
function makeLinks(nodes) {

//create a links between compatriote player

  return nodes.reduce((acc, currPlayer, _, players) => {
    let compatriote = players.find(player => player !== currPlayer && player.countryCode === currPlayer.countryCode);
    if (!compatriote) return acc;
    let existing = acc.find(exEntry => exEntry.source.id === currPlayer.id && exEntry.target.id === compatriote.id || exEntry.target.id === currPlayer.id && exEntry.source.id === compatriote.id);
    if(!existing) {
      acc.push({source: currPlayer, target: compatriote});
    }
    return acc;
  }, []);
};

function makeNodes(players, rankings) {

  //join rankings data to their players
  players = players.filter(player => rankings.find(rank => rank.playerId === player.id));

  return players.map(player => {
    player.ranking = rankings.find(rank => rank.playerId === player.id).ranking
    return player;
  });
};
