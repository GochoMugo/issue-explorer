/**
 * Handle our data needs
 */


export default {
  appendErrorLog,
  authorize,
  authenticate,
  fetchIssue,
  fetchIssues,
  formatIssue,
  formatIssues,
  getShorthandFromGit,
  parseIssueString,
  parseShorthand,
  targetsOneIssue,
};


// built-in modules
import fs from "fs";
import os from "os";
import path from "path";


// npm-installed modules
import _ from "lodash";
import Github from "github";
import moment from "moment";
import slug from "github-slug";
import name from "username";
import wrap from "word-wrap";


// own modules
import pkg from "../package.json";


// module variables
const credpath = path.join(process.env.HOME, ".issue-explorer");
const github = new Github({
  version: "3.0.0",
  headers: {
    "user-agent": "issue-explorer",
  },
});
let cache = {
  issues: {},
  trackers: {
    page: {},
  },
  issue: {},
};


// authenticate, if we can
authenticate();


/**
 * Parse a github shorthand into an object
 *
 * @param {String} shorthand
 * @return {Object} obj
 * @return {String} obj.user - name of user / org
 * @return {String} obj.repo - name of repo
 * @return {Number} obj.number=null - number of issue
 * @return {String} obj.clean - alias of (obj.user + obj.repo)
 */
function parseShorthand(shorthand) {
  let slashIndex = shorthand.indexOf("/");
  if (slashIndex === -1) {
    throw new Error(`invalid shorthand: slash missing from shorthand: ${shorthand}`);
  }
  let hashIndex = shorthand.indexOf("#");
  if (hashIndex !== -1 && hashIndex <= slashIndex) {
    throw new Error(`invalid shorthand: hash before slash: ${shorthand}`);
  }
  let endIndex = hashIndex === -1 ? shorthand.length : hashIndex;
  const user = shorthand.substring(0, slashIndex);
  const repo = shorthand.substring(slashIndex + 1, endIndex);
  const number = hashIndex === -1 ? null : Number(shorthand.substring(hashIndex + 1));
  if (number !== null && isNaN(number)) {
    throw new Error(`invalid shorthand: issue number is NaN: ${shorthand}`);
  }
  if (number === 0) {
    throw new Error(`invalid shorthand: issue number can not be Zero: ${shorthand}`);
  }
  return {
    user,
    repo,
    number,
    clean: user + "/" + repo,
  };
}


/**
 * parse an issue string from a terminal list into an object.
 * this is useful when selecting list items
 *
 * @param {String} issueString
 * @return {Object} obj
 * @return {Number} obj.number - issue number
 */
function parseIssueString(issueString) {
  return {
    number: Number(issueString.match(/^\s*(\d+)/)[1]),
  };
}


/**
 * format issues suitable for a terminal list
 *
 * @param {github.Issue[]} issues
 * @return {Object[row]}
 * @return {Number} row[0] - issue number
 * @return {String} row[1] - issue title
 * @return {String} row[2] - creator username
 * @return {String} row[3] - assignee username
 * @return {String} row[4] - updated at
 */
function formatIssues(issues) {
  return issues.map(function(issue) {
    return [
      issue.number,
      issue.title,
      issue.user.login,
      issue.assignee ? issue.assignee.login : "~unassigned~",
      moment(issue.updated_at, "YYYYMMDD").fromNow(),
    ];
  });
}


/**
 * format an issue suitable for table
 *
 * @param {github.Issue} issue
 * @return {Object[row]}
 * @return {String} row[0] - username / line continuation
 * @return {String} row[1] - comment body
 */
function formatIssue(issue) {
  let continuer = Array(17).join(" ") + "---";
  let separator = Array(100).join("-"); // eslint-disable-line
  let comments = issue.comments.slice();
  comments.unshift(issue);
  let display = [];
  comments.forEach(function(comment) {
    let wrapped = wrap(comment.body, { width: 100, indent: "" }).split("\n");
    wrapped.forEach(function(w, i) {
      if (i === 0) {
        return display.push([comment.user.login, w]);
      }
      display.push([continuer, w]);
    });
    display.push(["", ""], [continuer, separator], ["", ""]);
  });
  return display;
}


/**
 * Return true if shorthand does not target an issue
 *
 * @param {String} shorthand
 * @return {Boolean}
 */
function targetsOneIssue(shorthand) {
  return shorthand.indexOf("#") > -1;
}


/**
 * Fetch all repo issues
 *
 * @param {Object} options
 * @param {String} options.shorthand - repo shorthand
 * @param {String} [options.state=open] - open / closed / all
 * @param {Function} done
 */
function fetchIssues(options, done) {
  let descriptor = parseShorthand(options.shorthand);
  let collection = cache.issues[descriptor.clean];
  let page = cache.trackers.page[descriptor.clean] || 1;

  if ((!options.loadMore) && collection) {
    return done(null, collection);
  }

  var query = _.merge({}, {
    user: descriptor.user,
    repo: descriptor.repo,
    state: "open",
    page: page,
  }, options);

  github.issues.repoIssues(query, function(err, issues) {
    if (err) {
      return done(wrapError(err));
    }
    issues.shorthand = descriptor.clean;
    issues.state = query.state;
    if (collection) {
      collection.push.apply(collection, issues);
    } else {
      cache.issues[descriptor.clean] = collection = issues;
    }
    cache.trackers.page[descriptor.clean] = page + 1;
    return done(null, collection);
  });
}


/**
 * Fetch issue and its comments
 *
 * @param {Object} options
 * @param {String} options.shorthand - repo shorthand
 * @param {String} [options.number] - issue number (can be derived from shorthand)
 * @param {Function} done
 */
function fetchIssue(options, done) {
  let descriptor = parseShorthand(options.shorthand);
  let number = options.number || descriptor.number;

  if (cache.issue[descriptor.clean + "#" + number]) {
    return done(null, cache.issue[descriptor.clean + "#" + number]);
  }

  github.issues.getRepoIssue({
    user: descriptor.user,
    repo: descriptor.repo,
    number: number,
  }, function(err, issue) {
    if (err) {
      return done(wrapError(err));
    }

    github.issues.getComments({
      user: descriptor.user,
      repo: descriptor.repo,
      number: number,
    }, function(err2, comments) {
      if (err2) {
        return done(wrapError(err2));
      }

      issue.comments = comments;
      issue.shorthand = descriptor.clean + "#" + number;
      cache.issue[descriptor.clean + "#" + number] = issue;
      return done(null, issue);
    });

  });
}


/**
 * Return the repo shorthand using .git/ directory in directory
 *
 * @param {String} abspath - path to repo directory
 * @param {String} cb - callback(err, shorthand)
 */
function getShorthandFromGit(abspath, done) {
  return slug(abspath, done);
}


/**
 * Write to an error log
 *
 * @param {Error} err
 */
function appendErrorLog(err) {
  fs.appendFileSync("gie.log", `---\n${err.message}: ${err.stack}\n---\n`);
}


/**
 * Authorize with Github
 *
 * @param {Object} creds
 * @param {String} creds.username
 * @param {String} creds.password
 * @param {Function} done
 */
function authorize({ username, password }, done) {
  return name(function(err, myname) {
    if (err) {
      myname = "me";
    }
    const machinename = myname + "@" + os.hostname();
    const time = moment().format();
    const scopes = ["repo"];
    const note = `${pkg.name} (${machinename}) [${time}]`;
    const note_url = pkg.homepage; // eslint-disable-line camelcase
    github.authenticate({
      type: "basic",
      username,
      password,
    });
    github.authorization.create({ scopes, note, note_url }, function(authErr, res) { // eslint-disable-line camelcase
      if (authErr) {
        return done(authErr);
      }

      const creds = {
        username,
        token: res.token,
      };

      // store credentials
      fs.writeFileSync(credpath, JSON.stringify(creds));

      authenticate(creds);
      return done(null);
    });
  });
}

/**
 * Authenticate github client
 *
 * @param {Object} creds
 * @param {String} creds.username
 * @param {String} creds.token
 */
function authenticate(creds={}) {
  if (!(creds.username && creds.token)) {
    try {
      let data = fs.readFileSync(credpath);
      data = JSON.parse(data);
      creds.username = data.username;
      creds.token = data.token;
    } catch(err) {
      if (err.code === "ENOENT") {
        return;
      }
      throw err;
    }
  }
  github.authenticate({
    type: "token",
    username: creds.username,
    token: creds.token,
  });
}


/**
 * Wrap requests error
 *
 * @param {Error} err
 * @return {Error}
 */
function wrapError(err) {
  let message = JSON.parse(err).message;
  let newErr = new Error(`could not fetch: ${message}`);
  newErr.stack = err.stack;
  return newErr;
}
