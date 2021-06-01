var router = require('express').Router();

router.get('/:category', (req, res) => {
  try {
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