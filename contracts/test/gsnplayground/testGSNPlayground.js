const {assert, should, expect} = require("local-chai");
const {expectRevert, waitFor, objMap} = require("local-utils");
const {setupGSNPlayground} = require("./utils");
const {BigNumber} = require("@ethersproject/bignumber");

describe("GSNPlayground", function () {
  it("user can name", async function () {
    const {users} = await setupGSNPlayground();
    await waitFor(users[0].GSNPlayground.setName("test"));
  });
});
