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
        `CREATE TABLE IF NOT EXISTS test_tools ( \
                     id SERIAL NOT NULL, \
                     name VARCHAR (16) NOT NULL, \
                     info TEXT NOT NULL, \
                     enabled SMALLINT NOT NULL DEFAULT 1, \
                     fecha DATE, \
                     created TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() at time zone 'utc'),
                PRIMARY KEY ( id ), UNIQUE ( name ) )` );
    await oPsql.poolClose();
});

afterAll(async () => {
    let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
    let oPsql = new OPsql( { settings } );
    await oPsql.poolOpen();

    await oPsql.query( "DROP TABLE IF EXISTS test_tools" );

    await oPsql.poolClose();
});

//

describe('tools sanitize', () => {
    test( 'tool obj sanitize char', async () => {
        const oPsql = new OPsql();

        expect( oPsql.sanitize( `chacho`   ) ).toBe( `'chacho'` );
        expect( oPsql.sanitize( `'chacho'` ) ).toBe( `'''chacho'''` );
    } );

    test( 'tool static sanitize char', async () => {
        expect( OPsql.sanitize( `chacho`      ) ).toBe( `'chacho'`        );
        expect( OPsql.sanitize( `'chacho'`    ) ).toBe( `'''chacho\'''`  );
        expect( OPsql.sanitize( `"chacho"`    ) ).toBe( `'"chacho"'`  );
        expect( OPsql.sanitize( `' OR 1 = 1;` ) ).toBe( `''' OR 1 = 1;'` );
    } );

    test( 'tool static sanitize number', async () => {
        expect( OPsql.sanitize(  5  ) ).toBe( `5` );
        expect( OPsql.sanitize( '5' ) ).toBe( `'5'` );
    } );

    test( 'tool static sanitize null', async () => {
        expect( OPsql.sanitize( undefined ) ).toBe( `NULL` );
        expect( OPsql.sanitize( null ) ).toBe( `NULL` );
        expect( OPsql.sanitize( 'NULL' ) ).toBe( `'NULL'` );
    } );

    test( 'tool static sanitize bool', async () => {
        expect( OPsql.sanitize( true ) ).toBe( `1` );
        expect( OPsql.sanitize( false ) ).toBe( `0` );
    } );

    test( 'tool static sanitize array', async () => {
        expect( OPsql.sanitize( [ 1, 2, 3 ] ) ).toBe( `'[1,2,3]'` );
    } );

    test( 'tool static sanitize obj', async () => {
        expect( OPsql.sanitize( { chacho: 'loco', tio: 1 } ) ).toBe( `'{"chacho":"loco","tio":1}'` );
        expect( OPsql.sanitize( { chACho: "' OR 1 = 1;" } ) ).toBe( `'{"chACho":"'' OR 1 = 1;"}'` );
    } );
} );

describe('tools query history', () => {
    test( 'tool getAffectedRows', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result = await oPsql.query(
            `INSERT INTO test_tools ( name, info, enabled, fecha) \
                    VALUES ( 'chacho', 'loco', '1', '2022-05-01' ), \
                           ( 'foo', 'bar', '0', NULL )` );
        await oPsql.poolClose();

        expect( result.status ).toBe( true );
        expect( result.count ).toBe( 2 );
        expect( oPsql.getAffectedRows() ).toBe( 2 );
    } );

    test( 'tool getLastQuery', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result1 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 1` );
        let result2 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 2` );
        await oPsql.poolClose();

        let lastResult = oPsql.getLastQuery();

        expect( Ofn.type( lastResult, true ) ).toBe( 'ResultArray' );
        expect( result2 ).not.toBe( lastResult );
        expect( result2 ).toEqual( lastResult );
    } );

    test( 'tool getLastQuery offset', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result1 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 1` );
        let result2 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 2` );
        await oPsql.poolClose();

        let lastResult = oPsql.getLastQuery( 1 );

        expect( Ofn.type( lastResult, true ) ).toBe( 'ResultArray' );
        expect( result1 ).not.toBe( lastResult );
        expect( result1 ).toEqual( lastResult );
    } );

    test( 'tool getLastQuery raw', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result1 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 1` );
        let result2 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 2` );
        await oPsql.poolClose();

        let lastResult = oPsql.getLastQuery( 0, true );

        expect( Ofn.type( lastResult, true ) ).toBe( 'ResultArray' );
        expect( result2 ).toBe( lastResult );
    } );

    test( 'tool getLastQuery offset bad', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result1 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 1` );
        let result2 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 2` );
        await oPsql.poolClose();

        let lastResult = oPsql.getLastQuery( 2 );

        expect( lastResult ).toBe( undefined );
    } );

    test( 'tool getFirstQuery', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result1 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 1` );
        let result2 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 2` );
        await oPsql.poolClose();

        let lastResult = oPsql.getFirstQuery();

        expect( Ofn.type( lastResult, true ) ).toBe( 'ResultArray' );
        expect( result1 ).not.toBe( lastResult );
        expect( result1 ).toEqual( lastResult );
    } );

    test( 'tool getFirstQuery offset', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result1 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 1` );
        let result2 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 2` );
        await oPsql.poolClose();

        let lastResult = oPsql.getFirstQuery( 1 );

        expect( Ofn.type( lastResult, true ) ).toBe( 'ResultArray' );
        expect( result2 ).not.toBe( lastResult );
        expect( result2 ).toEqual( lastResult );
    } );

    test( 'tool getFirstQuery raw', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result1 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 1` );
        let result2 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 2` );
        await oPsql.poolClose();

        let lastResult = oPsql.getFirstQuery( 0, true );

        expect( Ofn.type( lastResult, true ) ).toBe( 'ResultArray' );
        expect( result1 ).toBe( lastResult );
    } );

    test( 'tool getFirstQuery offset bad', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        await oPsql.poolOpen();
        let result1 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 1` );
        let result2 = await oPsql.query( `SELECT * FROM test_tools WHERE id = 2` );
        await oPsql.poolClose();

        let lastResult = oPsql.getFirstQuery( 2 );

        expect( lastResult ).toBe( undefined );
    } );

    test( 'tool getAllQueries', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        let results = [];

        await oPsql.poolOpen();
        results.unshift( await oPsql.query( `SELECT * FROM test_tools WHERE id = 1` ) );
        results.unshift( await oPsql.query( `SELECT * FROM test_tools WHERE id = 2` ) );
        await oPsql.poolClose();

        let allResults = oPsql.getAllQueries();

        for( let i = 0, len = results.length; i < len; i++ ) {
            expect( results[ i ] ).not.toBe( allResults[ i ] );
            expect( results[ i ] ).toEqual( allResults[ i ] );
        }
    } );

    test( 'tool getAllQueries', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test_oropsql' } );
        const oPsql = new OPsql( { settings } );

        let results = [];

        await oPsql.poolOpen();
        results.unshift( await oPsql.query( `SELECT * FROM test_tools WHERE id = 1` ) );
        results.unshift( await oPsql.query( `SELECT * FROM test_tools WHERE id = 2` ) );
        await oPsql.poolClose();

        let allResults = oPsql.getAllQueries( true );

        for( let i = 0, len = results.length; i < len; i++ ) {
            expect( results[ i ] ).toBe( allResults[ i ] );
        }

    } );
});