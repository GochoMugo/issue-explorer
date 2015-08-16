/**
 * Explore the AMAs out there
 */


export default {
  loop,
};


// npm-installed modules
import _ from "lodash";
import blessed from "blessed";
import fixed from "fixed-object";


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
  options = fixed(options);

  screen = blessed.screen({
    smartCSR: true,
  });
  screen.title = pkg.name;

  // quit on [Control-C] and [esc]
  screen.key(["C-c", "escape"], exit);

  // init UI
  ui.init(screen, pkg);

  /**
   * Handling errors
   *
   * @param {Error} err
   */
  function handleError(err) {
    ui.showErrorMessage(err.message, function() {
      throw err;
    });
  }

  /**
   * show a single issue
   */
  function one(fetchOptions) {
    ui.showLoading("fetching issue...");
    data.fetchIssue(fetchOptions, function(err, issue) {
      ui.hideLoading();
      if (err) {
        return handleError(err);
      }
      // show issue. when user is done with the issue, go back to issues list
      ui.showIssue(screen, issue, data.formatIssue(issue));
    });
  }

  /**
   * show multiple issues
   */
  function all(fetchOptions) {
    ui.showLoading("fetching issues...");
    data.fetchIssues(fetchOptions, function(err, issues) {
      ui.hideLoading();
      if (err) {
        return handleError(err);
      }
      // show all issues. if a user chooses one from the list, browse it
      ui.showAllIssues(screen, issues, data.formatIssues(issues));
    });
  }

  // load more issues if user wants that
  ui.getTable("issues").on("more", function loadMore() {
    let ops = _.cloneDeep(options);
    ops.loadMore = true;
    all(ops);
  })
  // load a specific issue
  .on("select", function(issueString) {
    let ops = _.cloneDeep(options);
    ops.number = data.parseIssueString(issueString).number;
    one(ops);
  });

  // user cancelling from an issue
  ui.getTable("issue").on("cancel", function() {
    let ops = _.cloneDeep(options);
    all(ops);
  });

  // start the fetch loop
  if (data.targetsOneIssue(options.shorthand)) {
    one(_.cloneDeep(options));
  } else {
    all(_.cloneDeep(options));
  }
}
