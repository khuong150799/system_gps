const { eventFeature } = require("notify-services");

// Message Event
process.on(
  "message",
  async ({ data: { dataUsers, keyword, replaces, sv } }) => {
    // console.log("CHILD got message:", dataUsers, keyword, replaces, sv);
    for (let i = 0; i < dataUsers.length; i++) {
      try {
        const { user_id } = dataUsers[i];
        await eventFeature.sendNotification(
          {
            user_id: [user_id],
            keyword,
            replaces,
          },
          sv
        );
      } catch (error) {
        console.log(error);
      }
    }
    console.log("res ok");
    process.exit(0);
  }
);
