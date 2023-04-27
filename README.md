# Travel-app Server

## Intro

Hi when I started this project I was dreaming about an app that would be the best friend of any traveller. An app where you could meet travellers standing nearby you, where you could post every pictures and precising on a map where you took it, where you could share all your trips on a personal map (precise great hostels, great experiences, the cost of life, ...), where you could plan a trip and thanks to the data provided by the users a perfect trip would have been proposed in function of your life style (great roads to ride, great beaches to surf, great luxury hotels to stand, ... And warning you about the hard border to cross in function of your nationality), where you could buy your plane's tickets, where you could book your hostels and hotels and even some links to your ambassy to get the visa you need and even an app where you could save your important papers in one securised place.

Well, this is the version I started developping. And I know it is far from the version I was dreaming about.
You need Node and a text editor to host this app on your computer

## How to get the project from GitHub:

In order to get all the files, you need to clone this repository from this link: [Repository GitHub](https://github.com/HadrienSmet/travel-app-server)

When you are standing on the right directory in your terminal, writte those lines:

```
git init
git clone https://github.com/HadrienSmet/travel-app-server.git
```

_The first line will turn your directory into a Github repository._
_The second line will copy every directories and files from the GitHub repository._

## Follow those steps to make this project work:

### 1. Install all the libraries necessary for this project:

- When you are standing on the right directory on your terminal, writte this line:
    ```
    npm install
    ```

### 2. Create a file inside this project and call it: "_.env_".

- Inside this file you have to writte those lines:

    ```
    ACCESS_TOKEN_SECRET=<secretRandomToken>
    REFRESH_TOKEN_SECRET=<secretRandomToken>

    ADMIN_ACCOUNT_ID=<adminAccountId>
    MONGODB_URI=<mongoDbUrl

    API_URL=<ApiUrl>

    GCS_ID=<googleCloudStorageProjectId>
    GCS_URL=<googleCloudStorageFilesUrl>
    GOOGLE_APPLICATION_CREDENTIALS=<credentialsFileName>
    GOOGLE_CREDENTIALS=<credentialsFileContent>
    ```
_The two first lines refers to the token for the authentification_
_To create those random tokens writte those commands in you terminal:_

    ```
    node
    require('crypto').randomBytes(64).toString('hex')
    require('crypto').randomBytes(64).toString('hex')
    ```

_You have now two differents strings to fill the fields._ :grinning:
_The line just after the tokens refers to the account of the admin on the app_
_The fourth line refers to your mongoDB adress wich should look like this:
    ```
        <mongodb+srv://<AnyNameOfYourChoice>:<PasswordGeneratedByMongoDB>@<clusterName>.<randomCode>.mongodb.net/?retryWrites=true&w=majority>
    ```
_Then you have the url of your server (local server, heroku, ...)
_The four last lines refers to the credentials to link this project to your GCS account

All your environments virables are now set! :grin:

### 3. Lauching this project

- In your terminal writte this command:
    ```
    nodemon server
    ```

I hope that everything worked fine for you! :ok_hand:
Have a good day :innocent:
