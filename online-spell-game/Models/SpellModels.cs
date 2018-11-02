using System;
using System.Collections.Generic;

namespace online_spell_game.Models.Spells
{
	public class Spell
	{
		public string level { get; set; }
		public string name { get; set; }
		public string description { get; set; }
		public bool rollToHit { get; set; }
		public SavingThrow save { get; set; }
		public string howManyDice { get; set; }
		public string diceType { get; set; }
		public string diceTypeAlternate { get; set; }
	}

	public class SavingThrow
	{
		public string type { get; set; }
		public string number { get; set; }
		public bool halfOnFail { get; set; }
	}

	public static class SpellBook
	{
		private const string STANDARD_SAVE_NUM = "13";
		public static List<Spell> spells = new List<Spell>();

		static SpellBook()
		{
			spells.Add(new Spell
			{
				level = "0",
				name = "Acid Splash",
				description = "You hurl a bubble of acid. A target must succeed on a Dexterity saving throw or take 1d6 acid damage.",
				rollToHit = false,
				save = new SavingThrow()
				{
					type = "DEX",
					number = STANDARD_SAVE_NUM,
					halfOnFail = false
				},
				howManyDice = "1",
				diceType = "6",
				diceTypeAlternate = "-1"
			});

			spells.Add(new Spell
			{
				level = "0",
				name = "Fire Bolt",
				description = "You hurl a mote of fire. Make a ranged spell attack against the target. On a hit, the target takes 1d10 fire damage.",
				rollToHit = true,
				save = null,
				howManyDice = "1",
				diceType = "10",
				diceTypeAlternate = "-1"
			});

			spells.Add(new Spell
			{
				level = "0",
				name = "Ray of Frost",
				description = "A frigid beam of blue-white light streaks toward a creature. Make a ranged spell attack against the target. On a hit, it takes 1d8 cold damage.",
				rollToHit = true,
				save = null,
				howManyDice = "1",
				diceType = "8",
				diceTypeAlternate = "-1"
			});

			spells.Add(new Spell
			{
				level = "0",
				name = "Infestation",
				description = "You cause a cloud of mites, fleas, and other parasites to appear momentarily on one creature you can see within range. The target must succeed on a Constitution saving throw, or it takes 1d6 poison damage.",
				rollToHit = false,
				save = new SavingThrow()
				{
					type = "CON",
					number = STANDARD_SAVE_NUM,
					halfOnFail = false
				},
				howManyDice = "1",
				diceType = "6",
				diceTypeAlternate = "-1"
			});

			spells.Add(new Spell
			{
				level = "0",
				name = "Toll the Dead",
				description = "You point at one creature you can see within range, and the sound of a dolorous bell fills the air around it for a moment. The target must succeed on a Wisdom saving throw or take 1d8 necrotic damage. If the target is missing any of its hit points, it instead takes 1d12 necrotic damage.",
				rollToHit = false,
				save = new SavingThrow()
				{
					type = "CON",
					number = STANDARD_SAVE_NUM,
					halfOnFail = false
				},
				howManyDice = "1",
				diceType = "8",
				diceTypeAlternate = "12"
			});
		}

		public static Spell GetRandomSpell()
		{
			Random rand = new Random();
			int rn = rand.Next(0, spells.Count);

			return spells[rn];
		}
	}
	/*
    public JsonResult RollD20()
    {
        Random rand = new Random();
        int d20 = rand.Next(1, 21); // inclusive, exclusive

        return Json(new { roll = d20 });
    }

    [HttpPost]
    public JsonResult RollDamage(string dice)
    {
        Random rand = new Random();
        int dmg = rand.Next(1, int.Parse(dice) + 1); // add 1 since upper bound is exclusive

        return Json(new { damage = dmg });
    }*/
}