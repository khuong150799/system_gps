const { eventFeature } = require("notify-services");

// Message Event
process.on(
  "message",
  async ({ data: { dataUsers, keyword, vehicleName, sv } }) => {
    console.log("CHILD got message:", dataUsers, vehicleName, sv);
    for (let i = 0; i < dataUsers.length; i++) {
      try {
        const { user_id } = dataUsers[i];
        await eventFeature.sendNotification(
          {
            user_id: [user_id],
            keyword,
            replaces: {
              vehicle_name: vehicleName,
            },
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
