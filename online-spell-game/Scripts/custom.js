﻿var joined = false;
var caster = 1; // TODO: both players roll to see who goes first?
var target = 2;
var ac = 13;
var dc = 13;
var diceType = 0;
var playerID = 0;

$(document).ready(function () {
	$('[name="username"]').keypress(function (e) {
		if (e.which == 13) {
			join();
		}
	});

	$("#join-btn").click(function (e) {
		join();
	});
});

function join() {
	if (joined == false) {
		joined = true;
		initialize($('[name="username"]').val());
	}
}

function initialize(username) {
	var uri = 'ws://' + window.location.hostname + ":" + window.location.port + '/api/chat/' + username;

	websocket = new WebSocket(uri);

	websocket.onopen = function () {
		$(".cast").click(function (event) {
			if ($(this).hasClass("disabled") == false) {
				disableButton(caster, "cast");
				// TODO: check mana here
				websocket.send('cast,' + $(this).attr("data-spell"));
			}
		});

		$(".tohit").click(function (event) {
			if ($(this).hasClass("disabled") == false) {
				disableButton(caster, "tohit");
				websocket.send('tohit');
			}
		});

		$(".save").click(function (event) {
			if ($(this).hasClass("disabled") == false) {
				disableButton(target, "save");
				websocket.send('save');
			}
		});

		$(".damage").click(function (event) {
			if ($(this).hasClass("disabled") == false) {
				disableButton(target, "damage");
				websocket.send('damage,' + $(".spell-name").attr("data-dice"));
			}
		});

		$(".death").click(function (event) {
			if ($(this).hasClass("disabled") == false) {
				websocket.send('deathsave');
			}
		});

		$(".reset").click(function (event) {
			if ($(this).hasClass("disabled") == false) {
				websocket.send('reset');
			}
		});
	};

	websocket.onerror = function (event) {
		alert('A connection error occurred.');
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
		else if (response.action == "error") {
			$("#success").css("display", "none");
			$("#error").css("display", "block");
		}
		// CAST
		else if (response.action == "cast") {
			$(".spell-name").html(response.spell.name);
			$(".spell-name").attr("data-dice", response.spell.diceType);
			$(".spell-level").html(response.spell.level === 0 ? "Cantrip" : "Level " + response.spell.level);
			$(".spell-desc").html(response.spell.description);

			var mana = $("#caster-" + caster + " .curr-mana").text();
			mana -= response.spell.cost;
			mana = mana < 0 ? 0 : mana;
			$("#caster-" + caster + " .curr-mana").text(mana);
			subtractMana(caster, response.spell.cost);

			if (response.spell.rollToHit === true) {
				$(".spell-desc").append("<hr />Roll To Hit...");
				enableButton(caster, "tohit");
			}
			else if (response.spell.save !== null) {
				enableButton(target, "save");
			}

			diceType = response.spell.diceType;
		}
		// TO HIT
		else if (response.action == "tohit") {
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
			$(".spell-desc").append("<hr />Spell dealt <b>" + response.damage + "</b> damage!");

			var hp = $("#caster-" + target + " .curr-hp").text();
			hp -= response.damage;
			hp = hp < 0 ? 0 : hp;
			$("#caster-" + target + " .curr-hp").text(hp);
			subtractHealth(target, response.damage);

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

				$(".reset-container").show();
			}
		}
		// RESET
		else if (response.action == "reset") {
			startGame();
			resetHealthBars();
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
}

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
	var selector = "#caster-btns ." + btn;
	if (btn === "ALL") {
		selector = "#caster-btns a";
	}

	$(selector).addClass("disabled");
	
	$("#" + btn + "-container button").addClass("disabled");
	$("#" + btn + "-container").hide();
}

function enableButton(num, btn) {
	console.log("enableButton(" + num + ", " + btn + ")");
	if (num == playerID) {
		if (btn == "cast") {
			var selector = "#caster-btns ." + btn;

			var curr_mana = $("#caster-" + num + " .curr-mana").text();

			$(selector).each(function (index, elem) {
				console.log(index + ". " + $(elem).attr("data-spell"));
				if ($(elem).attr("data-cost") <= curr_mana) {
					console.log($(elem).attr("data-cost") + " <= " + curr_mana);
					$(elem).removeClass("disabled");
				}
			});
		}
		else {
			$("#" + btn + "-container button").removeClass("disabled");
			$("#" + btn + "-container").show();
		}
	}
}

function switchTurn() {
    disableButton(caster, "ALL");

    var temp = caster;
    caster = target;
    target = temp;

	// TODO: change player indicator
	/*
    $("#arrow-" + target).removeClass("on");
	$("#arrow-" + caster).addClass("on"); 
	*/

	// gain 1 mana each turn
	var mana = parseInt($("#caster-" + caster + " .curr-mana").text());
	if (mana < 5) { // TODO: don't hard-code max mana
		mana += 1;
		$("#caster-" + caster + " .curr-mana").text(mana);
		subtractMana(caster, -1); // subtract a negative = add
	}

    enableButton(caster, "cast");
}

function subtractHealth(target, damage) {
	var healthBar = $("#caster-" + target + " .health-bar");
	var total = healthBar.data('total'),
		value = healthBar.data('value'),
		healthBar_inner = healthBar.find('.bar-inner'),
		hit = healthBar.find('.hit');

	if (value < 0) {
		// you're dead
		return;
	}

	var newValue = value - damage;
	// calculate the percentage of the total width
	var barWidth = (newValue / total) * 100;
	var hitWidth = (damage / value) * 100 + "%";

	// show hit bar and set the width
	hit.css('width', hitWidth);
	healthBar.data('value', newValue);

	setTimeout(function () {
		hit.css({ 'width': '0' });
		healthBar_inner.css('width', barWidth + "%");
	}, 500);

	if (value < 0) {
		// DEAD
	}
}

function subtractMana(caster, cost) {
	var manaBar = $("#caster-" + caster + " .mana-bar");
	var total = manaBar.data('total'),
		value = manaBar.data('value'),
		manaBar_inner = manaBar.find('.bar-inner'),
		hit = manaBar.find('.hit');

	if (value < 0) {
		// you're out of mana
		return;
	}

	var newValue = value - cost;
	// calculate the percentage of the total width
	var barWidth = (newValue / total) * 100;
	var hitWidth = (cost / value) * 100 + "%";

	// show hit bar and set the width
	hit.css('width', hitWidth);
	manaBar.data('value', newValue);

	setTimeout(function () {
		hit.css({ 'width': '0' });
		manaBar_inner.css('width', barWidth + "%");
	}, 500);

	if (value < 0) {
		// DEPLETED
	}
}

function resetHealthBars() {
	for (var target = 1; target <= 2; target++) {
		var healthBar = $("#caster-" + target + " .health-bar");
		var total = healthBar.data('total'),
			value = healthBar.data('value'),
			healthBar_inner = healthBar.find('.bar-inner'),
			hit = healthBar.find('.hit');

		healthBar.data('value', healthBar.data('total'));

		hit.css({ 'width': '0' });

		healthBar_inner.css('width', '100%');
	}
}
