import crypto from "node:crypto";

const provisioningLeaseMs = 60 * 1000;

export const acquireDiscordProvisioningLease = async ({ model, resourceId, guard = {} }) => {
  const token = crypto.randomBytes(24).toString("hex");
  const resource = await model.findOneAndUpdate(
    {
      _id: resourceId,
      ...guard,
      $or: [
        { "discord.provisioningToken": { $exists: false } },
        { "discord.provisioningToken": null },
        { "discord.provisioningStartedAt": { $lt: new Date(Date.now() - provisioningLeaseMs) } }
      ]
    },
    {
      $set: {
        "discord.provisioningToken": token,
        "discord.provisioningStartedAt": new Date()
      }
    },
    { new: true }
  );

  return resource ? { resource, token } : null;
};

export const persistDiscordProvision = async ({ model, resourceId, guard = {}, token, discord }) => {
  const setValues = Object.fromEntries(
    Object.entries({
      "discord.channelId": discord?.channelId,
      "discord.channelName": discord?.channelName,
      "discord.inviteUrl": discord?.inviteUrl,
      "discord.createdAt": discord?.createdAt,
      "discord.expiresAt": discord?.expiresAt
    }).filter(([, value]) => value !== undefined)
  );

  return model.findOneAndUpdate(
    { _id: resourceId, ...guard, "discord.provisioningToken": token },
    {
      $set: setValues,
      $unset: {
        "discord.provisioningToken": "",
        "discord.provisioningStartedAt": ""
      }
    },
    { new: true, runValidators: true }
  );
};

export const releaseDiscordProvisioningLease = async ({ model, resourceId, token }) => {
  if (!token) return;
  await model.updateOne(
    { _id: resourceId, "discord.provisioningToken": token },
    {
      $unset: {
        "discord.provisioningToken": "",
        "discord.provisioningStartedAt": ""
      }
    }
  );
};
