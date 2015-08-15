// npm-installed modules
import should from "should";


// own modules
import data from "../lib/data";


// module variables
const issue = {
  number: 1,
  title: "issue title",
  user: {
    login: "UserName1",
  },
  assignee: {
    login: "UserName2",
  },
  "updated_at": "2011-04-22T13:33:48Z",
  "updated_at_conv": "4 years ago", // for tests
  body: "issue body",
  comments: [
    {
      body: Array(200).join("abcdef "),
      user: {
        login: "UserName3",
      },
    },
  ],
};


describe("data.parseShorthand", function() {
  it("returns an object", function() {
    should(data.parseShorthand("Username/Reponame")).be.an.Object();
  });

  it("parses correctly", function() {
    let result = data.parseShorthand("Username/Reponame");
    should.equal(result.user, "Username");
    should.equal(result.repo, "Reponame");
    should.equal(result.number, null);
    should.equal(result.clean, "Username/Reponame");

    result = data.parseShorthand("Username/Reponame#3");
    should.equal(result.number, 3);
  });

  it("throws an error if not valid", function() {
    [
      "Username", "Username#Reponame/3", "Username/Reponame#ian",
      "Username/Reponame#",
    ].forEach(function(s) {
      should.throws(function() {
        data.parseShorthand(s);
      });
    });
  });
});


describe("data.parseIssueString", function() {
  it("returns an object", function() {
    should(data.parseIssueString("1 some issue title")).be.an.Object();
  });

  it("object.number is the first padded number from string", function() {
    [
      "1 issue title", "  1 issue title",
      "\t1 issue", "\t1\tissue",
    ].forEach(function(s) {
      should.equal(data.parseIssueString(s).number, 1);
    });
  });
});


describe("data.formatIssues", function() {
  it("returns an array", function() {
    should(data.formatIssues([])).be.an.Array();
  });

  it("correctly formats", function() {
    const result = data.formatIssues([issue]);
    should.equal(result.length, 1);
    should(result[0]).be.an.Array();
    should.deepEqual(result[0], [
      1, issue.title, issue.user.login, issue.assignee.login, issue.updated_at_conv,
    ]);
  });

  it("formats date nicely", function() {
    const result = data.formatIssues([issue]);
    should.equal(result[0][4], issue.updated_at_conv);
  });
});


describe("data.formatIssue", function() {
  const result = data.formatIssue(issue);

  it("returns an array", function() {
    should(data.formatIssue(issue)).be.an.Array();
  });

  it("adds the original issue at start of array", function() {
    should.equal(result[0][0], issue.user.login);
  });

  it("adds a username on the left", function() {
    should.equal(result[0][0], issue.user.login);
  });

  it("shortens the bodies to 100 chars", function() {
    result.forEach(function(r) {
      should(r[1].length).below(101);
    });
  });

  it("adds a separator", function() {
    result.forEach(function(r, i) {
      if (r[0].indexOf("UserName") > -1 && i !== 0) {
        should(result[i - 2][1]).containEql(Array(100).join("-"));
      }
    });
  });
});


describe("data.targetsOneIssue", function() {
  it("returns true if is a single issue", function() {
    should(data.targetsOneIssue("Username/Reponame#3")).eql(true);
  });

  it("returns false if not", function() {
    should(data.targetsOneIssue("Username/Reponame")).eql(false);
  });
});
