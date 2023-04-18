const jwt = require('jsonwebtoken');
require('dotenv').config();

//Try catch allowing us to certified the user's authentification
//Returns the id authentified by JWT Token
//If succes the API goes to the next middleware
module.exports = (req, res, next) => {
   try {
       const token = req.headers.authorization.split(' ')[1];
       const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
       const userId = decodedToken.userId;
       req.auth = {
           userId: userId
       };
	next();
   } catch(error) {
       res.status(401).json({ error });
   }
};