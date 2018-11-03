$(document).ready(function () {
	var hitBtn = $('button.damage'),
		manaBtn = $('button.mana'),
		reset = $('button.reset'),
		healthBar = $('.health-bar'),
		manaBar = $('.mana-bar'),
		healthBar_inner = healthBar.find('.bar-inner'),
		manaBar_inner = manaBar.find('.bar-inner'),
		hit = healthBar.find('.hit'),
		mana = manaBar.find('.hit');

	hitBtn.on("click", function () {
		var total = healthBar.data('total'),
			value = healthBar.data('value');

		if (value < 0) {
			// you're dead
			return;
		}
		// max damage is essentially quarter of max life
		var damage = Math.floor(Math.random() * total);
		// damage = 100;
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
	});

	manaBtn.on("click", function () {
		var total = manaBar.data('total'),
			value = manaBar.data('value');

		if (value < 0) {
			// you're dead
			return;
		}
		// max damage is essentially quarter of max life
		var damage = Math.floor(Math.random() * total);
		// damage = 100;
		var newValue = value - damage;
		// calculate the percentage of the total width
		var barWidth = (newValue / total) * 100;
		var hitWidth = (damage / value) * 100 + "%";

		// show hit bar and set the width
		mana.css('width', hitWidth);
		manaBar.data('value', newValue);

		setTimeout(function () {
			mana.css({ 'width': '0' });
			manaBar_inner.css('width', barWidth + "%");
		}, 500);

		if (value < 0) {
			// DEAD
		}
	});

	reset.on('click', function (e) {
		healthBar.data('value', healthBar.data('total'));

		hit.css({ 'width': '0' });

		healthBar_inner.css('width', '100%');

		//

		manaBar.data('value', manaBar.data('total'));

		mana.css({ 'width': '0' });

		manaBar_inner.css('width', '100%');
	});
});