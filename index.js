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

console.log(process.env.API_PORT);

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

async function createTables(req, res, next) {
    try {

        const connection = await dbConnection.getConnection();

        // Check if the campaigns table already exists
        const [campaignsTableExists] = await connection.execute(`SHOW TABLES LIKE 'campaigns'`);
        
        if (!campaignsTableExists.length) {
            // Create the campaigns table
        
            await connection.execute(`
                CREATE TABLE sms_campaign (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(20),
                    message VARCHAR(255),
                    sender_name VARCHAR(20),
                    sender_phone VARCHAR(12)
                )
            `);
        }
    } catch (error) {
        //handle db connection errors
        if (error instanceof dbConnection.ConnectionError) {
            res.status(500);
            res.json({ error: 'Failed to connect to the database' });
        } else {
            console.log("Error creating tables: ", error);
            res.status(500);
            res.json({ error });
        }
    }
}

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
    await createTables(req, res, next); 

    const actions = {
        ['on-site']: addOnSite,
        sms: addSms,
        email: addEmail,
        voice: addVoice,
        push: addPush,
    }
    const action = actions[type];
    action(req, res, next);
    next();
});


app.listen(port, '0.0.0.0', () => {
    console.log('Listening on port', port);
});

function generateCampaignId() {
    return uuid.v4();
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
        const [result] = await connection.execute(
            'INSERT INTO on_site_campaign (id, name, placeholder, component, width, height) VALUES (?, ?, ?, ?, ?, ?)',
            [campaignId, campaign.name, campaign.placeholder, campaign.component, campaign.width, campaign.height]
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
        //handle db connection errors
        if (error instanceof dbConnection.ConnectionError) {
            res.status(500);
            res.json({ error: 'Failed to connect to the database' });
        } else {
            console.log(error);
            res.status(500);
            res.json({ error });
        }
    }
    
    next();
}

async function addSms(req, res, next) {
    const campaign = req.body;
    

    //validate fields
    if (!campaign.message || !campaign.sender || !campaign.sender.name || !campaign.sender.phone) {
        res.status(400).send({ error: "Missing required fields" });
        next();
        return;
    }
    
    //generate UUID
    const campaignId = generateCampaignId();
    try {
        //create connection to the database
        const connection = await dbConnection.getConnection();
        //prepared statement to prevent SQL injection
        const [result] = await connection.execute(
            'INSERT INTO sms_campaign (id, name, message, sender_name, sender_phone) VALUES (?, ?, ?, ?, ?)',
            [campaignId, campaign.name, campaign.message, campaign.sender.name, campaign.sender.phone]
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
        //handle db connection errors
        if (error instanceof dbConnection.ConnectionError) {
            res.status(500);
            res.json({ error: 'Failed to connect to the database' });
        } else {
            console.log(error);
            res.status(500);
            res.json({ error });
        }
    }
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
        const [result] = await connection.execute(
            'INSERT INTO email_campaign (id, name, message, sender_name, sender_email) VALUES (?, ?, ?, ?, ?)',
            [campaignId, campaign.name, campaign.message, campaign.sender.name, campaign.sender.email]
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
        //handle db connection errors
        if (error instanceof dbConnection.ConnectionError) {
            res.status(500);
            res.json({ error: 'Failed to connect to the database' });
        } else {
            console.log(error);
            res.status(500);
            res.json({ error });
        }
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
        const [result] = await connection.execute(
            'INSERT INTO voice_campaign (id, name, audio_name, caller_id) VALUES (?, ?, ?, ?)',
            [campaignId, campaign.name, campaign.audio_name, campaign.caller_id]
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
        //handle db connection errors
        if (error instanceof dbConnection.ConnectionError) {
            res.status(500);
            res.json({ error: 'Failed to connect to the database' });
        } else {
            console.log(error);
            res.status(500);
            res.json({ error });
        }
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
        const [result] = await connection.execute(
            'INSERT INTO push_campaign (id, name, message, sender) VALUES (?, ?, ?, ?)',
            [campaignId, campaign.name, campaign.message, campaign.sender]
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
        //handle db connection errors
        if (error instanceof dbConnection.ConnectionError) {
            res.status(500);
            res.json({ error: 'Failed to connect to the database' });
        } else {
            console.log(error);
            res.status(500);
            res.json({ error });
        }
    }
}


app.get('/campaigns/:id', async (req, res, next) => {
    const campaignId = req.params.id;
  
    try {
        //create connection to the database
        const connection = await dbConnection.getConnection();
        //prepared statement to prevent SQL injection
        const [rows] = await connection.execute(
            'SELECT * FROM campaigns WHERE id = ?',
            [campaignId]
        );
        // check if a campaign was found
        if (rows.length === 0) {
            res.status(404);
            res.json({ error: 'Campaign not found' });
        } else {
            res.status(200);
            res.json(rows[0]);
        }
    } catch (error) {
        //handle db connection errors
        if (error instanceof dbConnection.ConnectionError) {
            res.status(500);
            res.json({ error: 'Failed to connect to the database' });
        } else {
            console.log(error);
            res.status(500);
            res.json({ error });
        }
    } 
  });