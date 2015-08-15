/**
 * User Interface (UI)
 */


export default {
  getTable,
  init,
  showAllIssues,
  showIssue,
  showLoading,
  hideLoading,
};


// built-in modules
import { EventEmitter } from "events";


// npm-installed modules
import _ from "lodash";
import blessed from "blessed";
import contrib from "blessed-contrib";


// module variables
let dom = {};
let tables = {};
let commonOptions = {
  keys: true,
  fg: "white",
  selectedFg: "white",
  selectedBg: "blue",
  interactive: true,
  label: "issue-explorer",
  width: "80%",
  height: "80%",
  border: {type: "line", fg: "cyan"},
  left: "center",
  top: "center",
};


/**
 * Initializes the terminal Interface
 *
 * @param {blessed.screen} screen
 * @param {Object} package.json
 * @return {Object} terminal DOM*
 */
function init(screen, pkg) {
  dom.loading = blessed.loading({
    parent: screen,
    top: "center",
    left: "center",
    align: "center",
    tags: true,
    border: "line",
    height: 3,
    width: 40,
  });
  dom.title = blessed.box({
    parent: screen,
    top: 0,
    left: "center",
    height: 1,
    width: "shrink",
    content: `< issue explorer ${pkg.version} >`,
  });
  return dom;
}


/**
 * tables in the terminal
 */
class Table extends EventEmitter {
  constructor(initDict, options) {
    super();
    this._table = contrib.table(initDict);
    this._selected = null;
    this._config = options || { };
    this._init();
    return this;
  }

  _init() {
    let me = this;
    // to select an item
    this._table.rows.key(["enter", "space"], function() {
      me.emit("select", me._selected.content);
    });
    // track user
    this._table.rows.on("select", function(a) {
      me._selected = a;
    });
    // cancel
    function cancel() {
      if (me._config.alwaysOnTop) {
        return;
      }
      me.hide();
    }
    this._table.rows.on("cancel", cancel);
    this._table.rows.key(["escape", "q", "C-c"], cancel);
    return me;
  }

  /**
   * show the table to user
   *
   * @param {blessed.screen} screen
   * @param {Object} data - data to populate table with
   * @param {Object} [option={}] configure the show
   */
  show(screen, data, options={}) {
    this._table.setData(data);
    if (options.reset) {
      this._table.rows.select(0);
    }
    if (options.label) {
      this._table.setLabel(options.label);
    }
    this._table.focus();
    this._table.show();
    tables._active = this;
    screen.append(this._table);
    screen.render();
    return this;
  }

  /**
   * hide the table from user
   */
  hide() {
    this._table.hide();
    this.emit("cancel");
    return this;
  }
}


/**
 * Return the target table. Handles initializing these tables
 * only when required
 *
 * @param {String} name - name of table i.e issues / issue
 * @return {Table}
 */
function getTable(name) {
  if (!tables[name]) {
    tables = {
      issues: new Table(_.merge({}, commonOptions, {
        columnSpacing: 1,
        columnWidth: [5, 70, 15, 15, 15],
      }), {alwaysOnTop: true}),
      issue: new Table(_.merge({}, commonOptions, {
        columnSpacing: 3,
        columnWidth: [20, 101],
      })),
    };
  }

  return tables[name];
}


/**
 * show all issues
 *
 * @param {blessed.screen} screen
 * @param {github.Issues[]} issues
 * @param {Array[]} data
 * @param {Function} cb
 */
function showAllIssues(screen, issues, data, cb) {
  getTable("issues")
    .show(screen, {
      headers: ["#", "title", "reporter", "assignee", "updated at"],
      data,
    }, {
      label: `${issues.shorthand} (${issues.state})`,
    }).once("select", cb);
}


/**
 * show a single issue
 *
 * @param {blessed.screen} screen
 * @param {github.Issue} issue
 * @param {Array[]} data
 * @param {Function} cb
 */
function showIssue(screen, issue, data, cb) {
  getTable("issue")
    .show(screen, {
      headers: ["githubber", "body"],
      data,
      label: issue.shorthand,
    }, {
      reset: true,
      label: `${issue.shorthand}: ${issue.title}`,
    }).once("cancel", cb);
}


/**
 * show loading box
 *
 * @param {String} message - displayed to user
 */
function showLoading(message) {
  if (tables._active) {
    tables._active.hide();
  }
  dom.loading.load(message);
}


/**
 * hide the loading box
 */
function hideLoading() {
  dom.loading.stop();
}
