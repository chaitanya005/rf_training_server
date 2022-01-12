var express = require('express');
var router = express.Router();
const db = require('../config/dbConfig')
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')


const intializePassport = require('../config/passportCofig');

intializePassport(passport);

function addUser(db, newUser) {
  return db
    .insert(newUser)
    .into("users")
    .then(rows => {
      return rows[0];
    });
}

function addIssue(db, newIssue) {
  return db
    .insert(newIssue)
    .into("issues")
    .then(rows => {
      return rows[0];
    });
}

function addComment(db, newComment) {
  return db
    .insert(newComment)
    .into("comments")
    .then(rows => {
      return rows[0];
    });
}

function addLabel(db, newLabel) {
  return db
    .insert(newLabel)
    .into("labels")
    .then(rows => {
      return rows[0];
    });
}

function updateLabel(db, updateLabel) {
  return db
    .update('label_id', updateLabel.label_id)
    .where('id', updateLabel.issue_id)
    .into("issues")
    .then(rows => {
      return rows[0];
    }); 
}

function updateAssignee(db, updateAssignee) {
  return db
    .update('assignee_id', updateAssignee.assignee_id)
    .where('id', updateAssignee.issue_id)
    .into("issues")
    .then(rows => {
      return rows[0];
    }); 
}

router.get('/', function(req, res, next) {
  if (req.isAuthenticated()) {
    res.render('home')
  } else {
    res.redirect('/login')
  }
});

router.get('/home', async(req, res) => {
  if (req.query.search_keyword) {
    let filterdIssues;
    filterdIssues = await db('issues')
    .leftJoin('labels', 'issues.label_id', 'labels.id')
    .leftJoin('users', 'issues.assignee_id', 'users.id')
    .select('issues.id', 'issues.title', 'issues.comment', 'issues.posted_by', 'issues.issue_status', 'labels.name as label', 'labels.bg_color as bgColor', 'users.username as assignee', 'labels.font_color as fontColor')
    .where('title', 'ILIKE', `%${req.query.search_keyword.toLowerCase()}%`)
    const labels = await db('labels').select('id', 'name', 'description', 'bg_color', 'font_color')
    const users = await db('users').select('id', 'username')
    res.render('home', {filterdIssues, labels, users});
  } else {
    // const issues = await db('issues')
    // .leftJoin('labels', 'issues.label_id', 'labels.id')
    // .leftJoin('users', 'issues.assignee_id', 'users.id')
    // .select('issues.id', 'issues.title', 'issues.comment', 'issues.posted_by', 'issues.issue_status', 'labels.name as label', 'labels.bg_color as bgColor', 'users.username as assignee', 'labels.font_color as fontColor')
    let page = parseInt(req.query.page) || 1
    await db('issues')
    .leftJoin('labels', 'issues.label_id', 'labels.id')
    .leftJoin('users', 'issues.assignee_id', 'users.id')
    .select('issues.id', 'issues.title', 'issues.comment', 'issues.posted_by', 'issues.issue_status', 'labels.name as label', 'labels.bg_color as bgColor', 'users.username as assignee', 'labels.font_color as fontColor')
    .paginate({
      perPage: 10, 
      currentPage: page, 
      isLengthAware: true
    }).then(async(response) => {
        console.log('res', response)
        let issues = response.data
        let currPage = response.pagination.currentPage
        let lastPage = response.pagination.lastPage
        let totalPages = [];
        for (let i = 1; i <= lastPage; i++) {
          if (lastPage-1 >= 0 ) {
            totalPages.push(i);
          }
        }
        const users = await db('users').select('id', 'username')
        const labels = await db('labels').select('id', 'name', 'description', 'bg_color', 'font_color')
        // res.render('home', {issues, labels, users, currPage, lastPage, totalPages})
        res.status(200).json({issues, users, labels, currPage, lastPage, totalPages})
      })
      .catch(err => console.log(err))
  }
});


router.get('/search', async (req, res) => {
  console.log(req.body)
})

router.get('/new-issues', async(req, res) => {
    const labels = await db('labels').select('id', 'name', 'description', 'bg_color', 'font_color')
    const users = await db('users').select('id', 'username')
    // res.render('newIssue', {labels, users});
    res.status(200).json({labels, users})
});

router.get('/issues/:id', async (req, res) => {
  // console.log(req.params)
  const issue = await db('issues')
  .leftJoin('comments', 'issues.id', 'comments.issue_id')
  .leftJoin('labels', 'issues.label_id', 'labels.id')
  .leftJoin('users', 'issues.assignee_id', 'users.id')
  .select('issues.id', 'issues.title', 'issues.comment', 'issues.posted_by', 'issues.issue_status', 'comments.comment AS comments', 'comments.posted_by AS user_posted_by', 'labels.name as label_name', 'labels.bg_color as label_bgColor', 'labels.font_color as label_fontColor', 'users.username as assignee')
  .where({'issues.id': req.params.id})
  const labels = await db('labels').select('id', 'name', 'description', 'bg_color', 'font_color')
  const users = await db('users').select('id', 'username')
  console.log(issue)
  // res.render('issue', {issue, labels, users})
  res.status(200).json({issue, labels, users})
})

router.get('/labels', async(req, res) => {
  const labels = await db('labels').select('id', 'name', 'description', 'bg_color', 'font_color')
  // res.render('labels', {labels})
  res.status(200).json({labels})
})

let user;
router.get('/login', async function(req, res) {
    if (!req.isAuthenticated()) {
      res.render('login')
    } else {
      res.redirect('/home')
    }
})

router.post('/login', async (req, res) => {
  try {
    // console.log(req.body)
    const email = req.body.email
    const password = req.body.password
    const user = await db('users').where({email: email})
    if (!user) {
      res.status(400).json({message: 'User not found!'})
    } else {
      if (!bcrypt.compareSync(password, user[0].password)) {
        res.status(400).json({message: 'Password Incorrect!'})
      } else {
        // res.status(200).json({message: 'Success!'})
        let payload = {
          id: user[0].id,
          name:  user[0].name,
          username: user[0].username,
          email: user[0].email
        }
        const secretOrKey = 'jwt_secret_key'
        jwt.sign(payload, secretOrKey, { expiresIn: 3600} , (err, token) => {
          res.json({
            success: true,
            token: 'Bearer ' + token,
          })
        })
      }
    }
    
  } catch(err) {
    console.log(err)
  }
})

router.get('/currUser', passport.authenticate('jwt', {session: false}), (req, res) => {
  res.json({user: req.user})
})

// router.post("/login", (req, res, next) => {
//   passport.authenticate("jwt", (err, user, info) => {
//     if (err) throw err;
//     if (!user) res.send("No User Exists");
//     else {
//       req.logIn(user, (err) => {
//         if (err) throw err;
//         res.send("Successfully Authenticated");
//         console.log(req.user);
//       });
//     }
//   })(req, res, next);
// });


router.get('/getUser', async (req, res) => {
  console.log(req.isAuthenticated())
  console.log(req.session)
  console.log(req.user)
})

router.post('/logout', function(req, res) {
  console.log(req.isAuthenticated())
  req.logOut();
  // res.redirect('/login')
  user = '';
  res.json({user})
});

router.get('/signup', function(req, res) {
  if (!req.isAuthenticated()) {
    res.render('signup')
  } else {
    res.redirect('/home')
  }
})

router.post('/signup', async(req, res)=> {
  try {
    console.log(req.body)
    const { email, password, name, userName } = req.body.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await addUser(db, { email, password: hashedPassword, name: name, username: userName });
    res.status(200).json({message: 'Success'})
  }
  catch (err) {
    console.log(err)
    res.status(500).json({message: 'Failed'})
  }
  // console.log(req.body)
})


router.post('/create-issue', async(req, res) => {
  try {
    console.log(req.body)
    // const { input, newIssue.title, newIssue.label, newIssue.assignee } = req.body;
    const issue = await addIssue(db, { title: req.body.newIssue.title, comment: req.body.input, posted_by: req.body.userName, issue_status: 'open', label_id: req.body.newIssue.label, assignee_id: req.body.newIssue.assignee })
    res.status(200).json({message: 'Issue added Successfully!'})
    
    // addIssue(db, { title, posted_by: 'First user', issue_status: 'open', label_id: label })
    // .then(res => {
    //   addComment(db, { comment: editor, posted_by: 'First user', issue_id: res});
    // })
    // await addComment(db, { comment: editor, posted_by: req.user.username, issue_id: issue_id});
    // res.redirect('/home');
  }
  catch (err) {
    console.log(err);
  }
})

router.post('/create-comment', async(req, res) => {
  try {
    console.log(req.body)
    const { id, input, username } = req.body;
    const issue = await addComment(db, { comment: input, posted_by: username, issue_id: id, label_id: 0});
    // res.redirect(`/issues/${issue_id}`)
    res.status(200).json({message: 'Comment added Successfully!'})
  }
  catch (err) {
    console.log(err);
  }
})

router.post('/update-label', async(req, res) => {
  try {
    const { labelId, issueId } = req.body;
    await updateLabel(db, {label_id: labelId, issue_id: issueId})
    // res.redirect(`/issues/${issue_id}`)
    res.status(200).json({message: 'Label Updated Successfully!'})
  }
  catch (err) {
    console.log(err);
  }
})

router.post('/update-assignee', async(req, res) => {
  try {
    console.log(req.body)
    const { assigneeId, issueId } = req.body;
    await updateAssignee(db, {assignee_id: assigneeId, issue_id: issueId})
    // res.redirect(`/issues/${issue_id}`)
    res.status(200).json({message: 'Assignee Updated Successfully!'})
  }
  catch (err) {
    console.log(err);
  }
})


router.post('/create-label', async(req, res) => {
  try {
    const { label_name, description, color_code } = req.body;
    let r = color_code.substring(1, 3);
    let g = color_code.substring(3, 5);
    let b = color_code.substring(5, 7);
    let nThreshold = 105;
    let bgDelta = (parseInt(r, 16) * 0.299) + (parseInt(g, 16)* 0.587) + (parseInt(b, 16) * 0.114);
    let font_color =  (255 - bgDelta < nThreshold) ? "#000000" : "#ffffff";
    const label = await addLabel(db, { name: label_name, description, bg_color: color_code, font_color: font_color});
    res.json({message: 'Label Created Successfully!'})
    // res.redirect('/labels')
  }
  catch (err) {
    console.log(err);
  }
})


router.get('/home/search', async(req, res) => {
  try {
    let filterdIssues;
    if (req.query.label_id) {
      const { label_id } = req.query;
      filterdIssues = await db('issues')
      .leftJoin('labels', 'issues.label_id', 'labels.id')
      .leftJoin('users', 'issues.assignee_id', 'users.id')
      .select('issues.id', 'issues.title', 'issues.comment', 'issues.posted_by', 'issues.issue_status', 'labels.name as label', 'labels.bg_color as bgColor', 'users.username as assignee')
      .where({'issues.label_id': label_id})
      
    } else {
      filterdIssues = await db('issues')
      .leftJoin('labels', 'issues.label_id', 'labels.id')
      .leftJoin('users', 'issues.assignee_id', 'users.id')
      .select('issues.id', 'issues.title', 'issues.comment', 'issues.posted_by', 'issues.issue_status', 'labels.name as label', 'labels.bg_color as bgColor', 'users.username as assignee')
      .where({'issues.assignee_id': req.query.assignee_id})
    }

    const labels = await db('labels').select('id', 'name', 'description', 'bg_color', 'font_color')
    const users = await db('users').select('id', 'username')
    res.render('home', {filterdIssues, labels, users})
  }
  catch (err) {
    console.log(err);
  }
  
})

module.exports = router;
