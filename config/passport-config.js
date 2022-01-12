const LocalStrategy = require('passport-local').Strategy;
const db = require('./dbConfig')
const bcrypt = require('bcrypt');

function intialize(passport) {
    const authenticateUser =  (email, password, done) => {
      db('users').where('email', email).first().then( function (user) {
          if (user == null) {
              return done(null, false, { message: 'No user with that email' });
          }
          if (!bcrypt.compareSync(password, user.password)) {
              return done(null, false, { message: 'Password incorrect' });
          }
          return done(null, user);
      })
      .catch(function (err) {
          return done(err);
      });
  };

passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));
passport.serializeUser((user, done) => {
  console.log('SerailzeUser', user)
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  console.log('deserailzeUserId', id)
  db('users').where({id}).first()
  .then((user) => { console.log('deserailzeUser', user); done(null, user); })
  .catch((err) => { console.log('deserailzeUser', err); done(err, null); });
});

}

module.exports = intialize;
