const express = require('express');
const mysql = require('mysql2/promise');
const uuid = require('uuid');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();

const port = process.env.API_PORT;

const dbConnection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
});

const app = express();
app.use(bodyParser.json());

app.get('/health', async (req, res, next) => {
    let healthStatus = { mysql: 'down' };

    try {
        const connection = await dbConnection.getConnection();
        await connection.ping();
        healthStatus.mysql = 'up';
    } catch (error) {
        console.log(error);
    }

    res.status(200);
    res.json(healthStatus);
    next();
});

app.post('/campaigns', async (req, res, next) => {
    const campaign = req.body;
    const { type, name } = campaign;
    
    //validate campaing data
    if (!type || !name) {
        res.status(400).send({ error: "Missing required fields" });
        return;
    }
    
    const options = ['on-site', 'sms', 'email', 'voice', 'push'];
    //check if campaign type exists
    if (!options.includes(type)) {
        res.status(400);
        res.json({ error: 'Invalid campaign type' });
        next();
        return;
    }

    // checks if table exists and only creates if it doesn't
    try {

        const connection = await dbConnection.getConnection();

        // Check if the campaigns table already exists
        const [campaignsTableExists] = await connection.execute(`SHOW TABLES LIKE 'campaign'`);
        
        if (!campaignsTableExists.length) {
            // Create the campaigns table
            /* await connection.execute(`DROP TABLE sms_campaign`)
            await connection.execute(`DROP TABLE email_campaign`) 
            await connection.execute(`DROP TABLE on_site_campaign`) 
            await connection.execute(`DROP TABLE voice_campaign`) 
            await connection.execute(`DROP TABLE push_campaign`) 
            await connection.execute(`DROP TABLE campaign`) */
            await connection.execute(`
                CREATE TABLE campaign (
                    id VARCHAR(100),
                    name VARCHAR(50),
                    type VARCHAR(20),
                    PRIMARY KEY (id)
                )
            `);

            await connection.execute(`
                CREATE TABLE sms_campaign (
                    id VARCHAR(100) references campaign,
                    message VARCHAR(255),
                    sender_name VARCHAR(50),
                    sender_phone VARCHAR(50),
                    PRIMARY KEY (id)
                )
            `);
            await connection.execute(`ALTER TABLE sms_campaign ADD CONSTRAINT FK_sms FOREIGN KEY(id) references campaign(id)`)
            
            await connection.execute(`
                CREATE TABLE email_campaign (
                    id VARCHAR(100) references campaign,
                    message VARCHAR(255),
                    sender_name VARCHAR(50),
                    sender_email VARCHAR(50),
                    PRIMARY KEY (id)
                )
            `);
            await connection.execute(`ALTER TABLE email_campaign ADD CONSTRAINT FK_email FOREIGN KEY(id) references campaign(id)`)
            
            await connection.execute(`
                CREATE TABLE on_site_campaign (
                    id VARCHAR(100) references campaign,
                    placeholder VARCHAR(255),
                    component VARCHAR(512),
                    width VARCHAR(10),
                    height VARCHAR(10),
                    PRIMARY KEY (id)
                )
            `);
            await connection.execute(`ALTER TABLE on_site_campaign ADD CONSTRAINT FK_on_site FOREIGN KEY(id) references campaign(id)`)
            
            await connection.execute(`
                CREATE TABLE voice_campaign (
                    id VARCHAR(100) references campaign,
                    audio_name VARCHAR(50),
                    caller_id VARCHAR(50),
                    PRIMARY KEY (id)
                )
            `);
            await connection.execute(`ALTER TABLE voice_campaign ADD CONSTRAINT FK_voice FOREIGN KEY(id) references campaign(id)`)
            
            await connection.execute(`
                CREATE TABLE push_campaign (
                    id VARCHAR(100) references campaign,
                    message VARCHAR(255),
                    sender VARCHAR(50),
                    PRIMARY KEY (id)
                )
            `);
            await connection.execute(`ALTER TABLE push_campaign ADD CONSTRAINT FK_push FOREIGN KEY(id) references campaign(id)`)
        }
    } catch (error) {
        //handle db connection errors
        console.log("Error creating tables: ", error);
        res.json({ error });
        return;
    }
    
    const actions = {
        ['on-site']: addOnSite,
        sms: addSms,
        email: addEmail,
        voice: addVoice,
        push: addPush,
    }
    
    const action = actions[type];
    action(req, res, next);
});


app.listen(port, '0.0.0.0', () => {
    console.log('Listening on port', port);
});

function generateCampaignId() {
    return uuid.v4();
}

const addCampaign = async (campaignId, campaign) => {
    const connection = await dbConnection.getConnection();

    await connection.execute(
        'INSERT INTO campaign (id, name, type) VALUES (?, ?, ?)',
        [campaignId, campaign.name, campaign.type]
    );
}

async function addOnSite(req, res, next) {
    const campaign = req.body;
    //generate UUID
    const campaignId = generateCampaignId();

    //validate fields
    if (!campaign.placeholder || !campaign.component || !campaign.width || !campaign.height) {
        res.status(400).send({ error: "Missing required fields" });
        return;
    }
    try {
        //create connection to the database
        const connection = await dbConnection.getConnection();
        //prepared statement to prevent SQL injection
        await addCampaign(campaignId, campaign)
        const [result] = await connection.execute(
            'INSERT INTO on_site_campaign (id, placeholder, component, width, height) VALUES (?, ?, ?, ?, ?)',
            [campaignId, campaign.placeholder, campaign.component, campaign.width, campaign.height]
        );
        // check the number of rows affected by the query
        if (result.affectedRows === 1) {
            res.status(201);
            res.json({ id: campaignId });
        } else {
            res.status(500);
            res.json({ error: 'Failed to insert campaign' });
        }
    } catch (error) {
        console.log('Error ', error);
        res.status(500);
        res.json({ error });
    }
}

async function addSms(req, res, next) {
    const campaign = req.body;

    //validate fields
    if (!campaign.message || !campaign.sender || !campaign.sender.name || !campaign.sender.phone) {
        res.status(400).send({ error: "Missing required fields" });
        return;
    }
    
    //generate UUID
    const campaignId = generateCampaignId();
    try {
        //create connection to the database
        const connection = await dbConnection.getConnection();
        //prepared statement to prevent SQL injection
        await addCampaign(campaignId, campaign)
        const [result] = await connection.execute(
            'INSERT INTO sms_campaign (id, message, sender_name, sender_phone) VALUES (?, ?, ?, ?)',
            [campaignId, campaign.message, campaign.sender.name, campaign.sender.phone]
        );
        
        // check the number of rows affected by the query
        if (result.affectedRows === 1) {
            res.status(201);
            res.json({ id: campaignId });
        } else {
            res.status(500);
            res.json({ error: 'Failed to insert campaign' });
        }
    } catch (error) {
        console.log(error);
        res.status(500);
        res.json({ error });
    }
    next();
}

async function addEmail(req, res, next) {
    const campaign = req.body;
    //validate fields
    if (!campaign.message || !campaign.sender || !campaign.sender.name || !campaign.sender.email) {
        res.status(400).send({ error: "Missing required fields" });
        return;
    }
    
    //generate UUID
    const campaignId = generateCampaignId();

    try {
        //create connection to the database
        const connection = await dbConnection.getConnection();
        //prepared statement to prevent SQL injection
        await addCampaign(campaignId, campaign)
        const [result] = await connection.execute(
            'INSERT INTO email_campaign (id,message, sender_name, sender_email) VALUES (?, ?, ?, ?)',
            [campaignId, campaign.message, campaign.sender.name, campaign.sender.email]
        );
        // check the number of rows affected by the query
        if (result.affectedRows === 1) {
            res.status(201);
            res.json({ id: campaignId });
        } else {
            res.status(500);
            res.json({ error: 'Failed to insert campaign' });
        }
    } catch (error) {
        console.log('Error ', error);
        res.status(500);
        res.json({ error });
    }
}

async function addVoice(req, res, next) {
    const campaign = req.body;
    //validate fields
    if (!campaign.audio_name || !campaign.caller_id) {
        res.status(400).send({ error: "Missing required fields" });
        return;
    }
    
    //generate UUID
    const campaignId = generateCampaignId();

    try {
        //create connection to the database
        const connection = await dbConnection.getConnection();
        //prepared statement to prevent SQL injection
        await addCampaign(campaignId, campaign)
        const [result] = await connection.execute(
            'INSERT INTO voice_campaign (id, audio_name, caller_id) VALUES (?, ?, ?)',
            [campaignId, campaign.audio_name, campaign.caller_id]
        );
        // check the number of rows affected by the query
        if (result.affectedRows === 1) {
            res.status(201);
            res.json({ id: campaignId });
        } else {
            res.status(500);
            res.json({ error: 'Failed to insert campaign' });
        }
    } catch (error) {
        console.log('Error ', error);
        res.status(500);
        res.json({ error });
    }
}

async function addPush(req, res, next) {
    const campaign = req.body;
    //validate fields
    if (!campaign.message || !campaign.sender) {
        res.status(400).send({ error: "Missing required fields" });
        return;
    }
    
    //generate UUID
    const campaignId = generateCampaignId();

    try {
        //create connection to the database
        const connection = await dbConnection.getConnection();
        //prepared statement to prevent SQL injection
        await addCampaign(campaignId, campaign)
        const [result] = await connection.execute(
            'INSERT INTO push_campaign (id, message, sender) VALUES (?, ?, ?)',
            [campaignId, campaign.message, campaign.sender]
        );
        // check the number of rows affected by the query
        if (result.affectedRows === 1) {
            res.status(201);
            res.json({ id: campaignId });
        } else {
            res.status(500);
            res.json({ error: 'Failed to insert campaign' });
        }
    } catch (error) {
        console.log('Error ', error);
        res.status(500);
        res.json({ error });
    }
}

app.get('/campaigns/:id', async (req, res, next) => {
    const campaignId = req.params.id;
  
    try {
        //create connection to the database
        const connection = await dbConnection.getConnection();
        //prepared statement to prevent SQL injection
        const [campaign] = await connection.execute(
            'SELECT type FROM campaign WHERE id = ?',
            [campaignId]
        );

        if (campaign.length === 0) {
            res.status(404);
            res.json({ error: 'Campaign not found' });
            return;
        }
        const tableByType = {
            ['on-site']: 'on_site_campaign',
            sms: 'sms_campaign',
            email: 'email_campaign',
            voice: 'voice_campaign',
            push: 'push_campaign',
        }

        const table = tableByType[campaign[0].type]

        const [data] = await connection.execute(
           `SELECT * FROM campaign RIGHT JOIN ${table} ON campaign.id = ${table}.id WHERE campaign.id = ?`,
            [campaignId]
        );
    
        // check if a campaign was found
        if (data.length === 0) {
            res.status(404);
            res.json({ error: 'Campaign not found' });
        } else {
            res.status(200);
            res.json(data[0]);
        }
    } catch (error) {
        console.log('Error ', error);
        res.status(500);
        res.json({ error });
    }
  });