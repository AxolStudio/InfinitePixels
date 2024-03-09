package;

import js.Browser;
import js.html.Window;
import js.html.URLSearchParams;
import flixel.FlxGame;
import openfl.display.Sprite;

class Main extends Sprite
{
	public function new()
	{
		super();

		var search:String = Browser.window.location.search;

		var searchParams:URLSearchParams = new URLSearchParams(search);
		var graphicKey:String = [for (i in 0...128) 0].join("");
		if (searchParams.has("key"))
			graphicKey = searchParams.get("key");

		Globals.parseGraphicData(graphicKey);

		

		// addChild(new FlxGame(0, 0, PlayState));
	}
}
