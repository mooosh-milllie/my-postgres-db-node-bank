const errorHandler = (error, request, response, next) => {
  console.error('Error Handler', error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } 
  if (error.name === 'ValidationError') {
    return response.status(401).json({ error: error.message });
  }
  if (error.name === 'ReferenceError') {
    return response.status(500).json({ error: error.message });
  }
  if (error.name === 'TokenExpiredError') {
    return response.status(401).json({ error: error.message });
  }
  next(error)
}


module.exports = {
  errorHandler
}