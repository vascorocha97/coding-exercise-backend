# BySide Coding Exercise 2023

Hello there 👋, this is the BySide Coding Exercise 2023. 

The objective of this exercise is to present with a real problem (simplified) where you can apply your skills and be used as the foundation for the next step on our selection process.

We would like you to dedicate some time in solving this exercise and make them publicly available so we can go through your implementation in an interview meeting. We will discuss with you topics such as:

- How did you approach this exercise and where did you start
- Which decisions you took
- Are tests properly implemented and does it have good code coverage
- What improvements and future work can be done

Before we begin, let's get you up and running with this coding challenge.

### Before you start

1. [Download Docker](https://docs.docker.com/engine/install/) and install it
2. Run docker engine
3. Run the following command in the project folder:
    
    This will install the node_modules
    
    ```bash
    docker compose run npm i
    ```
    
    This command will start the docker container on your machine. 
    
    ```bash
    docker compose up -d
    ```
    
    You can check if the containers are running using this command:
    
    ```bash
    docker ps
    ```
    
4. You are ready to start

### The problem

BySide is a digital marketing company and one of our main products is campaigns. We have two types of campaigns:

- On-site (campaigns rendered on websites)
- Off-site (sms, email, voice and push notification)

We want you to create an endpoint that creates a campaign and saves it in a database to be used later and an endpoint to get the campaign information based on its ID (UUID). 

Here are the properties that each type of campaign has:

**On-site:**

```json
{
    "type": "on-site",
    "name": "On-site campaign",
    "placeholder": "(div | table)",
    "component": "(banner | window | image)",
    "width": "300px",
    "height": "400px"
}
```

**SMS:**

```json
{
    "type": "sms",
    "name": "SMS campaign",
    "message": "Hello and welcome to BySide.",
    "sender": {
        "name": "BySide",
        "phone": "+(country_code)(number)"
    }
}
```

**Email:**

```json
{
    "type": "email",
    "name": "Email campaign",
    "message": "Hello and welcome to BySide.",
    "sender": {
        "name": "BySide",
        "email": "(user)@(domain)"
    }
}
```

**Voice:**

```json
{
    "type": "voice",
    "name": "Voice campaign",
    "audio_name": "hello_welcome_to_byside.wav",
    "caller_id": "+(country_code)(number)"
}
```

**Push Notification:**

```json
{
    "type": "push",
    "name": "Push campaign",
    "message": "Hello and welcome to BySide.",
    "sender": "BySide"
}
```

### Exercise

> **Note:** The skeleton for this exercise was prepared using Node.js. If you prefer to solve the same exercise using a different tech stack, feel free to start a new project from scratch using that tech stack.  Please note that @Byside we use Node.js, PHP and Java as backend programming languages and would prefer to have the exercise being implemented using 1 of those languages

Fork this repository and start working on your copy of the repo. 

You can change the project as **much a you want** and **leave comments if necessary** so we can understand your solution.

We want you to develop 2 endpoints:

- Create a new campaign for any of the types listed above
- Get campaing information using its UUID

#### Create campaign

The route for the endpoint must follow the following rules:

- Method: POST
- Path: `/campaigns`
- Content-Type: `application/json`
- Request body must follow this naming convention mentioned above.
- Response body must include at least the same properties as above.
- In case of success should generate a new ID (UUID) and also return in the resposne


#### Get campaign

The route for the endpoint must follow the following rules:

- Method: GET
- Path: `/campaigns/<UUID>`
- Content-Type: `application/json`
- Response body must include campaign information


To check if your solution is working run the automated tests provided by:

```
docker compose run tests
```

> The base repository only has some tests to get the structure working. Feel free to add the automtic tests you think should be added.


### Submission

- Make your solution publicly available (GitHub, Bitbucket, Gitlab)
- Send the link to your solution with the solution 24 hours before your interview to internship@byside.com

Good luck! 💪
