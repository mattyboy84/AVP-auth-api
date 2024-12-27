const { VerifiedPermissions } = require("@aws-sdk/client-verifiedpermissions")
const client = new VerifiedPermissions();

const { policyStoreId, namespace } = require('./config');

const resourceType = `${namespace}::Application`;
const resourceId = namespace;
const actionType = `${namespace}::Action`;

async function handler(event) {
  console.log(JSON.stringify(event, null, 2));

  let bearerToken = event.headers?.Authorization;
  if (bearerToken?.toLowerCase().startsWith('bearer ')) {
    bearerToken = bearerToken.split(' ')[1];
  }

  const parsedToken = JSON.parse(Buffer.from(bearerToken.split('.')[1], 'base64').toString());
  const actionId = `${event.requestContext.httpMethod.toLowerCase()} ${event.requestContext.resourcePath}`;

  const input = {
    accessToken: bearerToken,
    policyStoreId: policyStoreId,
    action: {
      actionType: actionType,
      actionId: actionId,
    },
    resource: {
      entityType: resourceType,
      entityId: resourceId
    },
    context: getContextMap(event),
  };
  console.log(JSON.stringify(input, null, 2));

  const authResponse = await client.isAuthorizedWithToken(input);

  if (authResponse.principal) {
    const principalEidObj = authResponse.principal;
    principalId = `${principalEidObj.entityType}::"${principalEidObj.entityId}"`;
  }

  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: authResponse.decision.toUpperCase() === 'ALLOW' ? 'Allow' : 'Deny',
          Resource: event.methodArn
        },
      ],
    },
    context: {
      actionId,
    }
  }
};

function getContextMap(event) {
  const hasPathParameters = Object.keys(event.pathParameters).length > 0;
  const hasQueryString = Object.keys(event.queryStringParameters).length > 0;
  if (!hasPathParameters && !hasQueryString) {
    return undefined;
  }
  const pathParametersObj = !hasPathParameters ? {} : {
    pathParameters: {
      // transform regular map into smithy format
      record: Object.keys(event.pathParameters).reduce((acc, pathParamKey) => {
        return {
          ...acc,
          [pathParamKey]: {
            string: event.pathParameters[pathParamKey]
          }
        }
      }, {}),
    }
  };
  const queryStringObj = !hasQueryString ? {} : {
    queryStringParameters: {
      // transform regular map into smithy format
      record: Object.keys(event.queryStringParameters).reduce((acc, queryParamKey) => {
        return {
          ...acc,
          [queryParamKey]: {
            string: event.queryStringParameters[queryParamKey]
          }
        }
      }, {}),
    }
  };

  const contextMap = {
    ...queryStringObj,
    ...pathParametersObj,
  };

  return {
    contextMap,
  };
};

module.exports = {
  handler,
};