var JwtStrategy = require("passport-jwt").Strategy,
  ExtractJwt = require("passport-jwt").ExtractJwt;
const db = require('./dbConfig')

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'jwt_secret_key';

function intialize(passport) {
    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
        // console.log('jwt_payload', jwt_payload)
        db('users').where('id', jwt_payload.id).first()
        .then( function (user) {
            if (user == null) {
                return done(null, false, { message: 'No user with that email' });
            }
            return done(null, user);
        }).catch(err => console.log(err))

    }));
    
}

module.exports = intialize