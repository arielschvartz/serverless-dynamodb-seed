# serverless-dynamodb-seed

This is a simple plugin for [Serverless Framework](https://serverless.com/) to perform seeds on dynamodb databases based on serverless.yml.

## Install

```bash
$ npm install serverless-dynamodb-seed --save-dev
```

Add the plugin to your `serverless.yml` file:

```yaml
plugins:
  - serverless-dynamodb-seed
```

## Configure

The configuration of the plugin is done by defining a `custom: webpack` object in your `serverless.yml` with your specific configuration. You must set at least one seed for this plugin to work correctly.

You can set multiple named seed for running just one if needed.

```yaml
custom:
  mySeedName:
    table: myDynamodbTable # Name of the DynamoDB Table - In this version, Cloudformation references are not accepted.
    sources:
      - path/to/my/seed.json
```

Each named seed can have only one table, but may have multiple source files. This plugin will read all the files, concat them and save them do AWS.

Each source file must be a JSON array.

```json
[
  {
    "id": 1,
    "name": "myRecordName"
  },
  {
    "id": 2,
    "name": "myOtherRecord"
  }
]
```

## Usage

If you have multiple named seeds:

```yaml
custom:
  seedExample:
    table: myDynamodbTable
    sources:
      - path/to/my/seed.json
  otherSeed:
    table: myOtherDynamodbTable
    sources:
      - path/to/my/otherSeed.json
```

This command will run all the available seeds.

```bash
$ sls dynamodb:seed
```

If you want to run just one seed:

```bash
$ sls dynamodb:seed --seed otherSeed
```

## Warning

WATCH OUT! THIS PLUGIN MAY OVERWRITE DATA ON YOUR DYNAMO DB TABLE!