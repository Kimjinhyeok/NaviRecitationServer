var router = require('express').Router();
var pgClient = require('../utils/pgClient');

router.get('/:category', async (req, res) => {
  try {
    var row = await pgClient.query('SELECT * FROM nav_words');
    
    const { category } = req.params;
  } catch (error) {
    res.status(error.code).send(error.message)
  }
});
router.post('/oyo', (req, res) => {
  try {
    const { theme, bible_code, chapter, f_verse, l_verse, content } = req.body;
  } catch (error) {
    res.status(error.code).send(error.message)
  }
})
router.put('/', (req, res) => {
  try {
    const { memorized, cardnum, category } = req.body;
  } catch (error) {
    res.status(error.code).send(error.message)
  }
})

module.exports = router;