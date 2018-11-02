var caster = 1; // TODO: both players roll to see who goes first?
var target = 2;
var ac = 13;
var dc = 13;
var diceType = 0;
var playerID = 0;

$(document).ready(function () {
	var username = prompt('Please enter a username:');
	var uri = 'ws://' + window.location.hostname + ":" + window.location.port  + '/api/chat' + '?username=' + username;
	
	websocket = new WebSocket(uri);
    
	websocket.onopen = function () {
        $(".cast").click(function (event) {
            websocket.send('cast');
        });

        $(".hit").click(function (event) {
            websocket.send('tohit');
        });

        $(".save").click(function (event) {
            websocket.send('save');
        });

        $(".damage").click(function (event) {
            websocket.send('damage,' + $(".spell-name").attr("data-dice"));
        });

        $(".death").click(function (event) {
            websocket.send('deathsave');
		});

		$(".reset").click(function (event) {
			websocket.send('reset');
		});
	};

	websocket.onerror = function (event) {
        alert('Sorry, there are already two people playin! sorry not sorry');
	};

	websocket.onmessage = function (event) {
        var response = JSON.parse(event.data);
		console.log(response);

		// ASSIGN PLAYER ID
		if (response.action == "assign") {
			if (playerID == 0) {
				playerID = response.id;
			}

			$(".player" + response.id).html(response.username);

			if (response.id == 1) {
				// say waiting for Player 2
				$(".spell-name").html("Waiting for Player 2...");
				$(".spell-level").html("");
				$(".spell-desc").html("The battle will start once Player 2 connects.");
			}
			else if (response.id == 2 && playerID == 1) {
				// Player 2 joined after Player 1 so it doesn't know their username, send it to them
				websocket.send('player1Name,' + $(".player1").text());
			}
		}
		// PLAYER 1 NAME (SHARE TO PLAYER 2)
		else if (response.action == "player1Name") {
			if (playerID != 1) {
				$(".player1").html(response.username);
			}
			
			// once player 1 name has been shared to player 2, game is ready to start...
			startGame();
		}
        // ERROR
        else if (response.action == "error")
        {
            $("#success").css("display", "none");
            $("#error").css("display", "block");
		}
        // CAST
        else if (response.action == "cast") {
            disableButton(caster, "cast");

            $(".spell-name").html(response.spell.name);
            $(".spell-name").attr("data-dice",response.spell.diceType);
            $(".spell-level").html(response.spell.level === 0 ? "Cantrip" : "Level " + response.spell.level);
            $(".spell-desc").html(response.spell.description);

            if (response.spell.rollToHit === true) {
                $(".spell-desc").append("<hr />Roll To Hit...");
                enableButton(caster, "hit");
            }
            else if (response.spell.save !== null) {
                enableButton(target, "save");
            }

            diceType = response.spell.diceType;
		}
		// TO HIT
		else if (response.action == "tohit") {
            disableButton(caster, "hit");

            $(".spell-desc").append("<br />" + response.roll + "<hr />");
            if (response.roll >= ac) {
                $(".spell-desc").append("<p>You hit!</p>Roll Damage...");
                enableButton(caster, "damage");
            }
            else {
                $(".spell-desc").append("<p>You missed.</p>");
                switchTurn();
            }
		}
		// SAVE
		else if (response.action == "save") {
			disableButton(target, "save");

			$(".spell-desc").append("<br />" + response.roll + "<hr />");

			if (response.roll >= dc) {
				$(".spell-desc").append("<p>Saving throw succeeded.</p>");
				switchTurn();
			}
			else {
				$(".spell-desc").append("<p>Saving throw failed... Take damage.</p>");
				enableButton(caster, "damage");
			}
		}
		// DAMAGE
        else if (response.action == "damage") {
            disableButton(target, "save");

            $(".spell-desc").append("<hr />Spell dealt <b>" + response.damage + "</b> damage!");

            var hp = $("#caster-" + target + " .curr-hp").text();
			hp -= response.damage;
			hp = hp < 0 ? 0 : hp;
            $("#caster-" + target + " .curr-hp").text(hp);

			if (hp > 0) {
				// Still Alive, Switch Turn
                switchTurn();
            }
			else {
				// Player is Dead -- TODO: death saves for target
				if (target == playerID) {
					// LOSER
					$(".spell-name").html("You Have Perished...");
					$(".spell-level").html("");
					$(".spell-desc").html("Feels bad man.");
				}
				else {
					// WINNER
					$(".spell-name").html("Your Foe Has Been Slain");
					$(".spell-level").html("");
					$(".spell-desc").html("Too eaz!");
				}

				$(".action-btns a").addClass("disabled");
				$(".action-btns a").removeClass("btn-primary");
				$(".action-btns a").addClass("btn-default");

				$(".reset-container").removeClass("hide");
            }
		}
		// RESET
		else if (response.action == "reset") {
			startGame();
		}
	};

	websocket.onclose = function (event) {
		var reason = "";
		// See http://tools.ietf.org/html/rfc6455#section-7.4.1
		if (event.code == 1000)
			reason = "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
		else if (event.code == 1001)
			reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
		else if (event.code == 1002)
			reason = "An endpoint is terminating the connection due to a protocol error";
		else if (event.code == 1003)
			reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
		else if (event.code == 1004)
			reason = "Reserved. The specific meaning might be defined in the future.";
		else if (event.code == 1005)
			reason = "No status code was actually present.";
		else if (event.code == 1006)
			reason = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
		else if (event.code == 1007)
			reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).";
		else if (event.code == 1008)
			reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
		else if (event.code == 1009)
			reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
		else if (event.code == 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
			reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
		else if (event.code == 1011)
			reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
		else if (event.code == 1015)
			reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
		else
			reason = "Unknown reason";

		$('#messages').prepend('<div>' + "The connection was closed for the following reason: " + reason + '</div>');
	};
	
});

function startGame() {
	caster = 1;
	target = 2;
	enableButton(caster, "cast");
	$(".reset-container").addClass("hide");
	$(".curr-hp").text($(".total-hp").attr("data-hp"));

	if (playerID == 1) {
		$(".spell-name").html("Ready!");
		$(".spell-level").html("");
		$(".spell-desc").html("Cast a spell to begin.");
	}
	else if (playerID == 2) {
		$(".spell-name").html("The Battle Has Begun");
		$(".spell-level").html("");
		$(".spell-desc").html("Waiting for " + $(".player1").text() + " to start.");
	}
}

function disableButton(num, btn) {
    var selector = "#caster-" + num + " ." + btn;
    if (btn === "ALL") {
        selector = "#caster-" + num + " a";
    }

    $(selector).addClass("disabled");
    $(selector).removeClass("btn-primary");
    $(selector).addClass("btn-default");
}

function enableButton(num, btn) {
	if (num == playerID) {
		var selector = "#caster-" + num + " ." + btn;
		if (selector === "ALL") {
			selector = "#caster-" + num + " a";
		}

		$(selector).removeClass("disabled");
		$(selector).addClass("btn-primary");
		$(selector).removeClass("btn-default");
	}
}

function switchTurn() {
    disableButton(caster, "ALL");

    var temp = caster;
    caster = target;
    target = temp;

    $("#arrow-" + target).removeClass("on");
    $("#arrow-" + caster).addClass("on");

    enableButton(caster, "cast");
}