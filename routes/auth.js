var router = require('express').Router();

router.post('/auth/password', (req, res) => {
  try {
    
  } catch (error) {
    res.status(error.code).send(error.message)
  }
});
router.post('/auth', (req, res) => {
  try {
    
  } catch (error) {
    res.status(error.code).send(error.message)
  }
})
router.delete('/auth', (req, res) => {
  try {
    
  } catch (error) {
    res.status(error.code).send(error.message)
  }
})

module.exports = router;