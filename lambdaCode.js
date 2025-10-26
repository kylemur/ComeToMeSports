const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const zip = event.queryStringParameters?.zip;

  if (!zip) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing ZIP code' })
    };
  }

  const params = {
    TableName: 'SportsEvents',
    KeyConditionExpression: 'zip = :z',
    ExpressionAttributeValues: { ':z': zip }
  };

  try {
    const data = await dynamo.query(params).promise();
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data.Items)
    };
  } catch (err) {
    console.error('DynamoDB error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};