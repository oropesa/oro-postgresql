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
        `CREATE TABLE IF NOT EXISTS test_once ( \
                     id SERIAL NOT NULL, \
                     name CHARACTER VARYING( 18 ) NOT NULL DEFAULT '', \
                PRIMARY KEY ( id ), UNIQUE ( name ) )` );
    await oPsql.query( `INSERT INTO test_once ( name ) VALUES ( 'chacho' )` );

    await oPsql.poolClose();
});

afterAll(async () => {
    let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
    let oPsql = new OPsql( { settings } );
    await oPsql.poolOpen();

    await oPsql.query( "DROP TABLE IF EXISTS test_once" );

    await oPsql.poolClose();
});

describe('queryOnce SELECT', () => {
    test( 'queryOnce SELECT bad settings', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsqll' } );
        const oPsql = new OPsql( { settings } );

        let response = await oPsql.queryOnce( `SELECT * FROM test_once`, 'row' );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toBe( `error: database "test_oropsqll" does not exist` );
    } );

    test( 'queryOnce SELECT bad query', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        let response = await oPsql.queryOnce( `SELECT * FROMM test_once`, 'row' );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toMatch( /(error: syntax error at or near )/ );
    } );

    test( 'queryOnce SELECT query ok', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        let response = await oPsql.queryOnce( `SELECT * FROM test_once`, 'row' );

        expect( response.status ).toBe( true );
        expect( response.result ).toEqual( { id: 1, name: 'chacho' } );
    } );
});