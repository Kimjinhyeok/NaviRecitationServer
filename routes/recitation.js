var router = require('express').Router();
const passport = require('passport');
var pgClient = require('../utils/pgClient');

router.get('/oyo/content', async (req, res) => {
  try {
    var { bible_code, chapter, f_verse, l_verse } = req.query;

    var query = `SELECT ARRAY_TO_STRING(array_agg(content), ' ') as content
      FROM bible_kornkrv WHERE bible_code=${bible_code} 
      AND chapter=${chapter} AND verse ${l_verse ? "BETWEEN " + f_verse + " AND " + l_verse : "= " + f_verse}`;

    var pgResult = await pgClient.query(query);
    var { content } = pgResult.rows[0];

    res.status(200).end(content);
  } catch (error) {
    res.status(500).send(error);
  }
})
router.get('/:category', (req, res) => {
  try {
    passport.authenticate('custom', async (error, user) => {
      if (error) {
        throw error;
      } 
      var category = Number(req.params.category);
      var version = req.query.version;

      var query = category != 500 ? getNaviSeriesCardQuery(category, version) : getOYOCardQuery(user);

      var row = await pgClient.query(query);
      var result = row.rows;
      res.status(200).send(result);
    })(req, res);
  } catch (error) {
    res.status(error.code || 400).send(error.message);
  }
});
function getNaviSeriesCardQuery(category, version) {
  return `select (ROW_NUMBER() OVER()) AS id, B.bible_name, A.card_num, A.category, A.theme, A.chapter, A.f_verse, A.l_verse, A.verse_gae, A.verse_kor   
  FROM nav_words as A RIGHT OUTER JOIN bible_code B on A.bible_code = B.bible_code 
  ${category ? (category % 100 === 0 ? `WHERE series_code > ${category} AND series_code <= ${category + 99} ` : "WHERE series_code = " + category) : ""}`;
}
function getOYOCardQuery(userInfo) {
  const { i : objId} = userInfo;
  return `SELECT B.bible_name, A.*, A.content as verse_gae FROM oyo A 
  RIGHT OUTER JOIN bible_code B on A.bible_code = B.bible_code WHERE owner = '${objId}'`
}
function getColumnNames(params) {
  var columns = [];
  var values = [];
  for (const key in params) {
    if (Object.hasOwnProperty.call(params, key)) {
      columns.push(`\"${key}\"`);
      values.push(`\'${params[key]}\'`);
    }
  }
  columns.push("\"id\"")
  values.push("uuid_generate_v4()")

  return { columns: columns.toString(), values: values.toString() };
}
router.post('/oyo', (req, res) => {
  passport.authenticate('custom', async (err, user) => {
    try {
      const {i : objId} = user;
      var { columns, values } = getColumnNames(req.body);
  
      columns += ',\"owner\"';
      values += `,\'${objId}\'`;
  
      var query = `INSERT INTO OYO(${columns}) VALUES(${values})`;
      var pgResult = await pgClient.query(query);
      var rowResult = pgResult.rows[0];
  
      res.status(200).send(rowResult);
  
    } catch (error) {
      res.status(error.code).send(error.message)
    }
  })(req,res);
});
router.put('/', (req, res) => {
  try {
    const { memorized, cardnum, category } = req.body;
  } catch (error) {
    res.status(error.code).send(error.message)
  }
})

module.exports = router;