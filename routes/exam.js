const router = require('express').Router();
const pgClient = require('../utils/pgClient');

router.get('/guest', async (req ,res) => {
  try {
    let version = req.params.version;
    let series = req.params.series;

    let query = makeQueryBySeriesForGuest(series, version);
    let result = await pgClient.query(query);
    let cardList = result.rows;

    res.status(200).send(cardList);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/mem', async (req, res) => {
  try {
    let include242 = req.params.include242;
    let participation = req.params.participation;
    let version = req.params.version

    let query = makeQueryByCountForMember(participation, include242, version, 545);
  } catch (error) {
    res.status(400).send(error);
  }
})
async function getVersesCount(series) {
  const query = `SELECT SUM(verse_count) FROM series WHERE in (${series.toString()})`;
  try {
    var result = await pgClient.query(query);
    var count = result.rows[0];

    return count;
  } catch (error) {
    throw error;
  }
}
/**
 * 
 * @param {Number} count 
 * @param {Boolean} include242 
 */
function getLimitBySeries(count, include242) {

  var limitBySeries = [];
  if(count <= 5) {
    limitBySeries.push({series_code : [201], limit : 5});
  } else if(count <= 13) {
    limitBySeries.push({series_code : [201, 202], limit : 10});
  } else if(count <= 25) {
    limitBySeries.push({series_code : [201, 202, 210], limit : 10});
  } else if(count <= 37) {
    limitBySeries.push({series_code : [201, 202, 210, 220], limit : 10});
  } else if(count <= 49) {
    limitBySeries.push({series_code : [201, 202, 210, 220, 230], limit : 10});
  } else if(count <= 61) {
    limitBySeries.push({series_code : [201, 202, 210, 220, 230, 240], limit : 10});
  } else if(count <= 73) {
    limitBySeries.push({series_code : 200, limit : 10});
  } else if(count < 150) {  // 74 ~ 150
    limitBySeries.push({series_code : 200, limit : 6});
    if(include242) {
      limitBySeries.push({series_code : [310], limit : 2})
    }
    limitBySeries.push({series_code : 500, limit : (include242 ? 2 : 4)})
  } else if(count < 200) {  //150 이상
    limitBySeries.push({series_code : 200, limit : 4});
    if(include242) {
      limitBySeries.push({series_code : [310, 320], limit : 4})
    }
    limitBySeries.push({series_code : 500, limit : (include242 ? 2 : 6)})
  } else if(count < 250) {  //200 이상
    limitBySeries.push({series_code : 200, limit : 2});
    if(include242) {
      limitBySeries.push({series_code : [310, 320, 330], limit : 6})
    }
    limitBySeries.push({series_code : 500, limit : (include242 ? 2 : 8)})
  } else if(count < 300) {  //250 이상
    limitBySeries.push({series_code : 200, limit : 2});
    if(include242) {
      limitBySeries.push({series_code : [310, 320, 330, 340], limit : 6})
    }
    limitBySeries.push({series_code : 500, limit : (include242 ? 2 : 6)})
  } else if(count < 350) {  //300 이상
    limitBySeries.push({series_code : 200, limit : 2});
    if(include242) {
      limitBySeries.push({series_code : [310, 320, 330, 340, 350], limit : 6})
    }
    limitBySeries.push({series_code : 500, limit : (include242 ? 2 : 8)})
  } else if(count < 400) {  //350 이상
    limitBySeries.push({series_code : 200, limit : 2});
    if(include242) {
      limitBySeries.push({series_code : [310, 320, 330, 340, 350, 360], limit : 4})
    }
    limitBySeries.push({series_code : 500, limit : (include242 ? 4 : 8)})
  } else if(count < 450) {  //400 이상
    limitBySeries.push({series_code : 200, limit : 2});
    if(include242) {
      limitBySeries.push({series_code : [310, 320, 330, 340, 350, 360, 370], limit : 4})
    }
    limitBySeries.push({series_code : 500, limit : (include242 ? 4 : 8)})
  } else if(count < 500) {  //450 이상
    limitBySeries.push({series_code : 200, limit : 2});
    if(include242) {
      limitBySeries.push({series_code : [310, 320, 330, 340, 350, 360, 370, 380], limit : 4})
    }
    limitBySeries.push({series_code : 500, limit : (include242 ? 4 : 8)})
  } else if(count >= 500) {  //500 이상
    limitBySeries.push({series_code : 200, limit : 2});
    if(include242) {
      limitBySeries.push({series_code : [310, 320, 330, 340, 350, 360, 370, 380, 390], limit : 4})
    }
    limitBySeries.push({series_code : 500, limit : (include242 ? 4 : 8)})
  }

  return limitBySeries;
}
function makeQueryByCountForMember(count, include242, version, memInfo) {

  var info = getLimitBySeries(count, include242);
  var queries = info.map((item, idx) => {
    let query = "";
    let {series_code, limit} = item;
    if(item.series_code instanceof Array || item.series_code != 500) {
      query = `(SELECT series_code, bible_code, theme, chapter, f_verse, l_verse, verse_${version} as content FROM nav_words WHERE series_code ${item.series_code instanceof Array ? `IN (${series_code.toString()})` : `BETWEEN ${series_code} AND ${series_code + 99}`} ORDER BY RANDOM() LIMIT ${limit})`;
    } else {
      query = `(SELECT 500 AS series_code, bible_code, theme, chapter, f_verse, l_verse, content as content FROM oyo WHERE owner = '${memInfo}' ORDER BY RANDOM() LIMIT ${limit})`;
    }
    return query;
  });

  return `SELECT * FROM (${queries.join(" UNION ALL ")}) AS SELECTED_CARD`;
}
function makeQueryBySeriesForGuest(series, version) {
  var query = `SELECT series_code, bible_code, theme, chapter, f_verse, l_verse, verse_${version} as content FROM nav_words WHERE`;

  series.sort((a,b) => b % 100 == 0 ?  1 : -1) // 200, 300들이 위로 올라오게

  for(var idx in series) {
    if((series[idx] % 100) == 0) {
      query += ` series_code between ${series[idx]} AND ${series[idx]+99} ${idx < series.length-1 ? 'OR ' : ''}`;
    } else {
      query += ` series_code in (${series.slice(idx).toString()})`;
      break;
    }
  }
  
  return query += " ORDER BY RANDOM() LIMIT 10";
}
module.exports = router;