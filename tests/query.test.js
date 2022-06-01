const Ofn = require( 'oro-functions' );
const { OPsql } = require( '../index' );

//

const CONFIG = Ofn.getFileJsonRecursivelySync( `${__dirname}/config.json` );

beforeAll(async () => {
    let oPsql = new OPsql( { settings: CONFIG } );
    await oPsql.poolOpen();
    await oPsql.query( "CREATE DATABASE test_oropsql" );
    await oPsql.poolClose();

    let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
    oPsql = new OPsql( { settings } );
    await oPsql.poolOpen();

    await oPsql.query(
        `CREATE TABLE IF NOT EXISTS test_easy ( \
                    id SERIAL, \
                    name VARCHAR (16) NOT NULL, \
                PRIMARY KEY ( id ), UNIQUE ( name ) )` );
    await oPsql.query(
        `CREATE TABLE IF NOT EXISTS test_complex ( \
                    name VARCHAR (16) NOT NULL, \
                    code SERIAL NOT NULL, \
                PRIMARY KEY ( code, name ) )` );
    await oPsql.poolClose();
});

afterAll(async () => {
    let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
    let oPsql = new OPsql( { settings } );
    await oPsql.poolOpen();

    await oPsql.query( "DROP TABLE IF EXISTS test_easy" );
    await oPsql.query( "DROP TABLE IF EXISTS test_complex" );

    await oPsql.poolClose();
});

//

describe('query when pool not opened', () => {
    test( 'query before poolOpen', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        let result = await oPsql.query( `INSERT INTO test_easy ( name ) VALUES ( 'chacho' )` );

        expect( result.status ).toBe( false );
        expect( result.error.msg ).toBe( 'Server is down' );
    } );

    test( 'query after poolClose', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        await oPsql.poolClose();

        let result = await oPsql.query( `INSERT INTO test_easy ( name ) VALUES ( 'chacho' )` );

        expect( result.status ).toBe( false );
        expect( result.error.msg ).toBe( 'Server is down' );
    } );
});

describe('query INSERT', () => {
    test( 'query INSERT bad', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `INSERT INTO test_easy ( namee ) VALUES ( 'chacho' )` );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result.status ).toBe( false );
        expect( result.error.msg ).toBe( `error: column "namee" of relation "test_easy" does not exist` );
        expect( lastQuery.status ).toBe( false );
        expect( lastQuery.error.msg ).toBe( `error: column "namee" of relation "test_easy" does not exist` );
    } );

    test( 'query INSERT ok bool', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `INSERT INTO test_easy ( name ) VALUES ( 'chacho' )`, 'bool' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toBe( true );
        expect( lastQuery.constructor.name ).toBe( 'ResultArray' );
        expect( lastQuery.count ).toBe( 1 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query INSERT ok get id', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `INSERT INTO test_easy ( name ) VALUES ( 'loco' ) RETURNING id`, 'value' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toBe( 2 );
        expect( lastQuery.count ).toBe( 1 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query INSERT ko unique', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `INSERT INTO test_easy ( name ) VALUES ( 'chacho' ) RETURNING id`, false );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toBe( false );
        expect( lastQuery.status ).toBe( false );
        expect( lastQuery.error.msg ).toBe( `error: duplicate key value violates unique constraint "test_easy_name_key"` );
    } );

    test( 'query INSERT ok get bool', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `INSERT INTO test_easy ( name ) VALUES ( 'tio' )`, 'bool' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toBe( true );
        expect( lastQuery.count ).toBe( 1 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query INSERT complex ok get id', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `INSERT INTO test_complex ( name ) VALUES ( 'chacho' ), ( 'loco' ) RETURNING code`, 'values' );
        let arr = await oPsql.query( `SELECT * FROM test_complex`, 'array' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery( 1 );

        expect( result ).toEqual( [ 1, 2 ] );
        expect( arr ).toEqual( [ { name: 'chacho', code: 1 }, { name: 'loco', code: 2 } ] );
        expect( lastQuery.count ).toBe( 2 );
        expect( lastQuery.status ).toBe( true );
    } );
});

describe('query UPDATE', () => {
    test( 'query UPDATE ok', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `UPDATE test_easy SET name = 'foo' WHERE id = 2` );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result.constructor.name ).toBe( 'ResultArray' );
        expect( lastQuery.count ).toBe( 1 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query UPDATE ok get bool', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `UPDATE test_easy SET name = 'bar' WHERE name = 'fooo'`, 'bool' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toBe( false );
        expect( lastQuery.count ).toBe( 0 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query UPDATE ok get bool', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `UPDATE test_easy SET name = 'bar' WHERE name = 'foo'`, 'bool' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toBe( true );
        expect( lastQuery.count ).toBe( 1 );
        expect( lastQuery.status ).toBe( true );
    } );
});

describe('query SELECT', () => {
    test( 'query SELECT bad', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROMM test_easy` );
        await oPsql.poolClose();

        expect( result.constructor.name ).toBe( 'ResultArray' );
        expect( result.status ).toBe( false );
        expect( result.error.msg ).toMatch( /(error: syntax error at or near )/ );
    } );

    test( 'query SELECT ok', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy` );
        await oPsql.poolClose();

        expect( result.constructor.name ).toBe( 'ResultArray' );
        expect( result.status ).toBe( true );
        expect( result.count ).toBe( 3 );
    } );

    test( 'query SELECT ok get bool', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT '' FROM test_easy`, 'bool' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toBe( true );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get bad format', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy`, 'chacho' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toBe( false );
        expect( lastQuery.status ).toBe( false );
        expect( lastQuery.error.msg ).toBe( 'OPsql.query:format is not allowed: chacho' );
    } );

    test( 'query SELECT ok get count', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT '' FROM test_easy`, 'count' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toBe( 3 );
        expect( lastQuery.count ).toBe( 3 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get value default', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy WHERE name = 'chacho'`, 'value' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toBe( 1 );
        expect( lastQuery.count ).toBe( 1 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get value', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT name FROM test_easy WHERE id = 1`, 'value' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toBe( 'chacho' );
        expect( lastQuery.count ).toBe( 1 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get value column', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy WHERE id = 1`, 'value', 'name' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toBe( 'chacho' );
        expect( lastQuery.count ).toBe( 1 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get value bad column', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy WHERE id = 1`, 'value', 'chacho' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toBe( undefined );
        expect( lastQuery.count ).toBe( 1 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get values default', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy ORDER BY id ASC`, 'values' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( [ 1, 2, 4 ] );
        expect( lastQuery.count ).toBe( 3 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get values column', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy ORDER BY id ASC`, 'values', 'name' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( [ 'chacho', 'bar', 'tio' ] );
        expect( lastQuery.count ).toBe( 3 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get values bad column', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy ORDER BY id ASC`, 'values', 'chacho' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( [ undefined, undefined, undefined ] );
        expect( lastQuery.count ).toBe( 3 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get valuesById default', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy`, 'valuesById', 'name' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( { '1': 'chacho', '2': 'bar', '4': 'tio' } );
        expect( lastQuery.count ).toBe( 3 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get valuesById column key', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy`, 'valuesById', 'id', 'name' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( { 'chacho': 1, 'bar': 2, 'tio': 4 } );
        expect( lastQuery.count ).toBe( 3 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get valuesById bad column key', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy`, 'valuesById', 'chacho', 'name' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( { 'chacho': undefined, 'bar': undefined, 'tio': undefined } );
        expect( lastQuery.count ).toBe( 3 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get valuesById column bad key', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy`, 'valuesById', 'id', 'chacho' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( {} );
        expect( lastQuery.count ).toBe( 3 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get array', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy ORDER BY id ASC`, 'array' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( [ { id: 1, name: 'chacho' }, { id: 2, name: 'bar' }, { id: 4, name: 'tio' } ] );
        expect( lastQuery.count ).toBe( 3 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get arrayById default', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy ORDER BY id ASC`, 'arrayById' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( { '1': { id: 1, name: 'chacho' }, '2': { id: 2, name: 'bar' }, '4': { id: 4, name: 'tio' } } );
        expect( lastQuery.count ).toBe( 3 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get arrayById column', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy ORDER BY id ASC`, 'arrayById', 'name' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( { 'chacho': { id: 1, name: 'chacho' }, 'bar': { id: 2, name: 'bar' }, 'tio': { id: 4, name: 'tio' } } );
        expect( lastQuery.count ).toBe( 3 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get arrayById bad column', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy ORDER BY id ASC`, 'arrayById', 'chacho' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( {} );
        expect( lastQuery.count ).toBe( 3 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get row', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy ORDER BY id ASC`, 'row' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( { id: 1, name: 'chacho' } );
        expect( lastQuery.count ).toBe( 3 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get row 2', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy ORDER BY id ASC`, 'row', 2 );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( { id: 4, name: 'tio' } );
        expect( lastQuery.count ).toBe( 3 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get bad row 999', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT * FROM test_easy ORDER BY id ASC`, 'row', 999 );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( {} );
        expect( lastQuery.count ).toBe( 3 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get rowStrict', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        await oPsql.query( `INSERT INTO test_easy ( id, name ) VALUES ( 5, '' )` );
        let result1 = await oPsql.query( `SELECT * FROM test_easy WHERE id = 5`, 'row' );
        let result2 = await oPsql.query( `SELECT * FROM test_easy WHERE id = 5`, 'rowStrict' );

        //fix id-serial sequence for the next use
        await oPsql.query( `SELECT setval( 'test_easy_id_seq', (SELECT max(id) FROM test_easy))` );

        await oPsql.poolClose();

        expect( result1 ).toEqual( { id: 5, name: '' } );
        expect( result2 ).toEqual( { id: 5 } );
    } );
});

describe('query SELECT with fnSanitize', () => {
    test( 'query SELECT ok bad fnSanitize', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query( `SELECT '' FROM test_easy`, 'bool', 0, 0, 'chacho' );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( false );
        expect( lastQuery.status ).toBe( false );
        expect( lastQuery.error.msg ).toBe( 'OPsql.query:fnSanitize must be a function, not a string.' );
    } );

    test( 'query INSERT ok get id', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query(
            `INSERT INTO test_easy ( name ) VALUES ( 'foo' ) RETURNING id`, 'value', 0, 0,
            value => ({ rowId: value })
        );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();
        expect( result ).toEqual( { rowId: 6 } );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get bool', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query(
            `SELECT '' FROM test_easy`, 'bool', 0, 0,
            value => ({ isDone: value })
        );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( { isDone: true } );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get count', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query(
            `SELECT '' FROM test_easy`, 'count', 0, 0,
            value => ({ total: value })
        );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( { total: 5 } );
        expect( lastQuery.count ).toBe( 5 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get value', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query(
            `SELECT * FROM test_easy WHERE name = 'chacho'`, 'value', 'name', 0,
            value => ({ value })
        );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( { value: 'chacho' } );
        expect( lastQuery.count ).toBe( 1 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get values', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query(
            `SELECT * FROM test_easy ORDER BY id ASC`, 'values', 'name', 0,
            value => ! value ? null : `name: ${value}`
        );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( [ 'name: chacho', 'name: bar', 'name: tio', null, 'name: foo' ] );
        expect( lastQuery.count ).toBe( 5 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get valuesById column key', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query(
            `SELECT * FROM test_easy`, 'valuesById', 'id', 'name',
            value => ({ id: value })
        );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( { 'chacho': { id: 1 }, 'bar': { id: 2 }, 'tio': { id: 4 }, '': { id: 5 }, 'foo': { id: 6 } } );
        expect( lastQuery.count ).toBe( 5 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get array', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query(
            `SELECT * FROM test_easy ORDER BY id ASC`, 'array', 0, 0,
            value => ! value ? 'default' : value
        );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( [
            { id: 1, name: 'chacho' },
            { id: 2, name: 'bar' },
            { id: 4, name: 'tio' },
            { id: 5, name: 'default' },
            { id: 6, name: 'foo' },
        ] );
        expect( lastQuery.count ).toBe( 5 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get arrayById column', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query(
            `SELECT * FROM test_easy ORDER BY id ASC`, 'arrayById', 'name', 0,
            value => ! value ? 'default' : value
        );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( {
            'chacho': { id: 1, name: 'chacho'  },
            'bar'   : { id: 2, name: 'bar'     },
            'tio'   : { id: 4, name: 'tio'     },
            ''      : { id: 5, name: 'default' },
            'foo'   : { id: 6, name: 'foo'     }
        } );
        expect( lastQuery.count ).toBe( 5 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get row', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query(
            `SELECT * FROM test_easy ORDER BY id ASC`, 'row', 0, 0,
            value => value +''
        );
        await oPsql.poolClose();

        let lastQuery = oPsql.getLastQuery();

        expect( result ).toEqual( { id: '1', name: 'chacho' } );
        expect( lastQuery.count ).toBe( 5 );
        expect( lastQuery.status ).toBe( true );
    } );

    test( 'query SELECT ok get rowStrict', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result2 = await oPsql.query(
            `SELECT * FROM test_easy WHERE id = 5`, 'rowStrict', 0, 0,
            value => value +''
        );
        await oPsql.poolClose();

        expect( result2 ).toEqual( { id: '5' } );
    } );
});