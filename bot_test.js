//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const fs = require('fs');
const token = "EAAWhdVgZA0nwBALALwNXQTk6vKsWsHJmH5PR9JjS7yuN4oWbYSE2auLJisSZBWELP9G7ZAUWk70XPPywyOqZCj2KMOiTOZCDNAjKZBEV01EpUc2joHVPMREmAUqPrQ4TFwyIleQmSZCov7kJsXYTlqJuUJUQDuWut3vIiW2fkMloAZDZD"


var messengerButton = "<html><head><title>Facebook Messenger Bot</title></head><body><h1>Facebook Messenger Bot</h1>This is a bot based on Messenger Platform QuickStart. For more details, see their <a href=\"https://developers.facebook.com/docs/messenger-platform/guides/quick-start\">docs</a>.<script src=\"https://button.glitch.me/button.js\" data-style=\"glitch\"></script><div class=\"glitchButton\" style=\"position:fixed;top:20px;right:20px;\"></div></body></html>";

// The rest of the code implements the routes for our Express server.
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Webhook validation
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === "SVKGPaHrdAO4u1TLB27V2pF8mEiUkp5HTFNLedmVVvVunIpy61OQekzu0iUhbUnw") {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

// Display the web page
app.get('/', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(messengerButton);
  res.end();
});

// Message processing
app.post('/webhook', function (req, res) {
  console.log(req.body);
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
          receivedPostback(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    res.sendStatus(200);
  }
});

// Incoming events handling
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the template example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'chat':
        sendImageMessage(senderID, messageText);
        sendTextMessage(senderID,"N'est-il pas magnifique ?" );
        break;
		case 'salut':
			sendTextMessage(senderID,messageText+" comment tu vas ?" );
            break;
		case 'merci':
			sendTextMessage(senderID," je t'en prie." );
            break;
        case 'bien et toi ?':
            sendTextMessage(senderID,"ça va ! je suis de bonne humeur aujourd'hui car j'ai vu un chat. Écrit ce mot justement (chat)");
            break;

        default:
            sendTextMessage(senderID, recoveryFile());
		    break;
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Merci pour la pièce jointe");
  }
}


/**
Fonction permettant de récupérer une ligne d'un texte défini
Cette fonction retournera une phrase aléatoire du fichier texte2.txt
**/
function recoveryFile(){


		var lines = fs.readFileSync(path.resolve(__dirname)+"/text2.txt", "utf8").split("\n");
		var index = Math.floor(Math.random() * (lines.length-1));
		return lines[index];

}

function sendImageMessage(sender, text) {
    let data =
    {
      "attachment":{
        "type":"image",
        "payload":{
          "url":"https://www.wikichat.fr/wp-content/uploads/sites/2/comment-soigner-une-plaie-dun-chat.jpg"
        }
      }
    }
   // let access_token = "mon token de page";
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: data,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending image messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " +
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

//////////////////////////
// Sending helpers
//////////////////////////
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function sendGenericMessage(recipientId) {


}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token:  token },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
        addMessageToBack(messageData);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}

function addMessageToBack(messageData){
    request({
        uri: (process.env.BACK_URL ||  '127.0.0.1')+'/message/add',
        qs: { access_token:  token },
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            console.log("Successfully sent message to back.");
        } else {
            console.error("Unable to send message to back.");
            console.error(response);
            console.error(error);
        }
    });

}

// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port %s", server.address().port);
});