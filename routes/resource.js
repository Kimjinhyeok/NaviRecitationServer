const router = require('express').Router();
var pgClient = require('../utils/pgClient');

router.get('/bible', async (req, res, next) => {
  try {
    const query = `SELECT * FROM bible_code`;
    var queryRes = await pgClient.query(query);
    var bibleCodes = queryRes.rows;

    res.status(200).send(bibleCodes);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/bible/:code', async (req, res, next) => {
  try {
    const code = req.params.code;
    const query = `SELECT * FROM bible_code where bible_code=${code}`;
    var queryRes = await pgClient.query(query);

    var bibleInfo = queryRes.rows[0];
    res.status(200).send(bibleInfo);
  } catch (error) {
    res.status(400).send(error);
  }
})

router.get('/category', async (req, res, next) => {
  try {
    const query = `SELECT * FROM series`;
    var queryRes = await pgClient.query(query);
    var categories = queryRes.rows;

    res.status(200).send(categories);
  } catch (error) {
    res.status(400).send(error);
  }
})

module.exports = router;