/**
 * Explore the AMAs out there
 */


export default {
  loop,
};


// npm-installed modules
import blessed from "blessed";


// own modules
import data from "./data";
import pkg from "../package.json";
import ui from "./ui";


// module variables
let screen;


/**
 * Exit with a zero exit code
 */
function exit() {
  return process.exit(0); // eslint-disable-line
}


/**
 * Starts the input loop
 *
 * @param {Object} options - init options
 */
function loop(options) {
  screen = blessed.screen({
    smartCSR: true,
  });
  screen.title = pkg.name;

  // quit on [Control-C] and [esc]
  screen.key(["C-c", "escape"], exit);

  // init UI
  ui.init(screen, pkg);

  /**
   * show a single issue
   */
  function one(num) {
    ui.showLoading("fetching issue...");
    // show issue #num if number is given (selecting from list in terminal)
    if (num) {
      options.number = num;
    }
    data.fetchIssue(options, function(err, issue) {
      ui.hideLoading();
      if (err) {
        throw err;
      }
      // show issue. when user is done with the issue, go back to issues list
      ui.showIssue(screen, issue, data.formatIssue(issue), all);
    });
  }

  /**
   * show multiple issues
   */
  function all() {
    ui.showLoading("fetching issues...");
    data.fetchIssues(options, function(err, issues) {
      ui.hideLoading();
      if (err) {
        throw err;
      }
      // show all issues. if a user chooses one from the list, browse it
      ui.showAllIssues(screen, issues, data.formatIssues(issues), function(issueString) {
        one(data.parseIssueString(issueString).number);
      });
    });
  }

  // start the fetch loop
  if (data.targetsOneIssue(options.shorthand)) {
    one();
  } else {
    all();
  }
}
