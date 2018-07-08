
const dateParser = d3.timeParse('%Y%m%d');

const playerFormatter = (text) => {

  return d3.csvParseRows(text, row => {

    return {
      id: +row[0],
      firstName: row[1],
      lastName: row[2],
      hand: row[3],
      countryCode: row[5],
      birthDate: dateParser(row[4])
    };
  });
};

const rankFormatter = (text) => {

  return d3.csvParseRows(text, row => {

    return {
      date: dateParser(row[0]),
      ranking: +row[1],
      playerId: +row[2],
      rankingPoint: +row[3]
    };
  })
};

