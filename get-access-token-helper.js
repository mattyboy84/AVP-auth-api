const AWS = require('aws-sdk');

const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
  apiVersion: '2016-04-18'
});

async function login(event) {
  const { AuthenticationResult: { AccessToken }} = await cognitoidentityserviceprovider.initiateAuth({
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: {
        USERNAME: event.Username,
        PASSWORD: event.Password
    },
    ClientId: event.UserPoolAppClientId  
  }).promise();
  console.log(AccessToken);
}

(async () => {
  await login({
   Username: 'a@b.com',
   Password: 'password',
   UserPoolAppClientId: 'xyz'
  });
})();

module.exports = {
  login,
};