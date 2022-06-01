# Oro Postgres

Class OroPostgres is a wrapper of npm-postgres to use it async/await.

[npm-postgres](https://www.npmjs.com/package/pg) is a psql API Wrapper for node.js.

```shell
npm install oro-postgresql
```

Example:

```js
const { OPsql } = require( 'oro-postgresql' );

const settings = {
    host: 'localhost',
    port: '5432',
    database: 'custom-database',
    user: 'custom-user',
    password: 'custom-password',
}

const server = new OPsql( { settings } );

const poolOpen = await server.poolOpen();
if( ! poolOpen.status ) { return poolOpen; }

const result = server.query( "SELECT * FROM table" );

const poolClose = await server.poolClose();
if( ! poolClose.status ) { return poolClose; }

console.log( result ); // resultArray

```

## Methods

* [new OPsql()](#new-opsql--settings--)
* [await .poolOpen()](#await-poolopen)
* [await .poolClose()](#await-poolclose)
* [.getClient()](#getclient)
* [.getDB()](#getdb)
* [.getInfo()](#getinfo)
* [.getStatus()](#getstatus)
* [.getAllQueries( raw = false )](#getallqueries-raw--false-)
* [.getLastQuery( offset = 0, raw = false )](#getlastquery-offset--0-raw--false-)
* [.getFirstQuery( offset = 0, raw = false )](#getfirstquery-offset--0-raw--false-)
* [.getAffectedRows()](#getaffectedrows)
* [.sanitize( value )](#sanitize-value-)
* [await .queryOnce( query, format = 'default', valueKey = 0, valueId = 0, fnSanitize = '' )](#await-queryonce-query-format--default-valuekey--0-valueid--0-fnsanitize---)
* [await .query( query, format = 'default', valueKey = 0, valueId = 0, fnSanitize = '' )](#await-query-query-format--default-valuekey--0-valueid--0-fnsanitize---)
    * [Parameters](#await-query-parameters)
    * [Formats](#await-query-formats)

### new OPsql( { settings } )

```js
const { OPsql } = require( 'oro-postgres' );

const settings = {
    host: 'localhost',
    database: '',
    user: 'root',
    password: ''
}

const server = new OPsql( { settings } );

```

### await .poolOpen()

When it opens pool, the connection to database is created to execute queries.

```js
const poolOpen = await server.poolOpen();
console.log( poolOpen ); // { status: true|false }
```

### await .poolClose()

To close the opened pool.

```js
const poolOpen = await server.poolOpen();
console.log( poolOpen ); // { status: true|false }
```

### .getClient()

If you want to use the library `pg`, you can get the class.

```js
const psql = server.getClient();
```

### .getDB()

When pool is open, you can get the npm-psql conn object.

```js
const db = server.getDB();
```

### .getInfo()

Get settings info (without the password).

```js
const info = server.getInfo();
```

### .getStatus()

Get the status object. If status is false, show the error message.

`status` is only `true` when pool is opened and it's enabled to call a query.

```js
const statusObj = server.getStatus();
console.log( statusObj ); // { status: true|false }
```

Another way to simplify getting the status is directly with using the property `server.status`.

```js
console.log( server.status ); // true|false
```

```js
const statusObj = server.getStatus();
console.log( statusObj ); // { status: true/false }
```

### .getAllQueries( raw = false )

Get all `resultArray` of the queries are saved in a heap.

<small>__Note__: By default, you get a _deep copy_ of each `resultArray` to avoid modify data,
but if you need a better performance and you understand what are you doing, you can get the `resultArray` as _shallow copy_.</small>

```js
const allResults = server.getAllQueries();
console.log( allResults ); // [ resultArray, ... ]
```

### .getLastQuery( offset = 0, raw = false )

Get the last `resultArray` of the queries, with the param `offset` you can get the preceding queries.

<small>__Note__: By default, you get a _deep copy_ of the `resultArray` to avoid modify data,
but if you need a better performance and you understand what are you doing, you can get the `resultArray` as _shallow copy_.</small>

```js
const lastResult = server.getLastQuery();
console.log( lastResult ); // resultArray
```

### .getFirstQuery( offset = 0, raw = false )

Get the first `resultArray` of the queries, with the param `offset` you can get the following queries.

<small>__Note__: By default, you get a _deep copy_ of each `resultArray` to avoid modify data,
but if you need a better performance and you understand what are you doing, you can get the `resultArray` as _shallow copy_.</small>

```js
const firstResult = server.getFirstQuery();
console.log( firstResult ); // resultArray
```

### .getAffectedRows()

Get the total number of rows that are affected in the last query.

```js
const count = server.getAffectedRows();
console.log( count ); // integer
```

### .sanitize( value )

Sanitize the value to avoid _code injections_.

```js
const valNumber = server.sanitize( 20 );
console.log( valNumber ); // `20`

const valString = server.sanitize( "chacho" );
console.log( valString ); // `'chacho'`

const valInjection = server.sanitize( "' OR 1 = 1" );
console.log( valInjection ); // `'\' OR 1 = 1'`
```

__Note:__ It could be called as _static_ too.

### await .queryOnce( query, format = 'default', valueKey = 0, valueId = 0, fnSanitize = null )

If you just need to call only _one query_, this function calls `poolOpen, query, poolClose` respectively.

### await .query( query, format = 'default', valueKey = 0, valueId = 0, fnSanitize = null )

You can choose the format that return the query.

By default the returned object is `resultArray`. This object extends from `Array` and it has extra params.

```js
{
    status = true || false,
    count = 0, // affected row
    statement = 'QUERY';
    columns = []; // table columns data
    error?: { msg: 'error reason', ... } // only when status is false
}
```
#### (await .query) Parameters
1. *query*: String `"SELECT * FROM table"`.
2. *format*: String, Allowed values: `default`,`bool`,`count`,`value`,`values`,`valuesById`,`array`,`arrayById`,`rowStrict`,`row`.
3. *valueKey*: String|Number, name or position of the column to get the value.
4. *valueId*: String|Number, name or position of the column to use as param.
5. *fnSanitize*: Null|Function, function to map each value.
   <br><small>Note: If _format_ is `row|array`, it maps each column-value, not the whole object.</small>

#### (await .query) Formats

* `default`, return object resultArray.
```js
const resultArray = server.query( "SELECT * FROM table" );
// [ 
//   0: { ... }, 
//   1: { ... }
//   status: true, 
//   count: 2, 
//   statement: "SELECT * FROM table", 
//   columns: [ ... ] 
// ]
```
* `bool`, if the query has _affected rows_ it returned `true`.
```js
const result = server.query( "UPDATE table SET value WHERE condition", 'bool' );
// true
```
* `count`, return number of affected rows.
```js
const count = server.query( "SELECT * FROM table", 'count' );
// 2
```
* `value`, return the first column value.
```js
const value = server.query( "SELECT column FROM table", 'value' );
// column-value

const value2 = server.query( "SELECT * FROM table", 'value', 'column2' );
// column2-value
```
* `values`, return `array` of column values.
```js
const values = server.query( "SELECT column FROM table", 'values' );
// [ column-value, ... ]

const values = server.query( "SELECT * FROM table", 'values', 'column2' );
// [ column2-value, ... ]
```
* `valuesById`, return `object` of values with _key_ as second column-value.
```js
const valuesById = server.query( "SELECT * FROM table", 'valuesById', 'column', 'column2' );
// { "column2-value": column-value, ... }
```
* `array`, return `array` of _object-row_.
```js
const arr = server.query( "SELECT * FROM table", 'array' );
// [ row, ... ]
```
* `arrayById`, return `object` of _object-row_ with _key_ as column-value.
```js
const arr = server.query( "SELECT * FROM table", 'arrayById', 'column' );
// { "column-value": { row }, ... }
```
* `row`, return `object` _row_.
```js
const arr = server.query( "SELECT * FROM table", 'row' );
// { row }
```
* `rowStrict`, return `object` _row_ without columns with falsy values.
```js
const arr = server.query( "SELECT * FROM table", 'rowStrict' );
// { row }
```


## Testing

If you want to run `npm run test`, you can create your own `./test/config.json`
(you can copypaste it from `./test/config-default.json`).

```json
{
  "host": "localhost",
  "port": "5432",
  "database": null,
  "user": "postgres",
  "password": ""
}
```

__ADVISE:__ When run the testing, it's created and removed the _database_ `test_oropsql`,
so if `config.user` has not permission to create database, you should create the _database_ `test_oropsql` manually.

On the other hand, if in your _psql_ already exist `test_oropsql` and it's required for you, avoid to `run test`.

__NOTE:__ If testing is not working because of I18n issue, change `lc_messages` 
to english `English_United States.1252` in `$psqlDir\postgresql.conf`. 
[StackOverflow](https://stackoverflow.com/questions/34640196/setting-error-messages-to-english-not-working).