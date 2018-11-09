using Microsoft.Web.WebSockets;
using Newtonsoft.Json;
using online_spell_game.Models.Spells;
using System;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;

namespace online_spell_game.Controllers
{
	public class ChatController : ApiController
	{

		public HttpResponseMessage Get(string id)
		{
			HttpContext.Current.AcceptWebSocketRequest(new ChatWebSocketHandler(getValidUsername(id)));
			return Request.CreateResponse(HttpStatusCode.SwitchingProtocols);
		}

		private class ChatWebSocketHandler : WebSocketHandler
		{
			private static WebSocketCollection _chatClients = new WebSocketCollection();
			private string _username;

			public ChatWebSocketHandler(string username)
			{
				_username = getValidUsername(username);
			}

			public override void OnOpen()
			{
				_chatClients.Add(this);

				_chatClients.Broadcast(
					"{" +
						"\"action\":\"assign\"," +
						"\"id\":" + _chatClients.Count.ToString() + "," +
						"\"username\":\"" + _username + "\"" +
					"}"
				);
			}

			public override void OnMessage(string message)
			{
				string obj = "";
				string json_action = "";
				string json_spell = "";
				string json_roll = "";
				string json_damage = "";
				string json_username = "";

				string[] messageArray = message.Split(',');

				if (messageArray[0] == "cast")
				{
					Spell spell = SpellBook.spells.Find(s => s.name == messageArray[1]);
					obj = JsonConvert.SerializeObject(spell);

					json_action = "cast";
					json_spell = obj;
				}
				else if (messageArray[0] == "tohit")
				{
					Random rand = new Random();
					int d20 = rand.Next(1, 21); // inclusive, exclusive

					json_action = "tohit";
					json_roll = d20.ToString();
				}
				else if (messageArray[0] == "save")
				{
					Random rand = new Random();
					int d20 = rand.Next(1, 21); // inclusive, exclusive

					json_action = "save";
					json_roll = d20.ToString();
				}
				else if (messageArray[0] == "damage")
				{
					Random rand = new Random();
					int dmg = rand.Next(1, int.Parse(messageArray[1]) + 1); // add 1 since upper bound is exclusive

					json_action = "damage";
					json_damage = dmg.ToString();
				}
				else if (messageArray[0] == "player1Name")
				{
					json_action = messageArray[0];
					json_username = messageArray[1];
				}
				else if (messageArray[0] == "deathsave")
				{
					json_action = messageArray[0];
					json_username = messageArray[1];
				}
				else if (messageArray[0] == "reset")
				{
					json_action = "reset";
				}

				_chatClients.Broadcast(
					"{" +
						"\"action\":\"" + json_action + "\"," +
						"\"spell\":" + ((json_spell == "") ? "{}" : json_spell) + "," +
						"\"roll\":\"" + json_roll + "\"," +
						"\"damage\":\"" + json_damage + "\"," +
						"\"username\":\"" + json_username + "\"" +
					"}"
				);
			}

			public override void OnClose()
			{
				base.OnClose();
			}

			public override void OnError()
			{
				base.OnError();
			}

			public override void OnMessage(byte[] message)
			{
				base.OnMessage(message);
			}
		}

		private static string getValidUsername(string s)
		{
			string u = stripSpecialCharacters(s);

			if (u.Length > 32)
			{
				u = u.Substring(0, 32);
			}

			return u;
		}

		private static string stripSpecialCharacters(string in_str)
		{
			string out_str = "";
			string allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -.,'()";
			char c;

			for (int i = 0; i < in_str.Length; i++)
			{
				c = in_str.ToCharArray()[i];
				if (allowed.IndexOf(c) > -1)
				{
					out_str += c.ToString();
				}
			}

			return out_str;
		}
	}
}