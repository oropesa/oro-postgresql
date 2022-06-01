const Ofn = require( 'oro-functions' );
const { OPsql } = require( '../index' );

//

const CONFIG_BAD = { host: 'chacho', database: 'chacho', user: 'chacho', password: 'loco' };
const CONFIG_BAD2 = { database: 'chacho', user: 'chacho', password: 'loco' };
const CONFIG = Ofn.getFileJsonRecursivelySync( `${__dirname}/config.json` );

//

describe('get OPsql defaults', () => {
    test( 'get client is ps', async () => {
        const oPsql = new OPsql( { settings: CONFIG } );

        let client = oPsql.getClient();
        expect( Ofn.isObject( client ) ).toBe( true );
        expect( client.constructor.name ).toBe( 'BoundPool' );
    } );

    test( 'get db con', async () => {
        const oPsql = new OPsql( { settings: CONFIG } );

        const poolOpen = await oPsql.poolOpen();
        const db = oPsql.getDB();
        await oPsql.poolClose();

        expect( poolOpen.status ).toBe( true );
        expect( db.constructor.name ).toBe( 'Client' );
    } );

    test( 'get default settings', async () => {
        const oPsql = new OPsql();

        expect( oPsql.getInfo() ).toEqual( {
            host: 'localhost',
            port: '5432',
            database: null,
            user: 'postgres',
            password: '',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        } );
    } );

    test( 'get info', async () => {
        let settings = Object.assign( {}, CONFIG, { database: 'test', password: 'chacho' } );
        const oPsql = new OPsql( { settings } );

        expect( oPsql.getInfo() ).toEqual( {
            host: 'localhost',
            port: '5432',
            database: 'test',
            user: 'postgres',
            password: '******',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        } );
    } );

    test( 'get default status', async () => {
        const oPsql = new OPsql();

        expect( oPsql.status ).toBe( false );
        expect( oPsql.getStatus() ).toEqual( { status: false, error: { msg: 'Not connected yet.' } } );
    } );

    test( 'get status dis/connected', async () => {
        const oPsql = new OPsql( { settings: CONFIG } );

        await oPsql.poolOpen();

        let status = oPsql.status;
        let objStatus = oPsql.getStatus();

        await oPsql.poolClose();

        expect( status ).toBe( true );
        expect( objStatus ).toEqual( { status: true, msg: 'Connected successfully.' } );

        expect( oPsql.status ).toBe( false );
        expect( oPsql.getStatus() ).toEqual( { status: false, error: { msg: 'Disconnected successfully.' } } );
    } );
});

describe('init Bad OPsql', () => {
    test( 'new OPsql( bad-config )', async () => {
        const oPsql = new OPsql( { settings: CONFIG_BAD } );

        const responseOpen = await oPsql.poolOpen();

        expect( responseOpen.status ).toBe( false );
        expect( responseOpen.error.msg ).toBe( 'Error: Connection terminated due to connection timeout' );
    } );

    test( 'new OPsql( bad-config2 )', async () => {
        const oPsql = new OPsql( { settings: CONFIG_BAD2 } );

        const responseOpen = await oPsql.poolOpen();

        expect( responseOpen.status ).toBe( false );
        expect( responseOpen.error.msg ).toMatch( /(error: password authentication failed for user)/ );
    } );

    test( 'new OPsql( timeout-config )', async () => {
        const customConfig = Object.assign( { connectionTimeoutMillis: 1 }, CONFIG );
        const oPsql = new OPsql( { settings: customConfig } );

        const responseOpen = await oPsql.poolOpen();

        expect( responseOpen.status ).toBe( false );
        expect( responseOpen.error.msg ).toBe( `Error: Connection terminated due to connection timeout` );
    } );
});

describe('init OPsql', () => {
    test( 'new OPsql( config )', async () => {
        const oPsql = new OPsql( { settings: CONFIG } );

        const responseOpen = await oPsql.poolOpen();
        const responseClose = await oPsql.poolClose();

        expect( responseOpen.status ).toBe( true );
        expect( responseOpen.msg ).toBe( 'Connected successfully.' );
        expect( responseClose.status ).toBe( true );
        expect( responseClose.msg ).toBe( 'Disconnected successfully.' );
    } );

    test( 'close without being opened', async () => {
        const oPsql = new OPsql( { settings: CONFIG } );

        const responseClose = await oPsql.poolClose();

        expect( responseClose.status ).toBe( true );
        expect( responseClose.msg ).toBe( 'Is already disconnected.' );
    } );

    test( 'open one close twice', async () => {
        const oPsql = new OPsql( { settings: CONFIG } );

        const responseOpen = await oPsql.poolOpen();
        const responseClose = await oPsql.poolClose();
        const responseClose2 = await oPsql.poolClose();

        expect( responseClose2.status ).toBe( true );
        expect( responseClose2.msg ).toBe( 'Is already disconnected.' );
    } );

    test( 'open twice', async () => {
        const oPsql = new OPsql( { settings: CONFIG } );

        const responseOpen = await oPsql.poolOpen();
        const responseOpen2 = await oPsql.poolOpen();
        const responseClose = await oPsql.poolClose();

        expect( responseOpen2.status ).toBe( true );
        expect( responseOpen2.msg ).toBe( 'Connected successfully.' );
    } );
});