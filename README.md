# Swiss Travel Game

This is an app for a travel game designed to run on Google Apps Script. 

## Rules of the Game
The current version of the game rules can be found [here](https://pad.gwdg.de/s/ayNaf-eNG).

## Installation
- To use this app, you need a Google Account. There, you need to upload the xlsx table (including all the sheets with their current names).
- Then you need to install a google apps script project (via Expansions -> Apps Script). In this project you need to create two new files called Index.html and the Code.gs and upload the code from the respective files in this project. If you're new to Apps Script, I recommend [this tutorial](https://developers.google.com/apps-script/samples).
- It is recommended to test the code before deploying (The blue button "Deployments" --> test deployments), where you can copy a link to the web app.
- If everything runs correctly, you can deploy the code (Deployments --> new deployment). There you will need to choose "Execute as me" (as the script needs access to the spreadsheet). Once deployed you get a link which you can share with the players.

## Setup
Once installed, the game must be setup:
- First, the team information need to be filled: In the Teams spreadsheet, the teams need to enter at least one email adress per team (max. 2) which they can access during the game, as important game information will be shared via email. Furthermore, the teams can define an access code to their part of the game app. This is a safeguard against accidentally entering the other team's space of the app which contains game information which should only be accessible to one team.
- Second, new tickets should be generated. To this end, the tickets in the "Possible Tickets" sheet can be deleted and in the Apps Script project the function WriteTicketStack() needs to be executed after adjusting the numTickets variable in that function according to the number of tickets you want to play with. A recommendation might be 50, but this hasn't been tested yet.
- After that, you're good to go. I would recommend to go through the rules with all the players and test the app thoroughly before playing.
- Then go to the agreed start location. As a first move, both teams should draw and choose tickets. Then the game starts.

## Known issues
Some parts are not coded in the most efficient way. For example, the finishing of a claim takes a lot of time, because many server-side functions are called. If you want to contribute, you are free to fork the project, or write to me under merten<at>mertensworld.ch.

