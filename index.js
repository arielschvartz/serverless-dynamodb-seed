'use strict';

const BbPromise = require('bluebird');
const fs = require('fs');
const path = require('path');

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.seedName = options.seed;

    this.commands = {
      'dynamodb:seed': {
        usage: 'Seed target dynamodb with file loads using configuration from serverless.yml',
        lifecycleEvents: [
          'start'
        ],
        options: {
          seed: {
            required: false,
            usage: 'The name of the seed to be used',
          },
        }
      },
    };

    this.hooks = {
      // this is where we declare the hook we want our code to run
      'before:dynamodb:seed:start': () => BbPromise.bind(this).then(this.dynamodbSeed),
    }

    // bindings
    this.log = this.log.bind(this)
  }

  log(msg) {
    this.serverless.cli.log(msg)
  }

  get provider() {
    return this.serverless.getProvider("aws");
  }

  get region() {
    return this.provider.getRegion();
  }

  get credentials() {
    return {
      ...this.provider.getCredentials(),
      region: this.region,
    };
  }

  get dynamodb() {
    if (!this._dynamodb) {
      this._dynamodb = new this.provider.sdk.DynamoDB(this.credentials);
    }

    return this._dynamodb;
  }

  get dynamoDocumentClient() {
    if (!this._dynamoDocumentClient) {
      this._dynamoDocumentClient = new this.provider.sdk.DynamoDB.DocumentClient({
        service: this.dynamodb,
      });
    }

    return this._dynamoDocumentClient;
  }

  get seedOptions() {
    return this.serverless.service.custom.seed;
  }

  async dynamodbSeed() {
    this.log('Starting seed...');

    let totalRecords;

    for (const [seedName, { table, sources }] of Object.entries(this.seedOptions)) {
      let records = [];
      if (!this.seedName || this.seedName === seedName) {
        for (const seedFile of sources) {
          const filePath = path.join(this.serverless.config.servicePath, `${seedFile}`)
          records = records.concat(JSON.parse(fs.readFileSync(filePath, 'utf8')))
        }
      }

      totalRecords = records.length;

      let recordGroup = records.splice(0, 25);
      while (recordGroup.length > 0) {
        await this.dynamoDocumentClient.batchWrite({
          RequestItems: {
            [table]: recordGroup.map(record => {
              return {
                PutRequest: {
                  Item: record,
                },
              };
            })
          },
        }).promise();

        recordGroup = records.splice(0, 25);
      }
    }

    this.log(`Finished seed. Seeded ${totalRecords} records.`);
  }
}

module.exports = ServerlessPlugin;
