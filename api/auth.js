const Parse = require("parse/node");

// Initialisation de Back4App
Parse.initialize("myAppId", "masterKey");
Parse.serverURL = "http://localhost:1337/parse";

// Fonction pour créer un utilisateur
async function createUser(username, email, password) {
  const user = new Parse.User();
  user.set("username", username);
  user.set("email", email);
  user.set("password", password);

  try {
    await user.signUp();
    return user;
  } catch (error) {
    throw error;
  }
}

// Fonction pour lier une instance à un utilisateur
async function linkInstanceToUser(userId, instanceId) {
  const SandboxInstance = Parse.Object.extend("SandboxInstance");
  const instance = new SandboxInstance();

  instance.set("userId", userId);
  instance.set("instanceId", instanceId);
  instance.set("createdAt", new Date());
  instance.set("status", "active");

  try {
    await instance.save();
    return instance;
  } catch (error) {
    throw error;
  }
}

// Fonction pour obtenir les instances d'un utilisateur
async function getUserInstances(userId) {
  const SandboxInstance = Parse.Object.extend("SandboxInstance");
  const query = new Parse.Query(SandboxInstance);
  query.equalTo("userId", userId);

  try {
    const results = await query.find();
    return results;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createUser,
  linkInstanceToUser,
  getUserInstances,
};
