describe("Invite User into league and change some league Settings and run through a matchday.", () => {
  before(() => {
    cy.exec("export NODE_ENV=test; node cypress/e2e/invite1.mjs");
  });
  // Used to signup change username and password and login again
  it("invite", () => {
    let user1;
    let user2;
    // Signs in
    cy.visit("http://localhost:3000");
    cy.get("#login").click();
    cy.get("#input-username-for-Sign\\ Up-provider").type("Invite 1");
    cy.get("#input-password-for-Sign\\ Up-provider").type("password");
    cy.contains("Sign in with Sign Up").click();
    // Creates league with alternate starting amount
    cy.getCookie("next-auth.session-token").then(
      (cookie) => (user1 = cookie.value)
    );
    cy.get("#startingMoney").clear().type(200);
    cy.get("#name").type("Sample League");
    cy.get("button").contains("Create League").click();
    // Creates invites and deletes the randomly generated one
    cy.contains("Open League").click();
    cy.contains("Standings for Sample League");
    cy.contains("Add Invite").click();
    cy.get("#invite").type("invite1");
    cy.contains("Add Invite").click();
    cy.contains("Link: localhost:3000/api/invite/").contains("Delete").click();
    cy.contains("Link: localhost:3000/api/invite/invite1");
    // Changes the default money amount and starred player multiplier
    cy.get("#startingMoney").clear().type(100);
    cy.get("#starredPercentage").clear().type(180);
    // Makes sure that users have unlimited transfers when they have an empty squad
    cy.get("#transfers").clear().type(1);
    // Changes the name and checks if that worked
    cy.get("#leagueName").clear().type("New Sample League");
    cy.contains("Standings for New Sample League");
    cy.contains("Save Admin Settings").click();
    // Signs into User 2 which will join the league through the invite
    cy.get("#logout").click();
    cy.get("#input-username-for-Sign\\ Up-provider").type("Invite 2");
    cy.get("#input-password-for-Sign\\ Up-provider").type("password");
    cy.contains("Sign in with Sign Up").click();
    cy.getCookie("next-auth.session-token").then(
      (cookie) => (user2 = cookie.value)
    );
    // Checks invalid invite
    cy.visit("http://localhost:3000/api/invite/invite2", {
      failOnStatusCode: false,
    });
    cy.get(".center").contains("404");
    // Joins the league
    cy.visit("http://localhost:3000/api/invite/invite1");
    cy.contains("Admin Panel").should("not.exist");
    // Purchases Lewandoski for 25.8 million
    cy.contains("Transfer").click();
    cy.contains("Money left: 100M");
    cy.contains("Buy for 25.8 M").click();
    cy.contains("Buying for 25.8 M");
    cy.contains("Money left: 74.2M");
    // Makes sure the next match indicator is right
    cy.contains("WOB in 0 D 2 H");
    // Switches to user 1
    cy.contains("Standings")
      .click()
      .then(() => {
        cy.setCookie("next-auth.session-token", user1);
      })
      .then(() => {
        cy.reload();
      });
    // Gives other user admin rights
    cy.get("#admins").click();
    cy.get("#admins-option-1").click();
    cy.contains("Save Admin Settings").click();
    // Outbides Lewandoski purchase
    cy.contains("Transfer").click();
    cy.contains("Money left: 200M");
    cy.contains("Buy for 25.9 M by outbidding Invite 2").click();
    cy.contains("Buying for 25.9 M");
    cy.contains("Money left: 174.1M");
    cy.contains("Unlimited transfers left");
    cy.contains("Squad").click();
    cy.contains("Move to Field").click();
    cy.contains("Star").click();
    cy.contains("Move to Bench").click();
    // Makes sure the player can be moved back to the bench
    cy.contains("Move to Field").click();
    cy.contains("Star").click();
    cy.contains("Buying");
    // Switches to user 2
    cy.contains("Standings")
      .click()
      .then(() => {
        cy.setCookie("next-auth.session-token", user2);
      })
      .then(() => {
        cy.reload();
      });
    // Changes the amount of times a player can be in a squad and buys lewandowski
    cy.get("#duplicatePlayers").clear().type(2);
    cy.contains("Save Admin Settings").click();
    cy.contains("Transfer").click();
    cy.contains("Unlimited transfers left");
    cy.contains("Money left: 100M");
    cy.contains("Buy for 25.8 M").click();
    cy.contains("Buying for 25.8 M");
    cy.contains("Money left: 74.2M");
    // Buys players until out of money
    cy.contains("Buy for 21 M").click();
    cy.contains("Buy for 20.1 M").click();
    cy.contains("Buy for 19.7 M").click();
    cy.contains("You need 19.3 M");
    cy.contains("Money left: 13.4M");
    // Moves the squad slightly
    cy.intercept("/api/player/87963521baf120631131").as("loadNkunku");
    cy.contains("Squad").click();
    cy.wait("@loadNkunku").then(() =>
      cy
        .contains("Christopher Nkunku")
        .parent()
        .parent()
        .children(".playerButton")
        .children("button")
        .click()
    );
    cy.contains("Buying");
    // Starts the matchday
    cy.exec("export NODE_ENV=test; node cypress/e2e/invite2.mjs").then(() => {
      cy.contains("Transfers").click();
    });
    cy.contains("Transfer Market Closed");
    cy.contains("Transfer Market is Closed");
    // Looks at the squad and moves some players around
    cy.contains("Squad").click();
    cy.get("#formation").click();
    cy.contains("5-4-1").click();
    cy.contains("Robert Lewandowski")
      .parent()
      .parent()
      .children(".playerButton")
      .children("button")
      .click();
    cy.contains("Erling Haaland")
      .parent()
      .parent()
      .children(".playerButton")
      .children("button")
      .contains("Position is Full");
    cy.get("#formation").click();
    cy.contains("4-4-2").click();
    cy.contains("Christopher Nkunku")
      .parent()
      .parent()
      .children(".playerButton")
      .children("button")
      .contains("Move to Bench");
    // Makes sure the starred percantage is correct
    cy.contains("180%");
    // Moves Haaland to the field and stars him
    cy.intercept("/api/player/a4e3b74d3b62fbd6376b").as("loadPlayer");
    cy.contains("Erling Haaland")
      .parent()
      .parent()
      .children(".playerButton")
      .children("button")
      .click();
    // Makes sure that Haaland has loaded
    cy.wait("@loadPlayer").then(() =>
      cy
        .contains("Erling Haaland")
        .parent()
        .parent()
        .children(".playerButton")
        .contains("Star")
        .click()
    );
    cy.contains("Erling Haaland").parent().contains("0 X Star");
    // Sims matchday until all players have played
    cy.exec("export NODE_ENV=test; node cypress/e2e/invite3.mjs");
    // Checks that the user points are correct
    cy.contains("Standings").click();
    cy.get(".MuiTableBody-root > :nth-child(1) > :nth-child(2)").contains("44");
    cy.get(".MuiTableBody-root > :nth-child(2) > :nth-child(2)").contains("22");
    cy.get(".MuiPagination-ul > :nth-child(2)").click();
    cy.get(".MuiTableBody-root > :nth-child(1) > :nth-child(2)").contains("44");
    cy.get(".MuiTableBody-root > :nth-child(2) > :nth-child(2)").contains("22");
    // Moves a player to the bench
    cy.contains("Squad").click();
    cy.contains("Christopher Nkunku")
      .parent()
      .parent()
      .children(".playerButton")
      .children("button")
      .contains("Move to Bench")
      .click();
    cy.contains("Standings").click();
    // Checks if the points got updated
    cy.get(".MuiTableBody-root > :nth-child(1) > :nth-child(2)").contains("34");
    cy.get(".MuiTableBody-root > :nth-child(2) > :nth-child(2)").contains("22");
    cy.get(".MuiPagination-ul > :nth-child(2)").click();
    cy.get(".MuiTableBody-root > :nth-child(1) > :nth-child(2)").contains("34");
    cy.get(".MuiTableBody-root > :nth-child(2) > :nth-child(2)").contains("22");
    // Checks Nkunku button
    cy.contains("Squad").click();
    cy.contains("Christopher Nkunku")
      .parent()
      .parent()
      .children(".playerButton")
      .children("button")
      .contains("Player has Already Played");
    // Starts the transfer period and sells Muller
    cy.exec("export NODE_ENV=test; node cypress/e2e/invite4.mjs");
    cy.contains("Transfer").click();
    cy.contains("Sell for: 21 M").click();
    // Switches user and sets the duplicate players setting to 1
    cy.contains("Money left: 34.4M")
      .then(() => {
        cy.setCookie("next-auth.session-token", user1);
      })
      .then(() => {
        cy.contains("Standings").click();
      });
    cy.get("#duplicatePlayers").clear().type(1);
    cy.contains("Save Admin Settings").click();
    cy.contains("Squad").click();
    // Checks if this user has Lewandowski still and that he is starred
    cy.get('[alt="starred"]');
    cy.contains("Robert Lewandowski")
      .parent()
      .parent()
      .children(".playerButton")
      .children("button")
      .contains("Move to Bench")
      .click();
    // Makes sure that Lewandowski has changed clubs
    cy.contains("VFB");
    // Purchases Mueller and checks if Nkunku is purchasable
    cy.contains("Transfer").click();
    cy.contains("Buy for 21.1 M").click();
    cy.contains("Christopher Nkunku")
      .parent()
      .parent()
      .children(".playerButton")
      .children("button")
      .contains("Player not for Sale");
    cy.contains("Money left: 153M");
    // Checks the standings
    cy.contains("Standings").click();
    cy.get(".MuiTableBody-root > :nth-child(1) > :nth-child(2)").contains("34");
    cy.get(".MuiTableBody-root > :nth-child(2) > :nth-child(2)").contains("22");
    // Goes to historical view and checks if the title is correct
    cy.get(
      ".MuiTableBody-root > :nth-child(1) > :nth-child(3) > .MuiTypography-root > .MuiButtonBase-root"
    ).click();
    cy.contains("Invite 2's Squad from New Sample League");
    cy.contains("Money: 34.5M");
    // Makes sure the team they are playing is correct
    cy.contains("Next").parent().contains("BVB");
    // Looks at the historical data for one of the users
    cy.get(':nth-child(8) > [style="width: 70%;"] > :nth-child(1)').contains(
      "Robert Lewandowski"
    );
    cy.get('[alt="starred"]');
    cy.get(":nth-child(19) > .playerButton > p").contains("Selling for 21.1M");
    cy.get(".MuiPagination-ul > :nth-child(2) > .MuiButtonBase-root").click();
    cy.contains("Invite 2's Squad on Matchday 1 from New Sample League");
    cy.contains("Money: 13.4M");
    cy.contains("Next").should("not.exist");
    cy.get('[alt="starred"]');
    cy.get(':nth-child(8) > [style="width: 70%;"] > :nth-child(1)').contains(
      "Robert Lewandowski"
    );
    cy.get(':nth-child(18) > [style="width: 70%;"] > :nth-child(1)').contains(
      "Robert Lewandowski"
    );
    cy.contains("19.7 M");
    // Simulates an empty matchday
    cy.exec("export NODE_ENV=test; node cypress/e2e/invite5.mjs");
    // Adds a third user that joins late
    cy.get("#logout").click();
    cy.get("#input-username-for-Sign\\ Up-provider").type("Invite 3");
    cy.get("#input-password-for-Sign\\ Up-provider").type("password");
    cy.contains("Sign in with Sign Up").click();
    cy.visit("http://localhost:3000/api/invite/invite1");
    // Makes sure this user actually has points for matchday 2
    cy.get(".MuiPagination-ul > :nth-child(3)").click();
    cy.get(".MuiTableBody-root > :nth-child(3) > :nth-child(2)").contains("0");
    // Checks if the league settings part is shown
    cy.contains("Settings");
    // Has all players leave the league
    cy.contains("Home").click();
    cy.contains("Leave League")
      .click()
      .then(() => {
        cy.setCookie("next-auth.session-token", user2);
      })
      .then(() => {
        cy.reload();
      });
    cy.contains("Leave League")
      .click()
      .then(() => {
        cy.setCookie("next-auth.session-token", user1);
      })
      .then(() => {
        cy.reload();
      });
    cy.contains("Leave League").click();
    cy.get("#logout").click();
    // Checks if the league is actually deleted
    cy.get("#login").click();
    cy.get("#input-username-for-Sign\\ Up-provider").type("Invite 3");
    cy.get("#input-password-for-Sign\\ Up-provider").type("password");
    cy.contains("Sign in with Sign Up").click();
    cy.visit("http://localhost:3000/api/invite/invite1", {
      failOnStatusCode: false,
    });
    cy.get(".center").contains("404");
  });
});
