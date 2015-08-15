/**
 * Handle our data needs
 */


export default {
  fetchIssue,
  fetchIssues,
  formatIssue,
  formatIssues,
  parseIssueString,
  parseShorthand,
  targetsOneIssue,
};


// npm-installed modules
import _ from "lodash";
import Github from "github";
import moment from "moment";
import wrap from "word-wrap";


// module variables
const github = new Github({
  version: "3.0.0",
  headers: {
    "user-agent": "issue-explorer",
  },
});
let cache = {
  issues: {},
  issue: {},
};


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
    throw new Error("invalid shorthand: slash missing from shorthand: %s", shorthand);
  }
  let hashIndex = shorthand.indexOf("#");
  if (hashIndex !== -1 && hashIndex <= slashIndex) {
    throw new Error("invalid shorthand: hash before slash: %s", shorthand);
  }
  let endIndex = hashIndex === -1 ? shorthand.length : hashIndex;
  const user = shorthand.substring(0, slashIndex);
  const repo = shorthand.substring(slashIndex + 1, endIndex);
  const number = hashIndex === -1 ? null : Number(shorthand.substring(hashIndex + 1));
  if (number !== null && isNaN(number)) {
    throw new Error("invalid shorthand: issue number is NaN: %s", shorthand);
  }
  if (number === 0) {
    throw new Error("invalid shorthand: issue number can not be Zero: %s", shorthand);
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

  if (cache.issues[descriptor.clean]) {
    return done(null, cache.issues[descriptor.clean]);
  }

  var query = _.merge({}, {
    user: descriptor.user,
    repo: descriptor.repo,
    state: "open",
  }, options);

  github.issues.repoIssues(query, function(err, issues) {
    if (err) {
      return done(err);
    }
    issues.shorthand = descriptor.clean;
    issues.state = query.state;
    cache.issues[descriptor.clean] = issues;
    return done(null, issues);
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
      return done(err);
    }

    github.issues.getComments({
      user: descriptor.user,
      repo: descriptor.repo,
      number: number,
    }, function(err2, comments) {
      if (err2) {
        return done(err2);
      }

      issue.comments = comments;
      issue.shorthand = descriptor.clean + "#" + number;
      cache.issue[descriptor.clean + "#" + number] = issue;
      return done(null, issue);
    });

  });
}
