/**
 * Argument parser
 */


// npm-installed modules
import parser from "simple-argparse";
import out from "cli-output";


// own modules
import pkg from "../package.json";
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
    ensureShorthand(shorthand);
    this.shorthand = shorthand;
    this.state = "all";
    run.loop(this);
  }).option("o", "open", "open issues", function(shorthand) {
    ensureShorthand(shorthand);
    this.shorthand = shorthand;
    this.state = "open";
    run.loop(this);
  }).option("c", "closed", "closed issues", function(shorthand) {
    ensureShorthand(shorthand);
    this.shorthand = shorthand;
    this.state = "closed";
    run.loop(this);
  }).parse();


function ensureShorthand(shorthand) {
  if (!shorthand) {
    out.error("no shorthand given. valid formats include:");
    out.error("   Username/Reponame e.g. GochoMugo/issue-explorer");
    out.error("   Username/Reponame#Num e.g. GochoMugo/issue-explorer#1");
    process.exit(1); // eslint-disable-line
  }
}
