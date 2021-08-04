var router = require('express').Router();
const passport = require('passport');
var pgClient = require('../utils/pgClient');

router.get('/oyo/content', async (req, res, next) => {
  try {
    var { bible_code, chapter, f_verse, l_verse } = req.query;

    var query = `SELECT ARRAY_TO_STRING(array_agg(content), ' ') as content
      FROM bible_kornkrv WHERE bible_code=${bible_code} 
      AND chapter=${chapter} AND verse ${l_verse ? "BETWEEN " + f_verse + " AND " + l_verse : "= " + f_verse}`;

    var pgResult = await pgClient.query(query);
    var { content } = pgResult.rows[0];

    res.status(200).end(content);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
})
router.get('/:category', (req, res, next) => {
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
    })(req, res, next);
  } catch (error) {
    console.error(error);
    res.status(error.code || 400).send(error.message);
  }
});
function getNaviSeriesCardQuery(category, version) {
  return `select (ROW_NUMBER() OVER()) AS id, B.bible_name, A.bible_code, A.card_num, A.category, A.theme, A.chapter, A.f_verse, A.l_verse, A.verse_gae, A.verse_kor   
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
router.post('/oyo', (req, res, next) => {
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
      console.error(error);
      res.status(error.code).send(error.message)
    }
  })(req,res);
});

router.put('/oyo/:oyoId', (req, res, next) => {
  passport.authenticate('custom', async (err, user) => {
    try {
      if(err) {
        throw {
          code : 401,
          message : "접근 권한이 없습니다. 로그인을 해주세요."
        }
      }

      var { oyoId } = req.params;
      var { i : objId } = user;
      var body = req.body;
      var value = {
        theme : body.theme,
        bible_code : body.bible_code,
        chapter : body.chapter,
        f_verse : body.f_verse,
        l_verse : body.l_verse,
        content : body.content,
      }
      const query = `UPDATE oyo SET 
        theme = '${value.theme}', bible_code = '${value.bible_code}',
        chapter = '${value.chapter}', f_verse = '${value.f_verse}',
        l_verse = '${value.l_verse}', content = '${value.content}' 
        WHERE id = '${oyoId}' AND owner = '${objId}'`;
      
      var result = await pgClient.query(query);
      if(result.rowCount <= 0) {
        throw {
          code : 400,
          message : "일치하는 OYO 카드를 찾을 수 없습니다. 다시 시도해주세요."
        }
      }
      res.status(200).send({
        id : oyoId,
        ...value
      });

    } catch (error) {
      var { code, message } = error;
      res.status(code || 500).send({message: message || "OYO 카드 수정 중 장애가 발생했습니다."})
    }
  })(req, res, next);
})
router.delete('/oyo/:oyoId', (req, res, next) => {
  passport.authenticate('custom', async (err, user) => {
    try {
      if(err) {
        throw {
          code : 401,
          message : ""
        }
      }
      const { oyoId } = req.params;
      const { i : objId } = user;
      const query = `DELETE FROM oyo WHERE id = '${oyoId}' AND owner = '${objId}'`;
  
      var result = await pgClient.query(query);
      var delCount = result.rowCount;
      if(delCount <= 0) {
        throw {
          code : 400,
          message : "OYO 카드 정보를 찾을 수 없습니다."
        }
      }
      res.status(200).send();
      
    } catch (error) {
      console.error(error);
      var { code, message } = error;
      res.status(code || 400).send({message : message || "OYO 카드 제거 도중 서버 장애가 발생했습니다."});
    }
  })(req, res, next);
})
router.put('/', (req, res, next) => {
  try {
    const { memorized, cardnum, category } = req.body;
  } catch (error) {
    console.error(error);
    res.status(error.code).send(error.message)
  }
})

module.exports = router;