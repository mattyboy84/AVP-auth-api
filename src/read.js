
async function handler(event) {
  console.log(JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    headers: { },
    body: "read",
  };
}

module.exports = {
  handler
};
