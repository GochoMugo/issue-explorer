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
  showErrorMessage,
  showMessage,
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
  dom.message = blessed.message({
    parent: screen,
    top: "center",
    left: "center",
    align: "center",
    border: "line",
    height: 5,
    width: 80,
    hidden: true,
  });
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
    this._data = null;
    this._config = options || { };
    this._init();
    return this;
  }

  _init() {
    let me = this;
    // to select an item
    this._table.rows.key(["enter"], function() {
      me.emit("select", me._selected.content);
    });
    // want more items
    this._table.rows.key(["space"], function() {
      me.emit("more");
    });
    // track user
    this._table.rows.on("select", function(a) {
      me._selected = a;
    });
    // cancel
    function cancel() {
      me.emit("cancel");
    }
    this._table.rows.on("cancel", cancel);
    this._table.rows.key(["escape", "q", "C-c"], cancel);
    return me;
  }

  /**
   * Allow binding to keypresses
   *
   * @param {String|String[]} keys
   * @param {Function} callback(key, metaKeys, tableState)
   */
  key(keys, callback) {
    let me = this;
    me._table.rows.key(keys, function() {
      let args = _.toArray(arguments);
      args.push({
        data: me._data,
      });
      callback.apply(null, args);
    });
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
    if (options.data) {
      this._data = options.data;
    }
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
    if (this._table.hidden) {
      return this;
    }
    if (this === tables._active) {
      tables._active = null;
    }
    this._table.hide();
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
        columnWidth: [5, 80, 15, 15, 15],
      })),
      issue: new Table(_.merge({}, commonOptions, {
        columnSpacing: 3,
        columnWidth: [20, 110],
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
 */
function showAllIssues(screen, issues, data) {
  getTable("issues")
    .show(screen, {
      headers: ["#", "title", "reporter", "assignee", "updated at"],
      data,
    }, {
      label: `${issues.shorthand} (${issues.state})`,
    });
}


/**
 * show a single issue
 *
 * @param {blessed.screen} screen
 * @param {github.Issue} issue
 * @param {Array[]} data
 */
function showIssue(screen, issue, data) {
  getTable("issue")
    .show(screen, {
      headers: ["githubber", "body"],
      data,
    }, {
      data: issue,
      reset: true,
      label: `${issue.shorthand}: ${issue.title}`,
    });
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


/**
 * Show error message
 *
 * @param {String} message
 * @param {Function} done
 */
function showErrorMessage(message, done) {
  if (tables._active) {
    tables._active.hide();
  }
  hideLoading();
  dom.message.error(message, 0, done);
}


/**
 * Show normal message
 *
 * @param {String} message
 * @param {Function} done
 */
function showMessage(message, done=function() {}) {
  dom.message.setFront();
  dom.message.display(message, done);
}
