const router = require('express').Router();
var pgClient = require('../utils/pgClient');

router.get('/bible', async (req, res) => {
  try {
    const query = `SELECT * FROM bible_code`;
    var queryRes = await pgClient.query(query);
    var bibleCodes = queryRes.rows;

    res.status(200).send(bibleCodes);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/category', async (req, res) => {
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