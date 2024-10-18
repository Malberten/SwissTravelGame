/*
Copyright (C) 2024 Merten Dahlkemper
    Contact: merten.nikolay <at> gmail.com

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// Global variables for sheet names
const TEAMS_SHEET = 'Teams';
const PUBLIC_ROUTES_SHEET = 'Public Routes';
const CHALLENGES_SHEET = 'Challenges';
const GAME_STATE_SHEET = 'Game State';
const POSSIBLE_TICKETS = 'Possible Tickets';
const STATION_SHEET = 'Stationlist'
const POSSIBLE_ROUTES_SHEET = 'Possible Routes'
const COST_TICKETS = 15;
const CHALLENGE_PENALTY = 0.2;
const GAMETITLE = "Swiss Train Travel Game"


function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Switzerland Travel Game')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function cantonDict(){
var swissCantons = {
  "Aargau": "AG",
  "Appenzell Innerrhoden": "AI",
  "Appenzell Ausserrhoden": "AR",
  "Bern": "BE",
  "Basel-Landschaft": "BL",
  "Basel-Stadt": "BS",
  "Deutschland": "D",
  "France": "F",
  "Fribourg": "FR",
  "Genève": "GE",
  "Glarus": "GL",
  "Graubünden": "GR",
  "Italia": "I",
  "Jura": "JU",
  "Liechtenstein": "L",
  "Luzern": "LU",
  "Neuchâtel": "NE",
  "Nidwalden": "NW",
  "Obwalden": "OW",
  "St.Gallen": "SG",
  "Schaffhausen": "SH",
  "Solothurn": "SO",
  "Schwyz": "SZ",
  "Thurgau": "TG",
  "Ticino": "TI",
  "Uri": "UR",
  "Vaud": "VD",
  "Valais": "VS",
  "Zug": "ZG",
  "Zürich": "ZH"
};

//Logger.log(Object.values(swissCantons))
return swissCantons;
}

function validateTeamAccess(teamId, accessCode) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEAMS_SHEET);
  const data = sheet.getRange("A2:D3").getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === teamId && data[i][3] === accessCode) {
      return true;
    }
  }
  return false;
}

function randomStation() {
  var stationSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STATION_SHEET);
  var data = getStationsAndRoutes();
  var lastRow = stationSheet.getLastRow();
  var stationIds = stationSheet.getRange("A2:A"+lastRow).getValues();
  var randomIndex = Math.floor(Math.random() * stationIds.length);
  var station = data.stations[stationIds[randomIndex]];
  return station;
}

function convertToMinutes(timeString) {
  // Regular expressions to match hours and minutes
  var hourPattern = /(\d+)\s*hour/;
  var minutePattern = /(\d+)\s*min/;
  
  // Extract hours and minutes from the string
  var hoursMatch = timeString.match(hourPattern);
  var minutesMatch = timeString.match(minutePattern);
  
  // Initialize hours and minutes
  var hours = 0;
  var minutes = 0;
  
  // Convert extracted values to integers
  if (hoursMatch) {
    hours = parseInt(hoursMatch[1], 10);
  }
  
  if (minutesMatch) {
    minutes = parseInt(minutesMatch[1], 10);
  }
  
  // Calculate total minutes
  var totalMinutes = (hours * 60) + minutes;
  
  return totalMinutes;
}


function calculateTransitTime(origin,destination) {
  //origin = ["Zweisimmen","Bern"];
  //destination = ["Montbovon","Vaud"];
  var directions = Maps.newDirectionFinder()
      .setRegion('ch')
      .setOrigin(origin[0],origin[1])
      .setDestination(destination[0],destination[1])
      .setMode(Maps.DirectionFinder.Mode.TRANSIT)
      .setDepart(new Date("September 14, 2024 07:00:00"))
      .setAlternatives(true)
      .getDirections();
  var routes = directions.routes;
  //Logger.log(route.legs[0])
  var shortestDuration = Infinity;
  Object.values(routes).forEach(function(route){
    var durText = route.legs[0].duration.text;
    var totalDurationMinutes = convertToMinutes(durText);
    if(totalDurationMinutes<shortestDuration){shortestDuration = totalDurationMinutes}
  })
return shortestDuration;
}

function generateTicket(){
  var maxkm = 200;
  var distance = maxkm +1;
  while(distance > maxkm){
    var start = randomStation();
    var end = randomStation();
    
    while (end.id === start.id) {
      end = randomStation();
    }

    distance = calculateDistance(start.lat,start.lon,end.lat,end.lon);
    //Logger.log([start, end,distance])
  }
  var id = start.id+"-"+end.id;
  var alternativeId = end.id+"-"+start.id;
  
  var altDiff = Math.abs(start.altitude - end.altitude)
  var bonus = 0;
  bonus += Math.floor(altDiff/100);
  if (start.canton !== end.canton){
    bonus++;
  }
  if (start.canton === "Appenzell Innerrhoden" || start.canton === "Appenzell Ausserrhoden" || start.canton === "Nidwalden"|| start.canton === "Obwalden" || start.canton === "Glarus" || start.canton === "Deutschland" || start.canton === "Liechtenstein" || start.canton === "France"  ){
    bonus++;
  }
  if (end.canton === "Appenzell Innerrhoden" || end.canton === "Appenzell Ausserrhoden" || end.canton === "Nidwalden"|| end.canton === "Obwalden" || end.canton === "Glarus" || end.canton === "Deutschland" || end.canton === "Liechtenstein" || end.canton === "France" ){
    bonus++;
  }
  if(start.longDistance ==="N"){
    bonus++;
  }
  if(end.longDistance ==="N"){
    bonus++;
  }
  var points = Math.ceil(distance/10) + bonus; 
  Logger.log([start.name, end.name,distance,altDiff,points])
  return {id:id,start:start, end:end, points:points,alternativeId:alternativeId}
}



function writeTicketStack(numTickets){
  numTickets = 1;
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(POSSIBLE_TICKETS);
  let runningId =1;
  let ids = [];
  while (runningId<=numTickets){
    Logger.log(runningId)
    let ticket = generateTicket();
    if(!ids.includes(ticket.id) && !ids.includes(ticket.alternativeId)){
      sheet.appendRow([ticket.id,ticket.start.id,ticket.end.id,ticket.points]);
      ids.push(ticket.id)
      runningId++;
    } 
  }
}



function generateTicketOptions(teamId) {
  //teamId = "Team A"
  var numTickets = 5;
  var data = getStationsAndRoutes()
  var stations = data.stations
  var gameStatus = data.gameStatus[teamId]
  let tickets = [];
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(POSSIBLE_TICKETS);
  let temporarySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(teamId + " Temporary Tickets");
  let lastRow = sheet.getLastRow();
  
  if(lastRow > 1 && gameStatus.coins >= COST_TICKETS){
  
    if (lastRow < 6){
      numTickets = lastRow -1;
    }
    let ticketData = sheet.getRange(2,1,numTickets,4).getValues();
    temporarySheet.getRange(2,1,numTickets,4).setValues(ticketData);
    sheet.deleteRows(2,numTickets);
  
    ticketData.forEach(currentTicketData => {
       let ticket = {id:currentTicketData[0],from:stations[currentTicketData[1]],to:stations[currentTicketData[2]],   points:currentTicketData[3],selected:false};
       tickets.push(ticket);
    }) 
    updateScore(teamId, 'Drew tickets', COST_TICKETS, 0, 0, 0, '','');
    sendTicketEmail(teamId, tickets);
  }
  else if (gameStatus.coins < COST_TICKETS){
    return {message: "Not enough coins to draw tickets"};
  }
  else if (lastRow ===1){
    return {message: "No tickets left"};
  }
  return tickets;
}

function recreateTicketOptions(teamId){
  //teamId = "Team A";
  let stations = getStationsAndRoutes().stations
  const drawnTicketSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(teamId + ' Temporary Tickets');
  let ticketData = drawnTicketSheet.getRange(2,1,drawnTicketSheet.getLastRow()-1,4).getValues();
  let tickets = [];
  ticketData.forEach(currentTicketData => {
       let ticket = {id:currentTicketData[0],from:stations[currentTicketData[1]],to:stations[currentTicketData[2]],   points:currentTicketData[3],selected:false};
       tickets.push(ticket);
    }) 
  return tickets;
}

function saveSelectedTickets(teamId, selectedTickets) {
  const teamTicketsheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(teamId + ' Tickets');
  const drawnTicketSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(teamId + ' Temporary Tickets');
  const availableTicketSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(POSSIBLE_TICKETS);

  selectedTickets.forEach(ticket => {
    teamTicketsheet.appendRow([ticket.id,ticket.from.id,ticket.to.id,ticket.points]);
    let ticketRow = drawnTicketSheet.getRange("A2:A6")
                                        .createTextFinder(ticket.id)
                                        .findNext();
    if (ticketRow) {
      drawnTicketSheet.deleteRow(ticketRow.getRow());
    }
  });
  let leftoverTickets = drawnTicketSheet.getRange("A2:D"+drawnTicketSheet.getLastRow()).getValues()
  availableTicketSheet.getRange(availableTicketSheet.getLastRow()+1,1,leftoverTickets.length,4).setValues(leftoverTickets)
  drawnTicketSheet.deleteRows(2,leftoverTickets.length)

  // Update game status
  updateScore(teamId, 'Selected ' + selectedTickets.length + ' new tickets', 0, 0, 0, selectedTickets.length, '','');
  let availableNumberOfTickets = availableTicketSheet.getLastRow() -1;
  sendTicketEmailToOtherTeam(teamId,selectedTickets.length,availableNumberOfTickets);
  // Check if we need to generate more tickets
  //if (availableTicketSheet.getLastRow() < 7) {
    //writeTicketStack(10);
  //}
  
  return getStationsAndRoutes();
}

function getTeamTickets(teamId) {
  //teamId = "Team A";
  let stations = getStationsAndRoutes().stations
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(teamId + ' Tickets');
  let ticketData = sheet.getRange("A2:D"+sheet.getLastRow()).getValues()
  let tickets = [];
  ticketData.forEach(currentTicketData => {
    let ticket = {id:currentTicketData[0],from:stations[currentTicketData[1]],to:stations[currentTicketData[2]],points:currentTicketData[3]};
    tickets.push(ticket)
  })
  Logger.log(tickets);
  return tickets;
}

function sendTicketEmail(teamId, tickets) {
  let teamEmail = getTeamEmail(teamId);
  let swissCantons =cantonDict();
  if (teamEmail) {
    let emailBody = 'Your new ticket options are:\n\n';
    tickets.forEach((ticket, index) => {
      emailBody += `${index + 1}. ${ticket.from.name}, ${swissCantons[ticket.from.canton]}  to ${ticket.to.name}, ${swissCantons[ticket.to.canton]} (${ticket.points} points)\n`;
    });
    
    GmailApp.sendEmail(teamEmail, 'Your Ticket Options - '+GAMETITLE, emailBody);
  }
}

function sendTicketEmailToOtherTeam(teamId, numberTickets,availableNumberOfTickets) {
  var otherTeamEmail = getOtherTeamEmail(teamId);
  var subject = "Tickets drawn in "+GAMETITLE;
  if(otherTeamEmail){
    var body = `${teamId} drew ${numberTickets} new tickets. There are ${availableNumberOfTickets} Tickets left in the stack.`;
    GmailApp.sendEmail(otherTeamEmail, subject, body);
  }
}

function getCoordinates(city) {
  //city = ["Interlaken", "Bern"];
  //Logger.log(city);
  var coordinates = Maps.newGeocoder().geocode(city[0]+" ("+city[1]+") train station").results[0].geometry.location;
  var elevation = Maps.newElevationSampler().sampleLocation(coordinates.lat,coordinates.lng).results[0].elevation
  coordinates.alt = elevation
  //Logger.log(coordinates);
  return coordinates;
}

function updateScore(teamId, status, cost, gain, points, tickets,location,challengeId) {
  const gameStatusSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GAME_STATE_SHEET);
  gameStatusSheet.appendRow([new Date(), teamId, status,cost,gain,points,tickets,location,challengeId]);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEAMS_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === teamId) {
      sheet.getRange(i + 1, 5).setValue(status);
      const newCoins = data[i][5] - cost + gain;
      sheet.getRange(i + 1, 6).setValue(newCoins);
      const newPoints = data[i][6] + points;
      sheet.getRange(i + 1, 7).setValue(newPoints);
      const newTickets= data[i][7] + tickets;
      sheet.getRange(i + 1, 8).setValue(newTickets);
      if (location !== ''){
        sheet.getRange(i + 1, 9).setValue(location);
      }
      if(challengeId !== ''){
        sheet.getRange(i +1,10).setValue(challengeId)
      }
      if(status === 'Started challenge'){
        sheet.getRange(i +1,11).setValue("Y")
      }
      else if(status === 'Completed challenge'){
        sheet.getRange(i +1,11).setValue("N")
      }
      else if(status === 'Cancelled challenge'){
        sheet.getRange(i +1,11).setValue("N")
      }
    }
  }
}

function getPublicGameData() {
  const teamsData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEAMS_SHEET).getDataRange().getValues();
  var gameStatus = {};
  
  for (var i = 1; i < teamsData.length; i++) {
    var row = teamsData[i];
    var teamId = row[0];  // Assuming Team ID is in the first column
    
    gameStatus[teamId] = {
      coins: row[5],
      points: row[6],
      latestAction: row[4],
      numberOfTickets: row[7],
      location: row[8],
      latestChallenge: row[9],
      ongoingChallenge: row[10]
    };
  }
  return gameStatus
        

}



function writeRoutes(){
  var stationSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STATION_SHEET);
  var routesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(POSSIBLE_ROUTES_SHEET);

  var stationsData = stationSheet.getDataRange().getValues();
  var headers = stationsData.shift(); // Remove headers

  var routes = [];
  var fromStations = {};
  var fromStationsColumn = []

  stationsData.forEach(function(row) {
    var stationId = row[0];
    var stationName = row[1];
    var canton = row[2];
    var connectionsTo = row[7].split(','); // Assuming connections are in the last column
    
    if(fromStations[stationId]){
      fromStationsColumn.push(fromStations[stationId]);
    } else{
      fromStationsColumn.push([""]);
    }
    connectionsTo.forEach(function(connectedStationId) {
      var connectedStation = stationsData.find(function(s) { return s[0] === connectedStationId; });
      
      if (connectedStation) {
        routes.push([
          stationId +"-"+ connectedStationId, // Route ID
          stationName,
          canton,
          connectedStation[1], // Connected station name
          connectedStation[2] // Connected station canton

        ]);
        if (!fromStations[connectedStationId]){
          fromStations[connectedStationId] = [];
        }
        fromStations[connectedStationId].push(stationId);
      }
    }); 
  });
  var fromStationsColumnStrings = [];
  fromStationsColumn.forEach(function(s){
    fromStationsColumnStrings.push([s.join()])
  });
  // Write routes to the Routes sheet
  routesSheet.getRange(2, 1, routes.length, routes[0].length).setValues(routes);
  stationSheet.getRange(2,9,fromStationsColumn.length,1).setValues(fromStationsColumnStrings)
  calculateRouteLengths();
  calculateRouteDistances();
}

function writeCityCoordinates(){
  var stationSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STATION_SHEET);
  var stationsData = stationSheet.getDataRange().getValues();
  var headers = stationsData.shift(); // Remove headers
  var coordinates = [];
  var index = 0;
  stationsData.forEach(function(row) {
    var stationName = row[1];
    var canton = row[2];
    var stationCoordinates = getCoordinates([stationName,canton]);
    coordinates.push([stationCoordinates.lat,stationCoordinates.lng,stationCoordinates.alt])
    index++;
    Logger.log([index, stationName, stationCoordinates])
  });
  stationSheet.getRange(2,5,coordinates.length,3).setValues(coordinates);
}

function calculateRouteLengths(){
  var routesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(POSSIBLE_ROUTES_SHEET);
  var routesData =routesSheet.getDataRange().getValues();
  var routes = getStationsAndRoutes().routes
  var times = [];
  var index = 0;
  Object.values(routes).forEach(function(route) {
    var routeId = route.id
    var routeTime = calculateTransitTime([route.fromLat,route.fromLon],[route.toLat,route.toLon]);
    var routePoints = Math.ceil(routeTime/10.0)**2;
    var routeIndex = routesData.findIndex(r => r[0] === routeId)
    routesSheet.getRange(routeIndex + 1, 8,1,2).setValues([[routeTime,routePoints]]);
    index ++;
    Logger.log([index,routeId,routeTime,routePoints])
  });
}

function getStationsAndRoutes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stationsSheet = ss.getSheetByName(STATION_SHEET);
  var routesSheet = ss.getSheetByName(POSSIBLE_ROUTES_SHEET);
  var ticketsSheet = ss.getSheetByName(POSSIBLE_TICKETS);
  var gameState = getPublicGameData();
  var numberAvailableTickets = ticketsSheet.getLastRow() -1;

  var stationsData = stationsSheet.getDataRange().getValues();
  var routesData = routesSheet.getDataRange().getValues();

  var stations = {};
  var routes = {};

  // Process stations
  stationsData.slice(1).forEach(row => {
    let id = row[0];
    let toIds = row[7].split(",");
    
    let fromIds = row[8].split(",");
    var possibleRoutes = [];
    if(toIds[0] !== ""){ toIds.forEach(toId => possibleRoutes.push(id+"-"+toId))}
    if(fromIds[0] !== ""){ fromIds.forEach(fromId => possibleRoutes.push(fromId+"-"+id)) }
    stations[row[0]] = {
      id: id,
      name: row[1],
      canton: row[2],
      longDistance: row[3],
      lat: row[4],
      lon: row[5],
      altitude: Math.round(row[6]),
      possibleRoutes: possibleRoutes,
      possibleGeneralChallenges: row[9].split(","),
      possibleSpecialChallenges: row[10].split(",")
    };
  });

  // Process routes
  routesData.slice(1).forEach(row => {
    var routeIds = row[0].split('-');
    var fromStation = stations[routeIds[0]];
    var toStation = stations[routeIds[1]];
    if (fromStation && toStation) {
      routes[row[0]] = {
        id: row[0],
        from: fromStation.id,
        fromName: fromStation.name,
        fromCanton: fromStation.canton,
        fromLat: fromStation.lat,
        fromLon: fromStation.lon,
        to: toStation.id,
        toName: toStation.name,
        toCanton: toStation.canton,
        toLat: toStation.lat,
        toLon: toStation.lon,
        cost: row[6],
        points: row[8],
        claimedBy: row[10],
        claimedOn: row[11]
      };
    }
  });

  return {
    stations: stations,
    routes: routes,
    gameStatus: gameState,
    message: "",
    numberAvailableTickets: numberAvailableTickets
  };
}

function initiateClaimInGameStatus(teamId, station) {
  updateScore(teamId,"Claim Initiated",0,0,0,0,station.id,'');
  return getStationsAndRoutes();
}

function abortClaim(teamId){
  updateScore(teamId,"Claim aborted",0,0,0,0,'','')
  return getStationsAndRoutes();
}

function sendClaimAbortionEmail(teamId) {
  var otherTeamEmail = getOtherTeamEmail(teamId);
  var subject = "Claim Aborted in "+GAMETITLE;
  if(otherTeamEmail){
    var body = `${teamId} has aborted their claim.`;
    GmailApp.sendEmail(otherTeamEmail, subject, body);
  }
}

function sendClaimInitiationEmail(teamId, station) {
  var otherTeamEmail = getOtherTeamEmail(teamId);
  var subject = "Claim Initiated in "+GAMETITLE;
  if(otherTeamEmail){
    var body = `${teamId} has initiated a claim at ${station.name} (${station.canton}).`;
    GmailApp.sendEmail(otherTeamEmail, subject, body);
  }
}

function claimRoute(teamId, route,startStationId, trainNumber) {
  var data = getStationsAndRoutes();
  var startStation = data.stations[startStationId]
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var routesSheet = ss.getSheetByName(POSSIBLE_ROUTES_SHEET);
  var routesData = routesSheet.getDataRange().getValues();
  var swissCantons = cantonDict();
  var routeIndex = routesData.findIndex(r => r[0] === route.id);
  if (data.routes[route.id].claimedBy === "" && data.gameStatus[teamId].coins>=route.cost) {
    routesSheet.getRange(routeIndex + 1, 11).setValue(teamId);
    routesSheet.getRange(routeIndex + 1, 12).setValue(trainNumber); 
    if (startStationId === route.to){
      var finalStation = data.stations[route.from]
    } else{
      var finalStation = data.stations[route.to];
    }
    let routeString = startStation.name+", "+swissCantons[startStation.canton]+" to "+finalStation.name+", "+swissCantons[finalStation.canton]+ ", Train: " + trainNumber
    updateScore(teamId,"Route claimed ("+routeString+")",route.cost,0,route.points,0,finalStation.id,'');
    sendClaimCompletionEmail(teamId, routeString);
    return data;
  } else if(data.routes[route.id].claimedBy !== ""){
    return {message: "Route claimed"};
  }
  else if (data.gameStatus[teamId].coins < route.cost){
    return {message: "Route too expensive"};
  }
}

function sendClaimCompletionEmail(teamId, routeString) {
  var otherTeamEmail = getOtherTeamEmail(teamId);
  var subject = "Route Claimed in "+GAMETITLE;
  if(otherTeamEmail){
    var body = `${teamId} has claimed the following route: ${routeString}.`;
    GmailApp.sendEmail(otherTeamEmail, subject, body);
  }
}

function getTeamEmail(teamId){
  const teamSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Teams');
  const teamData = teamSheet.getRange("A2:C3").getValues();
  let teamEmail = '';
  for (let i = 0; i < teamData.length; i++) {
    if (teamData[i][0] === teamId) {
      if(teamData[i][1]){
        teamEmail = [teamData[i][1],teamData[i][2]];
        return teamEmail;
      }
      else{
        return false;
      }
    }
  }
  
}

function getOtherTeamEmail(teamId) {
  const teamSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Teams');
  const teamData = teamSheet.getRange("A2:C3").getValues();
  let teamEmail = '';
  for (let i = 0; i < teamData.length; i++) {
    if (teamData[i][0] !== teamId) {
      if(teamData[i][1]){
        teamEmail = [teamData[i][1],teamData[i][2]];
        return teamEmail;
      }
      else{
        return false;
      }
    }
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula to calculate distance between two points on Earth
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
}

function calculateRouteDistances(){
  let data = getStationsAndRoutes()
  let routes = data.routes;
  let routesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(POSSIBLE_ROUTES_SHEET);
  let routesData = routesSheet.getDataRange().getValues()
  Object.values(routes).forEach(function(route){
    let distance = calculateDistance(route.fromLat,route.fromLon,route.toLat,route.toLon)
    let cost = Math.ceil(distance/5);
    var routeIndex = routesData.findIndex(r => r[0] === route.id)
    routesSheet.getRange(routeIndex + 1, 6,1,2).setValues([[distance,cost]]);
  })
}

function assignChallenges(){
  let stationSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STATION_SHEET);
  let challengeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CHALLENGES_SHEET);
  let swissCantons = cantonDict();
  let stationList = stationSheet.getRange("A2:C"+stationSheet.getLastRow()).getValues();
  let challenges = challengeSheet.getRange("A2:F"+challengeSheet.getLastRow()).getValues();
  stationList.forEach((station,index)=>{
    let stationId = station[0];
    let cantonAbbrev = swissCantons[station[2]];
    let stationChallengeList =[];
    let stationSpecialChallengeList = [];
    challenges.forEach(challenge =>{
      let challengeId = challenge[0];
      if(!challenge[3]){
        var possibleCantons = false;
      }
      else{
        var possibleCantons = challenge[3].split(",");
      }
      if(!challenge[4]){
        var impossibleCantons = false
      }
      else{
        var impossibleCantons = challenge[4].split(",");
      }
      let exclusiveCities = challenge[5].split(",");
      if(exclusiveCities[0] && exclusiveCities.includes(stationId)){
        stationSpecialChallengeList.push(challengeId)
      } 
      else if(!exclusiveCities[0]){
        if(possibleCantons){
          if(possibleCantons.includes(cantonAbbrev)){
            stationChallengeList.push(challengeId)
          }
        }
        else if(impossibleCantons){
          if(!impossibleCantons.includes(cantonAbbrev)){
            stationChallengeList.push(challengeId)
          }
        }
        else{
          stationChallengeList.push(challengeId)
        }
      }
    })
    stationSheet.getRange(index+2,10,1,1).setValue(stationChallengeList.join(","))
    stationSheet.getRange(index+2,11,1,1).setValue(stationSpecialChallengeList.join(","))
  })
}

function provideChallengeOptions(teamId,station){
  //teamId = "Team A"
  //station = getStationsAndRoutes().stations["AG1"]
  
  var gameStatus = getPublicGameData()
  var latestChallengeId = gameStatus[teamId].latestChallenge 
  var temporaryChallengeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(teamId + " Temporary Challenges")
  let challengeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CHALLENGES_SHEET)
  let challenges = challengeSheet.getRange("A2:G"+challengeSheet.getLastRow()).getValues();
  let possibleGeneralChallenges = station.possibleGeneralChallenges;
  let possibleSpecialChallenges = station.possibleSpecialChallenges;
  temporaryChallengeSheet.getRange(1,1,1,3).setValues([[station.id,station.name,station.canton]])
  if(possibleGeneralChallenges.includes(latestChallengeId)){
    let index = possibleGeneralChallenges.indexOf(latestChallengeId)
    possibleGeneralChallenges.splice(index,1)
  }
  else if(possibleSpecialChallenges.includes(latestChallengeId)){
    let index = possibleSpecialChallenges.indexOf(latestChallengeId)
    possibleSpecialChallenges.splice(index,1)
  }
  //Logger.log(possibleSpecialChallenges)
  let challengeOptions = [];
  let numberOtherOptions;
  if(possibleSpecialChallenges[0]){
    let randomIndex = Math.floor(Math.random() * possibleSpecialChallenges.length);
    let challengeOptionId = possibleSpecialChallenges[randomIndex]
    let challengeIndex = challenges.findIndex(r => r[0] === challengeOptionId)
    let challenge = challenges[challengeIndex]
    challengeOptions.push({id:challenge[0],title:challenge[1],text:challenge[2],reward:challenge[6],region:"local"})
    numberOtherOptions = 2
    temporaryChallengeSheet.appendRow([challenge[0],challenge[1],challenge[2],challenge[6],"local"])
  }
  else{numberOtherOptions = 3}
  indices =[]
  while(indices.length<numberOtherOptions){
    var randomIndex = Math.floor(Math.random() * possibleGeneralChallenges.length);
    if(indices.includes(randomIndex)){
      continue;
    }
    indices.push(randomIndex);
    let challengeOptionId = possibleGeneralChallenges[randomIndex]
    let challengeIndex = challenges.findIndex(r => r[0] === challengeOptionId)
    let challenge = challenges[challengeIndex]
    challengeOptions.push({id:challenge[0],title:challenge[1],text:challenge[2],reward:challenge[6],region:"cantonal"})
    temporaryChallengeSheet.appendRow([challenge[0],challenge[1],challenge[2],challenge[6],"cantonal"])
  }
  Logger.log(challengeOptions)
  
  updateScore(teamId,"Drew challenges",0,0,0,0,'','')
  sendChallengeOptionsEmail(teamId,challengeOptions)
  return challengeOptions;
}

function recreateChallengeOptions(teamId){
  var temporaryChallengeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(teamId + " Temporary Challenges")
  var locationId = temporaryChallengeSheet.getRange("A1").getValue()
  let lastRow = temporaryChallengeSheet.getLastRow()
  var challengeData = temporaryChallengeSheet.getRange("A3:E"+lastRow).getValues()
  challengeOptions = [];
  challengeData.forEach(challenge =>{
    challengeOptions.push({id:challenge[0],title:challenge[1],text:challenge[2],reward:challenge[3],region:challenge[4]})
  })
  return([locationId,challengeOptions])
}

function challengeSelection(teamId,selectedChallenge,station){
  var temporaryChallengeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(teamId + " Temporary Challenges")
  let numRows = temporaryChallengeSheet.getLastRow() -2;
  temporaryChallengeSheet.deleteRows(3,numRows);
  let  challengeId = selectedChallenge.id;
  let  reward = selectedChallenge.reward
  let text =selectedChallenge.text
  let  title = selectedChallenge.title
  let  region = selectedChallenge.region
  temporaryChallengeSheet.appendRow([challengeId,title,text,reward,region])
  updateScore(teamId,"Started challenge",0,0,0,0,"","")
}

function confirmChallengeCompletion(currentTeamId){
  //currentTeamId = "Team A"
  var temporaryChallengeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(currentTeamId + " Temporary Challenges")
  
  const swissCantons = cantonDict()
  var challenge = temporaryChallengeSheet.getRange("A3:E3").getValues()[0]
  var stationId = temporaryChallengeSheet.getRange("A1").getValue()
  var stationName = temporaryChallengeSheet.getRange("B1").getValue()
  var canton = temporaryChallengeSheet.getRange("C1").getValue()
  let  challengeId = challenge[0];
  let  reward = challenge[3]
  let  title = challenge[1]
  let  region = challenge[4]
  temporaryChallengeSheet.deleteRows(3,1);
   
  if(region === "local"){
    var locationId = stationId
    var location = stationName+" ("+canton+")"
  }
  else if (region === "cantonal"){
    var locationId = swissCantons[canton]
    var location = canton
  }
  updateScore(currentTeamId,"Completed challenge",0,reward,0,0,locationId,challengeId)
  sendChallengeCompletionEmail(currentTeamId,title,location,reward)
  return getStationsAndRoutes()
}

function cancelChallengeSelection(currentTeamId){
  var temporaryChallengeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(currentTeamId + " Temporary Challenges")
  let numRows = temporaryChallengeSheet.getLastRow() -2;
  temporaryChallengeSheet.deleteRows(3,numRows);
  var currentCoins = getPublicGameData()[currentTeamId].coins
  var penalty = Math.floor(CHALLENGE_PENALTY*currentCoins)
  updateScore(currentTeamId,"Cancelled challenge",penalty,0,0,0,'','')
  return getStationsAndRoutes()
}

function sendChallengeCompletionEmail(currentTeamId,title,location,reward){
  var otherTeamEmail = getOtherTeamEmail(currentTeamId);
  var subject = "Challenge completed in "+GAMETITLE;
  var body = `${currentTeamId} has completed challenge ${title} in ${location}`;
  if(otherTeamEmail){
    GmailApp.sendEmail(otherTeamEmail, subject, body);
  }
}

function sendChallengeOptionsEmail(teamId,challengeOptions){
  var currentCoins = getPublicGameData()[teamId].coins
  var penalty = Math.floor(CHALLENGE_PENALTY*currentCoins)
  var teamEmail = getTeamEmail(teamId);
  let subject = "Challenge Options in "+GAMETITLE;
  let emailBody = 'Your challenge options are:\n\n';
    challengeOptions.forEach((challenge, index) => {
      emailBody += `${index + 1}. ${challenge.title} (${challenge.region}) for ${challenge.reward} Coins: ${challenge.text}\n`;
    });
  emailBody += `\n You can still cancel, but at this moment, it would cost you ${penalty} Coins.`
  if(teamEmail){
    GmailApp.sendEmail(teamEmail, subject, emailBody);
  }
}

function createListOfChallenges(){
  let challengeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CHALLENGES_SHEET);
  let challengeData = challengeSheet.getRange("A2:H"+challengeSheet.getLastRow()).getValues();
  let challenges = [];
  let challengeDict = {};
  challengeData.forEach(challenge=>{
    challenges.push({id:challenge[0],title:challenge[1],text:challenge[2],reward:challenge[6],region:challenge[7]});
    challengeDict[challenge[0]] = {id:challenge[0],title:challenge[1],text:challenge[2],reward:challenge[6],region:challenge[7]}
  })
  challenges.sort((a, b) => a.title.localeCompare(b.title));
  Logger.log(Object.keys(challengeDict))
  return [challenges,challengeDict];
}


