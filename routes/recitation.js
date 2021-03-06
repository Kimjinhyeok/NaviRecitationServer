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
  passport.authenticate('custom', async (error, user) => {
    try {
      if (error) {
        throw error;
      }
      var category = Number(req.params.category);
      var version = req.query.version;
      let { i: obj_id } = user;

      var query = category != 500 ? getNaviSeriesCardQuery(category, obj_id) : getOYOCardQuery(user);

      var row = await pgClient.query(query);
      var result = row.rows;
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
      res.status(error.code || 400).send(error.message);
    }
  })(req, res, next);
});
function getNaviSeriesCardQuery(category, userId) {
  var query = getGuestNaviSeriesQuery(category);

  if (userId) {
    // If user has login, get card with passed status
    query = `SELECT navwords.*, N.passed
    FROM (${query}) as navwords
    LEFT JOIN nav_words_passed N ON N.user_obj_id = '${userId}' AND N.series_code = navwords.series_code AND N.card_num = navwords.card_num`
  }

  return query;
}
function getGuestNaviSeriesQuery(category) {
  return `SELECT (ROW_NUMBER() OVER()) AS id, * FROM (SELECT B.bible_name, A.bible_code, A.card_num, A.series_code, A.category, A.theme, A.chapter, A.f_verse, A.l_verse, A.verse_gae, A.verse_kor   
  FROM (
    SELECT * 
    FROM nav_words 
    ${category ? (category % 100 === 0 ? `WHERE series_code > ${category} AND series_code <= ${category + 99} ` : "WHERE series_code = " + category) : ""}
  ) as A 
  LEFT OUTER JOIN bible_code B on A.bible_code = B.bible_code
  ORDER BY A.series_code ASC, A.card_num ASC) as g`;
}
function getOYOCardQuery(userInfo) {
  const { i: objId } = userInfo;
  return `SELECT B.bible_name, A.bible_code, A.chapter, A.theme, A.f_verse, A.l_verse, A.content, A.content as verse_gae, A.id as card_num, A.passed, A.create_at FROM oyo A 
  RIGHT OUTER JOIN bible_code B on A.bible_code = B.bible_code WHERE owner = '${objId}'
  ORDER BY create_at ASC`
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
      const { i: objId } = user;
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
  })(req, res);
});

router.put('/oyo/:oyoId', (req, res, next) => {
  passport.authenticate('custom', async (err, user) => {
    try {
      if (err) {
        throw {
          code: 401,
          message: "?????? ????????? ????????????. ???????????? ????????????."
        }
      }

      var { oyoId } = req.params;
      var { i: objId } = user;
      var body = req.body;
      var value = {
        theme: body.theme,
        bible_code: body.bible_code,
        chapter: body.chapter,
        f_verse: body.f_verse,
        l_verse: body.l_verse,
        content: body.content,
      }
      const query = `UPDATE oyo SET 
        theme = '${value.theme}', bible_code = '${value.bible_code}',
        chapter = '${value.chapter}', f_verse = '${value.f_verse}',
        l_verse = '${value.l_verse}', content = '${value.content}' 
        WHERE id = '${oyoId}' AND owner = '${objId}'`;

      var result = await pgClient.query(query);
      if (result.rowCount <= 0) {
        throw {
          code: 400,
          message: "???????????? OYO ????????? ?????? ??? ????????????. ?????? ??????????????????."
        }
      }
      res.status(200).send({
        id: oyoId,
        ...value
      });

    } catch (error) {
      var { code, message } = error;
      res.status(code || 500).send({ message: message || "OYO ?????? ?????? ??? ????????? ??????????????????." })
    }
  })(req, res, next);
})
router.delete('/oyo/:oyoId', (req, res, next) => {
  passport.authenticate('custom', async (err, user) => {
    try {
      if (err) {
        throw {
          code: 401,
          message: ""
        }
      }
      const { oyoId } = req.params;
      const { i: objId } = user;
      const query = `DELETE FROM oyo WHERE id = '${oyoId}' AND owner = '${objId}'`;

      var result = await pgClient.query(query);
      var delCount = result.rowCount;
      if (delCount <= 0) {
        throw {
          code: 400,
          message: "OYO ?????? ????????? ?????? ??? ????????????."
        }
      }
      res.status(200).send();

    } catch (error) {
      console.error(error);
      var { code, message } = error;
      res.status(code || 400).send({ message: message || "OYO ?????? ?????? ?????? ?????? ????????? ??????????????????." });
    }
  })(req, res, next);
})

router.put('/passed/:category/:cardId', (req, res) => {
  passport.authenticate('custom', async (error, user) => {
    try {
      let { category: series_code, cardId: card_num } = req.params;
      let { recitation_status } = req.body;
      let query = "";

      if (!user) {
        // ????????? ????????? ??????
        throw {
          code: 401,
          message: "???????????? ????????? ???????????????."
        }
      }
      series_code = Number(series_code);
      let { i: obj_id } = user;
      if (series_code >= 500) {
        // OYO ??????
        query = `UPDATE oyo SET passed = ${recitation_status} WHERE owner = '${obj_id}' AND id = '${card_num}'`
      } else {
        // ?????? ????????????
        query = `INSERT INTO nav_words_passed(user_obj_id, series_code, card_num, passed) VALUES('${obj_id}', '${series_code}', '${card_num}', ${recitation_status})
        ON CONFLICT (user_obj_id, series_code, card_num)
        DO UPDATE SET passed = ${recitation_status}`;
      }

      try {

        var rows = await pgClient.query(query);
      } catch (error) {
        console.error(error);
        let err = new Error("????????? ?????? ??? ????????? ??????????????????.");
        err.code = 500;
        throw err;
      }
      // var queryRes = rows.rows[0];
      res.status(200).send(true);
    } catch (error) {
      res.status(error.code || 500).send({ message: error.message || "?????? ?????? ?????? ??? ????????? ??????????????????." });
    }
  })(req, res);
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