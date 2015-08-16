/**
 * Argument parser
 */


// npm-installed modules
import parser from "simple-argparse";
import out from "cli-output";


// own modules
import pkg from "../package.json";
import data from "./data";
import run from "./run";


// catch-all
process.on("uncaughtException", function(err) {
  out.error("an error occurred");
  out.error("    %s", err);
  process.exit(1); // eslint-disable-line
});


// define interface
parser
  .description(pkg.name, pkg.description)
  .version(pkg.version)
  .epilog(`see ${pkg.homepage} for feature-requests and issues`)
  .option("a", "all", "open+closed issues", function(shorthand) {
    this.state = "all";
    ensureShorthand(shorthand, function(sh) {
      this.shorthand = sh;
      run.loop(this);
    }.bind(this));
  }).option("o", "open", "open issues", function(shorthand) {
    this.state = "open";
    ensureShorthand(shorthand, function(sh) {
      this.shorthand = sh;
      run.loop(this);
    }.bind(this));
  }).option("c", "closed", "closed issues", function(shorthand) {
    this.state = "closed";
    ensureShorthand(shorthand, function(sh) {
      this.shorthand = sh;
      run.loop(this);
    }.bind(this));
  }).parse();


/**
 * Ensures a shorthand is received or implied from user
 *
 * @param {String} [shorthand] - applied by user
 * @param {Function} done - done(shorthand)
 */
function ensureShorthand(shorthand, done) {
  if (shorthand) {
    return done(shorthand);
  }

  return data.getShorthandFromGit(process.cwd(), function(err, impliedShorthand) {
    if (err) {
      out.error("no shorthand given/implied. valid formats include:");
      out.error("   Username/Reponame e.g. GochoMugo/issue-explorer");
      out.error("   Username/Reponame#Num e.g. GochoMugo/issue-explorer#1");
      out.error("the current working directory must have a .git/ directory for implied shorthands");
      process.exit(1); // eslint-disable-line
    }

    return done(impliedShorthand);
  });
}
