namespace online_spell_game.Areas.HelpPage.ModelDescriptions
{
	public class KeyValuePairModelDescription : ModelDescription
	{
		public ModelDescription KeyModelDescription { get; set; }

		public ModelDescription ValueModelDescription { get; set; }
	}
}