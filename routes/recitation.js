var router = require('express').Router();
var pgClient = require('../utils/pgClient');

router.get('/oyo/content', async (req, res) => {
  try {
    var { bible_code, chapter, f_verse, l_verse }=  req.query;

    var query = `SELECT ARRAY_TO_STRING(array_agg(content), ' ') as content
      FROM bible_kornkrv WHERE bible_code=${bible_code} 
      AND chapter=${chapter} AND verse ${l_verse ? "BETWEEN " + f_verse  + " AND " + l_verse : "= " + f_verse}`;
    
    var pgResult = await pgClient.query(query);
    var {content} = pgResult.rows[0];
    
    res.status(200).end(content);
  } catch (error) {
    res.status(500).send(error);
  }
})
router.get('/:category', async (req, res) => {
  try {
    var category = Number(req.params.category);
    
    var query = `SELECT B.bible_name, A.* FROM nav_words A 
    RIGHT OUTER JOIN bible_code B on A.bible_code = B.bible_code 
    ${category ? (category % 100 === 0 ? `WHERE series_code > ${category} AND series_code <= ${category + 99} ` : "WHERE series_code = " + category)  : ""}`;
    
    var row = await pgClient.query(query);
    var result = row.rows;
    res.status(200).send(result);
  } catch (error) {
    res.status(error.code).send(error.message);
  }
});
function getColumnNames(params) {
  var columns = [];
  var values = [];
  for (const key in params) {
    if (Object.hasOwnProperty.call(params, key)) {
      columns.push(`\"${key}\"`);
      values.push(`\'${params[key]}\'`);
    }
  }
  
  return {columns : columns.toString(), values : values.toString()};
}
router.post('/oyo', async (req, res) => {
  try {
    var {columns, values} = getColumnNames(req.body);


    /**
     *  TODO
     *  사용자 정보 MOCK 임시 데이터 적용 중
     */

    columns += ',\"owner\"';
    values += ',\'545\'';

    var query = `INSERT INTO OYO(${columns}) VALUES(${values})`;
    var pgResult = await pgClient.query(query);
    var rowResult = pgResult.rows[0];

    res.status(200).send(rowResult);

  } catch (error) {
    res.status(error.code).send(error.message)
  }
});
router.put('/', (req, res) => {
  try {
    const { memorized, cardnum, category } = req.body;
  } catch (error) {
    res.status(error.code).send(error.message)
  }
})

module.exports = router;